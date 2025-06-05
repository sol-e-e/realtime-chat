import { FieldValue, Timestamp } from "firebase/firestore";

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  chatId: string;
  timestamp: Timestamp | FieldValue;
}

export interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  isOnline: boolean;
}

export interface ChatRoom {
  id: string;
  participants: string[]; // 사용자 ID 배열
  participantsData: {
    [userId: string]: {
      name: string;
      email: string;
      lastReadAt?: Timestamp | FieldValue;
    };
  };
  lastMessage: {
    content: string;
    timestamp: Timestamp | FieldValue;
    senderId: string;
  };
  createdAt: Timestamp | FieldValue;
}

export interface OnlineUser {
  id: string;
  name: string;
  email: string;
  socketId: string;
  joinedAt: Date;
}
