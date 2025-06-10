import { SOCKET_EVENTS } from "@/constants/socketEvents";
import { io, Socket } from "socket.io-client";
import { Message, User } from "../types";

class SocketManager {
  private socket: Socket | null = null;
  private isConnecting = false;

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.isConnecting) {
      return this.socket!;
    }

    this.isConnecting = true;

    // Socket.io 서버 연결
    this.socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001",
      {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      }
    );

    // 연결 이벤트
    this.socket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log("✅ Socket 연결됨:", this.socket?.id);
      this.isConnecting = false;
    });

    this.socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log("❌ Socket 연결 끊김");
    });

    this.socket.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
      console.error("🚨 Socket 연결 오류:", error);
      this.isConnecting = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  registerUser(user: Pick<User, "id" | "name" | "email">) {
    this.socket?.emit(SOCKET_EVENTS.USER_REGISTER, user);
  }

  startChat(otherUser: Pick<User, "id" | "name" | "email">) {
    this.socket?.emit(SOCKET_EVENTS.CHAT_START, otherUser);
  }

  sendMessage(message: Pick<Message, "content" | "chatId">) {
    this.socket?.emit(SOCKET_EVENTS.MESSAGE_SEND, message);
  }

  startTyping(chatId: string) {
    this.socket?.emit(SOCKET_EVENTS.TYPING_START, { chatId });
  }

  stopTyping(chatId: string) {
    this.socket?.emit(SOCKET_EVENTS.TYPING_STOP, { chatId });
  }

  readMessage(chatId: string) {
    this.socket?.emit(SOCKET_EVENTS.MESSAGE_READ, { chatId });
  }

  // 이벤트 리스너 등록
  on(event: string, callback: (...args: unknown[]) => void) {
    if (!this.socket) {
      console.error("Socket 연결이 없습니다.");
      return;
    }

    this.socket?.on(event, callback);
  }

  off(event: string, callback: (...args: unknown[]) => void) {
    if (!this.socket) {
      console.error("Socket 연결이 없습니다.");
      return;
    }

    this.socket?.off(event, callback);
  }

  once(event: string, callback: (...args: unknown[]) => void) {
    if (!this.socket) {
      console.error("Socket 연결이 없습니다.");
      return;
    }

    this.socket?.once(event, callback);
  }
}

export const socketManager = new SocketManager();
export default socketManager;
