const productModel = require("../models/product-model");
const orderModel = require("../models/order-model");
const userModel = require("../models/user-model");
const couponModel = require("../models/coupon-model");

// ================= DASHBOARD =================

exports.dashboard = async (req, res) => {
  const totalProducts = await productModel.countDocuments();
  const totalUsers = await userModel.countDocuments();
  const totalOrders = await orderModel.countDocuments();

  const orders = await orderModel.find().populate("products.product");
  const totalRevenue = orders.reduce((sum, order) => {
    return sum + order.totalAmount;
  }, 0);

  // Revenue trend - last 7 days
  const last7Days = [];
  const revenueByDay = {};

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    last7Days.push(dateStr);
    revenueByDay[dateStr] = 0;
  }

  orders.forEach((order) => {
    const dateStr = order.placedAt.toISOString().split("T")[0];
    if (revenueByDay.hasOwnProperty(dateStr)) {
      revenueByDay[dateStr] += order.totalAmount;
    }
  });

  const revenueTrendData = last7Days.map((date) => revenueByDay[date]);

  // Orders by status
  const ordersByStatus = {
    Placed: orders.filter((o) => o.status === "Placed").length,
    Shipped: orders.filter((o) => o.status === "Shipped").length,
    Delivered: orders.filter((o) => o.status === "Delivered").length,
    Cancelled: orders.filter((o) => o.status === "Cancelled").length,
  };

  // Payment methods breakdown
  const paymentMethods = {
    UPI: orders.filter((o) => o.paymentMethod === "UPI").length,
    COD: orders.filter((o) => o.paymentMethod === "COD").length,
  };

  // Top 5 products
  const productSales = {};
  orders.forEach((order) => {
    order.products.forEach((item) => {
      if (item.product) {
        if (!productSales[item.product._id]) {
          productSales[item.product._id] = {
            name: item.product.name,
            sales: 0,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[item.product._id].sales += 1;
        productSales[item.product._id].quantity += item.quantity;
        productSales[item.product._id].revenue += item.price * item.quantity;
      }
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Monthly revenue
  const monthlyRevenue = {};
  orders.forEach((order) => {
    const month = order.placedAt.toISOString().slice(0, 7);
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + order.totalAmount;
  });

  const months = Object.keys(monthlyRevenue).sort().slice(-6);
  const monthlyRevenueData = months.map((m) => monthlyRevenue[m] || 0);

  // Customer insights
  const totalCustomers = totalUsers;
  const avgOrderValueNum = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const avgOrderValue = Math.round(avgOrderValueNum) || 0;
  const conversionRate =
    totalUsers > 0 ? ((totalOrders / totalUsers) * 100).toFixed(1) : "0";

  // Prepare data object for rendering
  const dashboardData = {
    totalProducts,
    totalUsers,
    totalOrders,
    totalRevenue,
    avgOrderValue,
    conversionRate,
    revenueTrendData: JSON.stringify(revenueTrendData),
    last7Days: JSON.stringify(last7Days),
    ordersByStatus: JSON.stringify([
      ordersByStatus.Placed,
      ordersByStatus.Shipped,
      ordersByStatus.Delivered,
      ordersByStatus.Cancelled,
    ]),
    paymentMethods: JSON.stringify([
      paymentMethods.UPI,
      paymentMethods.COD,
    ]),
    topProducts: JSON.stringify(
      topProducts.map((p) => ({
        name: p.name.substring(0, 15),
        revenue: p.revenue,
        quantity: p.quantity,
      })),
    ),
    monthlyRevenueData: JSON.stringify(monthlyRevenueData),
    months: JSON.stringify(months),
    success: req.flash("success"),
    error: req.flash("error"),
  };

  res.render("admin/dashboard", dashboardData);
};

// ================= PRODUCTS =================

exports.products = async (req, res) => {
  const products = await productModel.find();
  console.log(
    "[admin] products count:",
    Array.isArray(products) ? products.length : 0,
  );
  res.render("admin/products/index", {
    products,
    success: req.flash("success"),
    error: req.flash("error"),
  });
};

exports.createProduct = async (req, res) => {
  res.render("admin/products/create", {
    success: req.flash("success"),
    error: req.flash("error"),
  });
};

exports.editProduct = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id);
    res.render("admin/products/edit", {
      product,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    req.flash("error", "Product not found");
    res.redirect("/admin/products");
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.params.id);
    req.flash("success", "Product deleted successfully");
    res.redirect("/admin/products");
  } catch (err) {
    req.flash("error", "Failed to delete product");
    res.redirect("/admin/products");
  }
};

// ================= ORDERS =================

exports.orders = async (req, res) => {
  try {
    const rawOrders = await orderModel
      .find()
      .populate("user")
      .populate("products.product");

    const ordersByUser = {};

    rawOrders.forEach((order) => {
      // Skip orders where the user account was deleted
      if (!order.user) return;

      const userId = order.user._id;
      if (!ordersByUser[userId]) {
        ordersByUser[userId] = {
          user: order.user,
          orders: [],
        };
      }
      ordersByUser[userId].orders.push(order);
    });

    res.render("admin/orders/index", {
      ordersByUser: Object.values(ordersByUser),
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    console.error("Admin orders error:", err);
    req.flash("error", "Failed to load orders.");
    res.redirect("/admin/dashboard");
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    await orderModel.findByIdAndUpdate(req.params.orderId, {
      status: req.body.status,
    });

    req.flash("success", "Order updated successfully");
    res.redirect("/admin/orders");
  } catch (err) {
    req.flash("error", "Failed to update order");
    res.redirect("/admin/orders");
  }
};

// ================= USERS =================

exports.users = async (req, res) => {
  const users = await userModel.find();
  res.render("admin/users/index", {
    users,
    success: req.flash("success"),
    error: req.flash("error"),
  });
};

// ================= COUPONS =================

exports.coupons = async (req, res) => {
  const coupons = await couponModel.find();
  res.render("admin/coupons/index", {
    coupons,
    success: req.flash("success"),
    error: req.flash("error"),
  });
};
