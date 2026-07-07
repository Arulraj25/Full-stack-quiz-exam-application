import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function TakeQuiz() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState(null)
  const [attemptId, setAttemptId] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const quizRes = await axios.get(`/api/quizzes/${id}`)
        setQuiz(quizRes.data)

        const attemptRes = await axios.post('/api/attempts/start', { quiz_id: id })
        setAttemptId(attemptRes.data.attempt_id)
      } catch (err) {
        alert('Failed to load quiz')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleSelect = async (option) => {
    const question = quiz.questions[currentIndex]
    setAnswers(prev => ({ ...prev, [question.id]: option }))

    try {
      await axios.post('/api/attempts/answer', {
        attempt_id: attemptId,
        question_id: question.id,
        selected_option: option
      })
    } catch (err) {
      console.error('Failed to save answer', err)
    }
  }

  const handleSubmit = async () => {
    if (!window.confirm('Are you sure you want to submit?')) return
    setSubmitting(true)
    try {
      const res = await axios.post('/api/attempts/submit', { attempt_id: attemptId })
      navigate(`/results/${attemptId}`, { state: { result: res.data } })
    } catch (err) {
      alert('Submission failed')
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-center py-20">Loading quiz...</div>
  if (!quiz) return <div className="text-center py-20">Quiz not found</div>

  const questions = quiz.questions
  const currentQ = questions[currentIndex]
  const total = questions.length

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{quiz.title}</h2>
          <span className="text-sm text-gray-500">Question {currentIndex + 1} of {total}</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div className="bg-indigo-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / total) * 100}%` }}></div>
        </div>

        <p className="text-lg font-medium mb-6">{currentQ.question_text}</p>

        <div className="space-y-3">
          {['A', 'B', 'C', 'D'].map(opt => (
            <button key={opt}
              onClick={() => handleSelect(opt)}
              className={`w-full text-left px-4 py-3 rounded border transition ${
                answers[currentQ.id] === opt
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                  : 'bg-white border-gray-200 hover:border-indigo-300'
              }`}>
              <span className="font-bold mr-2">{opt}.</span>
              {currentQ[`option_${opt.toLowerCase()}`]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(i => i - 1)}
          className="px-4 py-2 rounded border disabled:opacity-40 hover:bg-gray-50">
          ← Previous
        </button>

        {currentIndex < total - 1 ? (
          <button
            onClick={() => setCurrentIndex(i => i + 1)}
            className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">
            Next →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {questions.map((q, i) => (
          <button key={q.id}
            onClick={() => setCurrentIndex(i)}
            className={`w-8 h-8 rounded text-xs font-medium ${
              i === currentIndex ? 'bg-indigo-600 text-white' :
              answers[q.id] ? 'bg-green-100 text-green-700 border border-green-300' :
              'bg-gray-100 text-gray-500 border border-gray-200'
            }`}>
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  )
}
