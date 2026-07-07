const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'quizuser',
  password: process.env.DB_PASSWORD || 'quizpassword',
  database: process.env.DB_NAME || 'quiz_portal',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.locals.pool = pool;

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
})();

app.use('/api/auth', require('./routes/auth'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/attempts', require('./routes/attempts'));

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'quiz-backend',
    database: process.env.DB_NAME || 'quiz_portal'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Quiz Portal API is running',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      quizzes: '/api/quizzes',
      questions: '/api/questions',
      attempts: '/api/attempts'
    }
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    success: false,
    message: 'Server error', 
    error: err.message 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Using database: ${process.env.DB_NAME || 'quiz_portal'}`);
});
