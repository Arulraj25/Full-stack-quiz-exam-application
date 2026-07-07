const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const router = express.Router();

// POST /api/attempts/start - start a quiz attempt
router.post('/start', authenticate, requireRole('student'), async (req, res) => {
  const pool = req.app.locals.pool;
  const { quiz_id } = req.body;
  const user_id = req.user.id;

  try {
    // Check if already has an active attempt
    const [existing] = await pool.execute(
      'SELECT id FROM attempts WHERE user_id = ? AND quiz_id = ? AND submitted_at IS NULL',
      [user_id, quiz_id]
    );

    if (existing.length > 0) {
      return res.json({ attempt_id: existing[0].id, message: 'Resuming existing attempt' });
    }

    const [result] = await pool.execute(
      'INSERT INTO attempts (user_id, quiz_id) VALUES (?, ?)',
      [user_id, quiz_id]
    );

    res.status(201).json({ attempt_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Failed to start attempt', error: err.message });
  }
});

// POST /api/attempts/answer - save or update an answer
router.post('/answer', authenticate, requireRole('student'), async (req, res) => {
  const pool = req.app.locals.pool;
  const { attempt_id, question_id, selected_option } = req.body;
  const user_id = req.user.id;

  try {
    // Verify attempt belongs to user and is not submitted
    const [[attempt]] = await pool.execute(
      'SELECT * FROM attempts WHERE id = ? AND user_id = ? AND submitted_at IS NULL',
      [attempt_id, user_id]
    );
    if (!attempt) return res.status(403).json({ message: 'Invalid or completed attempt' });

    // Get correct answer
    const [[question]] = await pool.execute(
      'SELECT correct_option FROM questions WHERE id = ?',
      [question_id]
    );
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const is_correct = selected_option === question.correct_option;

    // Upsert answer
    const [existing] = await pool.execute(
      'SELECT id FROM answers WHERE attempt_id = ? AND question_id = ?',
      [attempt_id, question_id]
    );

    if (existing.length > 0) {
      await pool.execute(
        'UPDATE answers SET selected_option = ?, is_correct = ? WHERE id = ?',
        [selected_option, is_correct, existing[0].id]
      );
    } else {
      await pool.execute(
        'INSERT INTO answers (attempt_id, question_id, selected_option, is_correct) VALUES (?, ?, ?, ?)',
        [attempt_id, question_id, selected_option, is_correct]
      );
    }

    res.json({ is_correct });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save answer', error: err.message });
  }
});

// POST /api/attempts/submit - submit quiz and calculate score
router.post('/submit', authenticate, requireRole('student'), async (req, res) => {
  const pool = req.app.locals.pool;
  const { attempt_id } = req.body;
  const user_id = req.user.id;

  try {
    const [[attempt]] = await pool.execute(
      'SELECT * FROM attempts WHERE id = ? AND user_id = ? AND submitted_at IS NULL',
      [attempt_id, user_id]
    );
    if (!attempt) return res.status(403).json({ message: 'Invalid or already submitted attempt' });

    // Count correct answers
    const [[result]] = await pool.execute(
      'SELECT COUNT(*) as correct FROM answers WHERE attempt_id = ? AND is_correct = true',
      [attempt_id]
    );

    // Count total questions in quiz
    const [[totalResult]] = await pool.execute(
      'SELECT COUNT(*) as total FROM questions WHERE quiz_id = ?',
      [attempt.quiz_id]
    );

    const score = result.correct;
    const total = totalResult.total;

    await pool.execute(
      'UPDATE attempts SET submitted_at = NOW(), score = ? WHERE id = ?',
      [score, attempt_id]
    );

    res.json({ score, total, percentage: total > 0 ? Math.round((score / total) * 100) : 0 });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit attempt', error: err.message });
  }
});

// GET /api/attempts/my - get current user's attempts
router.get('/my', authenticate, async (req, res) => {
  const pool = req.app.locals.pool;
  const user_id = req.user.id;

  try {
    const [rows] = await pool.execute(
      `SELECT a.*, q.title, q.subject,
        (SELECT COUNT(*) FROM questions WHERE quiz_id = a.quiz_id) as total_questions
       FROM attempts a
       JOIN quizzes q ON a.quiz_id = q.id
       WHERE a.user_id = ?
       ORDER BY a.started_at DESC`,
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch attempts', error: err.message });
  }
});

// GET /api/attempts/:id - get attempt details with answers
router.get('/:id', authenticate, async (req, res) => {
  const pool = req.app.locals.pool;
  const { id } = req.params;
  const user_id = req.user.id;
  const isAdmin = req.user.role === 'admin';

  try {
    const [[attempt]] = await pool.execute(
      `SELECT a.*, q.title, q.subject, u.name as student_name
       FROM attempts a
       JOIN quizzes q ON a.quiz_id = q.id
       JOIN users u ON a.user_id = u.id
       WHERE a.id = ?`,
      [id]
    );

    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
    if (!isAdmin && attempt.user_id !== user_id) return res.status(403).json({ message: 'Forbidden' });

    const [answers] = await pool.execute(
      `SELECT ans.*, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option
       FROM answers ans
       JOIN questions q ON ans.question_id = q.id
       WHERE ans.attempt_id = ?`,
      [id]
    );

    const [[totalQ]] = await pool.execute(
      'SELECT COUNT(*) as total FROM questions WHERE quiz_id = ?',
      [attempt.quiz_id]
    );

    res.json({ ...attempt, answers, total_questions: totalQ.total });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch attempt', error: err.message });
  }
});

// GET /api/attempts/all - admin view all attempts
router.get('/all/list', authenticate, requireRole('admin'), async (req, res) => {
  const pool = req.app.locals.pool;

  try {
    const [rows] = await pool.execute(
      `SELECT a.*, q.title, q.subject, u.name as student_name,
        (SELECT COUNT(*) FROM questions WHERE quiz_id = a.quiz_id) as total_questions
       FROM attempts a
       JOIN quizzes q ON a.quiz_id = q.id
       JOIN users u ON a.user_id = u.id
       ORDER BY a.started_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch attempts', error: err.message });
  }
});

module.exports = router;
