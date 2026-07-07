import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/quizzes').then(res => {
      setQuizzes(res.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20">Loading quizzes...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Available Quizzes</h1>
      {quizzes.length === 0 ? (
        <p className="text-gray-500">No quizzes available yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map(q => (
            <div key={q.id} className="bg-white p-5 rounded-lg shadow hover:shadow-md transition">
              <h3 className="font-bold text-lg mb-1">{q.title}</h3>
              <p className="text-sm text-gray-500 mb-3">{q.subject}</p>
              <Link to={`/quizzes/${q.id}`}
                className="inline-block bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">
                Start Quiz
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
