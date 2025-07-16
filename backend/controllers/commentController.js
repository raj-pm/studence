const db = require('../utils/db');

exports.addComment = async (req, res) => {
  const { post_id, name, content } = req.body;

  try {
    // Insert the comment
    const newComment = await db.query(
      'INSERT INTO comments (post_id, name, content) VALUES ($1, $2, $3) RETURNING *',
      [post_id, name, content]
    );

    // Get the post author to notify
    const postResult = await db.query('SELECT name FROM posts WHERE id = $1', [post_id]);
    const postAuthor = postResult.rows[0]?.name;

    // Don't notify if the commenter is the same as the post author
    if (postAuthor && postAuthor !== name) {
      await db.query(
        'INSERT INTO notifications (user_name, post_id, comment_id) VALUES ($1, $2, $3)',
        [postAuthor, post_id, newComment.rows[0].id]
      );
    }

    res.status(201).json(newComment.rows[0]);
  } catch (err) {
    console.error('❌ Error adding comment:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};


exports.getCommentsByPostId = async (req, res) => {
  const { postId } = req.params;
  try {
    const result = await db.query(
      'SELECT * FROM comments WHERE post_id = $1 ORDER BY date ASC',
      [postId]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching comments:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};
