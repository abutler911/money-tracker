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

dotenv.config();

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set("view engine", "ejs");
app.use(expressLayouts);
app.use(express.static("public"));

const mongoURI = process.env.MONGODB_URI;
mongoose
  .connect(mongoURI, {})
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Configure express-session middleware with a secret
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
  res.render("index", { title: "Money Tracker" });
});

app.get("/register", (req, res) => {
  res.render("register", { title: "Register" });
});

app.post("/register", async (req, res) => {
  try {
    const { name, username, password } = req.body;

    // Hash and salt the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user instance
    const user = new User({
      name,
      username,
      password: hashedPassword,
    });

    // Save the user to the database
    await user.save();

    res.redirect("/dashboard"); // Redirect to dashboard after successful registration
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to register user");
  }
});

app.get("/dashboard", isAuthenticated, async (req, res) => {
  try {
    const savings = await Savings.find();
    const debt = await Debt.find();
    res.render("index", { savings, debt });
  } catch (err) {
    next(err);
  }
});

// Routes for the admin section
app.get("/admin", (req, res) => {
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

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
