const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const router = express.Router();

// GET /api/quizzes - list all quizzes (any authenticated user)
router.get('/', authenticate, async (req, res) => {
  const pool = req.app.locals.pool;
  try {
    const [rows] = await pool.execute('SELECT * FROM quizzes ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch quizzes', error: err.message });
  }
});

// GET /api/quizzes/:id - get quiz with questions
router.get('/:id', authenticate, async (req, res) => {
  const pool = req.app.locals.pool;
  const { id } = req.params;
  try {
    const [[quiz]] = await pool.execute('SELECT * FROM quizzes WHERE id = ?', [id]);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const [questions] = await pool.execute(
      'SELECT id, question_text, option_a, option_b, option_c, option_d FROM questions WHERE quiz_id = ?',
      [id]
    );

    res.json({ ...quiz, questions });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch quiz', error: err.message });
  }
});

// POST /api/quizzes - create quiz (admin only)
router.post('/', authenticate, requireRole('admin'), async (req, res) => {
  const pool = req.app.locals.pool;
  const { title, subject } = req.body;

  if (!title || !subject) {
    return res.status(400).json({ message: 'Title and subject required' });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO quizzes (title, subject) VALUES (?, ?)',
      [title, subject]
    );
    res.status(201).json({ id: result.insertId, title, subject });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create quiz', error: err.message });
  }
});

// PUT /api/quizzes/:id - update quiz (admin only)
router.put('/:id', authenticate, requireRole('admin'), async (req, res) => {
  const pool = req.app.locals.pool;
  const { id } = req.params;
  const { title, subject } = req.body;

  try {
    await pool.execute('UPDATE quizzes SET title = ?, subject = ? WHERE id = ?', [title, subject, id]);
    res.json({ message: 'Quiz updated' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update quiz', error: err.message });
  }
});

// DELETE /api/quizzes/:id - delete quiz (admin only)
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  const pool = req.app.locals.pool;
  const { id } = req.params;

  try {
    await pool.execute('DELETE FROM quizzes WHERE id = ?', [id]);
    res.json({ message: 'Quiz deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete quiz', error: err.message });
  }
});

module.exports = router;
