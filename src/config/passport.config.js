const passport = require('passport');
const bcrypt = require('bcrypt');
const config = require('../config/config');
const User = require('../user/user.model');

const passportJWT = require('passport-jwt');
const JwtStrategy = require('passport-jwt').Strategy;
const LocalStrategy = require('passport-local').Strategy;

var jwtOptions = {};
jwtOptions.jwtFromRequest = passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken();
jwtOptions.secretOrKey = config.jwtSecret;

passport.use(new LocalStrategy((username, password, done) => {
	User.findOne({ username: username }, (err, user) => {
		if (err) { return done(err); }
		if (!user) {
			return done(null, false, { message: 'Incorrect username.' });
		}
		bcrypt.compare(password, user.password, (err, isMatch) => {
			if (err) return done(err, null);
			if (isMatch) {
				return done(null, user);
			}
			return done(null, false, { message: 'Incorrect username or password.' });
		});
	});
}));

passport.use(new JwtStrategy(jwtOptions, (jwt_payload, next) => {
	User.findById(jwt_payload._id, (err, user) => {
		if (err) { return next(err); }
		if (!user) {
			return next(null, false);
		}
		const userModified = user.toObject();
		delete userModified.password;
		next(null, userModified);
	});
}));

module.exports = passport;