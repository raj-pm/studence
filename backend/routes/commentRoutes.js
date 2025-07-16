const express = require('express');
const { addComment, getCommentsByPostId } = require('../controllers/commentController');

const router = express.Router();

router.post('/comments', addComment);
router.get('/comments/:postId', getCommentsByPostId);

module.exports = router;
