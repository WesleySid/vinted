const express = require("express");
const fileUpload = require("express-fileupload");
require("dotenv").config();
const cors = require("cors");
const serv = express();
const mongoose = require("mongoose");
serv.use(express.json());
serv.use(cors());
const cloudinary = require("cloudinary").v2;
mongoose.connect(process.env.MONGODB_URL);

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

serv.get("/", (req, res) => {
  try {
    return res.status(200).json("Bienvenue sur notre serveur Vinted");
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

const userRoutes = require("./routes/user");
const publishRoutes = require("./routes/publish");
serv.use(publishRoutes);
serv.use(userRoutes);

serv.all("*", (req, res) => {
  return res.status(404).json("404 NOT FOUND");
});

serv.listen(process.env.PORT, () => {
  console.log("Zé pardi 🤖");
});
