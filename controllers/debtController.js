const Debt = require("../models/debt");

exports.getTotalDebtAmount = async (req, res) => {
  try {
    const debt = await Debt.find();
    let totalDebt = 0;
    debt.forEach((debtItem) => {
      totalDebt += debtItem.amount;
    });
    res.render("dashboard", {
      title: "Penny Pal Dashboard",
      user: req.user,
      debt,
      totalDebt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Controller function to get all debt
exports.getAllDebt = async (req, res) => {
  try {
    const debt = await Debt.find();
    const totalDebtAmount = getTotalDebtAmount(debt);
    res.render("debt/index", { debt, totalDebtAmount });
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
