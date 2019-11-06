const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config/config');
const routes = require('./api');
const passport = require('./passport/passport');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { sendMessages } = require('./game/chat/chat');
const { init, createNewRoom, joinRandomRoom } = require('./game/room/room');
const { verifyMove, sendDrawRequestToCompetitor, endTheGameWithoutWinner, setCompetitorIsWinner } = require('./game/game');

const PORT = process.env.PORT || config.port;
const app = express();

app.use('/uploads', express.static('uploads'));

app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

app.use(config.api.prefix, routes());

app.use(cookieParser());

app.use(passport.initialize());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

mongoose.connect(config.databaseURL, {
    useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false, useUnifiedTopology: true
}).then(() => {
    console.log("Successfully connected to the database");
}).catch(err => {
    console.log('Could not connect to the database. Exiting now...', err);
    process.exit();
});

const server = app.listen(PORT, err => {
    if (err) {
        console.log(err);
        process.exit(1);
        return;
    }
    console.log('App running at port: ' + PORT);
});

const io = require('socket.io').listen(server);

io.on('connection', socket => {

    socket.emit('server-request-client-init-info');

    socket.on('client-send-init-info', info => init(socket, info));

    socket.on('client-send-message', message => sendMessages(io, socket, message));

    socket.on('client-create-new-room', () => createNewRoom(io, socket));

    socket.on('client-play-now', () => joinRandomRoom(io, socket));

    socket.on('client-send-move', move => verifyMove(io, socket, move));

    socket.on('client-leave-room', () => socket.leaveAll());

    socket.on('client-answer-draw-game', answer => endTheGameWithoutWinner(io, socket, answer));

    socket.on('client-ask-draw-game', () => sendDrawRequestToCompetitor(io, socket));

    socket.on('client-surrender', () => setCompetitorIsWinner(io, socket, 'surrender'));

    socket.on('client-exit-game', () => setCompetitorIsWinner(io, socket, 'exit'));

    socket.on('client-lose-game', () => setCompetitorIsWinner(io, socket, 'lose'));

    socket.on('disconnect', () => setCompetitorIsWinner(io, socket, 'disconnect'));
})