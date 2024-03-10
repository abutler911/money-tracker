const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
});

// Apply passport-local-mongoose plugin to UserSchema
UserSchema.plugin(passportLocalMongoose);

// Create User model
const User = mongoose.model("User", UserSchema);

module.exports = User;
