const Savings = require("../models/savings");

// Controller function to get all savings
exports.getAllSavings = async (req, res) => {
  try {
    const savings = await Savings.find();
    res.render("savings/index", { savings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Controller function to create a new saving
exports.createSaving = async (req, res) => {
  const saving = new Savings({
    amount: req.body.amount,
    description: req.body.description,
  });
  try {
    const newSaving = await saving.save();
    res.redirect("/savings");
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Controller function to delete a saving
exports.deleteSaving = async (req, res) => {
  try {
    await Savings.findByIdAndDelete(req.params.id);
    res.redirect("/savings");
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
