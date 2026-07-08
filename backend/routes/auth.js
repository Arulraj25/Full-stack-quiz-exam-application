const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Helper to get pool
function getPool(req) {
  return req.app.locals.pool;
}

// Helper to check DB ready
function isDbReady(req) {
  return req.app.locals.dbReady || false;
}

router.post('/register', async (req, res) => {
  const pool = getPool(req);
  const { name, email, password } = req.body;

  // ✅ Validate input
  if (!name || !email || !password) {
    return res.status(400).json({ 
      success: false,
      message: 'All fields required' 
    });
  }

  // ✅ Check database readiness
  if (!isDbReady(req)) {
    return res.status(503).json({
      success: false,
      message: 'Database is initializing. Please wait a moment and try again.'
    });
  }

  try {
    // Check if user exists
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ 
        success: false,
        message: 'Email already registered' 
      });
    }

    // Hash password and create user
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, hash, 'student']
    );

    // Generate JWT
    const token = jwt.sign(
      { id: result.insertId, email, role: 'student', name },
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_this',
      { expiresIn: '24h' }
    );

    console.log(`✅ User registered: ${email}`);
    res.status(201).json({ 
      success: true,
      message: 'Registration successful',
      token, 
      user: { 
        id: result.insertId, 
        name, 
        email, 
        role: 'student' 
      }
    });
  } catch (err) {
    console.error('❌ Registration error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Registration failed', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

router.post('/login', async (req, res) => {
  const pool = getPool(req);
  const { email, password } = req.body;

  // ✅ Validate input
  if (!email || !password) {
    return res.status(400).json({ 
      success: false,
      message: 'Email and password required' 
    });
  }

  // ✅ Check database readiness
  if (!isDbReady(req)) {
    return res.status(503).json({
      success: false,
      message: 'Database is initializing. Please wait a moment and try again.'
    });
  }

  try {
    // Find user
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    
    if (rows.length === 0) {
      console.log(`❌ Login failed: User not found - ${email}`);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    const user = rows[0];
    
    // Check password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      console.log(`❌ Login failed: Wrong password - ${email}`);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_this',
      { expiresIn: '24h' }
    );

    console.log(`✅ User logged in: ${email}`);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      }
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Login failed', 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

module.exports = router;