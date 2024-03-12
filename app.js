const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
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
// app.use(bodyParser.json());
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

// Logout route
app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      console.error("Error logging out:", err);
      res.status(500).send("Error logging out");
    } else {
      res.redirect("/login");
    }
  });
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

app.get("/dashboard", isAuthenticated, async (req, res, next) => {
  try {
    const user = req.user;
    const savings = await Savings.find();
    const debt = await Debt.find();
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
    res.status(403).render("error", {
      message: "You do not have permission to access this page.",
    });
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
    if (!req.user.isAdmin) {
      return res
        .status(403)
        .send("You do not have permission to perform this action.");
    }
    const { accountName, amount } = req.body;
    const savings = new Savings({
      accountName,
      amount,
    });
    await savings.save();
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error adding savings:", error);
    res.status(500).send("Failed to add savings.");
  }
});

app.post("/delete-saving/:id", isAuthenticated, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res
        .status(403)
        .send("You do not have permission to perform this action.");
    }
    const { id } = req.params;
    await Savings.findByIdAndDelete(id);
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
    if (!req.user.isAdmin) {
      return res
        .status(403)
        .send("You do not have permission to perform this action.");
    }
    const { accountName, amount } = req.body;
    const debt = new Debt({
      accountName,
      amount,
    });
    await debt.save();
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error adding debt:", error);
    res.status(500).send("Failed to add debt.");
  }
});

app.post("/update-debt/:id", isAuthenticated, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res
        .status(403)
        .send("You do not have permission to perform this action.");
    }
    const { id } = req.params;
    const { newAmount } = req.body;
    await Debt.findByIdAndUpdate(id, { amount: newAmount });
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error updating debt:", error);
    res.status(500).send("Failed to update debt.");
  }
});

app.post("/update-saving/:id", isAuthenticated, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res
        .status(403)
        .send("You do not have permission to perform this action.");
    }
    const { id } = req.params;
    const { newAmount } = req.body;
    await Savings.findByIdAndUpdate(id, { amount: newAmount });
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error updating saving:", error);
    res.status(500).send("Failed to update saving.");
  }
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
