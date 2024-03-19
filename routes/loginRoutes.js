const express = require("express");
const passport = require("passport");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const { check, validationResult } = require("express-validator");

const router = express.Router();

const loginValidationRules = () => {
  return [
    check("username").notEmpty().withMessage("Username is required"),
    check("password").notEmpty().withMessage("Password is required"),
  ];
};
// Login route
router.get("/login", (req, res) => {
  res.render("login", { title: "Login" });
});

router.post("/login", loginValidationRules(), async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

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
router.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      console.error("Error logging out:", err);
      res.status(500).send("Error logging out");
    } else {
      res.redirect("/login");
    }
  });
});

router.get("/register", (req, res) => {
  res.render("register", { title: "Register" });
});

router.post("/register", async (req, res) => {
  try {
    const { name, username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, username, password: hashedPassword });
    await user.save();
    res.redirect("/verification-pending");
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .render("error", { title: "Error", message: "Failed to register user" });
  }
});

module.exports = router;
