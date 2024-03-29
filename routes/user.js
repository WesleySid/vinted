const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const encBase64 = require("crypto-js/enc-base64");
const SHA256 = require("crypto-js/sha256");
const User = require("../models/User");

router.post("/signup", async (req, res) => {
  try {
    console.log("Je suis dans la route user/signup");
    console.log("Données reçues du frontend :", req.body);

    // Vérifier si toutes les informations requises sont fournies
    if (!req.body.username || !req.body.email || !req.body.password) {
      return res
        .status(400)
        .json("Nom d'utilisateur, email ou mot de passe manquant");
    }

    // Vérifier si l'email est déjà utilisé
    const alreadyExist = await User.findOne({ email: req.body.email });
    if (alreadyExist) {
      return res.status(400).json("Email déjà utilisé");
    }

    // Générer le salt et le hash pour le mot de passe
    const salt = uid2(16);
    const hash = SHA256(req.body.password + salt).toString(encBase64);
    const token = uid2(32);

    // Créer un nouvel utilisateur avec les données fournies
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      newsletter: req.body.newsletter,
      token: token,
      hash: hash,
      salt: salt,
    });

    // Sauvegarder le nouvel utilisateur dans la base de données
    await newUser.save();

    // Créer l'objet de réponse
    const responseObj = {
      _id: newUser._id,
      token: newUser.token,
      account: { username: newUser.username },
    };

    // Envoyer la réponse avec le statut 201 (Created)
    return res.status(201).json(responseObj);
  } catch (error) {
    // En cas d'erreur, envoyer une réponse avec le statut 500 (Internal Server Error)
    return res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    console.log("Je suis dans la route /login");

    // Rechercher l'utilisateur dans la base de données par son email
    const userFound = await User.findOne({ email: req.body.email });

    // Si l'utilisateur n'est pas trouvé, retourner une erreur
    if (!userFound) {
      return res.status(400).json("Email ou mot de passe incorrect");
    }

    // Vérifier le mot de passe en comparant les hashes
    const newHash = SHA256(req.body.password + userFound.salt).toString(
      encBase64
    );
    if (newHash === userFound.hash) {
      // Si les mots de passe correspondent, créer l'objet de réponse
      const responseObj = {
        _id: userFound._id,
        token: userFound.token,
        account: { username: userFound.username },
      };
      // Envoyer la réponse avec le statut 200 (OK)
      return res.status(200).json(responseObj);
    } else {
      // Si les mots de passe ne correspondent pas, retourner une erreur
      return res.status(401).json("Email ou mot de passe incorrect");
    }
  } catch (error) {
    // En cas d'erreur, envoyer une réponse avec le statut 500 (Internal Server Error)
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
