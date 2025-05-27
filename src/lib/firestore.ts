import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { ChatRoom, Message, User } from "@/types/chat";

// collection
export const messagesCollection = collection(db, "messages");
export const chatsCollection = collection(db, "chats");
export const usersCollection = collection(db, "users");

// create chat id
export function createChatId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join("_");
}

// store message
export async function saveMessage(
  chatId: string,
  message: {
    text: string;
    senderId: string;
    senderName: string;
    senderEmail: string;
  }
) {
  try {
    const messageData = {
      ...message,
      chatId,
      timestamp: Timestamp.now(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(messagesCollection, messageData);

    // update last message
    await updateChatLastMessage(chatId, {
      text: message.text,
      timestamp: Timestamp.now(),
      senderId: message.senderId,
    });

    return { id: docRef.id, ...messageData };
  } catch (error) {
    console.error("메시지 저장 실패:", error);
    throw error;
  }
}

// create or get chat
export async function createOrGetChat(
  userId1: string,
  userId2: string,
  user1Data: Pick<User, "name" | "email">,
  user2Data: Pick<User, "name" | "email">
) {
  const chatId = createChatId(userId1, userId2);
  const chatRef = doc(chatsCollection, chatId);

  // if chat existed
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    // create chat
    const chatData: Omit<ChatRoom, "id"> = {
      participants: [userId1, userId2],
      participantsData: {
        [userId1]: {
          name: user1Data.name,
          email: user1Data.email,
        },
        [userId2]: {
          name: user2Data.name,
          email: user2Data.email,
        },
      },
      createdAt: Timestamp.now(),
    };

    await setDoc(chatRef, chatData);
  }

  return chatId;
}

// subscribe messages
export function subscribeToMessages(
  chatId: string,
  callback: (messages: Message[]) => void
) {
  const q = query(
    messagesCollection,
    where("chatId", "==", chatId),
    orderBy("timestamp", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Message[];

    callback(messages);
  });
}

async function updateChatLastMessage(
  chatId: string,
  lastMessage: {
    text: string;
    timestamp: Timestamp;
    senderId: string;
  }
) {
  const chatRef = doc(chatsCollection, chatId);
  await updateDoc(chatRef, { lastMessage });
}

// save or update user
export async function saveOrUpdateUser(
  user: Pick<User, "id" | "name" | "email">
) {
  const userRef = doc(usersCollection, user.id);
  await setDoc(
    userRef,
    {
      ...user,
      isOnline: true,
      lastSeen: Timestamp.now(),
    },
    { merge: true }
  );
}

// update user online status
export async function updateUserOnlineStatus(
  userId: string,
  isOnline: boolean
) {
  try {
    const userRef = doc(usersCollection, userId);
    await updateDoc(userRef, {
      isOnline,
      lastSeen: Timestamp.now(),
    });
  } catch (error) {
    console.error("온라인 상태 업데이트 실패:", error);
  }
}
