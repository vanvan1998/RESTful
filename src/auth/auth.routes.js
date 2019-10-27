const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('../config/passport.config');
const User = require('../user/user.model');
const config = require('../config/config');

module.exports = (app) => {
    app.use(router);

    router.post('/register', (req, res) => {
        if (req.body.password != req.body.confirmPassword) {
            return res.status(401).json({ message: 'Password and confirm password is not match' });
        }
        User.findOne({ username: req.body.username }, (err, user) => {
            if (user) {
                return res.status(401).json({ message: 'Username has already been taken' })
            }
            bcrypt.hash(req.body.password, config.saltRounds, async function (err, hash) {
                if (err) { return res.status(500).json(err); }
                const user = new User({ ...req.body, password: hash });
                user.save((err, user) => {
                    if (err) { return res.status(500).json(err) }
                    const userModified = user.toObject();
                    delete userModified.password;
                    return res.status(201).json(userModified);
                });
            });
        });
    });

    router.post('/login', (req, res) => {
        passport.authenticate('local', { session: false }, (err, user, info) => {
            if (err || !user) {
                return res.status(401).json({
                    message: info ? info.message : 'Login failed'
                });
            }

            req.login(user, { session: false }, err => {
                if (err) {
                    return res.send(err);
                }
                const userModified = user.toObject();
                delete userModified.password;
                const token = jwt.sign(userModified, config.jwtSecret);
                res.cookie('jwt', token, { expires: new Date(Date.now() + 900000), httpOnly: true });
                return res.json({ userModified, token });
            });
        })(req, res);
    });
};