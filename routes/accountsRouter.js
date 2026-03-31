const express = require("express");
const router = express.Router();

const isLoggedIn = require("../middlewares/isLoggedIn");
const productModel = require("../models/product-model");
const userModel = require("../models/user-model");
const multer = require("multer");
const uploadAvatar = require("../config/multer-avatar");

const upload = multer({ dest: "public/uploads/" });
const bcrypt = require("bcrypt");

const sanitizeRedirectPath = (path) => {
  if (typeof path !== "string") return "/account";
  if (!path.startsWith("/")) return "/account";
  if (path.startsWith("//")) return "/account";
  return path;
};

// GET route – Show Change Password form
router.get("/changepassword", isLoggedIn, (req, res) => {
  res.render("change-password", {
    error: req.flash("error"),
    success: req.flash("success"),
  });
});

// POST route – Update password
router.post("/changepassword", isLoggedIn, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      req.flash("error", "All password fields are required.");
      return res.redirect("/account/changepassword");
    }

    if (newPassword.length < 6) {
      req.flash("error", "New password must be at least 6 characters long.");
      return res.redirect("/account/changepassword");
    }

    const user = await userModel.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      req.flash("error", "Current password is incorrect.");
      return res.redirect("/account/changepassword");
    }

    if (newPassword !== confirmPassword) {
      req.flash("error", "New passwords do not match.");
      return res.redirect("/account/changepassword");
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    user.password = hashed;
    await user.save();

    req.flash("success", "✅ Password changed successfully.");
    res.redirect("/account");
  } catch (error) {
    console.error("Password change error:", error);
    req.flash("error", "An error occurred while changing your password.");
    res.redirect("/account/changepassword");
  }
});

router.get("/", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);
    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/login");
    }
    const success = req.flash("success");
    const error = req.flash("error");
    res.render("account", { user, success, error });
  } catch (error) {
    console.error("Account fetch error:", error);
    req.flash("error", "An error occurred while loading your account.");
    res.redirect("/login");
  }
});

router.get("/edit", isLoggedIn, async (req, res) => {
  const user = await userModel.findById(req.user._id);
  const success = req.flash("success");
  const error = req.flash("error");
  res.render("edit-profile", { user, success, error });
});

router.post("/edit", isLoggedIn, upload.single("avatar"), async (req, res) => {
  try {
    const { fullname, phone } = req.body;

    // Validation
    if (!fullname || fullname.trim() === "") {
      req.flash("error", "Full name is required.");
      return res.redirect("/account/edit");
    }

    const updatedData = {
      fullname: fullname.trim(),
      phone: phone ? phone.trim() : "",
    };

    if (req.file) {
      updatedData.picture = `/uploads/${req.file.filename}`;
    }

    await userModel.findByIdAndUpdate(req.user._id, updatedData, { new: true });
    req.flash("success", "✅ Profile updated successfully.");
    res.redirect("/account");
  } catch (error) {
    console.error("Profile update error:", error);
    req.flash("error", "An error occurred while updating your profile.");
    res.redirect("/account/edit");
  }
});

router.post("/addresses/new", isLoggedIn, async (req, res) => {
  const redirectTo = sanitizeRedirectPath(req.body.redirectTo || "/account");
  const newAddressPage = `/account/addresses/new?redirect=${encodeURIComponent(redirectTo)}`;

  try {
    const { line1, city, state, pincode } = req.body;

    // Validation
    if (!line1 || !city || !state || !pincode) {
      req.flash("error", "All address fields are required.");
      return res.redirect(newAddressPage);
    }

    if (!/^\d{6}$/.test(pincode)) {
      req.flash("error", "Pincode must be a valid 6-digit number.");
      return res.redirect(newAddressPage);
    }

    const user = await userModel.findById(req.user._id);
    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/login");
    }

    user.addresses.push({
      line1: line1.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      isDefault: user.addresses.length === 0,
    });
    await user.save();

    req.flash("success", "✅ Address added successfully.");
    res.redirect(redirectTo);
  } catch (error) {
    console.error("Address add error:", error);
    req.flash("error", "An error occurred while adding the address.");
    res.redirect(newAddressPage);
  }
});

router.get("/addresses/new", isLoggedIn, (req, res) => {
  const redirectTo = sanitizeRedirectPath(req.query.redirect || "/account");
  const error = req.flash("error");
  const success = req.flash("success");
  res.render("new-address", { redirectTo, error, success });
});

router.post("/addresses/edit/:id", isLoggedIn, async (req, res) => {
  try {
    const { line1, city, state, pincode } = req.body;

    // Validation
    if (!line1 || !city || !state || !pincode) {
      req.flash("error", "All address fields are required.");
      return res.redirect(`/account/addresses/edit/${req.params.id}`);
    }

    if (!/^\d{6}$/.test(pincode)) {
      req.flash("error", "Pincode must be a valid 6-digit number.");
      return res.redirect(`/account/addresses/edit/${req.params.id}`);
    }

    const user = await userModel.findById(req.user._id);
    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/login");
    }

    const address = user.addresses.id(req.params.id);

    if (!address) {
      req.flash("error", "Address not found.");
      return res.redirect("/account");
    }

    address.set({
      line1: line1.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
    });

    await user.save();
    req.flash("success", "✅ Address updated successfully.");
    res.redirect("/account");
  } catch (error) {
    console.error("Address edit error:", error);
    req.flash("error", "An error occurred while updating the address.");
    res.redirect(`/account/addresses/edit/${req.params.id}`);
  }
});

router.get("/addresses/edit/:id", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);
    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/login");
    }

    const address = user.addresses.id(req.params.id);

    if (!address) {
      req.flash("error", "Address not found.");
      return res.redirect("/account");
    }

    const error = req.flash("error");
    const success = req.flash("success");
    res.render("edit-address", { address, error, success });
  } catch (error) {
    console.error("Address fetch error:", error);
    req.flash("error", "An error occurred while fetching the address.");
    res.redirect("/account");
  }
});

router.get("/addresses/default/:id", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);
    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/login");
    }

    const selectedAddress = user.addresses.id(req.params.id);
    if (!selectedAddress) {
      req.flash("error", "Address not found.");
      return res.redirect("/account");
    }

    // Set all addresses as non-default first
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });

    // Set selected address as default
    selectedAddress.isDefault = true;
    await user.save();

    req.flash("success", "✅ Default address updated successfully.");
    res.redirect("/account");
  } catch (error) {
    console.error("Set default address error:", error);
    req.flash("error", "An error occurred while updating the default address.");
    res.redirect("/account");
  }
});

router.get("/addresses/delete/:id", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);
    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/login");
    }

    const address = user.addresses.id(req.params.id);

    if (!address) {
      req.flash("error", "Address not found.");
      return res.redirect("/account");
    }

    const wasDefault = address.isDefault;
    address.deleteOne();

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    req.flash("success", "✅ Address deleted successfully.");
    res.redirect("/account");
  } catch (error) {
    console.error("Address delete error:", error);
    req.flash("error", "An error occurred while deleting the address.");
    res.redirect("/account");
  }
});

module.exports = router;
