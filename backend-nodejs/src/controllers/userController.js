const passport = require("passport");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
// const User = require('../models/user');
const Friendship = require("../models/friendship");
const fs = require("fs");
const path = require("path");
const {
	getToken,
	COOKIE_OPTIONS,
	getRefreshToken,
} = require("../../authenticate");

exports.register = async (req, res, next) => {
	try {
		const { name, email, password, confirmPassword } = req.body;

		// Check if the email is already registered
		const existingUser = await User.findOne({ email: email });

		if (existingUser) {
			res.statusCode = 400;
			res.send({
				name: "DuplicateEmailError",
				error: "Email already in use",
			});
		} else {
			// Hash the password
			if (!password) {
				res.statusCode = 500;
				res.send({
					name: "PasswordUndefined",
					error: "Password is Undefined",
				});
				return;
			}
			const hashedPassword = bcrypt.hashSync(password, 10);

			User.register(
				new User({ name, email, password: hashedPassword }),
				password,
				async (err, user) => {
					if (err) {
						console.log("Error: ", err);
						res.statusCode = 500;
						res.send(err);
					} else {
						const token = getToken({ _id: user._id });
						const refreshToken = getRefreshToken({ _id: user._id });
						user.refreshToken.push({ refreshToken });
						try {
							user.save();

							res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
							res.send({ success: true, token });
						} catch {
							res.statusCode = 500;
							res.send({
								name: "ServerError",
								error: err,
							});
						}
					}
				}
			);
		}
	} catch (error) {
		console.error(error);
		res.statusCode = 500;
		res.send({
			name: "ServerError",
			error: "Server Error",
		});
	}
};

exports.searchUserByText = async (req, res) => {
	if (req.user) {
	  // User is authenticated; continue to the protected route
	  try {
		const searchText = req.query.text; // Get the search text from the query parameter 'text'
  
		// Use a regular expression to perform a case-insensitive search
		const users = await User.find({
		  $or: [
			{ name: { $regex: searchText, $options: "i" } }, // Search in the 'name' field
			{ email: { $regex: searchText, $options: "i" } }, // Search in the 'email' field
			// Add more fields as needed
		  ],
		});
		res.status(200).json(users);
	  } catch (error) {
		console.error('Error From searchUserByText: ', error);
		res.status(500).json({ error: "Internal server error" + error });
	  }
	} else {
	  // JWT verification failed; send a custom error response
	  res.status(401).json({ message: "Unauthorized" });
	}
  };
  

exports.login = async (req, res, next) => {
	passport.authenticate("local", (err, user, info) => {
		if (err) {
			// Handle unexpected errors
			return res.status(500).json({ error: "Server error" });
		}
		if (!user) {
			// Authentication failed (user not found or incorrect password)
			return res.status(401).json({ message: info.message });
		}

		// If authentication is successful, log in the user
		req.logIn(user, (err) => {
			if (err) {
				// Handle login error
				return res.status(500).json({ error: "Login error" });
			}

			const token = getToken({ _id: user._id });
			const refreshToken = getRefreshToken({ _id: user._id });
			user.refreshToken.push({ refreshToken });
			try {
				user.save();

				res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
				res.send({ success: true, token, user });
			} catch (err) {
				res.statusCode = 500;
				res.send(err);
			}
		});
	})(req, res, next);
};

exports.currentUser = async (req, res, next) => {
	if (req.user) {
		// User is authenticated; continue to the protected route
		try {
			res.json({ user: req.user });
		} catch (err) {
			console.error(err);
			res.status(500).json({ message: "Internal server error" });
		}
		next();
	} else {
		// JWT verification failed; send a custom error response
		res.status(401).json({ message: "Unauthorized" });
	}
};

exports.logout = async (req, res, next) => {
	if (req.user) {
		// User is authenticated; continue to the protected route
		try {
			const { signedCookies = {} } = req;
			const { refreshToken } = signedCookies;
			req.user.exec().then((user) => {
				const tokenIndex = user.refreshToken.findIndex(
					(item) => item.refreshToken === refreshToken
				);

				if (tokenIndex !== -1) {
					// user.refreshToken.id(user.refreshToken[tokenIndex]._id).remove();

					try {
						// Remove the refreshToken from the array
						user.refreshToken.splice(tokenIndex, 1);

						user.save();

						res.clearCookie("refreshToken", COOKIE_OPTIONS);
						res.json({
							success: true,
							message: "Refresh token removed successfully",
						});
					} catch (err) {
						res.statusCode = 500;
						res.json({ message: "Error saving user", Error: err });
					}
				} else {
					res.json({
						success: true,
						message: "Refresh token does not exists",
					});
				}
			});
		} catch (err) {
			res.statusCode = 400;
			res.send(err);
		}
		next();
	} else {
		// JWT verification failed; send a custom error response
		res.status(401).json({ message: "Unauthorized" });
	}
};

exports.getUserById = async (req, res, next) => {
	if (req.user) {
	  // User is authenticated; continue to the protected route
	  try {
		// Access the userId parameter from the URL
		const userId = req.params.userId;
  
		// Query the database or your data source to find the user by userId
		const user = await User.find({ _id: userId });
  
		// Check if the user was found
		if (user.length === 0) {
		  res.status(404).json({ message: "User not found" });
		} else {
		  // Send a JSON response with the user data
		  res.status(200).json({user : user[0]}); // Send the first (and presumably only) user found
		}
	  } catch (error) {
		// Handle any errors that occur during the database query or other operations
		console.error("Error getUserById: ", error);
		res.status(500).json({ message: "Internal server error" });
	  }
	  next();
	} else {
	  // JWT verification failed; send a custom error response
	  res.status(401).json({ message: "Unauthorized" });
	}
  };

exports.refreshToken = async (req, res, next) => {
	const { signedCookies = {} } = req;
	const { refreshToken } = signedCookies;

	if (refreshToken) {
		try {
			const payload = jwt.verify(
				refreshToken,
				process.env.REFRESH_TOKEN_SECRET
			);
			const userId = payload._id;
			User.findOne({ _id: userId }).then(
				(user) => {
					if (user) {
						// Find the refresh token against the user record in database
						const tokenIndex = user.refreshToken.findIndex(
							(item) => item.refreshToken === refreshToken
						);

						if (tokenIndex === -1) {
							res.statusCode = 401;
							res.send("Unauthorized");
						} else {
							const token = getToken({ _id: userId });
							// If the refresh token exists, then create new one and replace it.
							const newRefreshToken = getRefreshToken({ _id: userId });
							user.refreshToken[tokenIndex] = { refreshToken: newRefreshToken };
							try {
								user.save();

								res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
								res.send({ success: true, token });
							} catch (err) {
								res.statusCode = 500;
								res.send(err);
							}
						}
					} else {
						res.statusCode = 401;
						res.send("Unauthorized");
					}
				},
				(err) => next(err)
			);
		} catch (err) {
			res.statusCode = 401;
			res.send("Unauthorized");
		}
	} else {
		res.statusCode = 401;
		res.send("Unauthorized");
	}
};

// let's keep it same as before
module.exports.profile = function (req, res) {
	User.findById(req.params.id, async function (err, user) {
		try {
			let to_user = await User.findById(req.params.id);
			let from_user = await User.findById(req.user.id);

			let isFriend = false;

			let existingFriendship_1 = await Friendship.findOne({
				from_user: from_user,
				to_user: to_user,
			});

			let existingFriendship_2 = await Friendship.findOne({
				from_user: to_user,
				to_user: from_user,
			});

			if (existingFriendship_1 || existingFriendship_2) {
				isFriend = true;
			}
			if (isFriend) {
				return res.render("user_profile_remove", {
					title: "User Profile",
					profile_user: user,
				});
			} else {
				return res.render("user_profile_add", {
					title: "User Profile",
					profile_user: user,
				});
			}
		} catch (err) {
			console.log(err);
			return res.redirect("back");
		}
	});
};

module.exports.update = async function (req, res) {
	if (req.user.id == req.params.id) {
		try {
			let user = await User.findById(req.params.id);
			User.uploadedAvatar(req, res, function (err) {
				if (err) {
					console.log("*****Multer Error", err);
				}

				user.name = req.body.name;
				user.email = req.body.email;

				if (req.file) {
					if (user.avatar) {
						fs.unlinkSync(path.join(__dirname, "..", user.avatar));
					}

					//this is saving the path of uploaded file in the avatar field in the user
					user.avatar = User.avatarPath + "/" + req.file.filename;
				}

				user.save();
				return res.redirect("back");
			});
		} catch {
			req.flash("error", err);
			return res.redirect("back");
		}
	} else {
		req.flash("error", "Unauthorized!");
		return res.status(401).send("Unauthorized");
	}
};

// render the sign up page
module.exports.signUp = function (req, res) {
	if (req.isAuthenticated()) {
		return res.redirect("/users/profile");
	}

	return res.render("user_sign_up", {
		title: "Codeial | Sign Up",
	});
};

// render the sign in page
module.exports.signIn = function (req, res) {
	if (req.isAuthenticated()) {
		return res.redirect("/users/profile");
	}
	return res.render("user_sign_in", {
		title: "Codeial | Sign In",
	});
};

// get the sign up data
module.exports.create = function (req, res) {
	if (req.body.password != req.body.confirm_password) {
		req.flash("error", "Passwords do not match");
		return res.redirect("back");
	}

	User.findOne({ email: req.body.email }, function (err, user) {
		if (err) {
			req.flash("error", err);
			return;
		}

		if (!user) {
			User.create(req.body, function (err, user) {
				if (err) {
					req.flash("error", err);
					return;
				}

				return res.redirect("/users/sign-in");
			});
		} else {
			req.flash("success", "You have signed up, login to continue!");
			return res.redirect("back");
		}
	});
};

module.exports.createSession = async function (req, res) {
	try {
		let user = await User.findOne({ email: req.body.email });

		if (!user || user.password !== req.body.password) {
			return res.json(422, {
				message: "Invalid username or password",
			});
		}

		return res.json(200, {
			message: "Sign-in successful, here is your token, please keep it safe",
			data: {
				token: jwt.sign(user.toJSON(), env.jwt_secret, { expiresIn: "100000" }),
			},
		});
	} catch (err) {
		console.log("**********", err);
		return res.json(500, {
			message: "Internal Server Error",
		});
	}
};
//sign out action
module.exports.destroySession = function (req, res) {
	//this function is provided by passport.js
	req.logout(function (err) {
		if (err) {
			console.log("Error in logout --> Passport");
		}
	});

	//flash meaage on sign-out
	req.flash("success", "You have logged out!");

	return res.redirect("/");
};
