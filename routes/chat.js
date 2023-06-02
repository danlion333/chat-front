const router = require("express").Router();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const Chat = require("../model/Chat");
const User = require("../model/User");
const Message = require("../model/Message");
const bcrypt = require("bcrypt");

router.post("/createNewChat/:token", async (req, res) => {
  const { participants } = req.body;

  const token = req.params.token;
  const decodedJWT = jwt.decode(token);
  const username = decodedJWT.username;

  const newChat = new Chat({ participants: participants });
  newChat.participants.push(username);
  try {
    const savedChat = await newChat.save();
    res.send(savedChat);
  } catch (err) {
    res.status(400).send(err);
  }
});

router.post("/getChatId/:token", async (req, res) => {
  const token = req.params.token;
  const decodedJWT = jwt.decode(token);
  const senderUsername = decodedJWT.username;
  const { participants } = req.body;

  try {
    participants.push(senderUsername);
    const chat = await Chat.findOne({
      participants: { $all: participants, $size: participants.length },
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found." });
    }
    res.json({ id: chat._id });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while sending the message." });
  }
});

router.get("/getChats/:token", async (req, res) => {
  const token = req.params.token;
  const decodedJWT = jwt.decode(token);
  const username = decodedJWT.username;

  try {
    // Find the current user
    const currentUser = await User.findOne({ username });
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find chats with the current user
    const chats = await Chat.find({ participants: username });

    // Extract unique participant usernames from chats
    const participantUsernames = Array.from(
      new Set(chats.flatMap((chat) => chat.participants))
    );

    // Remove the current user's username from the participant usernames
    const filteredParticipantUsernames = participantUsernames.filter(
      (participantUsername) => participantUsername !== currentUser.username
    );

    // Find corresponding user documents for the participant usernames
    const users = await User.find(
      { username: { $in: filteredParticipantUsernames } },
      "username"
    );

    // Create a map of user usernames to usernames
    const userMap = users.reduce((map, user) => {
      map.set(user.username, user.username);
      return map;
    }, new Map());

    // Format chats with participant usernames
    const formattedChats = chats.map((chat) => {
      const participantUsernames = chat.participants
        .filter(
          (participantUsername) => participantUsername !== currentUser.username
        )
        .map((participantUsername) => userMap.get(participantUsername));
      return participantUsernames;
    });

    res.json(formattedChats);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the chats." });
  }
});
module.exports = router;
