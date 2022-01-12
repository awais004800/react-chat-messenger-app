import React, { createContext, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

// @ts-ignore
const SocketContext = createContext();

const SocketProvider = ({ children }) => {
  const me = useRef(null);

  const socketRef = useRef(null);

  const socketInial = useCallback(() => {
    const socket = io("http://127.0.0.1:2000", {
      forceNew: true,
    });

    socketRef.current = socket;

    socket.on("me", (id) => {
      me.current = id;
    });
  }, []);

  useEffect(() => {
    socketInial();
  }, [socketInial]);

  return (
    <SocketContext.Provider value={{ socketRef, me }}>
      {children}
    </SocketContext.Provider>
  );
};

export { SocketContext, SocketProvider };
