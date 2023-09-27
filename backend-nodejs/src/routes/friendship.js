const express = require('express');
const router = express.Router();
const frienshipController = require('../controllers/friendship_controller');

// router.get('/add/:id', frienshipController.add);
router.post('/create_friendship', frienshipController.add);
router.get('/remove/:id', frienshipController.remove);
router.get('/fetch_user_friends', frienshipController.fetchUserFriends);

module.exports = router;