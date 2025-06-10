import { ChatRoom, Message, User } from "@/types";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  startAfter,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

// collection
export const messagesCollection = collection(db, "messages");
export const chatsCollection = collection(db, "chats");
export const usersCollection = collection(db, "users");

// create chat id
export function createChatId(user1Id: string, user2Id: string): string {
  return [user1Id, user2Id].sort().join("-");
}

// get chat room
export async function getChatRoom(chatId: string) {
  try {
    const chatRef = doc(chatsCollection, chatId);
    const chatSnap = await getDoc(chatRef);
    return chatSnap.exists() ? { id: chatSnap.id, ...chatSnap.data() } : null;
  } catch (error) {
    console.error("채팅방 조회 실패:", error);
    throw error;
  }
}

// get user chat rooms
export async function getUserChatRooms(userId: string) {
  try {
    const q = query(
      chatsCollection,
      where("participants", "array-contains", userId),
      orderBy("lastMessage.timestamp", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ChatRoom[];
  } catch (error) {
    console.error("사용자 채팅방 목록 조회 실패:", error);
    throw error;
  }
}

// get messages
export async function getMessages(
  chatId: string,
  lastMessageId?: Message | null,
  pageSize: number = 20
) {
  try {
    let q = query(
      messagesCollection,
      where("chatId", "==", chatId),
      orderBy("timestamp", "asc"),
      limit(pageSize)
    );

    if (lastMessageId) {
      q = query(q, startAfter(lastMessageId.timestamp));
    }

    const snapshot = await getDocs(q);

    return {
      messages: snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[],
      lastMessageId: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === pageSize,
    };
  } catch (error) {
    console.error("메시지 조회 실패:", error);
    throw error;
  }
}

// get user by id
export async function getUserById(userId: string) {
  try {
    const userRef = doc(usersCollection, userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null;
  } catch (error) {
    console.error("사용자 조회 실패:", error);
    throw error;
  }
}

// get users
export async function getUsers() {
  try {
    const q = query(usersCollection, orderBy("name", "asc"), limit(10));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
  } catch (error) {
    console.error("사용자 목록 조회 실패:", error);
    throw error;
  }
}

// save user or update user
export async function saveOrUpdateUser(user: Omit<User, "isOnline">) {
  const userRef = doc(usersCollection, user.id);
  await setDoc(userRef, user, { merge: true });
}
