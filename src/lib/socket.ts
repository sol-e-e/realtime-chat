import { io, Socket } from "socket.io-client";

class SocketManager {
  private socket: Socket | null = null;
  private isConnecting = false;

  connect(userId: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.isConnecting) {
      return this.socket!;
    }

    this.isConnecting = true;

    // Socket.io 서버 연결
    this.socket = io(
      process.env.NEXT_PUBLIC_SOCKE_URL || "http://localhost:3001",
      {
        auth: {
          userId,
        },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      }
    );

    // 연결 이벤트
    this.socket.on("connect", () => {
      console.log("✅ Socket 연결됨:", this.socket?.id);
      this.isConnecting = false;
    });

    this.socket.on("disconnect", () => {
      console.log("❌ Socket 연결 끊김");
    });

    this.socket.on("connect_error", (error) => {
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
}

export const socketManager = new SocketManager();
export default socketManager;
