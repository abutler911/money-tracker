// Import required modules
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const savingsRouter = require("./routes/savings");
const savingsController = require("./controllers/savingsController");
const debtRouter = require("./routes/debt");
const debtController = require("./controllers/debtController");
const Savings = require("./models/savings");
const Debt = require("./models/debt");

// Load environment variables from .env file
dotenv.config();

// Create Express app
const app = express();

// Set up body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set up EJS as the view engine
app.set("view engine", "ejs");

// Connect to MongoDB using the connection string from the .env file
const mongoURI = process.env.MONGODB_URI;
mongoose
  .connect(mongoURI, {})
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Route for the admin section
app.get("/admin", (req, res) => {
  res.render("admin");
});

// Define routes
app.get("/", async (req, res) => {
  try {
    const savings = await Savings.find();
    const debt = await Debt.find();
    res.render("index", { savings, debt });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Routes for savings
app.get("/savings", savingsController.getAllSavings);
app.post("/savings", savingsController.createSaving);
app.delete("/savings/:id", savingsController.deleteSaving);

// Routes for debt
app.get("/debt", debtController.getAllDebt);
app.post("/debt", debtController.createDebt);
app.delete("/debt/:id", debtController.deleteDebt);

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
