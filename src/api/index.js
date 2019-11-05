const express = require('express');
const user = require('../user/user.routes');
const auth = require('../auth/auth.routes');
const upload = require('../upload/upload.routes');

module.exports = () => {
    const router = express.Router();

    user(router);
    auth(router);
    upload(router);
    
	return router;
}