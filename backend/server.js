const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

let pool = null;
let isDbConnected = false;

const initDatabase = async (retries = 10, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting database connection (${i + 1}/${retries})...`);
      
      pool = mysql.createPool({
        host: process.env.DB_HOST || 'mysql',
        user: process.env.DB_USER || 'quizuser',
        password: process.env.DB_PASSWORD || 'quizpassword',
        database: process.env.DB_NAME || 'quiz_portal',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      const connection = await pool.getConnection();
      console.log('✅ Database connected successfully');
      connection.release();
      isDbConnected = true;
      return true;
    } catch (error) {
      console.log(`❌ Database connection failed (attempt ${i + 1}): ${error.message}`);
      if (i < retries - 1) {
        console.log(`Waiting ${delay/1000} seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.error('❌ Failed to connect to database after all retries');
  return false;
};

app.get('/health', (req, res) => {
  if (isDbConnected && pool) {
    res.status(200).json({ 
      status: 'OK', 
      database: 'connected',
      timestamp: new Date().toISOString(),
      service: 'quiz-backend'
    });
  } else {
    res.status(503).json({ 
      status: 'Service Unavailable', 
      database: 'disconnected',
      message: 'Database is not ready. Please try again in a few moments.'
    });
  }
});

const startServer = async () => {
  const connected = await initDatabase();
  
  if (!connected) {
    console.error('⚠️  Server starting without database connection. Will retry...');
    setInterval(async () => {
      if (!isDbConnected) {
        console.log('🔄 Retrying database connection...');
        await initDatabase(3, 3000);
      }
    }, 10000);
  }

  app.use((req, res, next) => {
    req.pool = pool;
    req.isDbConnected = isDbConnected;
    next();
  });

  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/quizzes', require('./routes/quizzes'));
  app.use('/api/questions', require('./routes/questions'));
  app.use('/api/attempts', require('./routes/attempts'));

  app.get('/', (req, res) => {
    res.json({ 
      message: 'Quiz Portal API is running',
      database: isDbConnected ? 'connected' : 'disconnected',
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
    console.log(`📊 Database status: ${isDbConnected ? 'Connected ✅' : 'Disconnected ⚠️'}`);
  });
};

startServer();
