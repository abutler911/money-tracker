const Debt = require("../models/debt");

// Controller function to get all debt
exports.getAllDebt = async (req, res) => {
  try {
    const debt = await Debt.find();
    res.render("debt/index", { debt });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Controller function to create a new debt
exports.createDebt = async (req, res) => {
  const debt = new Debt({
    amount: req.body.amount,
    description: req.body.description,
  });
  try {
    const newDebt = await debt.save();
    res.redirect("/debt");
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Controller function to delete a debt
exports.deleteDebt = async (req, res) => {
  try {
    await Debt.findByIdAndDelete(req.params.id);
    res.redirect("/debt");
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
