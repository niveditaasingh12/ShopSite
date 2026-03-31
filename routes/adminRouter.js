const express = require("express");
const router = express.Router();
const isOwner = require("../middlewares/isOwner");
const adminController = require("../controllers/adminController");

// Dashboard
router.get("/dashboard", isOwner, adminController.dashboard);

// Products
router.get("/products", isOwner, adminController.products);
router.get("/products/create", isOwner, adminController.createProduct);
// Edit product (render edit page)
router.get("/products/edit/:id", isOwner, adminController.editProduct);
// Delete product
router.get("/products/delete/:id", isOwner, adminController.deleteProduct);

// Orders
router.get("/orders", isOwner, adminController.orders);
router.post(
  "/orders/:orderId/status",
  isOwner,
  adminController.updateOrderStatus,
);

// Users
router.get("/users", isOwner, adminController.users);

// Coupons
router.get("/coupons", isOwner, adminController.coupons);

module.exports = router;
