const isAuthenticated = (req, res, next) => {
  // Check if user is authenticated using Passport.js
  if (req.isAuthenticated()) {
    return next(); // User is authenticated, continue to the next middleware
  } else {
    res.redirect("/login"); // User is not authenticated, redirect to login page
  }
};

module.exports = isAuthenticated;
