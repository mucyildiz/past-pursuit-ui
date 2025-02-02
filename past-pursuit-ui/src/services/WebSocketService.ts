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
      this.socket = new WebSocket("ws://3.145.150.58:8081");

      this.socket.onopen = () => {
        console.log("WebSocket connected");
        this.isConnected = true;
      };

      this.socket.onmessage = (event) => {
        console.log("Received WebSocket message:", event.data);
        const gameState: GameState = JSON.parse(event.data);
        this.messageHandlers.forEach((handler) => handler(gameState));
      };

      this.socket.onclose = () => {
        console.log("WebSocket connection closed");
        this.isConnected = false;
        this.socket.close();
        window.location.reload(); // Force refresh on connection loss
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        alert("Failed to connect to game server. Please try again later.");
        this.socket.close();
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      alert("Failed to connect to game server. Please try again later.");
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
      this.socket.close();
      this.isConnected = false;
    }
  }
}

export const webSocketService = WebSocketService.getInstance();
