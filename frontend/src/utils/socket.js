import { io } from "socket.io-client";

let socket = null;

export const initSocket = ({ token } = {}) => {
  try {
    if (!token) return null;
    if (socket?.connected) return socket;
    
    const base = import.meta.env.VITE_API_BASE_WS || "http://localhost:5000";
    socket = io(base, {
      auth: { token },
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => console.log("Socket connected"));
    socket.on("connect_error", (err) => console.warn("Socket connect_error:", err?.message || err));
    socket.on("disconnect", () => console.log("Socket disconnected"));

    return socket;
  } catch (err) {
    console.warn("initSocket error:", err);
    return null;
  }
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};