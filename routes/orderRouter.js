const express = require("express");
const router = express.Router();
const orderModel = require("../models/order-model");
const userModel = require("../models/user-model");
const productModel = require("../models/product-model");
const isLoggedIn = require("../middlewares/isLoggedIn");

// Place Order Route
router.post("/place-order", isLoggedIn, async (req, res) => {
  try {
    const { fullname, address, city, pincode } = req.body;

    // For Buy Now
    if (req.session.buyNow) {
      const product = await productModel.findById(req.session.buyNow.product);
      const totalAmount = product.price;

      const newOrder = await orderModel.create({
        user: req.user._id,
        products: [{ product: product._id, quantity: 1, price: product.price }],
        totalAmount,
        address: { fullname, address, city, pincode },
      });

      delete req.session.buyNow; // Clear session
      req.flash("success", "Order placed successfully!");
      return res.redirect("/orders");
    }

    // For Cart Orders
    const user = await userModel
      .findById(req.user._id)
      .populate("cart.product");
    const validItems = user.cart.filter((item) => item.product);
    const totalAmount = validItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    const order = await orderModel.create({
      user: req.user._id,
      products: validItems.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price,
      })),
      totalAmount,
      address: { fullname, address, city, pincode },
    });

    // Clear user cart
    user.cart = [];
    await user.save();

    req.flash("success", "Order placed successfully!");
    res.redirect("/orders");
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to place order.");
    res.redirect("/checkout");
  }
});

router.get("/orders", isLoggedIn, async (req, res) => {
  router.get("/orders", isLoggedIn, async (req, res) => {
    console.log("Reached /orders route ✅"); // add this
    const orders = await orderModel
      .find({ user: req.user._id })
      .populate("products.product");

    const success = req.flash("success");
    const error = req.flash("error");

    res.render("orders", { orders, success, error });
  });
});

module.exports = router;
