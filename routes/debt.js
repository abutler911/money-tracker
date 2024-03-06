const express = require("express");
const router = express.Router();
const Debt = require("../models/debt");

// Route to get all debt
router.get("/debt", async (req, res) => {
  try {
    const debt = await Debt.find();
    res.json(debt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route to create a new debt
router.post("/debt", async (req, res) => {
  const debt = new Debt({
    amount: req.body.amount,
    description: req.body.description,
  });
  try {
    const newDebt = await debt.save();
    res.status(201).json(newDebt);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Route to delete a debt
router.delete("/debt/:id", async (req, res) => {
  try {
    await Debt.findByIdAndDelete(req.params.id);
    res.json({ message: "Debt deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
