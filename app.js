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

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(express.static("public"));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize Passport
app.use(passport.initialize());
console.log("Passport initialized");

app.use(passport.session());

// Passport Local Strategy
passport.use(
  new LocalStrategy(
    { usernameField: "username" },
    async (username, password, done) => {
      console.log("Entered passport strategy");
      // Use 'async' here
      try {
        const user = await User.findOne({
          username: { $regex: new RegExp("^" + username + "$", "i") },
        }); // Use 'await'
        // ... (rest of your password comparison logic with bcrypt) ...
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
console.log("Local strategy configured");

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI;
mongoose
  .connect(mongoURI, {})
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Routes
app.get("/", (req, res) => {
  console.log("GET / route accessed"); // Log when the root route is accessed
  res.render("index", { title: "Money Tracker" });
});

app.get("/login", (req, res) => {
  console.log("GET /login route accessed"); // Log when the login page is accessed
  res.render("login", { title: "Login" });
});

app.post("/login", (req, res, next) => {
  console.log("POST /login route accessed");
  console.log("Request body:", req.body);

  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Error during authentication:", err);
      return next(err);
    }
    if (!user) {
      console.log("User not found");
      return res.redirect("/login");
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error("Error during login:", err);
        return next(err);
      }
      console.log("User authenticated:", user);
      return res.redirect("/dashboard"); // Redirect only after successful login
    });
  })(req, res, next);
});

app.get("/register", (req, res) => {
  console.log("GET /register route accessed"); // Log when the registration page is accessed
  res.render("register", { title: "Register" });
});

app.post("/register", async (req, res) => {
  try {
    console.log("POST /register route accessed"); // Log when the registration form is submitted
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
    console.log("GET /dashboard route accessed"); // Log when the dashboard is accessed
    const savings = await Savings.find();
    const debt = await Debt.find();
    res.render("index", { savings, debt });
  } catch (err) {
    next(err);
  }
});

// Admin section route
app.get("/admin", (req, res) => {
  console.log("GET /admin route accessed"); // Log when the admin section is accessed
  res.render("admin", { title: "Admin" });
});

// Routes for savings (protected by isAuthenticated middleware)
app.get("/savings", isAuthenticated, savingsController.getAllSavings);
app.post("/savings", isAuthenticated, savingsController.createSaving);
app.delete("/savings/:id", isAuthenticated, savingsController.deleteSaving);

// Routes for debt (protected by isAuthenticated middleware)
app.get("/debt", isAuthenticated, debtController.getAllDebt);
app.post("/debt", isAuthenticated, debtController.createDebt);
app.delete("/debt/:id", isAuthenticated, debtController.deleteDebt);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Something went wrong!");
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
