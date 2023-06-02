const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const authRoute = require("./routes/auth");
const chatRoute = require("./routes/chat");
const getRoute = require("./routes/getUsers");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const Chat = require("./model/Chat");
const User = require("./model/User");
const Message = require("./model/Message");

const app = express();
app.use(cors());
const server = http.createServer(app);
io = socketIO(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("A client connected");

  socket.on("joinChatRoom", (room) => {
    // Join the specified chat room
    socket.join(room);
    console.log(`Socket ${socket.id} joined chat room ${room}`);
  });

  socket.on("leaveChatRoom", (room) => {
    // Leave the specified chat room
    socket.leave(room);
    console.log(`Socket ${socket.id} left chat room ${room}`);
  });

  socket.on("disconnect", () => {
    console.log("A client disconnected");
  });
});
let port = process.env.PORT || 3001;

mongoose.connect(process.env.DB_CONNECT);

app.use(express.json());

app.use("/api/user", authRoute);
app.use("/api/user", chatRoute);
app.use("/api/user/", getRoute);

app.post("/api/user/newMessage/:token", async (req, res) => {
  const token = req.params.token;
  const decodedJWT = jwt.decode(token);
  const senderUsername = decodedJWT.username;
  const { participants, content } = req.body;

  try {
    // Add the sender's username to the participants array
    participants.push(senderUsername);

    // Find the chat that contains all the participant usernames
    const chat = await Chat.findOne({
      participants: { $all: participants, $size: participants.length },
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found." });
    }

    // Create a new message with the chat ID, sender's username, and content
    const newMessage = new Message({
      chatId: chat._id,
      senderUsername,
      content,
    });
    const savedMessage = await newMessage.save();
    const room = chat._id.toString(); // Assuming chat._id is a valid identifier
    io.to(room).emit("messageReceived", savedMessage);
    res.json(savedMessage);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while sending the message." });
  }
});

app.post("/api/user/getMessages/:token", async (req, res) => {
  const token = req.params.token;
  const decodedJWT = jwt.decode(token);
  const senderUsername = decodedJWT.username;
  const { participants } = req.body;

  try {
    // Add the sender's username to the participants array
    participants.push(senderUsername);

    // Find the chat that contains all the participant usernames
    const chat = await Chat.findOne({
      participants: { $all: participants, $size: participants.length },
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found." });
    }

    // Find all messages in the chat sorted by createdAt field in chronological order
    const messages = await Message.find({ chatId: chat._id }).sort({
      createdAt: 1,
    });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while retrieving the messages." });
  }
});

server.listen(port, () => {
  console.log(`listening on *:${port}`);
});
