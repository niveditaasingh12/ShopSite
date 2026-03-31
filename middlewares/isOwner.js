module.exports = (req, res, next) => {
  if (!req.session || !req.session.user) {
    req.flash("error", "You must be logged in to access this page.");
    return res.redirect("/owners/login"); // ✅ Correct path
  }

  if (req.session.user.role !== "owner") {
    req.flash("error", "You are not authorized to access this page.");
    return res.redirect("/"); // you can also redirect to "/owners/login" if needed
  }

  next();
};
