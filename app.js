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

dotenv.config();

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(express.static("public"));

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
  res.render("index", { title: "Money Tracker" });
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

app.get("/dashboard", isAuthenticated, async (req, res, next) => {
  try {
    const savings = await Savings.find();
    const debt = await Debt.find();
    res.render("dashboard", { title: "Dashboard", savings, debt });
  } catch (err) {
    next(err);
  }
});

app.get("/admin", isAuthenticated, (req, res) => {
  res.render("admin", { title: "Admin" });
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
