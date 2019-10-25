var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const UserModel = require('../models/user.model');
const passport = require('../passport');

router.post('/register', async function(req, res, next) {
  const hash = await bcrypt.hash(req.body.password, 10).catch(reason => {
    return res.status(500).json(reason);
  });
  const user = new UserModel({ ...req.body, password: hash });

  await user.save().catch(reason => {
    return res.status(500).json(reason);
  });

  return res.status(201).send(
    user.toJSON({
      transform: (doc, ret) => {
        delete ret['_id'];
        delete ret['password'];
        return ret;
      }
    })
  );
  return;
});

router.post('/login', function(req, res, next) {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(403).json({
        message: info ? info.message : 'Login failed'
      });
    }

    req.login(user, { session: false }, err => {
      if (err) {
        console.log(err);
        return res.send(err);
      }

      console.log('login successfull!!!');
      const token = jwt.sign(user.toJSON(), 'your_jwt_secret');
      return res.json({ user, token });
    });
  })(req, res);
});

module.exports = router;
