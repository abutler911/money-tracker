const express = require("express");
const User = require("../models/user");
const Account = require("../models/account");
const isAuthenticated = require("../auth/authMiddleware");

const router = express.Router();

// Admin dashboard route
router.get("/admin", isAuthenticated, async (req, res) => {
  try {
    // Fetch unverified users from the database
    const unverifiedUsers = await User.find({ isVerified: false });

    res.render("admin", {
      title: "Admin",
      unverifiedUsers: unverifiedUsers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching unverified users");
  }
});

// Verify user route
router.post("/verify-user/:userId", isAuthenticated, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Update the user's verification status to true
    await User.findByIdAndUpdate(userId, { isVerified: true });

    // Redirect back to the admin page
    res.redirect("/admin");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error verifying user");
  }
});

// Edit accounts route
router.get("/edit-accounts", isAuthenticated, async (req, res) => {
  if (req.user.isAdmin) {
    try {
      // Fetch all accounts from the database
      const accounts = await Account.find({});

      const user = req.user;
      console.log(accounts);

      res.render("edit-accounts", {
        title: "Edit Accounts",
        user: user,
        accounts: accounts,
      });
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.status(403).send("You do not have permission to access this page.");
  }
});

// Add account route
router.get("/add-account", isAuthenticated, (req, res) => {
  if (req.user.isAdmin) {
    const user = req.user;
    res.render("add-account", { title: "Add Account", user: user });
  } else {
    res.status(403).send("You do not have permission to access this page.");
  }
});

router.post("/add-account", isAuthenticated, async (req, res) => {
  // Add account logic
});

module.exports = router;
