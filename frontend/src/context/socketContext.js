import React, { createContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);

  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  /*
  ============================
  GET TOKEN (SAFE)
  ============================
  */
  const getToken = async () => {
    let token = await SecureStore.getItemAsync("accessToken");
    if (!token) return null;

    return token.replace("Bearer ", "").trim();
  };

  /*
  ============================
  REFRESH TOKEN
  ============================
  */
  const refreshToken = async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync("refreshToken");
      if (!refreshToken) return null;

      const res = await axios.post(
        "http://10.0.0.14:9090/api/auth/refresh-token",
        { refreshToken }
      );

      let newToken = res.data.accessToken;
      if (!newToken) return null;

      newToken = newToken.replace("Bearer ", "").trim();

      await SecureStore.setItemAsync("accessToken", newToken);

      return newToken;
    } catch (err) {
      console.log("❌ Refresh failed");
      return null;
    }
  };

  /*
  ============================
  CONNECT SOCKET
  ============================
  */
  const connectSocket = async (passedToken = null) => {
    const token = passedToken || (await getToken());

    if (!token) {
      console.log("❌ No token → skip socket");
      return;
    }

    // disconnect old
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    console.log("🔌 Connecting socket with token:", token);

    const newSocket = io("http://10.0.0.14:9090", {
      transports: ["websocket"],
      auth: { token }
    });

    /*
    ============================
    CONNECT SUCCESS
    ============================
    */
    newSocket.on("connect", async () => {
      console.log("🟢 Socket Connected");

      setIsConnected(true);

      const userId = await SecureStore.getItemAsync("userId");
      const role = await SecureStore.getItemAsync("role");

      if (userId) {
        newSocket.emit("join_user_room", userId);
      }

      if (role === "buddy" && userId) {
        newSocket.emit("join_buddy_room", userId);
      }
    });

    /*
    ============================
    ERROR HANDLING (FIXED)
    ============================
    */
    newSocket.on("connect_error", async (err) => {
      console.log("❌ Socket error:", err.message);

      if (err.message === "AUTH_FAILED" || err.message === "NO_TOKEN") {
        console.log("♻️ Refreshing token...");

        const newToken = await refreshToken();

        if (newToken) {
          console.log("✅ Reconnecting with new token...");
          connectSocket(newToken);
        } else {
          console.log("❌ Refresh failed → logout needed");
        }
      }

      setIsConnected(false);
    });

    newSocket.on("disconnect", () => {
      console.log("🔴 Socket disconnected");
      setIsConnected(false);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  };

  /*
  ============================
  DISCONNECT
  ============================
  */
  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }
  };

  /*
  ============================
  RECONNECT
  ============================
  */
  const reconnectSocket = async () => {
    console.log("♻️ Manual reconnect...");
    disconnectSocket();

    const token = await getToken();
    if (token) connectSocket(token);
  };

  /*
  ============================
  INIT (SAFE TIMING)
  ============================
  */
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const token = await getToken();

      if (mounted && token) {
        connectSocket(token);
      } else {
        console.log("⏳ Waiting for token...");
      }
    };

    init();

    global.socketReconnect = reconnectSocket;

    return () => {
      mounted = false;
      disconnectSocket();
    };
  }, []);

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