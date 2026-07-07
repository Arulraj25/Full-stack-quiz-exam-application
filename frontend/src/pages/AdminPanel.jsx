import { useEffect, useState } from 'react'
import axios from 'axios'

export default function AdminPanel() {
  const [quizzes, setQuizzes] = useState([])
  const [attempts, setAttempts] = useState([])
  const [activeTab, setActiveTab] = useState('quizzes')
  const [editingQuiz, setEditingQuiz] = useState(null)
  const [editingQuestions, setEditingQuestions] = useState(null)
  const [newQuiz, setNewQuiz] = useState({ title: '', subject: '' })
  const [newQuestion, setNewQuestion] = useState({
    question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A'
  })

  const loadQuizzes = () => {
    axios.get('/api/quizzes').then(res => setQuizzes(res.data))
  }

  const loadAttempts = () => {
    axios.get('/api/attempts/all/list').then(res => setAttempts(res.data))
  }

  useEffect(() => {
    loadQuizzes()
    loadAttempts()
  }, [])

  const handleCreateQuiz = async (e) => {
    e.preventDefault()
    await axios.post('/api/quizzes', newQuiz)
    setNewQuiz({ title: '', subject: '' })
    loadQuizzes()
  }

  const handleUpdateQuiz = async (e) => {
    e.preventDefault()
    await axios.put(`/api/quizzes/${editingQuiz.id}`, editingQuiz)
    setEditingQuiz(null)
    loadQuizzes()
  }

  const handleDeleteQuiz = async (id) => {
    if (!window.confirm('Delete this quiz and all its questions?')) return
    await axios.delete(`/api/quizzes/${id}`)
    loadQuizzes()
  }

  const loadQuestions = (quiz) => {
    axios.get(`/api/questions/quiz/${quiz.id}`).then(res => {
      setEditingQuestions({ ...quiz, questions: res.data })
    })
  }

  const handleAddQuestion = async (e) => {
    e.preventDefault()
    await axios.post('/api/questions', { ...newQuestion, quiz_id: editingQuestions.id })
    setNewQuestion({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A' })
    loadQuestions(editingQuestions)
  }

  const handleDeleteQuestion = async (qid) => {
    if (!window.confirm('Delete this question?')) return
    await axios.delete(`/api/questions/${qid}`)
    loadQuestions(editingQuestions)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>

      <div className="flex gap-4 mb-6 border-b">
        <button onClick={() => setActiveTab('quizzes')}
          className={`pb-2 px-1 ${activeTab === 'quizzes' ? 'border-b-2 border-indigo-600 text-indigo-600 font-medium' : 'text-gray-500'}`}>
          Manage Quizzes
        </button>
        <button onClick={() => setActiveTab('attempts')}
          className={`pb-2 px-1 ${activeTab === 'attempts' ? 'border-b-2 border-indigo-600 text-indigo-600 font-medium' : 'text-gray-500'}`}>
          All Attempts
        </button>
      </div>

      {activeTab === 'quizzes' && (
        <div>
          <form onSubmit={handleCreateQuiz} className="bg-white p-4 rounded-lg shadow mb-6 flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1">Title</label>
              <input type="text" value={newQuiz.title} onChange={e => setNewQuiz({...newQuiz, title: e.target.value})}
                className="w-full border rounded px-3 py-2" placeholder="Quiz title" required />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1">Subject</label>
              <input type="text" value={newQuiz.subject} onChange={e => setNewQuiz({...newQuiz, subject: e.target.value})}
                className="w-full border rounded px-3 py-2" placeholder="Subject" required />
            </div>
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Create</button>
          </form>

          {editingQuiz && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <form onSubmit={handleUpdateQuiz} className="bg-white p-6 rounded-lg shadow w-96">
                <h3 className="font-bold mb-4">Edit Quiz</h3>
                <input type="text" value={editingQuiz.title} onChange={e => setEditingQuiz({...editingQuiz, title: e.target.value})}
                  className="w-full border rounded px-3 py-2 mb-3" required />
                <input type="text" value={editingQuiz.subject} onChange={e => setEditingQuiz({...editingQuiz, subject: e.target.value})}
                  className="w-full border rounded px-3 py-2 mb-4" required />
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setEditingQuiz(null)} className="px-3 py-2 border rounded">Cancel</button>
                  <button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded">Save</button>
                </div>
              </form>
            </div>
          )}

          {editingQuestions && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto">
              <div className="bg-white p-6 rounded-lg shadow w-full max-w-2xl max-h-[90vh] overflow-auto m-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Questions: {editingQuestions.title}</h3>
                  <button onClick={() => setEditingQuestions(null)} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>

                <form onSubmit={handleAddQuestion} className="bg-gray-50 p-4 rounded mb-4 space-y-2">
                  <input type="text" value={newQuestion.question_text} onChange={e => setNewQuestion({...newQuestion, question_text: e.target.value})}
                    className="w-full border rounded px-3 py-2" placeholder="Question text" required />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={newQuestion.option_a} onChange={e => setNewQuestion({...newQuestion, option_a: e.target.value})}
                      className="border rounded px-3 py-2" placeholder="Option A" required />
                    <input type="text" value={newQuestion.option_b} onChange={e => setNewQuestion({...newQuestion, option_b: e.target.value})}
                      className="border rounded px-3 py-2" placeholder="Option B" required />
                    <input type="text" value={newQuestion.option_c} onChange={e => setNewQuestion({...newQuestion, option_c: e.target.value})}
                      className="border rounded px-3 py-2" placeholder="Option C" required />
                    <input type="text" value={newQuestion.option_d} onChange={e => setNewQuestion({...newQuestion, option_d: e.target.value})}
                      className="border rounded px-3 py-2" placeholder="Option D" required />
                  </div>
                  <div className="flex gap-2 items-center">
                    <label className="text-sm">Correct:</label>
                    <select value={newQuestion.correct_option} onChange={e => setNewQuestion({...newQuestion, correct_option: e.target.value})}
                      className="border rounded px-2 py-1">
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                    <button type="submit" className="ml-auto bg-green-600 text-white px-3 py-1 rounded text-sm">Add Question</button>
                  </div>
                </form>

                <div className="space-y-2">
                  {editingQuestions.questions.map((q, i) => (
                    <div key={q.id} className="border rounded p-3 flex justify-between items-start">
                      <div>
                        <p className="font-medium">{i + 1}. {q.question_text}</p>
                        <p className="text-xs text-gray-500 mt-1">Correct: {q.correct_option}</p>
                      </div>
                      <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-500 text-sm hover:underline">Delete</button>
                    </div>
                  ))}
                  {editingQuestions.questions.length === 0 && <p className="text-gray-500 text-sm">No questions yet.</p>}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Title</th>
                  <th className="text-left px-4 py-3 font-medium">Subject</th>
                  <th className="text-left px-4 py-3 font-medium">Created</th>
                  <th className="text-left px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {quizzes.map(q => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{q.title}</td>
                    <td className="px-4 py-3 text-gray-500">{q.subject}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(q.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setEditingQuiz(q)} className="text-indigo-600 hover:underline mr-3 text-xs">Edit</button>
                      <button onClick={() => loadQuestions(q)} className="text-green-600 hover:underline mr-3 text-xs">Questions</button>
                      <button onClick={() => handleDeleteQuiz(q.id)} className="text-red-600 hover:underline text-xs">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {quizzes.length === 0 && <p className="text-center py-8 text-gray-500">No quizzes yet.</p>}
          </div>
        </div>
      )}

      {activeTab === 'attempts' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Student</th>
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
                  <td className="px-4 py-3">{a.student_name}</td>
                  <td className="px-4 py-3 font-medium">{a.title}</td>
                  <td className="px-4 py-3 text-gray-500">{a.subject}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(a.started_at).toLocaleString()}</td>
                  <td className="px-4 py-3">{a.score !== null ? `${a.score} / ${a.total_questions}` : '-'}</td>
                  <td className="px-4 py-3">
                    {a.submitted_at ? (
                      <span className="text-green-600 text-xs bg-green-50 px-2 py-1 rounded">Completed</span>
                    ) : (
                      <span className="text-orange-600 text-xs bg-orange-50 px-2 py-1 rounded">In Progress</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {attempts.length === 0 && <p className="text-center py-8 text-gray-500">No attempts yet.</p>}
        </div>
      )}
    </div>
  )
}
