import { Server, Socket } from "socket.io";
import { SOCKET_EVENTS } from "./constants";
import {
  getOrCreateChatRoom,
  saveMessage,
  updateLastReadAt,
  updateUserOnlineStatus,
} from "./firebase-admin";
import { Message, OnlineUser, User } from "./types";

// 연결된 사용자들 관리
const onlineUsers = new Map<string, OnlineUser>(); // <socketId, OnlineUser>
const userSockets = new Map<string, string>(); // <userId, socketId>

export function setUpSocketHandlers(io: Server) {
  io.on(SOCKET_EVENTS.CONNECT, (socket: Socket) => {
    console.log(`새로운 클라이언트 연결: ${socket.id}`);

    // 사용자 인증 및 등록
    socket.on(
      SOCKET_EVENTS.USER_REGISTER,
      async (userData: Pick<OnlineUser, "id" | "name" | "email">) => {
        try {
          await updateUserOnlineStatus(userData.id, true);
          const user: OnlineUser = {
            ...userData,
            socketId: socket.id,
            joinedAt: new Date(),
          };

          onlineUsers.set(socket.id, user);
          userSockets.set(userData.id, socket.id);
          console.log(
            `사용자 등록: ${userData.name || userData.email} (${userData.id})`
          );

          socket.emit(SOCKET_EVENTS.USER_REGISTERED, { success: true, user });
        } catch (error) {
          console.error("사용자 온라인 상태 업데이트 실패:", error);
          socket.emit(SOCKET_EVENTS.USER_REGISTER_FAILED, {
            success: false,
            error: "사용자 온라인 상태 업데이트 실패",
          });
        }
      }
    );

    // 채팅방 입장
    socket.on(
      SOCKET_EVENTS.CHAT_START,
      async (otherUser: Pick<User, "id" | "name" | "email">) => {
        try {
          const currentUser = onlineUsers.get(socket.id);
          if (!currentUser) {
            socket.emit(SOCKET_EVENTS.CHAT_START_FAILED, {
              success: false,
              error: "사용자 정보 없음",
            });
            return;
          }

          // 채팅방 생성 또는 가져오기
          const chatRoom = await getOrCreateChatRoom(
            currentUser.id,
            otherUser.id,
            { name: currentUser.name, email: currentUser.email },
            { name: otherUser.name, email: otherUser.email }
          );

          if (!chatRoom) {
            socket.emit(SOCKET_EVENTS.CHAT_START_FAILED, {
              success: false,
              error: "채팅방 생성 실패",
            });
            return;
          }

          socket.join(chatRoom.id);
          socket.emit(SOCKET_EVENTS.CHAT_STARTED, {
            success: true,
            chatRoom,
          });

          const otherSocketId = userSockets.get(otherUser.id);
          if (otherSocketId) {
            io.sockets.sockets.get(otherSocketId)?.join(chatRoom.id);
            io.to(otherSocketId).emit(SOCKET_EVENTS.CHAT_STARTED, {
              success: true,
              chatRoom,
            });
          }

          console.log(`사용자 ${socket.id}가 채팅방 ${chatRoom.id}에 입장`);
        } catch (error) {
          console.error("채팅방 입장 실패:", error);
        }
      }
    );

    // 메시지 전송
    socket.on(
      SOCKET_EVENTS.MESSAGE_SEND,
      async (messageData: Pick<Message, "content" | "chatId">) => {
        try {
          const currentUser = onlineUsers.get(socket.id);
          if (!currentUser) {
            socket.emit(SOCKET_EVENTS.MESSAGE_SEND_FAILED, {
              success: false,
              error: "사용자 정보 없음",
            });
            return;
          }

          const messageId = await saveMessage(messageData.chatId, {
            content: messageData.content,
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderEmail: currentUser.email,
          });

          const message: Message = {
            ...messageData,
            id: messageId,
            timestamp: new Date(),
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderEmail: currentUser.email,
          };

          io.to(messageData.chatId).emit(SOCKET_EVENTS.MESSAGE_RECEIVED, {
            success: true,
            message,
          });
        } catch (error) {
          socket.emit(SOCKET_EVENTS.MESSAGE_SEND_FAILED, {
            success: false,
            error: "메시지 전송 실패",
          });
          console.error("메시지 전송 실패:", error);
        }
      }
    );

    // 타이핑 상태
    socket.on(SOCKET_EVENTS.TYPING_START, ({ chatId }: { chatId: string }) => {
      try {
        const currentUser = onlineUsers.get(socket.id);
        if (!currentUser) {
          return;
        }

        socket.to(chatId).emit(SOCKET_EVENTS.TYPING_START, {
          userId: currentUser.id,
          userName: currentUser.name,
          chatId,
        });
      } catch (error) {
        console.error("타이핑 시작 상태 전송 실패:", error);
      }
    });

    socket.on(SOCKET_EVENTS.TYPING_STOP, ({ chatId }: { chatId: string }) => {
      try {
        const currentUser = onlineUsers.get(socket.id);
        if (!currentUser) {
          return;
        }

        socket.to(chatId).emit(SOCKET_EVENTS.TYPING_STOP, {
          userId: currentUser.id,
          userName: currentUser.name,
          chatId,
        });
      } catch (error) {
        console.error("타이핑 종료 상태 전송 실패:", error);
      }
    });

    // 연결 종료
    socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
      try {
        const user = onlineUsers.get(socket.id);
        if (user) {
          await updateUserOnlineStatus(user.id, false);

          onlineUsers.delete(socket.id);
          userSockets.delete(user.id);
        }
      } catch (error) {
        console.error("연결 종료 처리 실패:", error);
      }
    });

    // 읽음처리
    socket.on(
      SOCKET_EVENTS.MESSAGE_READ,
      async ({ chatId }: { chatId: string }) => {
        try {
          const currentUser = onlineUsers.get(socket.id);
          if (!currentUser) {
            return;
          }

          await updateLastReadAt(chatId, currentUser.id);

          socket.to(chatId).emit(SOCKET_EVENTS.MESSAGE_READ, {
            userId: currentUser.id,
            chatId,
            readAt: new Date(),
          });
        } catch (error) {
          console.error("메시지 읽음 처리 실패:", error);
          socket.emit(SOCKET_EVENTS.MESSAGE_READ, {
            success: false,
            error: "메시지 읽음 처리 실패",
          });
        }
      }
    );
  });

  // 주기적으로 연결 상태 정보 출력
  setInterval(() => {
    try {
      if (onlineUsers.size > 0) {
        console.log(`현재 연결된 사용자 수: ${onlineUsers.size}`);
      }
    } catch (error) {
      console.error("연결 상태 정보 출력 실패:", error);
    }
  }, 30000);
}
