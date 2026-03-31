const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middlewares/isLoggedIn");
const userModel = require("../models/user-model");
const orderModel = require("../models/order-model");
const productModel = require("../models/product-model");

const CLOTHING_CATEGORIES = [
  "T-Shirt",
  "Shirt",
  "Jeans",
  "Tops",
  "Tees",
  "Bottom",
  "Dress",
];
const VALID_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const normalizeSize = (size) =>
  typeof size === "string" ? size.trim().toUpperCase() : "";

const isClothingProduct = (product) =>
  product && CLOTHING_CATEGORIES.includes(product.category);

router.get("/buynow/:productId", isLoggedIn, async (req, res) => {
  try {
    const product = await productModel.findById(req.params.productId);
    if (!product) {
      req.flash("error", "Product not found");
      return res.redirect("/shop");
    }

    const requestedSize = normalizeSize(req.query.size);
    const needsSize = isClothingProduct(product);

    if (needsSize && !VALID_SIZES.includes(requestedSize)) {
      req.flash("error", "Please select a valid size before Buy Now.");
      return res.redirect("/shop");
    }

    const user = await userModel.findById(req.user._id);
    const defaultAddress =
      user.addresses.find((addr) => addr.isDefault) || user.addresses[0];

    const arrivalDate = new Date();
    arrivalDate.setDate(arrivalDate.getDate() + 5);

    res.render("buynow-checkout", {
      product,
      selectedSize: needsSize ? requestedSize : null,
      addresses: user.addresses,
      defaultAddressId: defaultAddress?._id?.toString(),
      arrivalDate: arrivalDate.toDateString(),
      user,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong");
    res.redirect("/shop");
  }
});

// ============================================================================
// NOTE: This route is no longer needed as payment selection is now handled
// directly on the /buynow/:productId page. Kept for reference.
// ============================================================================
/*
router.post("/buynow/confirm", isLoggedIn, async (req, res) => {
  try {
    const { productId, quantity, addressId, paymentMethod } = req.body;
    const product = await productModel.findById(productId);
    const user = await userModel.findById(req.user._id);
    const address = user.addresses.id(addressId);

    if (!product || !address) {
      req.flash("error", "Invalid product or address");
      return res.redirect("/shop");
    }

    const selectedSize = normalizeSize(req.body.size);
    if (isClothingProduct(product) && !VALID_SIZES.includes(selectedSize)) {
      req.flash("error", "Please select a valid size before continuing.");
      return res.redirect("/shop");
    }

    const qty = parseInt(quantity, 10);
    const discount = Number(product.discount || 0);
    const baseTotalPrice = product.price * qty;
    const discountAmount = +(baseTotalPrice * (discount / 100)).toFixed(2);
    const itemTotal = +(baseTotalPrice - discountAmount).toFixed(2);
    const shippingFee = 49;
    const total = +(itemTotal + shippingFee).toFixed(2);

    // Calculate arrival date = today + 5 days
    const arrivalDate = new Date();
    arrivalDate.setDate(arrivalDate.getDate() + 5);

    res.render("buy-confirm", {
      product,
      quantity: qty,
      size: isClothingProduct(product) ? selectedSize : null,
      address,
      paymentMethod,
      shippingFee,
      total,
      price: itemTotal,
      discount,
      discountAmount,
      arrivalDate,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    console.error("Buy Now Confirm Error:", err);
    req.flash("error", "Something went wrong");
    res.redirect("/shop");
  }
});
*/

router.post("/buynow/place-order", isLoggedIn, async (req, res) => {
  try {
    // Validate inputs
    const { productId, addressId, paymentMethod } = req.body;

    if (!productId || !addressId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message:
          "❌ Missing required fields (productId, addressId, paymentMethod)",
      });
    }

      if (paymentMethod !== "COD") {
      return res.status(400).json({
        success: false,
        message: "❌ Invalid payment method",
      });
    }

    // Parse and validate quantity
    const quantity = parseInt(req.body.quantity, 10);
    if (isNaN(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "❌ Quantity must be a positive number",
      });
    }

    // Fetch user and product with error handling
    const user = await userModel.findById(req.user._id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "❌ User not found",
      });
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "❌ Product not found",
      });
    }

    // Validate selected address
    const selectedAddress = user.addresses.id(addressId);
    if (!selectedAddress) {
      return res.status(400).json({
        success: false,
        message: "❌ Please select a valid delivery address",
      });
    }

    // Validate size for clothing products
    const selectedSize = normalizeSize(req.body.size);
    if (isClothingProduct(product) && !VALID_SIZES.includes(selectedSize)) {
      return res.status(400).json({
        success: false,
        message: "❌ Please select a valid size before placing order.",
      });
    }

    // Calculate order total
    const discount = Number(product.discount || 0);
    const baseTotalPrice = product.price * quantity;
    const discountAmount = +(baseTotalPrice * (discount / 100)).toFixed(2);
    const priceAfterDiscount = +(baseTotalPrice - discountAmount).toFixed(2);
    const shippingFee = 49;
    const totalAmount = +(priceAfterDiscount + shippingFee).toFixed(2);

    // Create order in database
    const order = await orderModel.create({
      user: req.user._id,
      products: [
        {
          product: productId,
          quantity: quantity,
          price: priceAfterDiscount,
          size: isClothingProduct(product) ? selectedSize : null,
        },
      ],
      totalAmount: totalAmount,
      platformFee: 0,
      shippingFee: shippingFee,
      address: {
        fullname: user.fullname,
        address: selectedAddress.line1,
        city: selectedAddress.city,
        pincode: selectedAddress.pincode,
        state: selectedAddress.state,
      },
      paymentMethod: paymentMethod,
        paymentStatus: "Completed",
    });

    console.log(`✅ Order created: ${order._id}`);


    // Handle COD payment - add order to user and clear cart
    user.orders.push(order._id);
    user.cart = []; // Clear the cart after order is placed
    await user.save();

    console.log(`✅ COD Order confirmed for user ${req.user._id}`);

    // Return JSON response for COD (frontend will redirect)
    return res.json({
      success: true,
      orderId: order._id.toString(),
      paymentMethod: "COD",
      message: "✅ Order placed successfully!",
    });
  } catch (err) {
    console.error("❌ Place Order Error:", err);
    res.status(500).json({
      success: false,
      message: "❌ Something went wrong while placing order. Please try again.",
    });
  }
});

router.get("/order-success/:orderId", isLoggedIn, async (req, res) => {
  try {
    const { orderId } = req.params;

    // Validate orderId format
    if (!orderId || orderId.length < 1) {
      console.error("❌ Invalid order ID format");
      return res.status(400).send("Invalid order ID.");
    }

    const order = await orderModel
      .findById(orderId)
      .populate("products.product");

    if (!order) {
      console.error("❌ Order not found:", orderId);
      return res.status(404).send("Order not found.");
    }

    // Verify order belongs to the logged-in user
    if (order.user.toString() !== req.user._id.toString()) {
      console.error("❌ Unauthorized order access:", orderId);
      return res.status(403).send("Unauthorized access to this order.");
    }

    const user = await userModel.findById(order.user);
    if (!user) {
      console.error("❌ User not found for order:", orderId);
      return res.status(404).send("User not found.");
    }

    // Calculate delivery date (5 days from now)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);

    console.log(`✅ Order success page accessed for order: ${orderId}`);

    res.render("order-success", {
      fromOrderId: true,
      user,
      order,
      address: order.address,
      deliveryDate,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    });
  } catch (err) {
    console.error("❌ Order success route error:", err);
    res.status(500).send("An error occurred while retrieving your order.");
  }
});

module.exports = router;
