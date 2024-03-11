const mongoose = require("mongoose");

const savingsSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  accountName: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const Savings = mongoose.model("Savings", savingsSchema);

module.exports = Savings;
