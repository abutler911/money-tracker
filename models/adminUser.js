const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const adminUserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const AdminUser = mongoose.model("AdminUser", adminUserSchema);

module.exports = AdminUser;
