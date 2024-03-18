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

router.get("/add-account", isAuthenticated, (req, res) => {
  if (req.user.isAdmin) {
    const user = req.user;
    res.render("add-account", { title: "Add Account", user: user });
  } else {
    res.status(403).send("You do not have permission to access this page.");
  }
});

router.post("/add-account", isAuthenticated, async (req, res) => {
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
router.post("/update-account", async (req, res) => {
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

router.post("/delete-account/:accountId", isAuthenticated, async (req, res) => {
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
});

module.exports = router;
