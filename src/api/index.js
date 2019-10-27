const express = require('express');
const user = require('../user/user.routes');
const auth = require('../auth/auth.routes');

module.exports = () => {
    const route = express.Router();

    user(route);
    auth(route);

	return route;
}