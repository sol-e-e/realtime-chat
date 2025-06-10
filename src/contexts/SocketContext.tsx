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
import { SOCKET_EVENTS } from "../constants/socketEvents";
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
    if (socketManager.isConnected()) {
      return;
    }

    const socketInstance = socketManager.connect();
    setSocket(socketInstance);

    // 연결 상태 이벤트
    socketInstance.on(SOCKET_EVENTS.CONNECT, () => {
      setIsConnected(true);
    });

    socketInstance.on(SOCKET_EVENTS.DISCONNECT, () => {
      setIsConnected(false);
    });

    socketInstance.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
      console.error("Socket 연결 오류:", error);
    });
  }, []);

  const disconnect = useCallback(() => {
    socketManager.disconnect();
    setSocket(null);
    setIsConnected(false);
  }, []);

  // 사용자 로그인 시 자동 연결
  useEffect(() => {
    if (currentUser) {
      connect();

      const handleRegisterUser = () => {
        console.log("사용자 등록 시도");
        socketManager.registerUser({
          id: currentUser.uid,
          name:
            currentUser.displayName ||
            currentUser.email?.split("@")[0] ||
            "Unknown",
          email: currentUser.email || "",
        });
      };

      socketManager.once(SOCKET_EVENTS.USER_REGISTERED, handleRegisterUser);
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
