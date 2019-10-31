const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config/config');
const routes = require('./api');
const passport = require('./config/passport.config');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT||config.port;

app.use('/uploads', express.static('uploads'));

app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

app.use(config.api.prefix, routes());

app.use(cookieParser());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "YOUR-DOMAIN.TLD");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Connecting to the database
mongoose.connect(config.databaseURL, {
    useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false, useUnifiedTopology: true
}).then(() => {
    console.log("Successfully connected to the database");
}).catch(err => {
    console.log('Could not connect to the database. Exiting now...', err);
    process.exit();
});

app.use(passport.initialize());

app.use('/', (req, res)=>{
    res.sendFile(__dirname + '/index.html');
})

app.listen(PORT, err => {
    if (err) {
        console.log(err);
        process.exit(1);
        return;
    }
    console.log('App running at port: ' + PORT);
});