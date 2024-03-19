const express = require("express");
const User = require("../models/user");
const Account = require("../models/account");
const isAuthenticated = require("../auth/authMiddleware");

const router = express.Router();

// Admin dashboard route
router.get("/admin", isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Fetch unverified users from the database
    const unverifiedUsers = await User.find({ isVerified: false });
    const currentUsers = await User.find({ isVerified: true });
    const adminUsers = await User.find({ isAdmin: true });
    console.log("Unverified Users:", unverifiedUsers);
    console.log("Current Users:", currentUsers);

    res.render("admin", {
      title: "Admin",
      unverifiedUsers: unverifiedUsers,
      currentUsers: currentUsers,
      adminUsers: adminUsers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching unverified users");
  }
});

// Verify user route
router.post(
  "/verify-user/:userId",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
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
  }
);

router.post(
  "/grant-admin/:userId",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      const userId = req.params.userId;

      // Update the user's verification status to true
      await User.findByIdAndUpdate(userId, { isAdmin: true });

      // Redirect back to the admin page
      res.redirect("/admin");
    } catch (err) {
      console.error(err);
      res.status(500).send("Error verifying user");
    }
  }
);

router.post(
  "/revoke-access/:userId",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      const userId = req.params.userId;

      // Update the user's verification status to true
      await User.findByIdAndUpdate(userId, { isAdmin: false });

      // Redirect back to the admin page
      res.redirect("/admin");
    } catch (err) {
      console.error(err);
      res.status(500).send("Error verifying user");
    }
  }
);

router.post(
  "/delete-user/:userId",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      const userId = req.params.userId;

      // Delete the user from the database
      await User.findByIdAndDelete(userId);

      // Redirect back to the admin page
      res.redirect("/admin");
    } catch (err) {
      console.error(err);
      res.status(500).send("Error deleting user");
    }
  }
);

router.get("/add-account", isAuthenticated, isAdmin, (req, res) => {
  if (req.user.isAdmin) {
    const user = req.user;
    res.render("add-account", { title: "Add Account", user: user });
  } else {
    res.status(403).send("You do not have permission to access this page.");
  }
});

router.post("/add-account", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { accountName, amount, accountType } = req.body;

    // Input Validation (adjust as needed)
    if (!accountName || !amount || !accountType) {
      return res
        .status(400)
        .send("Missing required fields: accountName, amount, or accountType");
    }

    // Assuming amounts are stored as numbers.  Convert if needed.
    const parsedAmount = parseFloat(amount);

    // Create a new Account object using your Mongoose model
    const newAccount = new Account({
      accountName: accountName,
      amount: parsedAmount,
      type: accountType,
      userId: req.user._id, // Associate with the current user
    });

    // Save the account to the database
    await newAccount.save();

    // Redirect for success: Choose where to redirect
    res.redirect("/dashboard"); // Replace '/dashboard' with the appropriate route
  } catch (error) {
    console.error("Error adding account:", error);
    res.status(500).send("Error adding account. Please try again.");
  }
});

// Assuming you have an instance of Express called 'app'
router.post("/update-account", isAuthenticated, isAdmin, async (req, res) => {
  const accountId = req.body.accountId;
  const newAmount = req.body.newAmount;

  try {
    const updatedAccount = await Account.findByIdAndUpdate(
      accountId,
      { amount: newAmount },
      { new: true }
    );

    res.redirect("/dashboard");
  } catch (err) {
    console.error("Error updating account:", err);

    res.status(500).send("Error updating account");
  }
});

router.post(
  "/delete-account/:accountId",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
    try {
      const accountId = req.params.accountId;

      if (!accountId) {
        console.error("Invalid data format: accountId is required.");
        return res
          .status(400)
          .send("Invalid data format: accountId is required.");
      }

      // Find the account by _id and delete it
      await Account.findByIdAndDelete(accountId);

      // Respond with a success message
      res.status(200).redirect("/dashboard");
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

router.get("/verification-pending", (req, res) => {
  res.render("verification-pending", { title: "Verification Pending" });
});

function isAdmin(req, res, next) {
  if (req.user.isAdmin) {
    return next();
  } else {
    res.status(403).send("You do not have permission to access this page.");
  }
}

module.exports = router;
