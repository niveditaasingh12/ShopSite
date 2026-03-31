const express = require("express");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
mongoose.set("bufferCommands", false);

const requiredEnvVars = [
  "MONGODB_URI",
  "JWT_KEY",
  "EXPRESS_SESSION_SECRET",
];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  console.error(
    `Missing required environment variable(s): ${missingEnvVars.join(", ")}`,
  );
  process.exit(1);
}

const db = mongoose.connection;

db.on("error", (err) => {
  console.log("Connection error:", err);
});

db.on("open", () => {
  console.log("Database connection opened");
});

const path = require("path");
const ownersRouter = require("./routes/ownersRouter");
const usersRouter = require("./routes/usersRouter");
const productsRouter = require("./routes/productsRouter");
const accountRouter = require("./routes/accountsRouter");
const index = require("./routes/index");
const expressSession = require("express-session");
const flash = require("connect-flash");
const buyRoute = require("./routes/buyProduct");
const orderRouter = require("./routes/orderRouter");
const myOrderRouter = require("./routes/myOrders");
const adminOrderRouter = require("./routes/adminOrderRouter");
const footerRouter = require("./routes/footerRouter");
const adminRouter = require("./routes/adminRouter");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  expressSession({
    resave: false,
    saveUninitialized: false,
    secret: process.env.EXPRESS_SESSION_SECRET,
  }),
);
app.use(flash());
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

app.use("/owners", ownersRouter);
app.use("/users", usersRouter);
app.use("/products", productsRouter);
app.use("/", index);
app.use("/account", accountRouter);
app.use("/", buyRoute);
app.use("/", orderRouter);
app.use("/", myOrderRouter);
app.use("/", adminOrderRouter);
app.use("/", footerRouter);
app.use("/admin", adminRouter);

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`Server on listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

startServer();
