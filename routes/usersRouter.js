const express = require("express");

const router = express.Router();
const userModel = require("../models/user-model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { generateToken } = require("../utils/generateToken");
const {
  registerUser,
  loginUser,
  logoutUser,
} = require("../controllers/authController");

// Customer registration & login pages
router.get("/register", (req, res) => {
  const success = req.flash("success");
  const error = req.flash("error");
  res.redirect("/");
});

router.get("/login", (req, res) => {
  const success = req.flash("success");
  const error = req.flash("error");
  res.redirect("/");
});

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);

module.exports = router;
