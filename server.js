const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;
const http = require("http");
const expressServer = http.createServer(app);

// path for manage all client site path request  (npm i path.js)
const path = require("path");

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// import data from utils > messages.js   this return appName newMessage time
const formatMessage = require("./utils/messages");
// import data from utils > users.js

// userJoin return a object{id , username, room}
// getCurrentUser return object{id , username, room}
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

// socket.io environment
const {Server} = require("socket.io");
const io = new Server (expressServer);
// name anyting 
const appName = "ChirKut";

io.on("connection", (socket) => {

  socket.on("joinRoom", ({ username, room }) => {
    // userJoin return {id , username, room}
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    socket.emit("message", formatMessage(appName, "Welcome to ChirKut!"));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(appName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);

    io.to(user?.room).emit("message", formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(appName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});


expressServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));