const express = require("express");
const router = express.Router();

const isLoggedIn = require("../middlewares/isLoggedIn");
const productModel = require("../models/product-model");
const userModel = require("../models/user-model");
const orderModel = require("../models/order-model");
const privilegeClubModel = require("../models/privilege-club-model");

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

router.get("/", async (req, res) => {
  const success = req.flash("success");
  const loginError = req.flash("loginError");
  const registerError = req.flash("registerError");

  const token = req.cookies.token;
  let loggedIn = false;
  if (token) {
    try {
      require("jsonwebtoken").verify(token, process.env.JWT_KEY || "shhhhh");
      loggedIn = true;
    } catch (err) {
      loggedIn = false;
    }
  }

  if (loggedIn) {
    try {
      const newArrivals = await productModel
        .find()
        .sort({ createdAt: -1 })
        .limit(4);
      const womenProducts = await productModel
        .find({ gender: "Women" })
        .sort({ salesCount: -1 })
        .limit(6);
      const menProducts = await productModel
        .find({ gender: "Men" })
        .sort({ salesCount: -1 })
        .limit(9);
      const trendingProducts = [...womenProducts, ...menProducts];
      const featuredProducts = await productModel
        .find({ discount: { $gt: 0 } })
        .limit(4);

      res.render("index", {
        success,
        loggedIn: true,
        newArrivals,
        trendingProducts,
        womenProducts,
        menProducts,
        featuredProducts,
      });
    } catch (err) {
      console.error("Error fetching home page data:", err);
      res.render("index", {
        success,
        loggedIn: false,
        loginError,
        registerError,
      });
    }
  } else {
    res.render("index", {
      success,
      loggedIn: false,
      loginError,
      registerError,
    });
  }
});

// Unified Login Page (Removed as requested)

router.get("/shop", isLoggedIn, async (req, res) => {
  const { filter, sort, gender, category } = req.query;
  const success = req.flash("success");
  const error = req.flash("error");

  let query = {};

  // Apply basic filters
  if (filter === "discounted") {
    query.discount = { $gt: 0 };
  } else if (filter === "available") {
    query.available = true;
  }

  // Apply gender and category filters
  if (gender) query.gender = gender;
  if (category) query.category = category;

  let productsQuery = productModel.find(query);

  // Optional: Apply sorting
  if (sort === "priceLowHigh") {
    productsQuery = productsQuery.sort({ price: 1 });
  } else if (sort === "priceHighLow") {
    productsQuery = productsQuery.sort({ price: -1 });
  } else if (sort === "new") {
    productsQuery = productsQuery.sort({ createdAt: -1 });
  }

  const products = await productsQuery;

  res.render("shop", {
    products,
    success,
    error,
    filter,
    sort,
    gender,
    category,
  });
});

router.get("/cart", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel
      .findById(req.user._id)
      .populate("cart.product");

    let subtotal = 0;

    const cartItems = user.cart
      .filter((item) => item.product !== null)
      .map((item) => {
        const product = item.product;
        const quantity = item.quantity;
        const price = Number(product.price);
        const discount = Number(product.discount || 0);

        const totalMRP = price * quantity;
        const discountAmount = totalMRP * (discount / 100);
        const netTotal = totalMRP - discountAmount;

        subtotal += netTotal;

        return {
          _id: product._id,
          name: product.name,
          image: product.image,
          bgcolor: product.bgcolor,
          panelcolor: product.panelcolor,
          textcolor: product.textcolor,
          price,
          discount,
          quantity,
          size: item.size || null,
          totalMRP,
          discountAmount,
          netTotal,
        };
      });

    const cartIsEmpty = cartItems.length === 0;
    const bill = cartIsEmpty ? 0 : subtotal;

    res.render("cart", { cartItems, bill, cartIsEmpty });
  } catch (err) {
    console.error("Error loading cart:", err);
    req.flash("error", "Could not load cart.");
    res.redirect("/shop");
  }
});

router.get("/addtocart/:productid", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);
    const product = await productModel.findById(req.params.productid);

    if (!product) {
      req.flash("error", "Product not found.");
      return res.redirect("/shop");
    }

    const requestedSize = normalizeSize(req.query.size);
    const needsSize = isClothingProduct(product);

    if (needsSize && !VALID_SIZES.includes(requestedSize)) {
      req.flash("error", "Please select a valid size before adding to cart.");
      return res.redirect("/shop");
    }

    const selectedSize = needsSize ? requestedSize : null;

    const existingItem = user.cart.find(
      (item) =>
        item.product &&
        item.product.toString() === req.params.productid &&
        (item.size || null) === selectedSize,
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      user.cart.push({
        product: req.params.productid,
        quantity: 1,
        size: selectedSize,
      });
    }

    await user.save();
    req.flash("success", "Added to cart");
    res.redirect("/shop");
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong while adding to cart.");
    res.redirect("/shop");
  }
});

// Increase quantity
router.post("/cart/increase/:productid", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);
    const requestedSize = normalizeSize(req.body.size || req.query.size);

    const item = user.cart.find(
      (i) =>
        i.product &&
        i.product.toString() === req.params.productid &&
        (requestedSize ? (i.size || "") === requestedSize : true),
    );

    if (item) item.quantity++;
    await user.save();
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// Decrease quantity or remove
router.post("/cart/decrease/:productid", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);
    const requestedSize = normalizeSize(req.body.size || req.query.size);

    const item = user.cart.find(
      (i) =>
        i.product &&
        i.product.toString() === req.params.productid &&
        (requestedSize ? (i.size || "") === requestedSize : true),
    );

    if (item && item.quantity > 1) {
      item.quantity--;
    } else {
      user.cart = user.cart.filter(
        (i) =>
          !(
            i.product.toString() === req.params.productid &&
            (requestedSize ? (i.size || "") === requestedSize : true)
          ),
      );
    }
    await user.save();
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

router.get("/clearcart", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);
    user.cart = [];
    await user.save();

    res.redirect("/cart");
  } catch (err) {
    console.error(err);
    req.flash("error", "Failed to clear cart.");
    res.redirect("/cart");
  }
});

router.get("/checkout", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel
      .findById(req.user._id)
      .populate("cart.product");

    const addresses = user.addresses || [];
    const defaultAddress =
      addresses.find((addr) => addr.isDefault) || addresses[0];
    const defaultAddressId = defaultAddress?._id?.toString();

    const platformFee = 20;
    const shippingFee = 49;

    const cartItems = user.cart
      .filter((item) => item.product)
      .map((item) => {
        const price = Number(item.product.price);
        const discount = Number(item.product.discount || 0);
        const quantity = item.quantity;

        const totalMRP = price * quantity;
        const discountAmount = +(totalMRP * (discount / 100)).toFixed(2);
        const netTotal = +(totalMRP - discountAmount).toFixed(2);

        return {
          ...item,
          product: item.product,
          quantity,
          size: item.size || null,
          discount,
          discountAmount,
          netTotal,
        };
      });

    const subtotal = +cartItems
      .reduce((sum, item) => sum + item.netTotal, 0)
      .toFixed(2);
    const totalAmount =
      cartItems.length === 0
        ? 0
        : +(subtotal + platformFee + shippingFee).toFixed(2);

    res.render("checkout", {
      user,
      addresses,
      defaultAddressId,
      cartItems,
      totalAmount,
      platformFee,
      shippingFee,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    console.error("Checkout error:", err);
    req.flash("error", "Something went wrong.");
    res.redirect("/cart");
  }
});

router.post("/confirm-cart-order", isLoggedIn, async (req, res) => {
  try {
    const { addressId } = req.body;
    const user = await userModel
      .findById(req.user._id)
      .populate("cart.product");
    const address = user.addresses.id(addressId);
    if (!address) return res.redirect("/checkout");

    const arrivalDate = new Date();
    arrivalDate.setDate(arrivalDate.getDate() + 5);

    const platformFee = 20;
    const shippingFee = 49;
    let subtotal = 0;

    const cartItems = user.cart.map((item) => {
      const product = item.product;
      const quantity = item.quantity;

      const price = product.price;
      const discount = product.discount || 0;

      const discountAmount = price * (discount / 100);
      const netPrice = (price - discountAmount) * quantity;

      subtotal += netPrice;

      return {
        name: product.name,
        image: product.image,
        quantity,
        size: item.size || null,
        price,
        discount,
        discountAmount,
        itemTotal: netPrice,
      };
    });

    const finalTotal = subtotal + platformFee + shippingFee;

    res.render("cart-confirm", {
      cartItems,
      address,
      arrivalDate,
      finalTotal,
      platformFee,
      shippingFee,
      subtotal,
    });
  } catch (err) {
    console.error("Confirm cart order error:", err);
    res.redirect("/checkout");
  }
});

router.post("/place-cart-order", isLoggedIn, async (req, res) => {
  try {
    const { addressId, paymentMethod } = req.body;
    const user = await userModel
      .findById(req.user._id)
      .populate("cart.product");

    const address = user.addresses.id(addressId);
    const platformFee = 20;
    const shippingFee = 49;

    const validItems = user.cart.filter((item) => item.product);

    // Calculate subtotal with discount
    let subtotal = validItems.reduce((sum, item) => {
      const price = item.product.price;
      const discount = item.product.discount || 0;
      const discountAmount = price * (discount / 100);
      const finalPrice = price - discountAmount; // Apply discount only once
      return sum + finalPrice * item.quantity;
    }, 0);

    subtotal = +subtotal.toFixed(2);
    const totalAmount = +(subtotal + platformFee + shippingFee).toFixed(2);

    if (paymentMethod !== "COD") {
      return res.status(400).json({
        success: false,
        message: "❌ Invalid payment method",
      });
    }

    const order = await orderModel.create({
      user: req.user._id,
      products: validItems.map((item) => {
        const price = item.product.price;
        const discount = item.product.discount || 0;
        const discountAmount = price * (discount / 100);
        const finalPrice = +(price - discountAmount).toFixed(2);

        return {
          product: item.product._id,
          quantity: item.quantity,
          price: finalPrice,
          size: item.size || null,
        };
      }),
      totalAmount,
      platformFee,
      shippingFee,
      address: {
        fullname: user.fullname,
        address: address.line1,
        city: address.city,
        pincode: address.pincode,
        state: address.state,
      },
      paymentMethod,
      paymentStatus: "Completed",
    });

    user.orders.push(order._id);
    user.cart = []; // Clear cart after order
    await user.save();

    const arrivalDate = new Date();
    arrivalDate.setDate(arrivalDate.getDate() + 5);

    res.render("order-success", {
      fromOrderId: false,
      user,
      address: order.address,
      deliveryDate: arrivalDate,
      products: validItems.map((item) => ({
        image: item.product.image,
        name: item.product.name,
        quantity: item.quantity,
        size: item.size || null,
      })),
      totalAmount,
    });
  } catch (err) {
    console.error("Place Cart Order Error:", err);
    req.flash("error", "Failed to place order.");
    res.redirect("/checkout");
  }
});

router.get("/logout", isLoggedIn, (req, res) => {
  res.render("shop");
});

router.get("/myaccount", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);
    res.render("myaccount", {
      user,
      success: req.flash("success"),
      error: req.flash("error"),
    });
  } catch (err) {
    req.flash("error", "Something went wrong.");
    res.redirect("/");
  }
});

// Privilege Club Signup Route
router.post("/join-privilege-club", async (req, res) => {
  try {
    const { fullname, email, phone } = req.body;

    // Validate required fields
    if (!fullname || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Check if already a member
    const existingMember = await privilegeClubModel.findOne({ email });
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: "This email is already registered in the Privilege Club",
      });
    }

    // Create new privilege club member
    const newMember = await privilegeClubModel.create({
      fullname,
      email,
      phone,
      status: "active",
      benefits: {
        exclusiveDiscount: 15,
        freeShipping: true,
        earlyAccess: true,
        watchServicing: true,
        watchCleanPolish: true,
        extendedWarranty: 1,
        lastServicingDate: null,
      },
    });

    return res.status(201).json({
      success: true,
      message:
        "Welcome to Scatch Privilege Club! Your membership is activated.",
      member: newMember,
    });
  } catch (err) {
    console.error("Privilege Club Signup Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error joining privilege club. Please try again.",
    });
  }
});

// Order Confirmation Page
router.get("/order-confirmed/:orderId", isLoggedIn, async (req, res) => {
  try {
    const order = await orderModel
      .findById(req.params.orderId)
      .populate("products.product");

    if (!order || order.user.toString() !== req.user._id.toString()) {
      req.flash("error", "Order not found");
      return res.redirect("/shop");
    }

    const arrivalDate = new Date();
    arrivalDate.setDate(arrivalDate.getDate() + 5);

    res.render("order-success", {
      fromOrderId: true,
      user: req.user,
      address: order.address,
      deliveryDate: arrivalDate,
      products: order.products.map((item) => ({
        image: item.product.image,
        name: item.product.name,
        quantity: item.quantity,
        size: item.size || null,
      })),
      totalAmount: order.totalAmount,
    });
  } catch (err) {
    console.error("Order Confirmation Error:", err);
    req.flash("error", "Could not load order details");
    res.redirect("/shop");
  }
});


module.exports = router;
