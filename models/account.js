const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ["debt", "savings"],
    required: true,
  },
  history: [
    {
      date: {
        type: Date,
        default: Date.now,
      },
      amount: {
        type: Number,
        required: true,
      },
    },
  ],
});

const Account = mongoose.model("Account", accountSchema);

module.exports = Account;
