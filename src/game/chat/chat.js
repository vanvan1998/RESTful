const Room = require('.././room/room.model');
const Message = require('../chat/message.model');

const sendMessages = async (io, socket, message) => {
    if (!socket.adapter.rooms[socket.socketRoomName]) {
        return;
    }

    socket.in(socket.socketRoomName).broadcast.emit('server-send-new-message', { message: message, owner: 'competitor' });

    var newMessage = new Message({
        userId: socket.socketUserId,
        name: socket.socketUserName,
        message: message.message
    })

    var message = await newMessage.save();
    var room = await Room.findById(socket.socketRoomId);
    
    if (room) {
        var mess = [...room.messages];
        mess.push(message._id);
        room.messages = mess;
        room.save();
    }
}

module.exports = { sendMessages }