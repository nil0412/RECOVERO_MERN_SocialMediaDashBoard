// controllers/comments.js
const Comment = require('../models/Comment');

// Controller functions for Comments
module.exports = {
  // Create a new comment
  createComment: (req, res) => {
    const newComment = new Comment({
      user: req.user.id,
      post: req.body.postId,
      text: req.body.text,
    });

    newComment.save().then(comment => res.json(comment));
  },

  // Get all comments for a post
  getCommentsByPostId: (req, res) => {
    Comment.find({ post: req.params.postId })
      .populate('user', ['username'])
      .exec((err, comments) => {
        if (err) {
          return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(comments);
      });
  },

  // Implement other CRUD operations for comments
};
