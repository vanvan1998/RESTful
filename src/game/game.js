const Room = require('./room/room.model');

function clearRoom(io, room, namespace = '/') {
    let roomObj = io.nsps[namespace].adapter.rooms[room];
    if (roomObj) {
        // now kick everyone out of this room
        Object.keys(roomObj.sockets).forEach(function (id) {
            io.sockets.connected[id].leave(room);
        })
    }
}

const startGame = async (io, socket) => {
    socket.adapter.rooms[socket.socketRoomName].currentBoard = Array.from(Array(20), () => new Array(20));
    socket.adapter.rooms[socket.socketRoomName].lastBoard = Array.from(Array(20), () => new Array(20));

    var room = await Room.findById(socket.socketRoomId);
    socket.adapter.rooms[socket.socketRoomName].roomId = room._id;
    socket.adapter.rooms[socket.socketRoomName].turn = room.XFirst ? 'X' : 'O';

    if (socket.adapter.rooms[socket.socketRoomName].turn == socket.socketSymbol) {
        socket.emit('server-enable-your-turn');
    }
    else {
        socket.in(socket.socketRoomName).broadcast.emit('server-enable-your-turn');
    }

    io.sockets.in(socket.socketRoomName).emit('server-init-game-success');
}

const verifyMove = (io, socket, move) => {
    if (!socket.adapter.rooms[socket.socketRoomName]) {
        return;
    }

    if (socket.adapter.rooms[socket.socketRoomName].turn !== socket.socketSymbol) {
        return;
    }

    if (socket.adapter.rooms[socket.socketRoomName].currentBoard[move.x][move.y] === undefined) {

        socket.adapter.rooms[socket.socketRoomName].currentBoard[move.x][move.y] = socket.socketSymbol;

        io.sockets.in(socket.socketRoomName).emit('server-send-move', { move, symbol: socket.socketSymbol });

        io.sockets.in(socket.socketRoomName).emit('server-send-new-message', { message: `${socket.socketUserName} set ${socket.socketSymbol} at ${move.x};${move.y}`, owner: 'server' });

        socket.adapter.rooms[socket.socketRoomName].turn = socket.socketSymbol === 'X' ? 'O' : 'X';

        socket.in(socket.socketRoomName).broadcast.emit('server-enable-your-turn');
    }
}

const setCompetitorIsWinner = async (io, socket, info) => {
    if (!socket.adapter.rooms[socket.socketRoomName]) {
        return;
    }
    // If player has join a room
    if (socket.socketRoomName) {

        var playerLose = socket.socketUserId;
        var roomId = socket.socketRoomId;
        var room = await Room.findById(roomId);

        if (room) {
            room.winner = playerLose == room.player_1 ? room.player_2 : room.player_1;
            room.status = 'end';
            room.save();
        }


        if (info === 'exit') {
            socket.in(socket.socketRoomName).broadcast.emit('server-send-new-message', { message: 'Your competitor exit game. Your are winner!', owner: 'server' });
        }
        else if (info === 'surrender') {
            socket.in(socket.socketRoomName).broadcast.emit('server-send-new-message', { message: 'Your competitor surrender. Your are winner!', owner: 'server' });
        }
        else if (info === 'disconnect') {
            socket.in(socket.socketRoomName).broadcast.emit('server-send-new-message', { message: 'Your competitor disconnect. Your are winner!', owner: 'server' });
        }
        else if (info === 'lose') {
            socket.in(socket.socketRoomName).broadcast.emit('server-send-new-message', { message: 'You won!', owner: 'server' });
            socket.emit('server-send-new-message', { message: 'Your lost!', owner: 'server' });
        }

        io.sockets.in(socket.socketRoomName).emit('server-send-new-message', { message: 'This game was end.', owner: 'server' });

        io.sockets.in(socket.socketRoomName).emit('the-game-was-end');

        clearRoom(io, socket.socketRoomName);
    }
}

const endTheGameWithoutWinner = async (io, socket, answer) => {
    if (!socket.adapter.rooms[socket.socketRoomName]) {
        return;
    }

    if (answer === 'yes') {
        var room = await Room.findById(socket.socketRoomId);

        if (room) {
            room.status = 'end';
            room.save();
        }

        io.sockets.in(socket.socketRoomName).emit('server-send-new-message', { message: 'This game was end without winner.', owner: 'server' });
        io.sockets.in(socket.socketRoomName).emit('the-game-was-end');

        clearRoom(io, socket.socketRoomName);
    }
    else {
        socket.in(socket.socketRoomName).broadcast.emit('server-send-new-message', { message: 'Your competitor not accept draw game!', owner: 'server' });
    }
}

const sendDrawRequestToCompetitor = (io, socket) => {
    if (!socket.adapter.rooms[socket.socketRoomName]) {
        return;
    }

    socket.in(socket.socketRoomName).broadcast.emit('competitor-want-a-draw-game');
    socket.emit('server-send-new-message', { message: 'Your request sent!', owner: 'server' });
}

module.exports = { startGame, verifyMove, sendDrawRequestToCompetitor, endTheGameWithoutWinner, setCompetitorIsWinner }