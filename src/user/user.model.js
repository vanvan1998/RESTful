const mongoose = require('mongoose');

var UserSchema = new mongoose.Schema(
    {
        username: String,
        name: String,
        email: String,
        dateOfBirth: String,
        sex: String,
        password: String,
        facebookId: String,
        userImage: {
            type: String,
            default: '/uploads/default_avatar.png'
        },
        role: { type: String, default: 'user' }
    },
    {
        timestamps: true
    }
);

var users = mongoose.model('users', UserSchema);

module.exports = users;