const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const encBase64 = require("crypto-js/enc-base64");
const SHA256 = require("crypto-js/sha256");
const isAuthenticated = require("../middleware/isAuthenticated");
const User = require("../models/User");

router.post("/user/signup", isAuthenticated, async (req, res) => {
  try {
    console.log("Je suis dans la route user/signup");
    if (!req.body.username || !req.body.email || !req.body.password) {
      return res.status(400).json("nom/mail/mdp pas bon");
    }
    const alreadyExist = await User.findOne({ email: req.body.email });
    if (!alreadyExist) {
      const salt = uid2(16);
      const hash = SHA256(req.body.password + salt).toString(encBase64);
      const token = uid2(32);
      const newUser = new User({
        email: req.body.email,
        account: { username: req.body.username },
        newsletter: req.body.newsletter,
        token: token,
        hash: hash,
        salt: salt,
      });
      await newUser.save();
      const responseObj = {
        _id: newUser._id,
        token: newUser.token,
        account: { username: newUser.account.username },
      };
      return res.status(201).json(responseObj);
    } else {
      return res.status(400).json("email already used");
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    console.log("Je suis dans la route user/login");
    const userFound = await User.findOne({ email: req.body.email });
    console.log(">>", userFound);
    if (!userFound) {
      return res.status(400).json("Email or password incorrect");
    }
    const newHash = SHA256(req.body.password + userFound.salt).toString(
      encBase64
    );
    if (newHash === userFound.hash) {
      const responseObj = {
        _id: userFound._id,
        token: userFound.token,
        account: { username: userFound.account.username },
      };
      return res.status(200).json(responseObj);
    } else {
      return res.status(401).json("Email or password incorrect");
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
