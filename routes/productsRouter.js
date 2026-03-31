const express=require("express");

const router=express.Router();
const upload=require("../config/multer-config");
const productModel=require("../models/product-model");

router.post("/create", upload.single("image"), async (req, res) => {
  try {
    const { name, price, discount, bgcolor, panelcolor, textcolor, gender, category } = req.body;

    if (!req.file) {
      req.flash("error", "Image is required.");
      return res.redirect("/owners/admin");
    }

    const product = await productModel.create({
      image: `/images/uploads/${req.file.filename}`, 
      name,
      price,
      discount,
      bgcolor: bgcolor || '#f9fafb',
      panelcolor: panelcolor || '#ffffff',
      textcolor: textcolor || '#1f2937',
      gender,
      category,
    });

  
    req.flash("success", "Product created successfully");
    res.redirect("/admin/products/create");
  } catch (err) {
    console.error("Product creation error:", err);
    req.flash("error", "Failed to create product.");
    res.redirect("/admin/products/create");
  }
});





router.post("/edit/:id", upload.single("image"), async (req, res) => {
    try {
        const { name, price, discount, bgcolor, panelcolor, textcolor, gender, category } = req.body;
        const updateData = {
          name, price, discount,
          bgcolor: bgcolor || '#f9fafb',
          panelcolor: panelcolor || '#ffffff',
          textcolor: textcolor || '#1f2937',
          gender, category
        };

        if (req.file) {
            updateData.image = `/images/uploads/${req.file.filename}`;
        }

        await productModel.findByIdAndUpdate(req.params.id, updateData);

        req.flash("success", "Product updated successfully");
        res.redirect("/admin/products");
    } catch (err) {
        console.error("Product update error:", err);
        req.flash("error", "Failed to update product.");
        res.redirect("/admin/products");
    }
});

module.exports=router;