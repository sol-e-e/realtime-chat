import { Server, Socket } from "socket.io";

interface ConnectedUser {
  userId: string;
  socketId: string;
  displayName?: string;
  email?: string;
  joinedAt: Date;
}

interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
}

// TODO: 연결된 사용자들 관리 Firebase Realtime Database에 저장
// 연결된 사용자들 관리
const connectedUsers = new Map<string, ConnectedUser>(); // <socketId, ConnectedUser>
const userSocket = new Map<string, string>(); // <userId, socketId>

export function setUpSocketHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log(`새로운 클라이언트 연결: ${socket.id}`);

    // 사용자 인증 및 등록
    socket.on(
      "user:resgister",
      (userData: Pick<ConnectedUser, "userId" | "displayName" | "email">) => {
        const user: ConnectedUser = {
          ...userData,
          socketId: socket.id,
          joinedAt: new Date(),
        };

        // 사용자 정보 저장
        connectedUsers.set(socket.id, user);
        userSocket.set(userData.userId, socket.id);
        console.log(
          `사용자 등록: ${userData.displayName || userData.email} (${
            userData.userId
          })`
        );

        // 사용자에게 등록 완료 알림
        socket.emit("user:registered", {
          success: true,
          user: user,
          connectedUsersCount: connectedUsers.size,
        });

        // 다른 사용자들에게 새 사용자 입장 알림
        socket.broadcast.emit("user:joined", {
          user: {
            ...userData,
          },
          connectedUsersCount: connectedUsers.size,
        });
      }
    );

    // 채팅방 입장
    socket.on("chat:join", (chatId: string) => {
      socket.join(chatId);
      console.log(`사용자 ${socket.id}가 채팅방 ${chatId}에 밉장`);

      socket.emit("chat:joined", { chatId });
      socket.to(chatId).emit("user:entered-chat", {
        userId: connectedUsers.get(socket.id)?.userId,
        chatId,
      });
    });

    // 채탕방 나가기
    socket.on("chat:leave", (chatId: string) => {
      socket.leave(chatId);
      console.log(`사용자 ${socket.id}가 채팅방 ${chatId}에서 나감`);

      socket.to(chatId).emit("user:left-chat", {
        userId: connectedUsers.get(socket.id)?.userId,
        chatId,
      });
    });

    // 메시지 전송
    socket.on(
      "message:send",
      (messageData: Omit<ChatMessage, "id" | "timestamp">) => {
        const message: ChatMessage = {
          ...messageData,
          id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          timestamp: new Date(),
        };

        console.log(
          `메시지 전송: ${messageData.senderName} -> ${messageData.chatId}`
        );

        // 채팅방 내 모든 사용자에게 메시지 전송
        io.to(messageData.chatId).emit("message:received", message);
      }
    );

    // 타이핑 상태
    socket.on(
      "typing:start",
      (data: { chatId: string; userId: string; userName: string }) => {
        socket.to(data.chatId).emit("typing:user-started", {
          ...data,
        });
      }
    );

    socket.on(
      "typing:stop",
      (data: { chatId: string; userId: string; userName: string }) => {
        socket.to(data.chatId).emit("typing:user-stopped", { ...data });
      }
    );

    // 연결 종료
    socket.on("disconnect", () => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        console.log(`사용자 ${user.userId}가 연결 종료`);

        // 사용자 정보 제거
        connectedUsers.delete(socket.id);
        userSocket.delete(user.userId);

        // 다른 사용자들에게 사용자 나감 알림
        socket.broadcast.emit("user:left", {
          user: {
            userId: user.userId,
            displayName: user.displayName,
            email: user.email,
          },
          connectedUsersCount: connectedUsers.size,
        });
      } else {
        console.log(`사용자 ${socket.id}가 연결 종료 (사용자 정보 없음)`);
      }
    });

    // 연결된 사용자 목록 요청
    socket.on("users:get-online", () => {
      const onlineUsers = Array.from(connectedUsers.values()).map((user) => ({
        userId: user.userId,
        displayName: user.displayName,
        email: user.email,
        joinedAt: user.joinedAt,
      }));

      socket.emit("users:online-list", onlineUsers);
    });
  });

  // 주기적으로 연결 상태 정보 출력
  setInterval(() => {
    if (connectedUsers.size > 0) {
      console.log(`현재 연결된 사용자 수: ${connectedUsers.size}`);
    }
  }, 30000);
}
