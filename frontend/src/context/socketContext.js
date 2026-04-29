import React, { createContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);

  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    initSocket();
    global.socketReconnect = reconnectSocket;

    return () => disconnectSocket();
  }, []);

  const getToken = async () => {
    let token = await SecureStore.getItemAsync("accessToken");
    if (!token) return null;

    if (token.startsWith("Bearer ")) {
      token = token.replace("Bearer ", "");
    }

    return token;
  };

  const initSocket = async () => {
    const token = await getToken();
    if (token) connectSocket(token);
  };

  /*
  ============================
  REFRESH TOKEN
  ============================
  */
  const refreshToken = async () => {
    try {
      const refreshToken =
        await SecureStore.getItemAsync("refreshToken");

      if (!refreshToken) return null;

      const res = await axios.post(
        "http://10.0.0.14:9090/api/auth/refresh-token",
        { refreshToken }
      );

      const newToken = res.data.accessToken;

      if (!newToken) return null;

      await SecureStore.setItemAsync("accessToken", newToken);

      return newToken;

    } catch (err) {
      console.log("Refresh failed");
      return null;
    }
  };

  const connectSocket = async (passedToken = null) => {
    const token = passedToken || (await getToken());
    if (!token) return;

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    console.log("🔌 Connecting socket...");

    const newSocket = io("http://10.0.0.14:9090", {
      transports: ["websocket"],
      auth: { token },
    });

    newSocket.on("connect", () => {
      console.log("🟢 Socket Connected");
      setIsConnected(true);
    });

    newSocket.on("connect_error", async (err) => {
      console.log("❌ Socket error:", err.message);

      if (err.message === "TOKEN_EXPIRED") {
        console.log("♻️ refreshing token...");

        const newToken = await refreshToken();

        if (newToken) {
          reconnectSocket();
        } else {
          console.log("❌ refresh failed logout");
        }
      }

      setIsConnected(false);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  };

  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  const reconnectSocket = async () => {
    console.log("♻️ Reconnecting socket...");
    await disconnectSocket();
    const token = await getToken();
    if (token) connectSocket(token);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        reconnectSocket,
        disconnectSocket,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};