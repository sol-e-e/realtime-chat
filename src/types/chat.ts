import { Timestamp } from "firebase/firestore";

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  chatId: string;
  timestamp: Timestamp;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isOnline: boolean;
  lastSeen: Timestamp;
}

export interface ChatRoom {
  id: string;
  participants: string[]; // 사용자 ID 배열
  participantsData: {
    [userId: string]: {
      name: string;
      email: string;
    };
  };
  lastMessage?: {
    text: string;
    timestamp: Timestamp;
    senderId: string;
  };
  createdAt: Timestamp;
}

export interface OnlineUser {
  id: string;
  name: string;
  email: string;
  socketId: string;
}
