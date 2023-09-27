const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy,
	ExtractJwt = require("passport-jwt").ExtractJwt;
const User = require("../src/models/User");

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.JWT_SECRET;

// Used by the authenticated requests to deserialize the user,
// i.e., to fetch user details from the JWT.
passport.use(
	new JwtStrategy(opts, function (jwt_payload, done) {
		const userQuery = User.findOne({ _id: jwt_payload._id });
		userQuery
			.exec()
			.then((user) => {
				if (user) {
					return done(null, user);
				} else {
					return done(null, false);
				}
			})
			.catch((err) => {
				return done(null, false);
			});
	})
);
