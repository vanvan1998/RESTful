const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var RoomSchema = new mongoose.Schema(
    {
        name: String,
        player_1: Schema.Types.ObjectId,
        player_2: Schema.Types.ObjectId,
        messages: [Schema.Types.ObjectId],
        winner: Schema.Types.ObjectId,
        XFirst: Boolean,
        status: String
    },
    {
        timestamps: true
    }
);

var rooms = mongoose.model('rooms', RoomSchema);

module.exports = rooms;