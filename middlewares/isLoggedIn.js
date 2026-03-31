// middlewares/isLoggedIn.js

const jwt = require("jsonwebtoken");
const userModel = require("../models/user-model");

module.exports = async (req, res, next) => {
  if (!req.cookies.token) {
    req.flash("error", "Please create an account first.");
    return res.redirect("/");
  }

  try {
    const decoded = jwt.verify(req.cookies.token, process.env.JWT_KEY);
    const user = await userModel.findOne({ email: decoded.email }).select("-password");
    req.user = user;
    next();
  } catch (error) {
    req.flash("error", "Invalid token. Please log in again.");
    return res.redirect("/");
  }
};
