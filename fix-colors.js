require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/product-model');

function fixColor(color) {
  if (!color) return color;
  color = color.trim();
  // If it's a 6-char hex without #, add it
  if (/^[0-9A-Fa-f]{6}$/.test(color)) return '#' + color;
  return color;
}

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const products = await Product.find({});
  let fixedCount = 0;
  
  for (const p of products) {
    const newBgcolor = fixColor(p.bgcolor);
    const newPanelcolor = fixColor(p.panelcolor);
    const newTextcolor = fixColor(p.textcolor);
    
    if (newBgcolor !== p.bgcolor || newPanelcolor !== p.panelcolor || newTextcolor !== p.textcolor) {
      await Product.findByIdAndUpdate(p._id, {
        bgcolor: newBgcolor,
        panelcolor: newPanelcolor,
        textcolor: newTextcolor
      });
      console.log(`Fixed: ${p.name} | panel: ${p.panelcolor} -> ${newPanelcolor}`);
      fixedCount++;
    }
  }
  
  console.log(`\nDone! Fixed ${fixedCount} products.`);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
