const mongoose = require("mongoose");
require("dotenv").config();
const productModel = require("./models/product-model");

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // We added category support around 18:30-18:40.
    // Let's look for products created before then or those that look like legacy watches.
    const cutoffDate = new Date("2026-02-25T18:45:00Z"); // Adjust as needed
    
    // Actually, let's just find products that have the default "Watches" category
    // but were created before we added the new ones.
    const legacyProducts = await productModel.find({
      category: "Watches",
      createdAt: { $lt: cutoffDate }
    });

    console.log(`Found ${legacyProducts.length} legacy watches to remove.`);
    
    for (const p of legacyProducts) {
      console.log(`Removing: ${p.name} (Created: ${p.createdAt})`);
      await productModel.findByIdAndDelete(p._id);
    }

    console.log("Cleanup complete.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

cleanup();
