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
      this.socket = new WebSocket("wss://api.pastpursuit.io/");

      this.socket.onopen = () => {
        console.log("WebSocket connected");
        this.isConnected = true;
        this.startPing();
      };

      this.socket.onmessage = (event) => {
        if (event.data === "PONG") {
          console.log("Received PONG");
          return;
        }

        console.log("Received WebSocket message:", event.data);
        const gameState: GameState = JSON.parse(event.data);
        this.messageHandlers.forEach((handler) => handler(gameState));
      };

      this.socket.onclose = () => {
        console.log("WebSocket connection closed");
        this.isConnected = false;
        this.stopPing();
        this.socket.close();
        window.location.reload();
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        alert("Failed to connect to game server. Please try again later.");
        this.stopPing();
        this.socket.close();
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      alert("Failed to connect to game server. Please try again later.");
    }
  }

  private startPing() {
    this.pingInterval = window.setInterval(() => {
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.send("PING");
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
