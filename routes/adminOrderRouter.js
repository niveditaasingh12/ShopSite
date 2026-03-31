const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const isOwner = require("../middlewares/isOwner");
const orderModel = require("../models/order-model");

router.get("/admin/orders", isOwner, async (req, res) => {
  const rawOrders = await orderModel
    .find()
    .populate("user")
    .populate("products.product");

  // Group orders by user._id
  const ordersByUser = {};

  rawOrders.forEach((order) => {
    const userId = order.user._id;
    if (!ordersByUser[userId]) {
      ordersByUser[userId] = {
        user: order.user,
        orders: [],
      };
    }
    ordersByUser[userId].orders.push(order);
  });

  res.render("admin-orders", {
    ordersByUser: Object.values(ordersByUser),
    success: req.flash("success"),
    error: req.flash("error"),
  });
});

router.post("/admin/orders/:orderId/status", isOwner, async (req, res) => {
  const { status } = req.body;

  try {
    await orderModel.findByIdAndUpdate(req.params.orderId, { status });
    req.flash("success", "Order status updated.");
    res.redirect("/admin/orders");
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to update status.");
    res.redirect("/admin/orders");
  }
});

module.exports = router;
