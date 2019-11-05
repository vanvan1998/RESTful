const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var MessageSchema = new mongoose.Schema(
    {
        userId: Schema.Types.ObjectId,
        name: String,
        message: String,
    },
    {
        timestamps: true
    }
);

var messages = mongoose.model('messages', MessageSchema);

module.exports = messages;