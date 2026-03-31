const mongoose = require("mongoose");

const ownerSchema = mongoose.Schema({
  fullname: {
    type: String,
    minLength: 3,
    trim: true,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },

  picture: {
    type: String,
  },
  gstin: String,

  role: { type: String, default: "owner" },
  // whether this owner has admin rights to create other owners
  is_admin: { type: Boolean, default: false },
  // reference to the owner who created this account (optional)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "owner",
    default: null,
  },
});

const Owner = mongoose.model("owner", ownerSchema);
module.exports = Owner;
