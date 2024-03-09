const express = require("express");
const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload"); // Import du middleware express-fileupload
const router = express.Router();
const Publish = require("../models/Publish");
const isAuthenticated = require("../middleware/isAuthenticated");
const convertToBase64 = require("../utils/convertToBase64");
const User = require("../models/User");

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      console.log(req.headers.authorization);

      const { description, price, condition, city, brand, size, color, title } =
        req.body;
      const picture = req.files.picture;
      const cloudResponse = await cloudinary.uploader.upload(
        convertToBase64(picture)
      );
      console.log(cloudResponse);

      const responseObj = new Publish({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          {
            MARQUE: brand,
          },
          {
            TAILLE: size,
          },
          {
            ÉTAT: condition,
          },
          {
            COULEUR: color,
          },
          {
            EMPLACEMENT: city,
          },
        ],
        product_image: cloudResponse,
        owner: req.user,
      });
      await responseObj.save();
      console.log(responseObj);
      return res.status(201).json(responseObj);
    } catch (error) {
      // Gérer les erreurs ici
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);
router.get("/offers", async (req, res) => {
  try {
    console.log(req.query);
    const { title, priceMin, priceMax, sort, page } = req.query;
    const filters = {};
    if (title) {
      filters.product_name = new RegExp(title, "i");
    }
    if (priceMin) {
      filters.product_price = { $gte: priceMin };
    }
    if (priceMax) {
      if (priceMin) {
        filters.product_price.$lte = priceMax;
      } else {
        filters.product_price = { $lte: priceMax };
      }
    }
    const sorter = {};
    if (sort === "price-asc") {
      sorter.product_price = "asc";
    } else if (sort === "price-desc") {
      sorter.product_price = "desc";
    }
    let skip = 0;
    if (page) {
      skip = (page - 1) * 5;
    }
    console.log(filters);
    const offers = await Publish.find(filters)
      .sort(sorter)
      .skip(skip)
      .limit(5)
      .populate("owner", "account");
    const count = await Publish.countDocuments(filters);
    res.json({ count: count, offers: offers });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/offers/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const offer = await Publish.findById(id).populate("owner", "account");
    res.json(offer);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
module.exports = router;
