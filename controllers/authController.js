const userModel = require("../models/user-model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/generateToken");

module.exports.registerUser = async (req, res) => {
  try {
    const { fullname, email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!fullname || !normalizedEmail || !password) {
      req.flash("registerError", "All fields are required.");
      return res.redirect("/");
    }

    const existingUser = await userModel.findOne({ email: normalizedEmail });
    if (existingUser) {
      req.flash("registerError", "You already have an account. Please login.");
      return res.redirect("/");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await userModel.create({
      fullname: fullname.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = generateToken(newUser);
    res.cookie("token", token);

    req.flash("success", "Account created successfully.");

    return res.redirect("/");
  } catch (error) {
    console.error("Registration Error:", error);

    if (error.code === 11000) {
      req.flash("registerError", "Email already exists. Please login.");
      return res.redirect("/");
    }

    if (error.message?.includes("JWT_KEY")) {
      req.flash(
        "registerError",
        "Server configuration issue. Please contact support.",
      );
      return res.redirect("/");
    }

    req.flash("registerError", "Registration failed. Please try again.");
    return res.redirect("/");
  }
};

module.exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    const user = await userModel.findOne({ email: normalizedEmail });
    if (!user) {
      req.flash("loginError", "email or password incorrect");
      return res.redirect("/");
    }

    if (user.isBlocked) {
      req.flash("loginError", "Your account has been blocked by admin.");
      return res.redirect("/");
    }

    const result = await bcrypt.compare(password, user.password);
    if (!result) {
      req.flash("loginError", "email or password incorrect");
      return res.redirect("/");
    }

    const token = generateToken(user);
    res.cookie("token", token);
    return res.redirect("/");
  } catch (error) {
    console.error("Login Error:", error);
    req.flash("loginError", "Login failed. Please try again.");
    return res.redirect("/");
  }
};

module.exports.logoutUser = function (req, res) {
  res.clearCookie("token");
  res.redirect("/");
};
