const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const savingsController = require("./controllers/savingsController");
const debtController = require("./controllers/debtController");
const Savings = require("./models/savings");
const Debt = require("./models/debt");
const expressLayouts = require("express-ejs-layouts");
const User = require("./models/user");
const isAuthenticated = require("./auth/authMiddleware");
const bcrypt = require("bcrypt");
const path = require("path");

dotenv.config();

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("view engine", "ejs");
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

app.get("/", (req, res) => {
  res.render("index", { title: "Penny Pal" });
});

app.get("/login", (req, res) => {
  res.render("login", { title: "Login" });
});

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/login");
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect("/dashboard");
    });
  })(req, res, next);
});

app.get("/register", (req, res) => {
  res.render("register", { title: "Register" });
});

app.post("/register", async (req, res) => {
  try {
    const { name, username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, username, password: hashedPassword });
    await user.save();
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to register user");
  }
});
const getTotalSavingsAmount = (savings) => {
  let totalAmount = 0;
  savings.forEach((saving) => {
    totalAmount += saving.amount;
  });
  return totalAmount;
};

const getTotalDebtAmount = (debt) => {
  let totalAmount = 0;
  debt.forEach((debt) => {
    totalAmount += debt.amount;
  });
  return totalAmount;
};

app.get("/dashboard", isAuthenticated, async (req, res, next) => {
  try {
    const user = req.user;
    const savings = await Savings.find();
    const debt = await Debt.find();
    const totalSavingsAmount = getTotalSavingsAmount(savings);
    const totalDebtAmount = getTotalDebtAmount(debt);
    res.render("dashboard", {
      title: "Penny Pal Dashboard",
      user,
      savings,
      debt,
      getTotalDebtAmount,
      getTotalSavingsAmount,
    });
  } catch (err) {
    next(err);
  }
});

app.get("/admin", isAuthenticated, (req, res) => {
  if (req.user.isAdmin) {
    res.render("admin", { title: "Admin" });
  } else {
    res.status(403).send("You do not have permission to access this page.");
  }
});

app.get("/add-savings", isAuthenticated, (req, res) => {
  if (req.user.isAdmin) {
    const user = req.user;
    res.render("add-savings", { title: "Add Savings", user: user });
  } else {
    res.status(403).send("You do not have permission to access this page.");
  }
});

app.post("/add-savings", isAuthenticated, async (req, res) => {
  try {
    // Ensure user is admin
    if (!req.user.isAdmin) {
      return res
        .status(403)
        .send("You do not have permission to perform this action.");
    }

    // Extract account name and amount from request body
    const { accountName, amount } = req.body;

    // Validate input (e.g., ensure amount is a valid number)

    // Create new savings object
    const savings = new Savings({
      accountName,
      amount,
    });

    // Save the savings object to the database
    await savings.save();

    // Redirect to dashboard with success message
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error adding savings:", error);
    res.status(500).send("Failed to add savings.");
  }
});

app.post("/delete-saving/:id", isAuthenticated, async (req, res) => {
  try {
    // Ensure user is admin
    if (!req.user.isAdmin) {
      return res
        .status(403)
        .send("You do not have permission to perform this action.");
    }

    // Extract the savings account ID from the request parameters
    const { id } = req.params;

    // Find the savings account by ID and delete it
    await Savings.findByIdAndDelete(id);

    // Redirect to the dashboard with a success message
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error deleting savings:", error);
    res.status(500).send("Failed to delete savings.");
  }
});

app.get("/add-debt", isAuthenticated, (req, res) => {
  if (req.user.isAdmin) {
    const user = req.user;
    res.render("add-debt", {
      title: "Add Debt",

      user: user,
    });
  } else {
    res.status(403).send("You do not have permission to access this page.");
  }
});

app.post("/add-debt", isAuthenticated, async (req, res) => {
  console.log(req.body);
  try {
    // Ensure user is admin
    if (!req.user.isAdmin) {
      return res
        .status(403)
        .send("You do not have permission to perform this action.");
    }

    // Extract debt information from request body
    const { accountName, amount } = req.body;

    // Create a new debt object
    const debt = new Debt({
      accountName,
      amount,
    });

    // Save the debt object to the database
    await debt.save();

    // Redirect to the dashboard with a success message
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error adding debt:", error);
    res.status(500).send("Failed to add debt.");
  }
});

app.post("/update-debt/:id", isAuthenticated, async (req, res) => {
  try {
    // Ensure user is admin
    if (!req.user.isAdmin) {
      return res
        .status(403)
        .send("You do not have permission to perform this action.");
    }

    // Extract debt ID and new amount from request body
    const { id } = req.params;
    const { newAmount } = req.body;

    // Find the debt by ID and update its amount
    await Debt.findByIdAndUpdate(id, { amount: newAmount });

    // Redirect to the dashboard with a success message
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error updating debt:", error);
    res.status(500).send("Failed to update debt.");
  }
});

app.post("/update-saving/:id", isAuthenticated, async (req, res) => {
  try {
    // Ensure user is admin
    if (!req.user.isAdmin) {
      return res
        .status(403)
        .send("You do not have permission to perform this action.");
    }

    // Extract saving ID and new amount from request body
    const { id } = req.params;
    const { newAmount } = req.body;

    // Find the saving by ID and update its amount
    await Savings.findByIdAndUpdate(id, { amount: newAmount });

    // Redirect to the dashboard with a success message
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error updating saving:", error);
    res.status(500).send("Failed to update saving.");
  }
});

app.get("/savings", isAuthenticated, savingsController.getAllSavings);
app.post("/savings", isAuthenticated, savingsController.createSaving);
app.delete("/savings/:id", isAuthenticated, savingsController.deleteSaving);

app.get("/debt", isAuthenticated, debtController.getAllDebt);
app.post("/debt", isAuthenticated, debtController.createDebt);
app.delete("/debt/:id", isAuthenticated, debtController.deleteDebt);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Something went wrong!");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
