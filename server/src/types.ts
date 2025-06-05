import { FieldValue, Timestamp } from "firebase-admin/firestore";

type TimestampType = Timestamp | FieldValue | Date;

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  chatId: string;
  timestamp: TimestampType;
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
      lastReadAt?: TimestampType;
    };
  };
  lastMessage: {
    content: string;
    timestamp: TimestampType;
    senderId: string;
  };
  createdAt: TimestampType;
}

export interface OnlineUser {
  id: string;
  name: string;
  email: string;
  socketId: string;
  joinedAt: Date;
}
