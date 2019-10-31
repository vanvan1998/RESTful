const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('../config/passport.config');
const User = require('../user/user.model');
const config = require('../config/config');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, 'avatar_' + req.body._id);
    }
});

const fileFilter = (req, file, cb) => {
    //reject a file
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fieldSize: 1024 * 1024 * 5 },
    fileFilter: fileFilter
});

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
                res.status(200).json({ message: 'Update user: ' + user.username + ' success' });
            });
        });
    });

    router.post('/uploadImage', upload.single('userImage'), (req, res) => {
        var UpdateUser = {
            $set: {
                userImage: '/uploads/avatar_' + req.body._id
            }
        };
        User.findByIdAndUpdate({ _id: req.body._id }, UpdateUser, (err, user) => {
            if (err) {
                return res.status(500).json({ message: 'Upload failed, please try again' });
            }
            res.status(200).json({ message: 'Upload image success' });
        });
    });
};