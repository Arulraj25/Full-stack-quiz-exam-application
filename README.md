# Quiz Portal

Full-stack quiz/exam application with admin and student roles.

## Tech Stack
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express + mysql2 (raw SQL, no ORM)
- **Auth:** JWT with role-based access control
- **Database:** MySQL

## Quick Start

### 1. Database Setup
```bash
# Login to MySQL
mysql -u root -p

# Run the schema (creates DB, tables, and admin user)
source backend/schema.sql
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials and JWT secret
npm install
npm run dev        # or: npm start
```
Server runs on http://localhost:5000

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on http://localhost:3000 (proxies API to :5000)

## Default Login
- **Admin:** admin@quizportal.com / admin123

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Student signup |
| POST | /api/auth/login | Login |
| GET | /api/quizzes | List quizzes |
| GET | /api/quizzes/:id | Get quiz (no answers) |
| POST | /api/quizzes | Create quiz (admin) |
| PUT | /api/quizzes/:id | Update quiz (admin) |
| DELETE | /api/quizzes/:id | Delete quiz (admin) |
| GET | /api/questions/quiz/:quizId | List questions (admin) |
| POST | /api/questions | Add question (admin) |
| PUT | /api/questions/:id | Update question (admin) |
| DELETE | /api/questions/:id | Delete question (admin) |
| POST | /api/attempts/start | Start quiz attempt |
| POST | /api/attempts/answer | Save answer |
| POST | /api/attempts/submit | Submit & score |
| GET | /api/attempts/my | My attempts |
| GET | /api/attempts/:id | Attempt detail |
| GET | /api/attempts/all/list | All attempts (admin) |

## Project Structure
```
quiz-portal/
├── backend/
│   ├── server.js              # Express app entry
│   ├── middleware/auth.js     # JWT + RBAC middleware
│   ├── routes/
│   │   ├── auth.js            # Login / register
│   │   ├── quizzes.js         # Quiz CRUD
│   │   ├── questions.js       # Question CRUD
│   │   └── attempts.js        # Attempts, answers, scoring
│   ├── schema.sql             # DB schema + seed admin
│   ├── .env.example           # Env template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Router setup
│   │   ├── main.jsx           # Entry point
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Signup.jsx
│   │       ├── Dashboard.jsx
│   │       ├── QuizList.jsx
│   │       ├── TakeQuiz.jsx
│   │       ├── Results.jsx
│   │       └── AdminPanel.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
└── README.md
```
