const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config/config');
const routes = require('./api');
const passport = require('./config/passport.config');
const mongoose = require('mongoose');
var cookieParser = require('cookie-parser');
var cors = require('cors');

const app = express();

app.use(cors());

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

app.use(config.api.prefix, routes());

app.use(cookieParser());

// Connecting to the database
mongoose
  .connect(config.databaseURL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('Successfully connected to the database');
  })
  .catch(err => {
    console.log('Could not connect to the database. Exiting now...', err);
    process.exit();
  });

app.use(passport.initialize());
  
app.listen(config.port, err => {
  if (err) {
    console.log(err);
    process.exit(1);
    return;
  }
  console.log('App running at port: ' + config.port);
});
