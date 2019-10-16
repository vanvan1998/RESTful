const passport = require('passport');
const passportJWT = require('passport-jwt');
const bcrypt = require('bcrypt');

const ExtractJWT = passportJWT.ExtractJwt;

const LocalStrategy = require('passport-local').Strategy;
const JWTStrategy = passportJWT.Strategy;const User = require('./models/user.model');
const UserModel = require('./models/user.model');



passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
    User.findOne({ email: email.toLowerCase() }, (err, user) => {
        if (!user) {
            return done(null, false, { msg: `Email ${email} not found.` });
        }
        bcrypt.compare(password, user.password, function (err, isMatch) {
            console.log(isMatch);
            if (err) return done(err, null);
            if (isMatch) {
                return done(null, user);
            }
            return done(null, false, { msg: 'Invalid email or password.' });
          });
    });
}));

passport.use(
	new JWTStrategy(
		{
			jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
			secretOrKey: 'your_jwt_secret',
		},
		async function(jwtPayload, callback) {
			console.log(jwtPayload);
			const user = await UserModel.findById(jwtPayload._id, {
				name: 1,
				email: 1,
			}).catch(reason => {
				return callback(reason);
			});

			if (user !== null) {
				const tmp = user.toObject();
				delete tmp._id;

				return callback(null, tmp);
			} else {
				callback({
					message: 'Cannot found user!!!',
				});
			}
		}
	)
);

module.exports = passport;
