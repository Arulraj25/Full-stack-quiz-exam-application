import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user, isAdmin } = useAuth()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Welcome, {user.name}!</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Available Quizzes</h2>
          <p className="text-gray-600 mb-4">Browse and take available quizzes.</p>
          <Link to="/quizzes" className="text-indigo-600 hover:underline font-medium">View Quizzes →</Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">My Results</h2>
          <p className="text-gray-600 mb-4">View your past quiz attempts and scores.</p>
          <Link to="/results" className="text-indigo-600 hover:underline font-medium">View Results →</Link>
        </div>
        {isAdmin && (
          <div className="bg-white p-6 rounded-lg shadow border-2 border-indigo-100">
            <h2 className="text-xl font-semibold mb-2">Admin Panel</h2>
            <p className="text-gray-600 mb-4">Manage quizzes, questions, and view all attempts.</p>
            <Link to="/admin" className="text-indigo-600 hover:underline font-medium">Go to Admin →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
