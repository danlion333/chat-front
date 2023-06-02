const router = require("express").Router();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const User = require("../model/User");
const bcrypt = require("bcrypt");

router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const usernameExists = await User.findOne({ username: username });
  if (usernameExists) return res.status(400).send("Email already exists");

  bcrypt.hash(password, 10, async function (err, hashedPassword) {
    const user = new User({
      username: username,
      password: hashedPassword,
    });
    try {
      const savedUser = await user.save();
      res.send(savedUser);
    } catch (err) {
      res.status(400).send(err);
    }
  });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username: username });
  if (!user) return res.status(400).send("User doesnt exist");

  bcrypt.compare(password, user.password, (err, result) => {
    if (result === false) {
      return res.status(400).json({ message: "Wrong password" });
    }
    const token = jwt.sign(
      { username: user.username },
      process.env.TOKEN_SECRET
    );
    res.send(token);
  });
});

module.exports = router;
