// routes/comments.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const Comment = require('../models/Comment');

// Create a new comment
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const newComment = new Comment({
      user: req.user.id,
      post: req.body.postId,
      text: req.body.text,
    });

    newComment.save().then(comment => res.json(comment));
  }
);

// Get all comments for a post
router.get('/:postId', (req, res) => {
  Comment.find({ post: req.params.postId })
    .populate('user', ['username'])
    .exec((err, comments) => {
      if (err) {
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.json(comments);
    });
});

// Implement other CRUD operations for comments

module.exports = router;
