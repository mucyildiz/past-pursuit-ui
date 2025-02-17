import Event from "../models/Event";
import User from "../models/User";

export enum GameEventType {
  GUESS = "GUESS",
  PLAYER_JOINED = "PLAYER_JOINED",
  PLAYER_LEFT = "PLAYER_LEFT",
  ROUND_START = "ROUND_START",
  REMATCH_PROPOSAL = "REMATCH_PROPOSAL",
  REMATCH = "REMATCH",
}

export interface WebSocketMessage {
  eventType: GameEventType;
  gameCode: string;
  user: User;
  data?: string | null;
  timestamp?: number;
}

export interface GameState {
  gameCode: string;
  users: User[];
  currentState: string;
  currentEvent?: Event;
  playerScores: Record<string, number>;
  currentGuesses: Record<string, { guess: number; timestamp: number }>;
}

class WebSocketService {
  private static instance: WebSocketService;
  private socket!: WebSocket;
  private messageHandlers: ((data: GameState) => void)[] = [];
  private isConnected: boolean = false;
  private pingInterval: number | null = null;
  private readonly PING_INTERVAL = 20000;
  private readonly WS_URL = import.meta.env.DEV
    ? "ws://localhost:8080/"
    : "wss://api.pastpursuit.io/";
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;
  private readonly RECONNECT_DELAY = 2000; // 2 seconds

  private constructor() {
    this.connect();
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private connect() {
    try {
      this.socket = new WebSocket(this.WS_URL);

      this.socket.onopen = () => {
        console.log("WebSocket connected");
        this.isConnected = true;
        this.reconnectAttempts = 0; // Reset attempts on successful connection
        this.startPing();
      };

      this.socket.onmessage = (event) => {
        if (event.data === "PONG") {
          console.debug("Received PONG");
          return;
        }

        console.debug("Received WebSocket message:", event.data);
        try {
          const gameState: GameState = JSON.parse(event.data);
          this.messageHandlers.forEach((handler) => handler(gameState));
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      this.socket.onclose = (event) => {
        console.warn("WebSocket connection closed", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        this.isConnected = false;
        this.stopPing();

        // Only attempt to reconnect if it wasn't a clean closure
        if (
          !event.wasClean &&
          this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS
        ) {
          console.log(
            `Attempting to reconnect (${this.reconnectAttempts + 1}/${
              this.MAX_RECONNECT_ATTEMPTS
            })...`
          );
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, this.RECONNECT_DELAY);
        } else if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
          console.error("Max reconnection attempts reached");
          alert("Lost connection to game server. Please refresh the page.");
          window.location.reload();
        }
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      alert("Failed to connect to game server. Please try again later.");
    }
  }

  private startPing() {
    this.stopPing(); // Clear any existing interval first
    this.pingInterval = window.setInterval(() => {
      if (this.socket.readyState === WebSocket.OPEN) {
        try {
          this.socket.send("PING");
        } catch (error) {
          console.error("Failed to send PING:", error);
          this.stopPing();
        }
      } else {
        console.warn(
          "Socket not open during ping attempt, state:",
          this.socket.readyState
        );
        this.stopPing();
      }
    }, this.PING_INTERVAL);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public addMessageHandler(handler: (data: GameState) => void) {
    this.messageHandlers.push(handler);
  }

  public removeMessageHandler(handler: (data: GameState) => void) {
    this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
  }

  public sendMessage(event: WebSocketMessage) {
    if (this.socket.readyState === WebSocket.OPEN) {
      console.log("Sending WebSocket message:", event);
      this.socket.send(JSON.stringify(event));
    } else {
      console.error("WebSocket not open, state:", this.socket.readyState);
    }
  }

  public close() {
    if (this.isConnected) {
      this.stopPing();
      this.socket.close();
      this.isConnected = false;
    }
  }
}

export const webSocketService = WebSocketService.getInstance();
