import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { setUpSocketHandlers } from "./socket-handlers";

const app = express();
const httpSever = createServer(app);

// CORS 설정
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);

// Socket.io 서버 설정
const io = new Server(httpSever, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket 이벤트 핸들러 설정
setUpSocketHandlers(io);

// 기본 라우트
app.get("/", (req, res) => {
  res.json({
    message: "Server is running",
    status: "running",
    connectedUsers: io.engine.clientsCount,
  });
});

// 서버 상태 확인 라우트
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 서버 시작
const PORT = process.env.PORT || 3001;
httpSever.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`클라이언트 연결: http://localhost:3000`);
  console.log(`서버 상태 확인: http://localhost:${PORT}/health`);
});
