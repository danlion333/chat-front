const router = require("express").Router();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const User = require("../model/User");

router.get("/getUserByJwt/:token", async (req, res) => {
  const token = req.params.token;
  const decodedJWT = jwt.decode(token);
  const username = decodedJWT.username;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/getAllUsers/:token", async (req, res) => {
  const token = req.params.token;
  const decodedJWT = jwt.decode(token);
  const username = decodedJWT.username;
  try {
    const currentUser = await User.findOne({ username });
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const users = await User.find({ _id: { $ne: currentUser._id } });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});
module.exports = router;
