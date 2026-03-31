const mongoose = require("mongoose");

// Address sub-schema
const addressSchema = new mongoose.Schema({
  line1: String,
  city: String,
  state: String,
  pincode: String,
  isDefault: { type: Boolean, default: false },
});

// Main User schema
const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      trim: true,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    // Avatar / Profile picture (optional)
    picture: {
      type: String, // file name or image path
    },

    phone: {
      type: String, // changed from Number to String for flexibility
    },

    cart: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
        },
        quantity: {
          type: Number,
          default: 1,
        },
        size: {
          type: String,
          default: null,
        },
      },
    ],

    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "order",
      },
    ],

    // New fields
    addresses: [addressSchema],
    role: {
      type: String,
      enum: ["customer", "admin", "editor"],
      default: "customer",
    },
  },
  { timestamps: true },
);

const User = mongoose.model("user", userSchema);
module.exports = User;
