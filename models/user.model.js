const mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');

var UserSchema = new mongoose.Schema(
  {
    username: String,
    name: String,
    email: String,
    dateOfBirth: String,
    sex: String,
    password: String
  },
  {
    timestamps: true
  }
);
UserSchema.plugin(passportLocalMongoose);

var users = mongoose.model('users', UserSchema);
module.exports = users;
