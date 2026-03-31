const mongoose = require("mongoose");
require("dotenv").config();
const productModel = require("./models/product-model");

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  // Find products that have both default category and default gender
  const legacy = await productModel.find({
    category: "Watches",
    gender: "Unisex"
  });
  
  console.log(`Potential legacy products (${legacy.length}):`);
  legacy.forEach((p, i) => {
    console.log(`${i+1}. ${p.name} | ${p.createdAt.toISOString()}`);
  });
  
  process.exit(0);
}
check();
