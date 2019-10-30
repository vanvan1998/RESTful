const dotenv = require('dotenv');

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const envFound = dotenv.config();

if (!envFound) {
    throw new Error("Couldn't find .env file");
}

var port = parseInt(process.env.PORT, 10);

var databaseURL = process.env.MONGODB_URI;

var jwtSecret = process.env.JWT_SECRET;

var api = {
    prefix: '/api'
}

var saltRounds = 10;

var FACEBOOK = {
    FACEBOOK_APP_ID: '2288576654580785',
    FACEBOOK_APP_SECRET: 'a43cb544f1e98a79db9c335ed8ee129d',
    CALLBACK_URL : 'http://localhost:3000/api/auth/facebook/callback'
}

module.exports = {port, databaseURL, jwtSecret, api, saltRounds, FACEBOOK};