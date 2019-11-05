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
    if (room) {
        socket.adapter.rooms[socket.socketRoomName].turns = [];
        socket.adapter.rooms[socket.socketRoomName].turns.push(room.XFirst);

        if (room.XFirst === true) {
            socket.in(socket.socketRoomName).broadcast.emit('server-enable-your-turn');
        }
        else {
            socket.emit('server-enable-your-turn');
        }
    }
}

const sendNextTurnToCompetitor = (io, socket) => {
    socket.in(socket.socketRoomName).broadcast.emit('server-enable-your-turn');
}

const updateBoard = (io, socket, data) => {
    // Player_1 default is 'X'
    if (!socket.adapter.rooms[socket.socketRoomName]) {
        return;
    }
    if (socket.adapter.rooms[socket.socketRoomName].currentBoard[data.x][data.y] === undefined) {
        socket.adapter.rooms[socket.socketRoomName].lastBoard = socket.adapter.rooms[socket.socketRoomName].currentBoard;

        if (socket.socketUserId === socket.adapter.rooms[socket.socketRoomName].idPlayer1) {
            socket.adapter.rooms[socket.socketRoomName].currentBoard[data.x][data.y] = 'X';
        } else {
            socket.adapter.rooms[socket.socketRoomName].currentBoard[data.x][data.y] = 'O';
        }
        sendNextTurnToCompetitor(io, socket);
        io.sockets.in(socket.socketRoomName).emit('server-send-new-message', socket.socketUserName + ' đánh: ' + data.x + ';' + data.y);
    }
    else{
        socket.emit('do-not-cheat-this-game');
    }
}

const setPlayerStayIsWinner = async (io, socket) => {
    console.log(socket.socketUserName + ' disconnect.');

    // If player has join a room
    if (socket.socketRoomName) {

        var playerExit = socket.socketUserId;
        var roomId = socket.socketRoomId;
        var room = await Room.findById(roomId);

        if (room) {
            room.winner = playerExit == room.player_1 ? room.player_2 : room.player_1;
            room.status = 'end';
            room.save();
        }

        socket.in(socket.socketRoomName).broadcast.emit('competitor-exit-you-are-winner');
        clearRoom(io, socket.socketRoomName);
    }
}

const setCompetitor = async (io, socket) => {
    // If player has join a room
    if (socket.socketRoomName) {

        var playerSurrender = socket.socketUserId;
        var roomId = socket.socketRoomId;
        var room = await Room.findById(roomId);

        if (room) {
            room.winner = playerSurrender == room.player_1 ? room.player_2 : room.player_1;
            room.status = 'end';
            room.save();
        }

        socket.in(socket.socketRoomName).broadcast.emit('competitor-surrender-you-are-winner');
        clearRoom(io, socket.socketRoomName);
    }
}

const endTheGameWithoutWinner = async (io, socket, data) => {
    if (data === 'yes') {
        var room = await Room.findById(socket.socketRoomId);

        if (room) {
            room.status = 'end';
            room.save();
        }

        io.sockets.in(socket.socketRoomName).emit('server-send-new-message', 'This game was end without winner');

        clearRoom(io, socket.socketRoomName);
    }
}

const sendDrawRequestToCompetitor = (io, socket) => {
    socket.in(socket.socketRoomName).broadcast.emit('competitor-want-a-draw-game', socket.socketUserName);
}

module.exports = { startGame, updateBoard, setPlayerStayIsWinner, sendDrawRequestToCompetitor, endTheGameWithoutWinner, setCompetitor }