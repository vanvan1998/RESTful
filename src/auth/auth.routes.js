const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('../passport/passport');
const User = require('../user/user.model');
const config = require('../config/config');
const fetch = require('node-fetch');
const querystring = require('querystring');

const clientId = '515923430857-91lh880df1vo0ssqvk91ooup3dpsg5or.apps.googleusercontent.com'
const clientSecret = 'dFzYFYV8uxW4PwzdLJN4LjZG'

module.exports = (app) => {
    app.use('/auth', router);

    router.post('/login-with-facebook', async (req, res) => {
        const { accessToken, userID } = req.body

        const response = await fetch(`https://graph.facebook.com/v5.0/me?access_token=${accessToken}&fields=name%2C%20email&method=get&pretty=0&sdk=joey&suppress_http_code=1`);
        const json = await response.json();

        if (json.id === userID) {
            existUser = await User.findOne({ facebookId: userID });
            if (existUser) {
                const userModified = existUser.toObject();
                const token = jwt.sign(userModified, config.jwtSecret, { expiresIn: '7d' });
                return res.status(200).json({ userModified, token });
            }
            const newUser = new User({
                name: json.name,
                facebookId: json.id,
                email: json.email
            });
            newUser.save((err, user) => {
                if (err) { return res.status(500).json(err) }
                const userModified = user.toObject();
                const token = jwt.sign(userModified, config.jwtSecret, { expiresIn: '7d' });
                return res.status(201).json({ userModified, token });
            });
        } else {
            res.status(403).json({ message: 'Fake information' });
        }
    });

    router.get('/login-with-google', async (req, res) => {
        const tokenResponse = await fetch(
            `https://www.googleapis.com/oauth2/v4/token`,
            {
                method: 'POST',
                body: JSON.stringify({
                    code: req.query.code,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: 'http://localhost:3000/api/auth/login-with-google',
                    grant_type: 'authorization_code'
                })
            }
        )
        const tokenJson = await tokenResponse.json();
        const userInfo = await getUserInfo(tokenJson.access_token);

        if (userInfo) {
            existUser = await User.findOne({ googleId: userInfo.id });
            if (existUser) {
                const userModified = existUser.toObject();
                const token = jwt.sign(userModified, config.jwtSecret, { expiresIn: '7d' });
                //return res.status(200).json({ userModified, token });

                const query = querystring.stringify({
                    "name": userModified.name,
                    "googleId": userModified.googleId,
                    "email": userModified.email,
                    "userImage": userModified.userImage,
                    "token": token
                });
                //return res.redirect(`http://localhost:3000?${Object.keys(userInfo).map(key => `${key}=${encodeURIComponent(userInfo[key])}`).join('&')}`)

                return res.redirect('http://localhost:3000?' + query);
            }
            const newUser = new User({
                name: userInfo.name,
                googleId: userInfo.id,
                email: userInfo.email,
                userImage: userInfo.picture
            });
            newUser.save((err, user) => {
                if (err) { return res.status(500).json(err) }
                const userModified = user.toObject();
                const token = jwt.sign(userModified, config.jwtSecret, { expiresIn: '7d' });
                //return res.status(201).json({ userModified, token });

                const query = querystring.stringify({
                    "a": 1,
                    "b": 2,
                    "valid": "your string here"
                });
                return res.redirect('http://localhost:3000?' + query);

                //res.redirect(`http://localhost:3000?${Object.keys(user).map(key => `${key}=${encodeURIComponent(user[key])}`).join('&')}`)
            });
        }

    });

    async function getUserInfo(accessToken) {
        const response = await fetch(
            `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${accessToken}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )
        const json = await response.json();
        return json;
    }

    router.post('/register', (req, res) => {
        if (req.body.password == '') {
            return res.status(401).json({ message: 'Password is empty' });
        }
        if (req.body.password.length < 6) {
            return res
                .status(401)
                .json({ message: 'Passwords must be at least 6 characters' });
        }
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
                const token = jwt.sign(userModified, config.jwtSecret, { expiresIn: '7d' });
                return res.json({ userModified, token });
            });
        })(req, res);
    });
};