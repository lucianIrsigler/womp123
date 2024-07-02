const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

const rooms = new Map();
const MAX_PLAYERS = 4;

let res = {
  "x":0,
  "y":0
}

io.on("connection", (socket) => {
  socket.on("createRoom", () => {
    const roomCode = generateRoomCode();
    rooms.set(roomCode, { host: socket.id, players: [] });
    socket.join(roomCode);
    socket.emit("roomCreated", roomCode);
  });

  socket.on("joinRoom", ({ name, roomCode }) => {
    const room = rooms.get(roomCode);
    if (room) {
      if (room.players.length >= MAX_PLAYERS) {
        socket.emit("error", "Room is full");
      } else {
        room.players.push({ id: socket.id, name });
        socket.join(roomCode);
        io.in(roomCode).emit("playerJoined", { name, room });
        io.to(roomCode).emit("updatePlayerList", room.players);

        socket.emit("joinedRoom", { roomCode, isHost: false });

        // Check if room is full after joining
        if (room.players.length === MAX_PLAYERS) {
          io.to(roomCode).emit("roomFull");
        }
      }
    } else {
      socket.emit("error", "Room not found");
    }
  });

  socket.on("startGame", (roomCode) => {
    const room = rooms.get(roomCode);
    if (room && room.host === socket.id) {
      io.to(roomCode).emit("gameStarted");
    }
  });

  socket.on("gyroscopeData", ({ roomCode, data }) => {
    const room = rooms.get(roomCode);
    /*if (room && room.host) {
      io.to(roomCode).emit("gyroscopeUpdate", { playerId: socket.id, data });
    }*/

    res.x = Math.max(res.x,data.x);
    res.y = Math.max(res.y,data.y);

    if (room) {
      //io.to(roomCode).emit("gyroscopeUpdate", { playerId: socket.id, data });
      io.to(roomCode).emit("updateBall",{playerID: socket.id, data:res})
    }
  });

  socket.on("disconnect", () => {
    rooms.forEach((room, roomCode) => {
      const playerIndex = room.players.findIndex((p) => p.id === socket.id);
      if (playerIndex !== -1) {
        const player = room.players[playerIndex];
        room.players.splice(playerIndex, 1);
        socket.to(roomCode).emit("playerLeft", { name: player.name });
        io.to(room.host).emit("updatePlayerList", room.players);
      }
    });
  });
});

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

const PORT = process.env.PORT || 1337;

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
