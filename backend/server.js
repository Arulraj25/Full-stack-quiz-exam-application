const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'quiz_portal',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.locals.pool = pool;
app.locals.dbReady = false;

// ✅ Database connection with retry (works everywhere)
async function connectWithRetry(retries = 30, delay = 2000) {
  console.log('🔄 Waiting for MySQL to be ready...');
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const connection = await pool.getConnection();
      console.log(`✅ MySQL connected successfully! (Attempt ${attempt})`);
      connection.release();
      app.locals.dbReady = true;
      return true;
    } catch (error) {
      console.log(`⏳ Attempt ${attempt}/${retries}: MySQL not ready yet...`);
      if (attempt === retries) {
        console.error('❌ Failed to connect to MySQL after all retries');
        console.error('Error:', error.message);
        app.locals.dbReady = false;
        // Don't exit - keep server running, but mark as not ready
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// ✅ Middleware to check DB connection
app.use(async (req, res, next) => {
  // Skip DB check for health endpoint
  if (req.path === '/health') {
    return next();
  }
  
  // If DB not ready, try to reconnect
  if (!app.locals.dbReady) {
    try {
      const connection = await pool.getConnection();
      connection.release();
      app.locals.dbReady = true;
      console.log('✅ Reconnected to MySQL');
    } catch (error) {
      return res.status(503).json({
        success: false,
        message: 'Database is not ready. Please try again in a few moments.'
      });
    }
  }
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/attempts', require('./routes/attempts'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'quiz-backend',
    database: process.env.DB_NAME || 'quiz_portal',
    dbReady: app.locals.dbReady,
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Quiz Portal API is running',
    version: '1.0.0',
    status: app.locals.dbReady ? '✅ Database connected' : '⏳ Waiting for database',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      quizzes: '/api/quizzes',
      questions: '/api/questions',
      attempts: '/api/attempts'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Server error', 
    error: err.message 
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Using database: ${process.env.DB_NAME || 'quiz_portal'}`);
  console.log(`🔄 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Try to connect to database
  await connectWithRetry();
  
  if (app.locals.dbReady) {
    console.log('✅ Server is fully ready!');
  } else {
    console.log('⚠️ Server started but database is not ready. Will retry on requests.');
  }
});

module.exports = { app, pool };