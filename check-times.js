const mongoose = require("mongoose");
require("dotenv").config();
const productModel = require("./models/product-model");

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const products = await productModel.find({}).sort({ createdAt: 1 }).limit(40);
  products.forEach((p, i) => {
    console.log(`${i+1}. ${p.name} | Cat: ${p.category} | Gen: ${p.gender} | Created: ${p.createdAt.toISOString()}`);
  });
  process.exit(0);
}
check();
