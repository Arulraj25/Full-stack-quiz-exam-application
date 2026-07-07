import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-indigo-600 text-white shadow">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold">Quiz Portal</Link>
        {user && (
          <div className="flex items-center gap-4 text-sm">
            <span className="opacity-80">{user.name} ({user.role})</span>
            <Link to="/" className="hover:underline">Dashboard</Link>
            <Link to="/quizzes" className="hover:underline">Quizzes</Link>
            <Link to="/results" className="hover:underline">My Results</Link>
            {isAdmin && <Link to="/admin" className="hover:underline font-semibold">Admin</Link>}
            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-xs">Logout</button>
          </div>
        )}
      </div>
    </nav>
  )
}
