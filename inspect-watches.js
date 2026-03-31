require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/product-model');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const watches = await Product.find({ category: 'Watches' }).limit(5);
  watches.forEach(p => {
    console.log('---');
    console.log('Name:', p.name);
    console.log('bgcolor:', JSON.stringify(p.bgcolor));
    console.log('panelcolor:', JSON.stringify(p.panelcolor));
    console.log('textcolor:', JSON.stringify(p.textcolor));
    console.log('gender:', p.gender);
  });
  process.exit(0);
});
