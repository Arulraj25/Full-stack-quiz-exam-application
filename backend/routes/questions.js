const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const router = express.Router();

// GET /api/questions/quiz/:quizId - get all questions for a quiz (admin only, or with attempt)
router.get('/quiz/:quizId', authenticate, async (req, res) => {
  const pool = req.app.locals.pool;
  const { quizId } = req.params;

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM questions WHERE quiz_id = ? ORDER BY id',
      [quizId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch questions', error: err.message });
  }
});

// POST /api/questions - add question (admin only)
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  const pool = req.app.locals.pool;
  const { quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option } = req.body;

  if (!quiz_id || !question_text || !option_a || !option_b || !option_c || !option_d || !correct_option) {
    return res.status(400).json({ message: 'All fields required' });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option]
    );
    res.status(201).json({ id: result.insertId, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add question', error: err.message });
  }
});

// PUT /api/questions/:id - update question (admin only)
router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  const pool = req.app.locals.pool;
  const { id } = req.params;
  const { question_text, option_a, option_b, option_c, option_d, correct_option } = req.body;

  try {
    await pool.execute(
      'UPDATE questions SET question_text = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_option = ? WHERE id = ?',
      [question_text, option_a, option_b, option_c, option_d, correct_option, id]
    );
    res.json({ message: 'Question updated' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update question', error: err.message });
  }
});

// DELETE /api/questions/:id - delete question (admin only)
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  const pool = req.app.locals.pool;
  const { id } = req.params;

  try {
    await pool.execute('DELETE FROM questions WHERE id = ?', [id]);
    res.json({ message: 'Question deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete question', error: err.message });
  }
});

module.exports = router;
