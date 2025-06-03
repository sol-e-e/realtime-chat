"use client";

import { socketManager } from "@/lib/socket";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

interface SocketProviderProps {
  children: ReactNode;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: SocketProviderProps) {
  const { currentUser } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (!currentUser) return;

    const socketInstance = socketManager.connect(currentUser.uid);
    setSocket(socketInstance);

    // 연결 상태 이벤트
    socketInstance.on("connect", () => {
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });
  }, [currentUser]);

  const disconnect = useCallback(() => {
    socketManager.disconnect();
    setSocket(null);
    setIsConnected(false);
  }, []);

  // 사용자 로그인 시 자동 연결
  useEffect(() => {
    if (currentUser) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [currentUser, connect, disconnect]);

  return (
    <SocketContext.Provider
      value={{ socket, isConnected, connect, disconnect }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }

  return context;
}
