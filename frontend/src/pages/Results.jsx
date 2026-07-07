import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'

export default function Results() {
  const { id } = useParams()
  const [attempts, setAttempts] = useState([])
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      axios.get(`/api/attempts/${id}`).then(res => {
        setDetail(res.data)
        setLoading(false)
      })
    } else {
      axios.get('/api/attempts/my').then(res => {
        setAttempts(res.data)
        setLoading(false)
      })
    }
  }, [id])

  if (loading) return <div className="text-center py-20">Loading...</div>

  if (detail) {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Quiz Result</h2>
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="font-bold text-lg">{detail.title}</h3>
          <p className="text-gray-500 mb-2">{detail.subject}</p>
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-indigo-600">
              {detail.score} / {detail.total_questions}
            </div>
            <p className="text-gray-500 mt-1">
              {detail.submitted_at ? new Date(detail.submitted_at).toLocaleString() : 'Not submitted'}
            </p>
          </div>
        </div>

        <h3 className="font-bold mb-3">Answer Review</h3>
        <div className="space-y-3">
          {detail.answers.map((ans, i) => (
            <div key={ans.id} className={`p-4 rounded-lg border ${ans.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className="font-medium mb-2">{i + 1}. {ans.question_text}</p>
              <div className="text-sm space-y-1">
                <p className={ans.selected_option === 'A' ? (ans.is_correct ? 'text-green-700 font-bold' : 'text-red-700 font-bold') : ans.correct_option === 'A' ? 'text-green-600' : ''}>A. {ans.option_a}</p>
                <p className={ans.selected_option === 'B' ? (ans.is_correct ? 'text-green-700 font-bold' : 'text-red-700 font-bold') : ans.correct_option === 'B' ? 'text-green-600' : ''}>B. {ans.option_b}</p>
                <p className={ans.selected_option === 'C' ? (ans.is_correct ? 'text-green-700 font-bold' : 'text-red-700 font-bold') : ans.correct_option === 'C' ? 'text-green-600' : ''}>C. {ans.option_c}</p>
                <p className={ans.selected_option === 'D' ? (ans.is_correct ? 'text-green-700 font-bold' : 'text-red-700 font-bold') : ans.correct_option === 'D' ? 'text-green-600' : ''}>D. {ans.option_d}</p>
              </div>
              <p className="text-xs mt-2">
                Your answer: <span className="font-bold">{ans.selected_option || 'Not answered'}</span> |
                Correct: <span className="font-bold">{ans.correct_option}</span>
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Link to="/results" className="text-indigo-600 hover:underline">← Back to all results</Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Quiz Results</h1>
      {attempts.length === 0 ? (
        <p className="text-gray-500">No attempts yet. <Link to="/quizzes" className="text-indigo-600 hover:underline">Take a quiz!</Link></p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Quiz</th>
                <th className="text-left px-4 py-3 font-medium">Subject</th>
                <th className="text-left px-4 py-3 font-medium">Started</th>
                <th className="text-left px-4 py-3 font-medium">Score</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {attempts.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {a.submitted_at ? (
                      <Link to={`/results/${a.id}`} className="text-indigo-600 hover:underline font-medium">{a.title}</Link>
                    ) : (
                      <span>{a.title}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{a.subject}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(a.started_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {a.score !== null ? `${a.score} / ${a.total_questions}` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {a.submitted_at ? (
                      <span className="text-green-600 text-xs bg-green-50 px-2 py-1 rounded">Completed</span>
                    ) : (
                      <Link to={`/quizzes/${a.quiz_id}`} className="text-orange-600 text-xs bg-orange-50 px-2 py-1 rounded hover:underline">In Progress</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
