const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    image: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },

    stockLevel: {
      type: Number,
      default: 0,
    },

    lowStockThreshold: {
      type: Number,
      default: 5,
    },

    gender: {
      type: String,
      enum: ["Men", "Women", "Unisex"],
      default: "Unisex",
    },
    category: {
      type: String,
      required: true,
      default: "Watch",
    },

    tags: [String],

    bgcolor: String,
    panelcolor: String,
    textcolor: String,


    salesCount: {
      type: Number,
      default: 0,
    },

    availability: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const Product = mongoose.model("product", productSchema);
module.exports = Product;
