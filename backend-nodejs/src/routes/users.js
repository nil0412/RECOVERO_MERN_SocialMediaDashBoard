const express = require("express");
const router = express.Router();
const passport = require("passport");
const CircularJSON = require('circular-json');

const userController = require('../controllers/userController');
const { verifyUser } = require("../../authenticate");

router.post("/signup", userController.register);
router.post("/login",  userController.login);
router.get("/logout", passport.authenticate("jwt", { session: false }), userController.logout);
router.post("/refreshToken", userController.refreshToken);
router.post('/create-session', userController.createSession);
// logged in user details
router.get("/currentUser", passport.authenticate("jwt", { session: false }), userController.currentUser);
router.get('/getUser/:userId', passport.authenticate("jwt", { session: false }), userController.getUserById);
router.get('/search', passport.authenticate("jwt", { session: false }), userController.searchUserByText);

module.exports = router;
