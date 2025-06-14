import dotenv from "dotenv";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { ChatRoom, Message, User } from "./types";

dotenv.config({ path: ".env.local" });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export const db = getFirestore();

// collection
export const messagesCollection = db.collection("messages");
export const chatsCollection = db.collection("chats");
export const usersCollection = db.collection("users");

// create chat id
export function createChatId(user1Id: string, user2Id: string): string {
  return [user1Id, user2Id].sort().join("-");
}

// get chat room
export async function getChatRoom(chatId: string) {
  try {
    const chatRef = chatsCollection.doc(chatId);
    const chatSnap = await chatRef.get();
    return chatSnap.exists ? { id: chatSnap.id, ...chatSnap.data() } : null;
  } catch (error) {
    console.error("채팅방 조회 실패:", error);
    throw error;
  }
}

// get or create chat room
export async function getOrCreateChatRoom(
  user1Id: string,
  user2Id: string,
  user1Data: Pick<User, "name" | "email">,
  user2Data: Pick<User, "name" | "email">,
  createdAt: Date
) {
  try {
    const chatId = createChatId(user1Id, user2Id);
    const existingChat = await getChatRoom(chatId);

    if (existingChat) {
      return existingChat;
    }

    const newChat: ChatRoom = {
      id: chatId,
      participants: [user1Id, user2Id],
      participantsData: {
        [user1Id]: {
          name: user1Data.name,
          email: user1Data.email,
        },
        [user2Id]: {
          name: user2Data.name,
          email: user2Data.email,
        },
      },
      lastMessage: {
        content: "채팅을 시작해보세요!",
        timestamp: createdAt,
        senderId: "system",
      },
      createdAt,
    };

    const chatRef = chatsCollection.doc(chatId);
    await chatRef.set(newChat);

    return await getChatRoom(chatId);
  } catch (error) {
    console.error("채팅방 생성 실패:", error);
    throw error;
  }
}

// update chat room last message
export async function updateChatRoomLastMessage(
  chatId: string,
  lastMessage: ChatRoom["lastMessage"]
) {
  try {
    const chatRef = chatsCollection.doc(chatId);
    await chatRef.update({
      "lastMessage.content": lastMessage.content,
      "lastMessage.timestamp": lastMessage.timestamp,
      "lastMessage.senderId": lastMessage.senderId,
    });
  } catch (error) {
    console.error("마지막 메시지 업데이트 실패:", error);
    throw error;
  }
}

// save message
export async function saveMessage(message: Omit<Message, "id">) {
  try {
    const messageRef = await messagesCollection.add(message);

    await updateChatRoomLastMessage(message.chatId, {
      content: message.content,
      timestamp: message.timestamp,
      senderId: message.senderId,
    });

    return messageRef.id;
  } catch (error) {
    console.error("메시지 저장 실패:", error);
    throw error;
  }
}

// update last read at
export async function updateLastReadAt(
  chatId: string,
  userId: string,
  lastReadAt: Date
) {
  try {
    const chatRef = chatsCollection.doc(chatId);
    await chatRef.update({
      [`participantsData.${userId}.lastReadAt`]: lastReadAt,
    });
  } catch (error) {
    console.error("읽은 시간 업데이트 실패:", error);
    throw error;
  }
}

// update user online status
export async function updateUserOnlineStatus(
  userId: string,
  isOnline: boolean
) {
  try {
    const userRef = usersCollection.doc(userId);
    await userRef.update({ isOnline });
  } catch (error) {
    console.error("사용자 온라인 상태 업데이트 실패:", error);
    throw error;
  }
}
