import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.emit("me", socket.id);

  socket.on("disconnect", () => {
    socket.broadcast.emit("callEnded", socket.id);
  });

  socket.on(
    "callUser",
    ({ clientID, signalData, from, email, isAudioCall }) => {
      socket
        .to(clientID)
        .emit("onCall", { clientID, signalData, from, email, isAudioCall });
    }
  );

  socket.on("answerCall", (data) => {
    io.to(data.to).emit("callAccepted", data.signal);
  });

  socket.on("userID", (data) => {
    socket.broadcast.emit("getUser", data);
  });

  socket.on("myID", (data) => {
    io.to(data.sender.current).emit("clientID", data);
  });
});

server.listen(2000, () => {
  console.log(`[+] Server running at 2000`);
});
