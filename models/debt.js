const mongoose = require("mongoose");

const debtSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const Debt = mongoose.model("Debt", debtSchema);

module.exports = Debt;
