const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('../passport/passport');
const User = require('../user/user.model');
const config = require('../config/config');

module.exports = (app) => {
    app.use('/users', router);

    router.get('/me', passport.authenticate('jwt', { session: false }), (req, res) => {
        return res.status(200).json(req.user);
    });

    router.post('/update', passport.authenticate('jwt', { session: false }), (req, res) => {
        if (req.body.newPassword == '') {
            return res.status(401).json({ message: 'Password is empty' });
        }
        if (req.body.newPassword.length < 6) {
            return res.status(401).json({ message: 'Passwords must be at least 6 characters' });
        }
        if (req.body.newPassword != req.body.confirmNewPassword) {
            return res.status(401).json({ message: 'New password and confirm password is not match' });
        }
        bcrypt.hash(req.body.newPassword, config.saltRounds, (err, hash) => {
            var UpdateUser = {
                $set: {
                    name: req.body.name,
                    email: req.body.email,
                    dateOfBirth: req.body.dateOfBirth,
                    sex: req.body.sex,
                    password: hash
                }
            };
            User.findByIdAndUpdate({ _id: req.body._id }, UpdateUser, (err, user) => {
                if (err) {
                    return res.status(500).json(err);
                }
                if (!user){
                    return res.status(404).json({message: 'Not found user: ' + req.body._id});
                }
                res.status(200).json({ message: 'Update user: ' + user.username + ' success' });
            });
        });
    });
};