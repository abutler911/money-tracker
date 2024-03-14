const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const Account = require("./models/account");
const expressLayouts = require("express-ejs-layouts");
const User = require("./models/user");
const isAuthenticated = require("./auth/authMiddleware");
const bcrypt = require("bcrypt");
const path = require("path");

//Import Routes
const loginRoutes = require("./routes/loginRoutes");
const adminRoutes = require("./routes/adminRoutes");

dotenv.config();

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(expressLayouts);
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(
  new LocalStrategy(
    { usernameField: "username" },
    async (username, password, done) => {
      try {
        const user = await User.findOne({
          username: { $regex: new RegExp("^" + username + "$", "i") },
        });
        if (!user) {
          return done(null, false);
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false);
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const mongoURI = process.env.MONGODB_URI;
mongoose
  .connect(mongoURI, {})
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

//Routes Setup
app.use(loginRoutes);

app.get("/", (req, res) => {
  res.render("index", { title: "Penny Pal" });
});

// app.get("/login", (req, res) => {
//   res.render("login", { title: "Login" });
// });

// app.post("/login", (req, res, next) => {
//   passport.authenticate("local", (err, user, info) => {
//     if (err) {
//       return next(err);
//     }
//     if (!user) {
//       return res.redirect("/login");
//     }
//     req.logIn(user, (err) => {
//       if (err) {
//         return next(err);
//       }
//       return res.redirect("/dashboard");
//     });
//   })(req, res, next);
// });

// // Logout route
// app.get("/logout", (req, res) => {
//   req.logout(function (err) {
//     if (err) {
//       console.error("Error logging out:", err);
//       res.status(500).send("Error logging out");
//     } else {
//       res.redirect("/login");
//     }
//   });
// });

// app.get("/register", (req, res) => {
//   res.render("register", { title: "Register" });
// });

// app.post("/register", async (req, res) => {
//   try {
//     const { name, username, password } = req.body;
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = new User({ name, username, password: hashedPassword });
//     await user.save();
//     res.redirect("/verification-pending");
//   } catch (err) {
//     console.error(err);
//     res
//       .status(500)
//       .render("error", { title: "Error", message: "Failed to register user" });
//   }
// });

const getTotalAmount = (accounts, type) => {
  return accounts.reduce((total, account) => {
    if (account.type === type) {
      total += account.amount;
    }
    return total;
  }, 0);
};

app.get("/dashboard", isAuthenticated, async (req, res, next) => {
  try {
    const user = req.user;
    const accounts = await Account.find();
    const savings = accounts.filter((account) => account.type === "savings"); // Filter savings accounts
    const debt = accounts.filter((account) => account.type === "debt"); // Filter debt accounts
    res.render("dashboard", {
      title: "Penny Pal Dashboard",
      user,
      savings,
      debt,
      accounts,
      getTotalAmount,
    });
  } catch (err) {
    next(err);
  }
});

app.get("/admin", isAuthenticated, async (req, res) => {
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

app.post("/verify-user/:userId", isAuthenticated, async (req, res) => {
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

app.get("/edit-accounts", isAuthenticated, async (req, res) => {
  if (req.user.isAdmin) {
    try {
      // Fetch savings and debt accounts from the database
      const savings = await Savings.find({});
      const debts = await Debt.find({});

      // Add a 'type' property to each account
      const savingsWithType = savings.map((account) => ({
        ...account.toObject(),
        type: "savings",
      }));
      const debtsWithType = debts.map((account) => ({
        ...account.toObject(),
        type: "debts",
      }));

      // Combine savings and debts into a single array
      const accounts = [...savingsWithType, ...debtsWithType];

      const user = req.user;
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

app.get("/add-account", isAuthenticated, (req, res) => {
  if (req.user.isAdmin) {
    const user = req.user;
    res.render("add-account", { title: "Add Account", user: user });
  } else {
    res.status(403).send("You do not have permission to access this page.");
  }
});

app.post("/add-account", isAuthenticated, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res
        .status(403)
        .send("You do not have permission to perform this action.");
    }
    const { accountName, amount, accountType } = req.body;
    // Save the account with type
    if (accountType === "savings" || accountType === "debt") {
      const account = new Account({
        accountName,
        amount,
        type: accountType, // Include the type of account
      });
      await account.save();
      res.redirect("/dashboard");
    } else {
      res.status(400).send("Invalid account type.");
    }
  } catch (error) {
    console.error("Error adding account:", error);
    res.status(500).send("Failed to add account.");
  }
});

// app.post("/delete-saving/:id", isAuthenticated, async (req, res) => {
//   try {
//     if (!req.user.isAdmin) {
//       return res
//         .status(403)
//         .send("You do not have permission to perform this action.");
//     }
//     const { id } = req.params;
//     await Savings.findByIdAndDelete(id);
//     res.redirect("/dashboard");
//   } catch (error) {
//     console.error("Error deleting savings:", error);
//     res.status(500).send("Failed to delete savings.");
//   }
// });

// app.get("/add-debt", isAuthenticated, (req, res) => {
//   if (req.user.isAdmin) {
//     const user = req.user;
//     res.render("add-debt", {
//       title: "Add Debt",

//       user: user,
//     });
//   } else {
//     res.status(403).send("You do not have permission to access this page.");
//   }
// });

// app.post("/add-debt", isAuthenticated, async (req, res) => {
//   console.log(req.body);
//   try {
//     if (!req.user.isAdmin) {
//       return res
//         .status(403)
//         .send("You do not have permission to perform this action.");
//     }
//     const { accountName, amount } = req.body;
//     const debt = new Debt({
//       accountName,
//       amount,
//     });
//     await debt.save();
//     res.redirect("/dashboard");
//   } catch (error) {
//     console.error("Error adding debt:", error);
//     res.status(500).send("Failed to add debt.");
//   }
// });

app.post("/update-accounts/:type/:id", isAuthenticated, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res
        .status(403)
        .send("You do not have permission to perform this action.");
    }

    const { type, id } = req.params;
    const { newAmount } = req.body;

    // Update the amount for the specified account
    await Account.findByIdAndUpdate(id, { amount: newAmount });
    res.redirect("/dashboard");
  } catch (error) {
    console.error(`Error updating ${type}:`, error);
    res.status(500).send(`Failed to update ${type}.`);
  }
});

app.get("/verification-pending", (req, res) => {
  res.render("verification-pending", { title: "Verification Pending" });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === "UnauthorizedError") {
    res
      .status(401)
      .render("error", { title: "Error", message: "Unauthorized Access!" });
  } else {
    res
      .status(500)
      .render("error", { title: "Error", message: "Something went wrong!" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// const getTotalSavingsAmount = (savings) => {
//   return savings.reduce((total, saving) => total + saving.amount, 0);
// };

// const getTotalDebtAmount = (debt) => {
//   return debt.reduce((total, debtItem) => total + debtItem.amount, 0);
// };

// Helper function to calculate total amount for savings or debt accounts
