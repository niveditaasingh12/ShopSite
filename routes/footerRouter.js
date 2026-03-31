const express = require("express");
const router = express.Router();

router.get("/about", (req, res) => {
  res.render("about-us");
});

router.get("/contact", (req, res) => {
  res.render("contact-us");
});

router.get("/terms", (req, res) => {
  res.render("terms-of-service");
});



module.exports = router;
