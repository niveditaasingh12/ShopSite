const mongoose = require("mongoose");
require("dotenv").config();
const productModel = require("./models/product-model");

async function listProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const products = await productModel.find({});
    console.log(`Total products found: ${products.length}`);

    products.forEach((p, i) => {
      console.log(`${i+1}. Name: ${p.name}, Category: ${p.category}, Gender: ${p.gender}, CreatedAt: ${p.createdAt}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listProducts();
