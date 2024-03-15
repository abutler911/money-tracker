// const express = require("express");
// const router = express.Router();
// const Savings = require("../models/savings");

// // Route to get all savings
// router.get("/savings", async (req, res) => {
//   try {
//     const savings = await Savings.find();
//     res.json(savings);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // Route to create a new saving
// router.post("/savings", async (req, res) => {
//   const saving = new Savings({
//     amount: req.body.amount,
//     description: req.body.description,
//   });
//   try {
//     const newSaving = await saving.save();
//     res.status(201).json(newSaving);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// });

// // Route to delete a saving
// router.delete("/savings/:id", async (req, res) => {
//   try {
//     await Savings.findByIdAndDelete(req.params.id);
//     res.json({ message: "Saving deleted" });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// module.exports = router;
