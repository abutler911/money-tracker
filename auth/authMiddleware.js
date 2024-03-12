const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated() && req.user.isVerified) {
    return next();
  }
  res.render("verification-pending", { title: "Verification Pending" });
};

module.exports = isAuthenticated;
