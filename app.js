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

const logger = require("./utils/logger");
const rateLimit = require("express-rate-limit");

//Import Routes
const loginRoutes = require("./routes/loginRoutes");
const adminRoutes = require("./routes/adminRoutes");

dotenv.config();

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later",
});

app.use(limiter);
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
app.use(adminRoutes);

//Routes

app.get("/", (req, res) => {
  res.render("index", { title: "Penny Pal" });
});

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
    const savings = accounts.filter((account) => account.type === "savings");
    const debt = accounts.filter((account) => account.type === "debt");
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

app.use((err, req, res, next) => {
  // Log the error using Winston
  logger.error(
    `${err.status || 500} - ${err.message} - ${req.originalUrl} - ${
      req.method
    } - ${req.ip}`
  );

  if (err.name === "UnauthorizedError") {
    return res
      .status(401)
      .render("error", { title: "Error", message: "Unauthorized Access!" });
  }

  res
    .status(err.status || 500)
    .json({ error: { message: err.message || "Something went wrong!" } });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
