const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "product" },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        size: { type: String, default: null },
        status: {
          type: String,
          enum: ["Active", "Cancelled"],
          default: "Active",
        },
      },
    ],
    platformFee: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    totalAmount: Number,
    paidAmount: { type: Number, default: 0 },
    address: {
      fullname: String,
      address: String,
      city: String,
      pincode: String,
    },
    status: {
      type: String,
      enum: ["Placed", "Shipped", "Delivered", "Cancelled"],
      default: "Placed",
    },
    paymentMethod: String,
    paymentId: String,
    paymentStatus: {
      type: String,
      enum: ["Pending", "Completed", "Failed"],
      default: "Pending",
    },

    placedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model("order", orderSchema);
