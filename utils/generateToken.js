const jwt = require("jsonwebtoken");

function generateToken(user) {
  if (!process.env.JWT_KEY) {
    throw new Error("Missing required environment variable: JWT_KEY");
  }

  return jwt.sign({ email: user.email, id: user._id }, process.env.JWT_KEY);
}

module.exports = { generateToken };
