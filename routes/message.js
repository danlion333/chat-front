const router = require("express").Router();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const Chat = require("../model/Chat");
const User = require("../model/User");
const Message = require("../model/Message");

router.post("/newMessage/:token", async (req, res) => {
  const token = req.params.token;
  const decodedJWT = jwt.decode(token);
  const senderUsername = decodedJWT.username;
  const { participants, content } = req.body;

  try {
    // Add the sender's username to the participants array
    participants.push(senderUsername);

    // Find the chat that contains all the participant usernames
    const chat = await Chat.findOne({
      participants: { $all: participants },
      participants: { $size: participants.length },
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
    io.emit("messageReceived", savedMessage);
    res.json(savedMessage);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while sending the message." });
  }
});

router.post("/getMessages/:token", async (req, res) => {
  const token = req.params.token;
  const decodedJWT = jwt.decode(token);
  const senderUsername = decodedJWT.username;
  const { participants } = req.body;
  console.log(participants);

  try {
    // Add the sender's username to the participants array
    participants.push(senderUsername);

    // Find the chat that contains all the participant usernames
    const chat = await Chat.findOne({
    });
    console.log(chat);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found." });
    }

    // Find all messages in the chat sorted by createdAt field in chronological order
    const messages = await Message.find({ chatId: chat._id }).sort({
      createdAt: 1,
    });
    console.log(messages);

    res.json(messages);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while retrieving the messages." });
  }
});

module.exports = router;
