export const SOCKET_EVENTS = {
  // Connection Events
  CONNECT: "connect",
  DISCONNECT: "disconnect",

  // User Events
  USER_REGISTER: "user:register",
  USER_REGISTERED: "user:registered",

  // Message Events
  MESSAGE_SEND: "message:send",
  MESSAGE_RECEIVED: "message:received",
  MESSAGE_READ: "message:read",

  // Chat Events
  CHAT_START: "chat:start",
  CHAT_STARTED: "chat:started",

  // Typing Events
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
  TYPING_NOTIFY: "typing:notify",

  // Error Events
  CONNECT_ERROR: "connect_error",
  USER_REGISTER_FAILED: "user:register-failed",
  CHAT_START_FAILED: "chat:start-failed",
  MESSAGE_SEND_FAILED: "message:send-failed",
} as const;
