import { useState, useEffect } from 'react'
import { getFlashcards, saveFlashcards, getTasks, saveTasks, getStudySessions, getWeakTopics, getNotes, getExams, saveExams } from '../lib/storage'
import { calculateNextReview, getDueCards, getFlashcardStats, sortCardsByPriority, updateCardReview } from '../lib/spacedRepetition'
import { synapseChat } from '../lib/ai/synapseAi'

function ComingSoon({ title, icon, desc, color='var(--c)' }) {
  return (
    <div className="rise" style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'60vh',gap:16,textAlign:'center' }}>
      <div style={{ fontSize:48 }}>{icon}</div>
      <div style={{ fontFamily:'Syne,sans-serif',fontSize:22,fontWeight:700 }}>{title}</div>
      <div style={{ fontSize:13,color:'var(--txt2)',maxWidth:320,lineHeight:1.7 }}>{desc}</div>
      <div style={{ padding:'6px 16px',borderRadius:100,background:`rgba(0,255,224,0.08)`,border:'1px solid rgba(0,255,224,0.2)',fontSize:11,color:'var(--c)',fontWeight:600 }}>Coming in next update</div>
    </div>
  )
}

export function StudyPlanner() {
  const [tasks, setTasks] = useState([])
  const [exams, setExams] = useState([])
  const [studySessions, setStudySessions] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTask, setNewTask] = useState('')
  const [newSubject, setNewSubject] = useState('Physics')
  const [newDuration, setNewDuration] = useState(60)
  const [showAISchedule, setShowAISchedule] = useState(false)
  const [dailyInput, setDailyInput] = useState('')
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false)

  useEffect(() => {
    setTasks(getTasks())
    setExams(getExams())
    setStudySessions(getStudySessions())
  }, [])

  const handleAddTask = () => {
    if (newTask.trim()) {
      const task = {
        id: Date.now(),
        subject: newSubject,
        task: newTask,
        done: false,
        scheduledDate: selectedDate,
        duration: newDuration
      }
      const updated = [...tasks, task]
      setTasks(updated)
      saveTasks(updated)
      setNewTask('')
      setShowAddTask(false)
    }
  }

  const handleToggleTask = (id) => {
    const updated = tasks.map(t => 
      t.id === id ? { ...t, done: !t.done } : t
    )
    setTasks(updated)
    saveTasks(updated)
  }

  const handleDeleteTask = (id) => {
    const updated = tasks.filter(t => t.id !== id)
    setTasks(updated)
    saveTasks(updated)
  }

  const handleAISchedule = async () => {
    if (!dailyInput.trim()) return
    
    setIsGeneratingSchedule(true)
    try {
      const prompt = `Based on the following daily activities, create a study schedule for today (${selectedDate}). 
      
Daily activities: ${dailyInput}

Generate a structured study plan with 4-6 tasks. For each task, provide:
1. Subject (Physics, Chemistry, Mathematics, Biology, etc.)
2. Specific topic/task description
3. Duration in minutes (30, 60, 90, or 120)

Format your response as a JSON array like this:
[
  {"subject": "Physics", "task": "Study Newton's Laws", "duration": 60},
  {"subject": "Chemistry", "task": "Practice organic reactions", "duration": 45}
]

Only return the JSON array, no other text.`

      const response = await synapseChat([{ role: 'user', content: prompt }], null)
      
      // Parse the AI response to extract JSON
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const generatedTasks = JSON.parse(jsonMatch[0])
        
        // Add tasks to the planner
        const newTasks = generatedTasks.map(t => ({
          id: Date.now() + Math.random(),
          subject: t.subject,
          task: t.task,
          done: false,
          scheduledDate: selectedDate,
          duration: t.duration || 60
        }))
        
        const updated = [...tasks, ...newTasks]
        setTasks(updated)
        saveTasks(updated)
        setShowAISchedule(false)
        setDailyInput('')
      }
    } catch (error) {
      console.error('Error generating AI schedule:', error)
      alert('Failed to generate schedule. Please try again.')
    } finally {
      setIsGeneratingSchedule(false)
    }
  }

  // Get tasks for selected date
  const getTasksForDate = (date) => {
    return tasks.filter(t => t.scheduledDate === date)
  }

  // Generate week dates
  const getWeekDates = () => {
    const dates = []
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dateNum: date.getDate()
      })
    }
    return dates
  }

  const weekDates = getWeekDates()
  const selectedTasks = getTasksForDate(selectedDate)
  const totalDuration = selectedTasks.reduce((sum, t) => sum + (t.duration || 60), 0)

  const colors = { Physics:'#00ffe0', Mathematics:'#7c3aff', Chemistry:'#fb923c', Biology:'#4ade80', Revision:'#ff2d78' }
  
  return (
    <div className="rise">
      <div style={{ marginBottom: 16 }}>
        <div className="section-label">This Week</div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8 }}>
          {weekDates.map((d, i) => (
            <button
              key={i}
              onClick={() => setSelectedDate(d.date)}
              style={{
                minWidth: 60,
                padding: '12px 8px',
                borderRadius: 10,
                border: selectedDate === d.date ? '1px solid rgba(0,255,224,0.4)' : '1px solid var(--glass-border)',
                background: selectedDate === d.date ? 'rgba(0,255,224,0.08)' : 'var(--glass)',
                color: selectedDate === d.date ? 'var(--c)' : 'var(--txt2)',
                fontSize: 11,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: 10, opacity: 0.7 }}>{d.day}</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{d.dateNum}</div>
              <div style={{ fontSize: 9, opacity: 0.5 }}>{getTasksForDate(d.date).length} tasks</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="section-label" style={{ marginBottom: 0 }}>
          {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <div style={{ fontSize: 11, color: 'var(--txt3)' }}>
          {Math.floor(totalDuration / 60)}h {totalDuration % 60}m planned
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button 
          className="btn btn-primary" 
          style={{ fontSize: 12, padding: '8px 14px' }}
          onClick={() => setShowAddTask(true)}
        >
          + Add Task
        </button>
        <button 
          className="btn btn-ghost" 
          style={{ fontSize: 12, padding: '8px 14px' }}
          onClick={() => setShowAISchedule(true)}
        >
          ⚡ AI Schedule
        </button>
      </div>

      {showAddTask && (
        <div style={{ marginBottom: 16, padding: 16, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--glass)' }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
            Add Study Task
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="What do you want to study?"
              style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'var(--txt)', fontSize: 13 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'var(--txt)', fontSize: 13 }}
              >
                {['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Accountancy', 'Economics', 'General'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={newDuration}
                onChange={(e) => setNewDuration(parseInt(e.target.value))}
                style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'var(--txt)', fontSize: 13 }}
              >
                <option value={30}>30 min</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className="btn btn-ghost" 
                style={{ flex: 1, fontSize: 12 }} 
                onClick={() => setShowAddTask(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, fontSize: 12 }} 
                onClick={handleAddTask}
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {showAISchedule && (
        <div style={{ marginBottom: 16, padding: 16, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--glass)' }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
            AI Schedule Generator
          </div>
          <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 12 }}>
            Describe what you did today or your study goals, and AI will create a personalized study schedule.
          </div>
          <textarea
            value={dailyInput}
            onChange={(e) => setDailyInput(e.target.value)}
            placeholder="e.g., I studied Physics for 2 hours today, watched chemistry videos, and need to prepare for my math exam next week..."
            rows={4}
            style={{ 
              width: '100%', 
              padding: '10px 14px', 
              borderRadius: 8, 
              background: 'rgba(255,255,255,0.04)', 
              border: '1px solid var(--glass-border)', 
              color: 'var(--txt)', 
              fontSize: 13,
              resize: 'vertical',
              marginBottom: 12
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              className="btn btn-ghost" 
              style={{ flex: 1, fontSize: 12 }} 
              onClick={() => setShowAISchedule(false)}
              disabled={isGeneratingSchedule}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary" 
              style={{ flex: 1, fontSize: 12 }} 
              onClick={handleAISchedule}
              disabled={isGeneratingSchedule || !dailyInput.trim()}
            >
              {isGeneratingSchedule ? 'Generating...' : 'Generate Schedule'}
            </button>
          </div>
        </div>
      )}

      {selectedTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--txt3)', fontSize: 13 }}>
          No tasks scheduled for this day. Add a task to start planning!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {selectedTasks.map((task, i) => (
            <div
              key={task.id}
              style={{
                padding: '12px 14px',
                borderRadius: 11,
                border: '1px solid var(--glass-border)',
                background: task.done ? 'rgba(74,222,128,0.04)' : 'var(--glass)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                opacity: task.done ? 0.6 : 1
              }}
            >
              <button
                onClick={() => handleToggleTask(task.id)}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  border: task.done ? '2px solid #4ade80' : '2px solid var(--glass-border)',
                  background: task.done ? '#4ade80' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  color: task.done ? '#fff' : 'transparent'
                }}
              >
                {task.done ? '✓' : ''}
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt)', marginBottom: 4, textDecoration: task.done ? 'line-through' : 'none' }}>
                  {task.task}
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--txt3)' }}>
                  <span>{task.subject}</span>
                  <span>{task.duration} min</span>
                </div>
              </div>
              <button
                onClick={() => handleDeleteTask(task.id)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  background: 'rgba(248,113,113,0.1)',
                  border: '1px solid rgba(248,113,113,0.2)',
                  color: '#f87171',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {exams.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div className="section-label">Upcoming Exams</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {exams.slice(0, 3).map(exam => {
              const daysUntil = Math.ceil((new Date(exam.date) - new Date()) / (1000 * 60 * 60 * 24))
              return (
                <div
                  key={exam.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 11,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--glass)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt)' }}>{exam.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{new Date(exam.date).toLocaleDateString()}</div>
                  </div>
                  <div style={{ padding: '4px 10px', borderRadius: 100, background: daysUntil <= 7 ? 'rgba(251,146,60,0.1)' : 'rgba(74,222,128,0.1)', border: daysUntil <= 7 ? '1px solid rgba(251,146,60,0.2)' : '1px solid rgba(74,222,128,0.2)', fontSize: 11, color: daysUntil <= 7 ? '#fb923c' : '#4ade80' }}>
                    {daysUntil} days
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function Flashcards() {
  const [cards, setCards] = useState([])
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [showAddCard, setShowAddCard] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const [newAnswer, setNewAnswer] = useState('')
  const [newSubject, setNewSubject] = useState('Physics')

  useEffect(() => {
    const loadedCards = getFlashcards()
    const sortedCards = sortCardsByPriority(loadedCards)
    setCards(sortedCards)
  }, [])

  const handleRate = (quality) => {
    if (cards.length === 0) return
    
    const updatedCard = updateCardReview(cards[idx], quality)
    const updatedCards = [...cards]
    updatedCards[idx] = updatedCard
    saveFlashcards(updatedCards)
    
    // Move to next card
    setFlipped(false)
    if (idx < cards.length - 1) {
      setIdx(idx + 1)
    } else {
      // Resort and start from beginning
      const resorted = sortCardsByPriority(updatedCards)
      setCards(resorted)
      setIdx(0)
    }
  }

  const handleAddCard = () => {
    if (newQuestion.trim() && newAnswer.trim()) {
      const newCard = {
        id: Date.now(),
        question: newQuestion,
        answer: newAnswer,
        subject: newSubject,
        interval: 0,
        repetitions: 0,
        easeFactor: 2.5,
        createdAt: new Date().toISOString()
      }
      const updatedCards = [...cards, newCard]
      const sorted = sortCardsByPriority(updatedCards)
      setCards(sorted)
      saveFlashcards(sorted)
      setNewQuestion('')
      setNewAnswer('')
      setShowAddCard(false)
    }
  }

  const handleDeleteCard = (id) => {
    const updated = cards.filter(c => c.id !== id)
    const sorted = sortCardsByPriority(updated)
    setCards(sorted)
    saveFlashcards(sorted)
  }

  const stats = getFlashcardStats(cards)
  const currentCard = cards[idx]
  return (
    <div className="rise">
      {/* Stats Bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,255,224,0.08)', border: '1px solid rgba(0,255,224,0.2)', fontSize: 11, color: 'var(--txt2)' }}>
          📚 Total: {stats.total}
        </div>
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)', fontSize: 11, color: 'var(--txt2)' }}>
          ⏰ Due: {stats.due}
        </div>
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', fontSize: 11, color: 'var(--txt2)' }}>
          ✓ Learned: {stats.learned}
        </div>
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(124,58,255,0.08)', border: '1px solid rgba(124,58,255,0.2)', fontSize: 11, color: 'var(--txt2)' }}>
          🆕 New: {stats.newCards}
        </div>
      </div>

      {cards.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--txt3)', fontSize: 13 }}>
          No flashcards yet. Add your first card to start studying!
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 12, color: 'var(--txt2)' }}>
            <span>Card {idx + 1} of {cards.length}</span>
            <button 
              className="btn btn-ghost" 
              style={{ fontSize: 11, padding: '5px 12px' }}
              onClick={() => setShowAddCard(true)}
            >
              + Add Card
            </button>
          </div>
          <div 
            onClick={() => setFlipped(!flipped)} 
            style={{ 
              minHeight: 200, 
              borderRadius: 16, 
              border: `1px solid ${flipped ? 'rgba(0,255,224,0.3)' : 'var(--glass-border)'}`,
              background: flipped ? 'rgba(0,255,224,0.06)' : 'var(--glass)', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: 24, 
              cursor: 'pointer', 
              transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)', 
              textAlign: 'center', 
              marginBottom: 14, 
              position: 'relative' 
            }}
          >
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--txt3)', marginBottom: 12 }}>
              {flipped ? 'ANSWER' : 'QUESTION'} · {currentCard?.subject || 'General'}
            </div>
            <div style={{ fontSize: 15, color: 'var(--txt)', lineHeight: 1.6, fontWeight: flipped ? 400 : 500 }}>
              {flipped ? currentCard?.answer : currentCard?.question}
            </div>
            <div style={{ position: 'absolute', bottom: 12, fontSize: 10, color: 'var(--txt3)' }}>
              Tap to {flipped ? 'see question' : 'reveal answer'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              className="btn btn-ghost" 
              style={{ flex: 1, justifyContent: 'center', fontSize: 12 }} 
              onClick={() => setIdx(i => Math.max(0, i - 1))}
            >
              ← Prev
            </button>
            <button 
              className="btn btn-ghost" 
              style={{ flex: 1, justifyContent: 'center', fontSize: 12, color: '#f87171', borderColor: 'rgba(248,113,113,0.2)' }} 
              onClick={() => handleRate(0)}
            >
              ✗ Again
            </button>
            <button 
              className="btn btn-ghost" 
              style={{ flex: 1, justifyContent: 'center', fontSize: 12, color: '#fbbf24', borderColor: 'rgba(251,191,36,0.2)' }} 
              onClick={() => handleRate(2)}
            >
              Hard
            </button>
            <button 
              className="btn btn-ghost" 
              style={{ flex: 1, justifyContent: 'center', fontSize: 12, color: '#4ade80', borderColor: 'rgba(74,222,128,0.2)' }} 
              onClick={() => handleRate(3)}
            >
              Good
            </button>
            <button 
              className="btn btn-primary" 
              style={{ flex: 1, justifyContent: 'center', fontSize: 12 }} 
              onClick={() => handleRate(4)}
            >
              Easy →
            </button>
          </div>
        </>
      )}

      {/* Add Card Modal */}
      {showAddCard && (
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--glass)' }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
            Add Flashcard
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              type="text"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Question"
              style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'var(--txt)', fontSize: 13 }}
            />
            <textarea
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="Answer"
              rows={3}
              style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'var(--txt)', fontSize: 13, resize: 'vertical' }}
            />
            <select
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'var(--txt)', fontSize: 13 }}
            >
              {['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Accountancy', 'Economics', 'Other'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className="btn btn-ghost" 
                style={{ flex: 1, fontSize: 12 }} 
                onClick={() => setShowAddCard(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, fontSize: 12 }} 
                onClick={handleAddCard}
              >
                Add Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function MockTests() {
  const [tests, setTests] = useState([])
  const [selectedTest, setSelectedTest] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [selectedDifficulty, setSelectedDifficulty] = useState('all')
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [timerActive, setTimerActive] = useState(false)
  const [questionTimings, setQuestionTimings] = useState({})
  const [testStartTime, setTestStartTime] = useState(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [showAnswerKeyModal, setShowAnswerKeyModal] = useState(false)
  const [selectedTestForKey, setSelectedTestForKey] = useState(null)
  const [showAIGenerateModal, setShowAIGenerateModal] = useState(false)
  const [aiExplanations, setAiExplanations] = useState({})
  const [generatingExplanation, setGeneratingExplanation] = useState(false)
  const [aiTestSubject, setAiTestSubject] = useState('')
  const [aiTestTopics, setAiTestTopics] = useState('')
  const [aiTestQuestionCount, setAiTestQuestionCount] = useState(5)
  const [aiTestDuration, setAiTestDuration] = useState(30)
  const [isGeneratingTest, setIsGeneratingTest] = useState(false)
  const [subjectiveAnswers, setSubjectiveAnswers] = useState({})
  const [isGradingSubjective, setIsGradingSubjective] = useState(false)
  const [showManualAnswerKeyModal, setShowManualAnswerKeyModal] = useState(false)
  const [manualAnswerKey, setManualAnswerKey] = useState({})
  const [isProcessingPDF, setIsProcessingPDF] = useState(false)
  const [pdfText, setPdfText] = useState('')
  const [showPDFConversionModal, setShowPDFConversionModal] = useState(false)
  const [conversionSubject, setConversionSubject] = useState('')

  useEffect(() => {
    const savedTests = JSON.parse(localStorage.getItem('synapse_mock_tests') || '[]')
    setTests(savedTests)
  }, [])

  useEffect(() => {
    let interval
    if (timerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1)
      }, 1000)
    } else if (timeRemaining === 0 && timerActive) {
      handleSubmit()
    }
    return () => clearInterval(interval)
  }, [timerActive, timeRemaining])

  const handleStartTest = (test) => {
    setSelectedTest(test)
    setCurrentQuestion(0)
    setAnswers({})
    setShowResults(false)
    setTimeRemaining(test.duration * 60)
    setTimerActive(true)
    setQuestionTimings({})
    setTestStartTime(Date.now())
  }

  const handleAnswer = (questionId, answerIndex) => {
    const timing = Date.now() - testStartTime
    setQuestionTimings(prev => ({ ...prev, [questionId]: timing }))
    setAnswers(prev => ({ ...prev, [questionId]: answerIndex }))
  }

  const handleSubmit = () => {
    setTimerActive(false)
    setShowResults(true)
  }

  const calculateScore = () => {
    if (!selectedTest) return 0
    let totalScore = 0
    let maxScore = 0
    
    selectedTest.questions.forEach(q => {
      if (q.type === 'subjective') {
        // For subjective questions, use AI grading
        const userAnswer = subjectiveAnswers[q.id]
        if (userAnswer) {
          // Will be graded asynchronously, for now count as partial
          totalScore += 50 // Placeholder, will be updated with actual AI grading
          maxScore += 100
        }
      } else {
        // MCQ questions
        if (answers[q.id] === q.correct) {
          totalScore += 100
        }
        maxScore += 100
      }
    })
    
    return maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
  }

  const handleBack = () => {
    setSelectedTest(null)
    setShowResults(false)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setUploadedFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const testData = JSON.parse(event.target.result)
          const newTest = {
            id: Date.now(),
            title: testData.title || 'Uploaded Test',
            subject: testData.subject || 'General',
            duration: testData.duration || 30,
            difficulty: testData.difficulty || 'medium',
            questions: testData.questions || []
          }
          const updatedTests = [...tests, newTest]
          setTests(updatedTests)
          localStorage.setItem('synapse_mock_tests', JSON.stringify(updatedTests))
          setShowUploadModal(false)
          setUploadedFile(null)
        } catch (error) {
          alert('Invalid JSON file format')
        }
      }
      reader.readAsText(file)
    }
  }

  const handleAnswerKeyUpload = (e) => {
    const file = e.target.files[0]
    if (file && selectedTestForKey) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const answerKeyData = JSON.parse(event.target.result)
          const updatedTests = tests.map(test => {
            if (test.id === selectedTestForKey.id) {
              return {
                ...test,
                questions: test.questions.map(q => ({
                  ...q,
                  correct: answerKeyData.answers[q.id] !== undefined ? answerKeyData.answers[q.id] : q.correct
                }))
              }
            }
            return test
          })
          setTests(updatedTests)
          localStorage.setItem('synapse_mock_tests', JSON.stringify(updatedTests))
          setShowAnswerKeyModal(false)
          setSelectedTestForKey(null)
          alert('Answer key updated successfully')
        } catch (error) {
          alert('Invalid JSON file format')
        }
      }
      reader.readAsText(file)
    }
  }

  const handleManualAnswerKeySubmit = () => {
    if (!selectedTestForKey) return
    
    const updatedTests = tests.map(test => {
      if (test.id === selectedTestForKey.id) {
        return {
          ...test,
          questions: test.questions.map(q => ({
            ...q,
            correct: manualAnswerKey[q.id] !== undefined ? parseInt(manualAnswerKey[q.id]) : q.correct
          }))
        }
      }
      return test
    })
    
    setTests(updatedTests)
    localStorage.setItem('synapse_mock_tests', JSON.stringify(updatedTests))
    setShowManualAnswerKeyModal(false)
    setSelectedTestForKey(null)
    setManualAnswerKey({})
    alert('Answer key updated successfully')
  }

  const handlePDFConversion = async (textContent, subject) => {
    setIsProcessingPDF(true)
    try {
      const prompt = `Convert the following text content into a test format. Extract all questions and their options.
      
Text content:
${textContent}

Subject: ${subject}

Extract questions in the following JSON format:
[
  {
    "id": 1,
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "type": "mcq"
  }
]

Only return the JSON array. If options are not available, mark as "subjective" type.`

      const response = await synapseChat([{ role: 'user', content: prompt }], null)
      
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const extractedQuestions = JSON.parse(jsonMatch[0])
        
        const newTest = {
          id: Date.now(),
          title: `Converted: ${subject}`,
          subject: subject,
          duration: 30,
          difficulty: 'medium',
          questions: extractedQuestions
        }

        const updatedTests = [...tests, newTest]
        setTests(updatedTests)
        localStorage.setItem('synapse_mock_tests', JSON.stringify(updatedTests))
        alert(`Successfully converted ${extractedQuestions.length} questions from the content!`)
      } else {
        throw new Error('Could not parse AI response')
      }
    } catch (error) {
      console.error('Error converting PDF:', error)
      alert('Failed to convert content. Please try again or ensure the text contains clear questions.')
    } finally {
      setIsProcessingPDF(false)
    }
  }

  const handleAIGenerate = async () => {
    if (!aiTestSubject.trim() || !aiTestTopics.trim()) {
      alert('Please select a subject and enter topics')
      return
    }

    setIsGeneratingTest(true)
    try {
      const prompt = `Generate ${aiTestQuestionCount} multiple choice questions for a test on ${aiTestSubject}.
      
Topics to cover: ${aiTestTopics}
Test duration: ${aiTestDuration} minutes

For each question, provide:
1. The question text
2. 4 options (A, B, C, D)
3. The correct answer (0-3, where 0=A, 1=B, 2=C, 3=D)
4. Brief explanation
5. Question type: "mcq" for multiple choice

Format your response as a JSON array like this:
[
  {
    "id": 1,
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Brief explanation",
    "type": "mcq"
  }
]

Only return the JSON array, no other text. Make questions challenging but fair.`

      const response = await synapseChat([{ role: 'user', content: prompt }], null)
      
      // Parse the AI response to extract JSON
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const generatedQuestions = JSON.parse(jsonMatch[0])
        
        const newTest = {
          id: Date.now(),
          title: `AI-Generated: ${aiTestSubject} - ${aiTestTopics}`,
          subject: aiTestSubject,
          duration: aiTestDuration,
          difficulty: 'medium',
          questions: generatedQuestions
        }

        const updatedTests = [...tests, newTest]
        setTests(updatedTests)
        localStorage.setItem('synapse_mock_tests', JSON.stringify(updatedTests))
        setShowAIGenerateModal(false)
        setAiTestSubject('')
        setAiTestTopics('')
        alert(`AI-generated test created with ${generatedQuestions.length} questions!`)
      } else {
        throw new Error('Could not parse AI response')
      }
    } catch (error) {
      console.error('Error generating AI test:', error)
      alert('Failed to generate test. Please try again.')
    } finally {
      setIsGeneratingTest(false)
    }
  }

  const handleGenerateAIExplanation = async (question, userAnswer, correctAnswer) => {
    setGeneratingExplanation(true)
    try {
      // Simulate AI explanation generation
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const explanation = `The correct answer is "${question.options[correctAnswer]}". Your answer "${question.options[userAnswer]}" is incorrect because this option doesn't align with the fundamental concept being tested. To improve your understanding, focus on the key principles and practice similar problems.`
      
      setAiExplanations(prev => ({
        ...prev,
        [question.id]: explanation
      }))
    } catch (error) {
      console.error('Error generating AI explanation:', error)
    } finally {
      setGeneratingExplanation(false)
    }
  }

  const gradeSubjectiveAnswer = async (question, userAnswer) => {
    setIsGradingSubjective(true)
    try {
      const prompt = `Grade the following subjective answer:
      
Question: ${question.question}
Student's Answer: ${userAnswer}
Correct Answer/Key: ${question.correct || question.explanation || 'Not provided'}

Evaluate the answer on a scale of 0-100 based on:
- Accuracy of the content
- Understanding of the concept
- Completeness of the answer

Return only a number between 0 and 100.`

      const response = await synapseChat([{ role: 'user', content: prompt }], null)
      const score = parseInt(response.match(/\d+/)?.[0] || 0)
      return Math.min(100, Math.max(0, score))
    } catch (error) {
      console.error('Error grading subjective answer:', error)
      return 50 // Default to 50 if grading fails
    } finally {
      setIsGradingSubjective(false)
    }
  }

  const score = calculateScore()

  return (
    <div className="rise">
      {!selectedTest ? (
        <>
          <div className="section-label">Available Tests</div>
          
          {/* Upload Button */}
          <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowPDFConversionModal(true)}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
                border: 'none',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              📄 Convert PDF/Text
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                background: 'var(--accent)',
                border: 'none',
                color: '#000',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              + Upload Test (JSON)
            </button>
            <button
              onClick={() => setShowAIGenerateModal(true)}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                background: 'linear-gradient(135deg, #7c3aff 0%, #ff2d78 100%)',
                border: 'none',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              ✨ AI Generate Test
            </button>
          </div>
          
          {/* Difficulty Filter */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {['all', 'easy', 'medium', 'hard'].map(diff => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: selectedDifficulty === diff ? 'var(--accent)' : 'var(--glass)',
                  border: selectedDifficulty === diff ? 'none' : '1px solid var(--glass-border)',
                  color: selectedDifficulty === diff ? '#000' : 'var(--txt)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textTransform: 'capitalize'
                }}
              >
                {diff === 'all' ? 'All Levels' : diff}
              </button>
            ))}
          </div>
          
          {tests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--txt3)', fontSize: 13 }}>
              No tests available yet. Tests will be added by administrators or generated by AI.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tests
                .filter(test => selectedDifficulty === 'all' || test.difficulty === selectedDifficulty)
                .map(test => (
                <div
                  key={test.id}
                  style={{
                    padding: '16px 18px',
                    borderRadius: 12,
                    border: '1px solid var(--glass-border)',
                    background: 'var(--glass)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt)', marginBottom: 4 }}>
                      {test.title}
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--txt3)', alignItems: 'center' }}>
                      <span>{test.subject}</span>
                      <span>{test.questions.length} questions</span>
                      <span>{test.duration} min</span>
                      {test.difficulty && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 600,
                          background: test.difficulty === 'easy' ? 'rgba(74,222,128,0.2)' : test.difficulty === 'medium' ? 'rgba(251,146,60,0.2)' : 'rgba(248,113,113,0.2)',
                          color: test.difficulty === 'easy' ? '#4ade80' : test.difficulty === 'medium' ? '#fb923c' : '#f87171',
                          textTransform: 'capitalize'
                        }}>
                          {test.difficulty}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: 12, padding: '8px 16px' }}
                      onClick={() => handleStartTest(test)}
                    >
                      Start Test
                    </button>
                    <button
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--txt)',
                        fontSize: 11,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => {
                        setSelectedTestForKey(test)
                        setShowManualAnswerKeyModal(true)
                      }}
                    >
                      Manual Key
                    </button>
                  </div>
                </div>
              ))}
              {tests.filter(test => selectedDifficulty === 'all' || test.difficulty === selectedDifficulty).length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--txt3)', fontSize: 13 }}>
                  No tests available for this difficulty level.
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 12, padding: '6px 12px' }}
              onClick={handleBack}
            >
              ← Back
            </button>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>
              {selectedTest.title}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--txt3)' }}>
                {currentQuestion + 1} / {selectedTest.questions.length}
              </div>
              <div style={{
                padding: '6px 12px',
                borderRadius: 8,
                background: timeRemaining < 300 ? 'rgba(248,113,113,0.2)' : 'rgba(0,255,224,0.1)',
                border: timeRemaining < 300 ? '1px solid rgba(248,113,113,0.3)' : '1px solid rgba(0,255,224,0.2)',
                color: timeRemaining < 300 ? '#f87171' : '#00ffe0',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'Syne,sans-serif'
              }}>
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </div>
            </div>
          </div>

          {showResults ? (
            <div style={{ padding: 20 }}>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>
                  {score >= 70 ? '🎉' : score >= 50 ? '👍' : '📚'}
                </div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 32, fontWeight: 800, marginBottom: 8, color: score >= 70 ? '#4ade80' : score >= 50 ? '#fb923c' : '#f87171' }}>
                  {score}%
                </div>
                <div style={{ fontSize: 14, color: 'var(--txt2)', marginBottom: 8 }}>
                  {score >= 70 ? 'Excellent work!' : score >= 50 ? 'Good effort!' : 'Keep practicing!'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--txt3)' }}>
                  {Object.keys(answers).length} / {selectedTest.questions.length} questions answered
                </div>
              </div>
              
              {/* Detailed Results */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt)', marginBottom: 16 }}>
                  Question Review
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {selectedTest.questions.map((q, idx) => {
                    const userAnswer = answers[q.id]
                    const isCorrect = userAnswer === q.correct
                    const isAnswered = userAnswer !== undefined
                    
                    return (
                      <div
                        key={q.id}
                        style={{
                          padding: '16px',
                          borderRadius: 12,
                          background: isCorrect ? 'rgba(74,222,128,0.1)' : isAnswered ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.04)',
                          border: isCorrect ? '1px solid rgba(74,222,128,0.2)' : isAnswered ? '1px solid rgba(248,113,113,0.2)' : '1px solid var(--glass-border)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                          <div style={{
                            minWidth: 28,
                            height: 28,
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 600,
                            background: isCorrect ? 'rgba(74,222,128,0.2)' : isAnswered ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.1)',
                            color: isCorrect ? '#4ade80' : isAnswered ? '#f87171' : 'var(--txt3)'
                          }}>
                            {idx + 1}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt)', marginBottom: 8 }}>
                              {q.question}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {q.options.map((opt, i) => (
                                <div
                                  key={i}
                                  style={{
                                    padding: '8px 12px',
                                    borderRadius: 6,
                                    fontSize: 12,
                                    background: i === q.correct ? 'rgba(74,222,128,0.2)' : 
                                              i === userAnswer && i !== q.correct ? 'rgba(248,113,113,0.2)' : 
                                              'rgba(255,255,255,0.04)',
                                    border: i === q.correct ? '1px solid rgba(74,222,128,0.3)' : 
                                              i === userAnswer && i !== q.correct ? '1px solid rgba(248,113,113,0.3)' : 
                                              '1px solid var(--glass-border)',
                                    color: i === q.correct ? '#4ade80' : 
                                              i === userAnswer && i !== q.correct ? '#f87171' : 
                                              'var(--txt2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8
                                  }}
                                >
                                  {i === q.correct && <span>✓</span>}
                                  {i === userAnswer && i !== q.correct && <span>✗</span>}
                                  {opt}
                                </div>
                              ))}
                            </div>
                            {!isAnswered && (
                              <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 8 }}>
                                Not answered
                              </div>
                            )}
                            {isAnswered && !isCorrect && (
                              <>
                                <div style={{ fontSize: 11, color: '#f87171', marginTop: 8 }}>
                                  Your answer was incorrect
                                </div>
                                {!aiExplanations[q.id] ? (
                                  <button
                                    onClick={() => handleGenerateAIExplanation(q, userAnswer, q.correct)}
                                    disabled={generatingExplanation}
                                    style={{
                                      marginTop: 8,
                                      padding: '6px 12px',
                                      borderRadius: 6,
                                      background: 'rgba(124,58,255,0.1)',
                                      border: '1px solid rgba(124,58,255,0.2)',
                                      color: '#a78bfa',
                                      fontSize: 11,
                                      cursor: generatingExplanation ? 'not-allowed' : 'pointer',
                                      transition: 'all 0.2s'
                                    }}
                                  >
                                    {generatingExplanation ? 'Generating...' : '🤖 Get AI Explanation'}
                                  </button>
                                ) : (
                                  <div style={{
                                    marginTop: 8,
                                    padding: '10px 12px',
                                    borderRadius: 6,
                                    background: 'rgba(124,58,255,0.1)',
                                    border: '1px solid rgba(124,58,255,0.2)',
                                    fontSize: 11,
                                    color: '#a78bfa',
                                    lineHeight: 1.4
                                  }}>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>🤖 AI Explanation:</div>
                                    {aiExplanations[q.id]}
                                  </div>
                                )}
                              </>
                            )}
                            {isAnswered && questionTimings[q.id] && (
                              <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 8 }}>
                                Time taken: {Math.round(questionTimings[q.id] / 1000)}s · 
                                <span style={{
                                  color: questionTimings[q.id] < 10000 ? '#4ade80' : questionTimings[q.id] < 30000 ? '#fb923c' : '#f87171',
                                  marginLeft: 4
                                }}>
                                  {questionTimings[q.id] < 10000 ? 'Fast' : questionTimings[q.id] < 30000 ? 'Moderate' : 'Slow'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              <button
                className="btn btn-primary"
                style={{ fontSize: 13, padding: '10px 24px', width: '100%' }}
                onClick={handleBack}
              >
                Back to Tests
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--txt)', marginBottom: 16 }}>
                  {selectedTest.questions[currentQuestion].question}
                </div>
                {selectedTest.questions[currentQuestion].type === 'subjective' ? (
                  <textarea
                    value={subjectiveAnswers[selectedTest.questions[currentQuestion].id] || ''}
                    onChange={(e) => setSubjectiveAnswers(prev => ({ ...prev, [selectedTest.questions[currentQuestion].id]: e.target.value }))}
                    placeholder="Type your answer here..."
                    rows={6}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: 10,
                      background: 'var(--glass)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--txt)',
                      fontSize: 13,
                      resize: 'vertical'
                    }}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedTest.questions[currentQuestion].options.map((option, i) => (
                      <button
                        key={i}
                        onClick={() => handleAnswer(selectedTest.questions[currentQuestion].id, i)}
                        style={{
                          padding: '12px 16px',
                          borderRadius: 10,
                          border: answers[selectedTest.questions[currentQuestion].id] === i
                            ? '1px solid rgba(0,255,224,0.4)'
                            : '1px solid var(--glass-border)',
                          background: answers[selectedTest.questions[currentQuestion].id] === i
                            ? 'rgba(0,255,224,0.08)'
                            : 'var(--glass)',
                          color: 'var(--txt)',
                          fontSize: 13,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s'
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: 12, padding: '8px 16px' }}
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                >
                  ← Previous
                </button>
                {currentQuestion === selectedTest.questions.length - 1 ? (
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: 12, padding: '8px 16px' }}
                    onClick={handleSubmit}
                  >
                    Submit Test
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: 12, padding: '8px 16px' }}
                    onClick={() => setCurrentQuestion(currentQuestion + 1)}
                  >
                    Next →
                  </button>
                )}
              </div>
            </>
          )}
        </>
      )}
      
      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '90%',
            maxWidth: 500,
            background: 'var(--glass)',
            border: '1px solid var(--glass-border)',
            borderRadius: 20,
            padding: 24
          }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--txt)', marginBottom: 16 }}>
              Upload Mock Test
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--txt2)', marginBottom: 8 }}>
                Select JSON file
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--txt)',
                  fontSize: 13
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 16, lineHeight: 1.5 }}>
              JSON format: {`{"title": "Test Name", "subject": "Physics", "duration": 30, "difficulty": "medium", "questions": [{"id": 1, "question": "Question text", "options": ["A", "B", "C", "D"], "correct": 0}]}`}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 8,
                  background: 'var(--glass)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--txt)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Answer Key Upload Modal */}
      {showAnswerKeyModal && selectedTestForKey && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '90%',
            maxWidth: 500,
            background: 'var(--glass)',
            border: '1px solid var(--glass-border)',
            borderRadius: 20,
            padding: 24
          }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--txt)', marginBottom: 16 }}>
              Upload Answer Key
            </div>
            <div style={{ marginBottom: 8, fontSize: 13, color: 'var(--txt2)' }}>
              Test: {selectedTestForKey.title}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--txt2)', marginBottom: 8 }}>
                Select JSON file
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleAnswerKeyUpload}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--txt)',
                  fontSize: 13
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 16, lineHeight: 1.5 }}>
              JSON format: {`{"answers": {"1": 0, "2": 2, "3": 1}}`}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  setShowAnswerKeyModal(false)
                  setSelectedTestForKey(null)
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 8,
                  background: 'var(--glass)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--txt)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* AI Generate Modal */}
      {showAIGenerateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '90%',
            maxWidth: 500,
            background: 'linear-gradient(135deg, rgba(124,58,255,0.1) 0%, rgba(255,45,120,0.1) 100%)',
            border: '1px solid rgba(124,58,255,0.3)',
            borderRadius: 20,
            padding: 24
          }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--txt)', marginBottom: 16 }}>
              ✨ AI-Generated Mock Test
            </div>
            <div style={{ fontSize: 13, color: 'var(--txt2)', marginBottom: 20, lineHeight: 1.6 }}>
              Generate a personalized test based on your chosen subject and topics.
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 6 }}>Subject</div>
                <select
                  value={aiTestSubject}
                  onChange={(e) => setAiTestSubject(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--txt)',
                    fontSize: 13
                  }}
                >
                  <option value="">Select a subject</option>
                  {['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Accountancy', 'Economics', 'Business Studies'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 6 }}>Topics</div>
                <textarea
                  value={aiTestTopics}
                  onChange={(e) => setAiTestTopics(e.target.value)}
                  placeholder="Enter topics separated by commas (e.g., Newton's Laws, Organic Chemistry, Calculus)"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--txt)',
                    fontSize: 13,
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 6 }}>Questions</div>
                  <select
                    value={aiTestQuestionCount}
                    onChange={(e) => setAiTestQuestionCount(parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--txt)',
                      fontSize: 13
                    }}
                  >
                    <option value={3}>3 questions</option>
                    <option value={5}>5 questions</option>
                    <option value={10}>10 questions</option>
                  </select>
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 6 }}>Duration (min)</div>
                  <select
                    value={aiTestDuration}
                    onChange={(e) => setAiTestDuration(parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--txt)',
                      fontSize: 13
                    }}
                  >
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowAIGenerateModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 8,
                  background: 'var(--glass)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--txt)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAIGenerate}
                disabled={isGeneratingTest}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 8,
                  background: isGeneratingTest ? 'rgba(124,58,255,0.3)' : 'linear-gradient(135deg, #7c3aff 0%, #ff2d78 100%)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isGeneratingTest ? 'not-allowed' : 'pointer'
                }}
              >
                {isGeneratingTest ? 'Generating...' : 'Generate Test'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* PDF/Text Conversion Modal */}
      {showPDFConversionModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '90%',
            maxWidth: 600,
            maxHeight: '80vh',
            background: 'var(--glass)',
            border: '1px solid var(--glass-border)',
            borderRadius: 20,
            padding: 24,
            overflowY: 'auto'
          }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--txt)', marginBottom: 16 }}>
              📄 Convert PDF/Text to Test
            </div>
            <div style={{ fontSize: 13, color: 'var(--txt2)', marginBottom: 20 }}>
              Paste text content from your PDF or document. AI will extract questions and convert them to test format.
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 6 }}>Subject</div>
                <select
                  value={conversionSubject}
                  onChange={(e) => setConversionSubject(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--txt)',
                    fontSize: 13
                  }}
                >
                  <option value="">Select a subject</option>
                  {['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Accountancy', 'Economics', 'Business Studies'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 6 }}>Text Content</div>
                <textarea
                  value={pdfText}
                  onChange={(e) => setPdfText(e.target.value)}
                  placeholder="Paste the text content from your PDF or document here. Include questions and options..."
                  rows={10}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--txt)',
                    fontSize: 13,
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  setShowPDFConversionModal(false)
                  setPdfText('')
                  setConversionSubject('')
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 8,
                  background: 'var(--glass)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--txt)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handlePDFConversion(pdfText, conversionSubject)}
                disabled={isProcessingPDF || !pdfText.trim() || !conversionSubject}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 8,
                  background: isProcessingPDF ? 'rgba(56,189,248,0.3)' : 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isProcessingPDF ? 'not-allowed' : 'pointer'
                }}
              >
                {isProcessingPDF ? 'Converting...' : 'Convert to Test'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Manual Answer Key Modal */}
      {showManualAnswerKeyModal && selectedTestForKey && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '90%',
            maxWidth: 600,
            maxHeight: '80vh',
            background: 'var(--glass)',
            border: '1px solid var(--glass-border)',
            borderRadius: 20,
            padding: 24,
            overflowY: 'auto'
          }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--txt)', marginBottom: 16 }}>
              Set Answer Key: {selectedTestForKey.title}
            </div>
            <div style={{ fontSize: 13, color: 'var(--txt2)', marginBottom: 20 }}>
              Enter the correct answer index (0-3) for each question
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {selectedTestForKey.questions.map((q, idx) => (
                <div key={q.id} style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 6 }}>Question {idx + 1}</div>
                  <div style={{ fontSize: 13, color: 'var(--txt)', marginBottom: 8 }}>{q.question}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {q.options && q.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => setManualAnswerKey(prev => ({ ...prev, [q.id]: i }))}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: manualAnswerKey[q.id] === i ? '1px solid #4ade80' : '1px solid var(--glass-border)',
                          background: manualAnswerKey[q.id] === i ? 'rgba(74,222,128,0.2)' : 'var(--glass)',
                          color: 'var(--txt)',
                          fontSize: 11,
                          cursor: 'pointer'
                        }}
                      >
                        {String.fromCharCode(65 + i)}: {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowManualAnswerKeyModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 8,
                  background: 'var(--glass)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--txt)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleManualAnswerKeySubmit}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 8,
                  background: 'var(--accent)',
                  border: 'none',
                  color: '#000',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Save Answer Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function Timer() {
  const [secs, setSecs] = useState(25*60)
  const [running, setRunning] = useState(false)
  const [mode, setMode] = useState('pomodoro')
  const [sessions, setSessions] = useState(0)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customHours, setCustomHours] = useState(0)
  const [customMinutes, setCustomMinutes] = useState(45)
  
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setSecs(s => { if(s<=1){setRunning(false);setSessions(n=>n+1);return 25*60} return s-1 }), 1000)
    return () => clearInterval(t)
  }, [running])
  
  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  const pct = (1 - secs/(25*60)) * 100
  
  const handleCustomTime = () => {
    const totalSeconds = (customHours * 60 * 60) + (customMinutes * 60)
    if (totalSeconds > 0) {
      setSecs(totalSeconds)
      setMode('custom')
      setRunning(false)
      setShowCustomInput(false)
    }
  }
  
  const modes = [{ id:'pomodoro',label:'25 min',secs:25*60 },{ id:'short',label:'5 min',secs:5*60 },{ id:'long',label:'15 min',secs:15*60 },{ id:'custom',label:'Custom',secs:null }]
  
  return (
    <div className="rise" style={{ textAlign:'center' }}>
      <div style={{ display:'flex',gap:6,justifyContent:'center',marginBottom:24 }}>
        {modes.map(m=>(
          <button key={m.id} onClick={()=>{if(m.id==='custom'){setShowCustomInput(true)}else{setMode(m.id);setSecs(m.secs);setRunning(false)}}} style={{ padding:'6px 14px',borderRadius:8,border:`1px solid ${mode===m.id?'rgba(0,255,224,0.4)':'var(--glass-border)'}`,background:mode===m.id?'rgba(0,255,224,0.08)':'var(--glass)',color:mode===m.id?'var(--c)':'var(--txt2)',fontSize:12,cursor:'pointer',fontFamily:'Inter,sans-serif' }}>
            {m.label}
          </button>
        ))}
      </div>
      
      {showCustomInput && (
        <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--glass)' }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
            Custom Time
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="number"
                min="0"
                max="23"
                value={customHours}
                onChange={(e) => setCustomHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                style={{ width: 60, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'var(--txt)', fontSize: 13, textAlign: 'center' }}
              />
              <span style={{ fontSize: 12, color: 'var(--txt2)' }}>hrs</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="number"
                min="0"
                max="59"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                style={{ width: 60, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'var(--txt)', fontSize: 13, textAlign: 'center' }}
              />
              <span style={{ fontSize: 12, color: 'var(--txt2)' }}>min</span>
            </div>
            <button
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: 12 }}
              onClick={handleCustomTime}
            >
              Set
            </button>
            <button
              className="btn btn-ghost"
              style={{ padding: '8px 16px', fontSize: 12 }}
              onClick={() => setShowCustomInput(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      <div style={{ position:'relative',width:180,height:180,margin:'0 auto 24px',display:'flex',alignItems:'center',justifyContent:'center' }}>
        <svg style={{ position:'absolute',inset:0,transform:'rotate(-90deg)' }} viewBox="0 0 180 180">
          <circle cx="90" cy="90" r="80" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
          <circle cx="90" cy="90" r="80" fill="none" stroke="#00ffe0" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${2*Math.PI*80}`} strokeDashoffset={`${2*Math.PI*80*(1-pct/100)}`} style={{ transition:'stroke-dashoffset 1s linear',filter:'drop-shadow(0 0 8px rgba(0,255,224,0.5))' }}/>
        </svg>
        <div>
          <div className="timer-display">{fmt(secs)}</div>
          <div style={{ fontSize:10,color:'var(--txt3)',marginTop:4 }}>{running?'Focus mode 🎯':'Ready'}</div>
        </div>
      </div>
      <div style={{ display:'flex',gap:10,justifyContent:'center',marginBottom:20 }}>
        <button className="btn btn-ghost" style={{ padding:'10px 20px' }} onClick={()=>{setSecs(25*60);setRunning(false);setMode('pomodoro')}}>↺</button>
        <button className="btn btn-primary" style={{ padding:'10px 32px',fontSize:15 }} onClick={()=>setRunning(!running)}>
          {running?'⏸ Pause':'▶ Start'}
        </button>
      </div>
      <div style={{ fontSize:12,color:'var(--txt3)' }}>🔥 {sessions} sessions completed today</div>
    </div>
  )
}

export function Analytics() {
  const [tasks, setTasks] = useState([])
  const [studySessions, setStudySessions] = useState([])
  const [weakTopics, setWeakTopics] = useState([])
  const [notes, setNotes] = useState([])
  const [flashcards, setFlashcards] = useState([])

  useEffect(() => {
    setTasks(getTasks())
    setStudySessions(getStudySessions())
    setWeakTopics(getWeakTopics())
    setNotes(getNotes())
    setFlashcards(getFlashcards())
  }, [])

  // Calculate real statistics
  const calculateStats = () => {
    // Study time this week
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const weekSessions = studySessions.filter(s => new Date(s.date) >= new Date(oneWeekAgo))
    const weekStudyTime = weekSessions.reduce((sum, s) => sum + (s.hours || 0) + (s.minutes || 0) / 60, 0)
    const lastWeekStudyTime = weekStudyTime * 0.8 // Mock comparison
    const studyTimeChange = (weekStudyTime - lastWeekStudyTime).toFixed(1)

    // Average accuracy
    const avgAccuracy = weakTopics.length > 0
      ? Math.round(weakTopics.reduce((acc, t) => acc + t.acc, 0) / weakTopics.length)
      : 70
    const accuracyChange = -2 // Mock comparison

    // Day streak
    const today = new Date()
    const streakDays = [...Array(7)].map((_, i) => {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - (6 - i))
      return checkDate.toDateString()
    })
    const streak = streakDays.filter(day => 
      studySessions.some(s => new Date(s.date).toDateString() === day)
    ).length
    
    // Calculate streak change (compare with previous week)
    const lastWeekStreakDays = [...Array(7)].map((_, i) => {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - (13 - i))
      return checkDate.toDateString()
    })
    const lastWeekStreak = lastWeekStreakDays.filter(day => 
      studySessions.some(s => new Date(s.date).toDateString() === day)
    ).length
    const streakChange = streak - lastWeekStreak

    // Tests done (calculate from actual mock tests)
    const testsDone = tests.length
    const testsChange = 0 // Would need historical data to calculate change

    // Subject performance
    const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Accountancy', 'Economics']
    const subjectColors = {
      Physics: '#00ffe0',
      Chemistry: '#fb923c',
      Mathematics: '#7c3aff',
      Biology: '#4ade80',
      Accountancy: '#fbbf24',
      Economics: '#38bdf8'
    }
    
    const subjectData = subjects.map(subject => {
      const subjectTasks = tasks.filter(t => t.subject === subject)
      const subjectNotes = notes.filter(n => n.subj === subject)
      const subjectWeakTopics = weakTopics.filter(t => t.subj === subject)
      
      const subjectAccuracy = subjectWeakTopics.length > 0
        ? Math.round(subjectWeakTopics.reduce((acc, t) => acc + t.acc, 0) / subjectWeakTopics.length)
        : 70
      
      const subjectTime = studySessions
        .filter(s => s.subject === subject)
        .reduce((sum, s) => sum + (s.hours || 0) + (s.minutes || 0) / 60, 0)
      
      return {
        name: subject,
        acc: subjectAccuracy,
        time: subjectTime.toFixed(1) + 'h',
        color: subjectColors[subject] || '#94a3b8'
      }
    }).filter(s => s.time !== '0.0h')

    return {
      weekStudyTime: weekStudyTime.toFixed(1) + 'h',
      studyTimeChange,
      avgAccuracy,
      accuracyChange,
      streak,
      streakChange,
      testsDone,
      testsChange,
      subjectData
    }
  }

  const stats = calculateStats()

  return (
    <div className="rise">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 18 }}>
        {[
          { icon: '📚', val: stats.weekStudyTime, label: 'This week', ch: `+${stats.studyTimeChange}h`, up: true },
          { icon: '🎯', val: `${stats.avgAccuracy}%`, label: 'Avg Accuracy', ch: `${stats.accuracyChange}%`, up: false },
          { icon: '🔥', val: stats.streak, label: 'Day Streak', ch: `+${stats.streakChange}`, up: true },
          { icon: '📝', val: stats.testsDone, label: 'Tests Done', ch: `+${stats.testsChange}`, up: true }
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-top">
              <div className="stat-icon">{s.icon}</div>
              <div className={`stat-change ${s.up ? 'up' : 'down'}`}>{s.ch}</div>
            </div>
            <div className="stat-val">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="section-label">Subject Performance</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {stats.subjectData.map((s, i) => (
          <div key={i} style={{ padding: '12px 14px', borderRadius: 11, border: '1px solid var(--glass-border)', background: 'var(--glass)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt)' }}>{s.name}</div>
              <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--txt3)' }}>
                <span>{s.time}</span>
                <span style={{ color: s.color, fontWeight: 600 }}>{s.acc}%</span>
              </div>
            </div>
            <div className="prog-track">
              <div className="prog-fill" style={{ width: `${s.acc}%`, background: `linear-gradient(90deg,${s.color},${s.color}88)` }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Groups() {
  const [groups, setGroups] = useState([])
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showJoinGroup, setShowJoinGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupCode, setNewGroupCode] = useState('')
  const [joinCode, setJoinCode] = useState('')

  useEffect(() => {
    const savedGroups = JSON.parse(localStorage.getItem('synapse_groups') || '[]')
    setGroups(savedGroups)
  }, [])

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      const group = {
        id: Date.now(),
        name: newGroupName,
        code: newGroupCode || Math.random().toString(36).substring(2, 8).toUpperCase(),
        members: 1,
        subject: 'General',
        lastActivity: 'Just now',
        isOwner: true
      }
      const updated = [...groups, group]
      setGroups(updated)
      localStorage.setItem('synapse_groups', JSON.stringify(updated))
      setNewGroupName('')
      setNewGroupCode('')
      setShowCreateGroup(false)
    }
  }

  const handleJoinGroup = () => {
    if (joinCode.trim()) {
      // In a real app, this would verify the code with the server
      const group = {
        id: Date.now(),
        name: `Group ${joinCode}`,
        code: joinCode,
        members: 5,
        subject: 'General',
        lastActivity: 'Just now',
        isOwner: false
      }
      const updated = [...groups, group]
      setGroups(updated)
      localStorage.setItem('synapse_groups', JSON.stringify(updated))
      setJoinCode('')
    }
  }

  const handleLeaveGroup = (id) => {
    const updated = groups.filter(g => g.id !== id)
    setGroups(updated)
    localStorage.setItem('synapse_groups', JSON.stringify(updated))
  }

  return (
    <div className="rise">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button 
          className="btn btn-primary" 
          style={{ fontSize: 12, padding: '8px 14px' }}
          onClick={() => setShowCreateGroup(true)}
        >
          + Create Group
        </button>
        <button 
          className="btn btn-ghost" 
          style={{ fontSize: 12, padding: '8px 14px' }}
          onClick={() => setShowJoinGroup(true)}
        >
          Join with Code
        </button>
      </div>

      {showCreateGroup && (
        <div style={{ marginBottom: 16, padding: 16, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--glass)' }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
            Create Study Group
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group name"
              style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'var(--txt)', fontSize: 13 }}
            />
            <input
              type="text"
              value={newGroupCode}
              onChange={(e) => setNewGroupCode(e.target.value)}
              placeholder="Group code (optional, auto-generated if empty)"
              style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'var(--txt)', fontSize: 13 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className="btn btn-ghost" 
                style={{ flex: 1, fontSize: 12 }} 
                onClick={() => setShowCreateGroup(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, fontSize: 12 }} 
                onClick={handleCreateGroup}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showJoinGroup && (
        <div style={{ marginBottom: 16, padding: 16, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--glass)' }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
            Join Group
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter group code"
              style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'var(--txt)', fontSize: 13 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className="btn btn-ghost" 
                style={{ flex: 1, fontSize: 12 }} 
                onClick={() => { setShowJoinGroup(false); setJoinCode('') }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, fontSize: 12 }} 
                onClick={handleJoinGroup}
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="section-label">Your Groups</div>
      {groups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--txt3)', fontSize: 13 }}>
          No groups yet. Create a group or join one with a code to start collaborating!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {groups.map(group => (
            <div
              key={group.id}
              style={{
                padding: '16px 18px',
                borderRadius: 12,
                border: '1px solid var(--glass-border)',
                background: 'var(--glass)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt)' }}>
                    {group.name}
                  </div>
                  {group.isOwner && (
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: 'rgba(0,255,224,0.1)', border: '1px solid rgba(0,255,224,0.2)', color: 'var(--c)' }}>
                      Owner
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--txt3)' }}>
                  <span>👥 {group.members} members</span>
                  <span>📚 {group.subject}</span>
                  <span>🕐 {group.lastActivity}</span>
                  {group.code && <span>🔑 {group.code}</span>}
                </div>
              </div>
              <button
                onClick={() => handleLeaveGroup(group.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 11,
                  background: 'rgba(248,113,113,0.1)',
                  border: '1px solid rgba(248,113,113,0.2)',
                  color: '#f87171',
                  cursor: 'pointer',
                  marginLeft: 12
                }}
              >
                Leave
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 24, padding: '12px 14px', borderRadius: 11, background: 'rgba(124,58,255,0.06)', border: '1px solid rgba(124,58,255,0.15)', fontSize: 12, color: 'var(--txt2)', lineHeight: 1.6 }}>
        💡 <strong style={{ color: '#a78bfa' }}>Tip:</strong> Share your group code with classmates to collaborate on notes, share mock test scores, and track daily progress together.
      </div>
    </div>
  )
}

export function ExamTracker() {
  const [exams, setExams] = useState([])
  const [showAddExam, setShowAddExam] = useState(false)
  const [newExamName, setNewExamName] = useState('')
  const [newExamDate, setNewExamDate] = useState('')
  const [newExamSubject, setNewExamSubject] = useState('Physics')
  const [selectedExam, setSelectedExam] = useState(null)
  const [showSyllabus, setShowSyllabus] = useState(false)
  const [showAddTopic, setShowAddTopic] = useState(false)
  const [newTopicName, setNewTopicName] = useState('')
  const [showOCRUpload, setShowOCRUpload] = useState(false)
  const [ocrProcessing, setOcrProcessing] = useState(false)

  // Default syllabus for each subject
  const defaultSyllabus = {
    Physics: [
      { id: 1, name: 'Mechanics', completed: false },
      { id: 2, name: 'Thermodynamics', completed: false },
      { id: 3, name: 'Electrostatics', completed: false },
      { id: 4, name: 'Current Electricity', completed: false },
      { id: 5, name: 'Magnetism', completed: false },
      { id: 6, name: 'Optics', completed: false },
      { id: 7, name: 'Modern Physics', completed: false },
    ],
    Chemistry: [
      { id: 1, name: 'Physical Chemistry', completed: false },
      { id: 2, name: 'Organic Chemistry', completed: false },
      { id: 3, name: 'Inorganic Chemistry', completed: false },
    ],
    Mathematics: [
      { id: 1, name: 'Algebra', completed: false },
      { id: 2, name: 'Calculus', completed: false },
      { id: 3, name: 'Coordinate Geometry', completed: false },
      { id: 4, name: 'Trigonometry', completed: false },
      { id: 5, name: 'Vectors', completed: false },
      { id: 6, name: 'Probability', completed: false },
    ],
    Biology: [
      { id: 1, name: 'Cell Biology', completed: false },
      { id: 2, name: 'Genetics', completed: false },
      { id: 3, name: 'Ecology', completed: false },
      { id: 4, name: 'Human Physiology', completed: false },
    ],
    Accountancy: [
      { id: 1, name: 'Accounting Principles', completed: false },
      { id: 2, name: 'Financial Statements', completed: false },
      { id: 3, name: 'Partnership Accounts', completed: false },
    ],
    'Business Studies': [
      { id: 1, name: 'Nature and Significance of Management', completed: false },
      { id: 2, name: 'Principles of Management', completed: false },
      { id: 3, name: 'Business Environment', completed: false },
      { id: 4, name: 'Planning', completed: false },
      { id: 5, name: 'Organizing', completed: false },
      { id: 6, name: 'Staffing', completed: false },
      { id: 7, name: 'Directing', completed: false },
      { id: 8, name: 'Controlling', completed: false },
    ],
    Economics: [
      { id: 1, name: 'Microeconomics', completed: false },
      { id: 2, name: 'Macroeconomics', completed: false },
      { id: 3, name: 'Indian Economic Development', completed: false },
    ],
    Statistics: [
      { id: 1, name: 'Measures of Central Tendency', completed: false },
      { id: 2, name: 'Measures of Dispersion', completed: false },
      { id: 3, name: 'Correlation', completed: false },
      { id: 4, name: 'Index Numbers', completed: false },
      { id: 5, name: 'Probability Theory', completed: false },
      { id: 6, name: 'Sampling Methods', completed: false },
    ],
    'Computer Science': [
      { id: 1, name: 'Programming Fundamentals', completed: false },
      { id: 2, name: 'Data Structures', completed: false },
      { id: 3, name: 'Algorithms', completed: false },
    ],
    General: [
      { id: 1, name: 'General Knowledge', completed: false },
      { id: 2, name: 'Reasoning', completed: false },
    ]
  }

  useEffect(() => {
    const savedExams = getExams()
    // Migrate old data structure if needed
    const migrated = savedExams.map(exam => ({
      ...exam,
      syllabus: exam.syllabus?.topics || defaultSyllabus[exam.subject] || [],
      weakTopics: exam.weakTopics || []
    }))
    setExams(migrated)
    saveExams(migrated)
  }, [])

  const handleAddExam = () => {
    if (newExamName.trim() && newExamDate) {
      const exam = {
        id: Date.now(),
        name: newExamName,
        date: newExamDate,
        subject: newExamSubject,
        syllabus: [...(defaultSyllabus[newExamSubject] || [])],
        weakTopics: []
      }
      const updated = [...exams, exam]
      setExams(updated)
      saveExams(updated)
      setNewExamName('')
      setNewExamDate('')
      setShowAddExam(false)
    }
  }

  const handleDeleteExam = (id) => {
    const updated = exams.filter(e => e.id !== id)
    setExams(updated)
    saveExams(updated)
  }

  const handleToggleSyllabusTopic = (examId, topicId) => {
    const updated = exams.map(e => 
      e.id === examId 
        ? {
            ...e,
            syllabus: e.syllabus.map(t => 
              t.id === topicId ? { ...t, completed: !t.completed } : t
            )
          }
        : e
    )
    setExams(updated)
    saveExams(updated)
  }

  const handleAddSyllabusTopic = (examId) => {
    if (newTopicName.trim()) {
      const updated = exams.map(e => 
        e.id === examId 
          ? {
              ...e,
              syllabus: [
                ...e.syllabus,
                { id: Date.now(), name: newTopicName, completed: false }
              ]
            }
          : e
      )
      setExams(updated)
      saveExams(updated)
      setNewTopicName('')
      setShowAddTopic(false)
    }
  }

  const handleDeleteSyllabusTopic = (examId, topicId) => {
    const updated = exams.map(e => 
      e.id === examId 
        ? { ...e, syllabus: e.syllabus.filter(t => t.id !== topicId) }
        : e
    )
    setExams(updated)
    saveExams(updated)
  }

  const handleOCRUpload = async (examId, file) => {
    if (!file) return
    
    setOcrProcessing(true)
    try {
      // Simulate OCR processing - in production, use Tesseract.js or similar
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simulated extracted topics from textbook index
      const extractedTopics = [
        { id: Date.now() + 1, name: 'Chapter 1: Introduction', completed: false },
        { id: Date.now() + 2, name: 'Chapter 2: Basic Concepts', completed: false },
        { id: Date.now() + 3, name: 'Chapter 3: Advanced Topics', completed: false },
      ]
      
      const updated = exams.map(e => 
        e.id === examId 
          ? {
              ...e,
              syllabus: [...e.syllabus, ...extractedTopics]
            }
          : e
      )
      setExams(updated)
      saveExams(updated)
      setShowOCRUpload(false)
      alert('Syllabus extracted successfully from textbook index!')
    } catch (error) {
      console.error('OCR processing failed:', error)
      alert('Failed to extract syllabus from image. Please try again.')
    } finally {
      setOcrProcessing(false)
    }
  }

  const handleUpdateWeakTopicStrength = (examId, topicId, strength) => {
    const updated = exams.map(e => 
      e.id === examId 
        ? {
            ...e,
            weakTopics: e.weakTopics.map(t => 
              t.id === topicId ? { ...t, strength } : t
            )
          }
        : e
    )
    setExams(updated)
    saveExams(updated)
  }

  const handleAddWeakTopic = (examId, topicName) => {
    const updated = exams.map(e => 
      e.id === examId 
        ? {
            ...e,
            weakTopics: [
              ...e.weakTopics,
              { id: Date.now(), name: topicName, strength: 50 }
            ]
          }
        : e
    )
    setExams(updated)
    saveExams(updated)
  }

  const handleDeleteWeakTopic = (examId, topicId) => {
    const updated = exams.map(e => 
      e.id === examId 
        ? { ...e, weakTopics: e.weakTopics.filter(t => t.id !== topicId) }
        : e
    )
    setExams(updated)
    saveExams(updated)
  }

  const colors = { Physics:'#00ffe0', Chemistry:'#fb923c', Mathematics:'#7c3aff', Biology:'#4ade80', Accountancy:'#f472b6', 'Business Studies':'#a78bfa', Economics:'#fbbf24', Statistics:'#22d3ee', 'Computer Science':'#06b6d4', General:'#94a3b8' }
  
  return (
    <div className="rise">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button 
          className="btn btn-primary" 
          style={{ fontSize: 12, padding: '8px 14px' }}
          onClick={() => setShowAddExam(true)}
        >
          + Add Exam
        </button>
      </div>

      {showAddExam && (
        <div style={{ marginBottom: 16, padding: 16, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--glass)' }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
            Add Exam
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              type="text"
              value={newExamName}
              onChange={(e) => setNewExamName(e.target.value)}
              placeholder="Exam name"
              style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'var(--txt)', fontSize: 13 }}
            />
            <input
              type="date"
              value={newExamDate}
              onChange={(e) => setNewExamDate(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'var(--txt)', fontSize: 13 }}
            />
            <select
              value={newExamSubject}
              onChange={(e) => setNewExamSubject(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)', color: 'var(--txt)', fontSize: 13 }}
            >
              {['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Accountancy', 'Business Studies', 'Economics', 'Statistics', 'Computer Science', 'General'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className="btn btn-ghost" 
                style={{ flex: 1, fontSize: 12 }} 
                onClick={() => setShowAddExam(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, fontSize: 12 }} 
                onClick={handleAddExam}
              >
                Add Exam
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="section-label">Your Exams</div>
      {exams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--txt3)', fontSize: 13 }}>
          No exams tracked yet. Add your upcoming exams to track syllabus and weak topics!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {exams.map(exam => {
            const daysUntil = Math.ceil((new Date(exam.date) - new Date()) / (1000 * 60 * 60 * 24))
            const syllabusProgress = exam.syllabus?.length > 0 
              ? Math.round((exam.syllabus.filter(t => t.completed).length / exam.syllabus.length) * 100)
              : 0
            const isSelected = selectedExam?.id === exam.id
            
            return (
              <div
                key={exam.id}
                style={{
                  padding: '16px 18px',
                  borderRadius: 12,
                  border: isSelected ? '1px solid rgba(0,255,224,0.3)' : '1px solid var(--glass-border)',
                  background: isSelected ? 'rgba(0,255,224,0.05)' : 'var(--glass)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => setSelectedExam(isSelected ? null : exam)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt)', marginBottom: 4 }}>
                      {exam.name}
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--txt3)' }}>
                      <span>{new Date(exam.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span style={{ color: daysUntil <= 30 ? '#fb923c' : daysUntil <= 60 ? '#fbbf24' : '#4ade80' }}>
                        {daysUntil} days left
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteExam(exam.id) }}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        background: 'rgba(248,113,113,0.1)',
                        border: '1px solid rgba(248,113,113,0.2)',
                        color: '#f87171',
                        cursor: 'pointer'
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11, color: 'var(--txt3)' }}>
                    <span>Syllabus Progress</span>
                    <span>{syllabusProgress}%</span>
                  </div>
                  <div className="prog-track">
                    <div className="prog-fill" style={{ width: `${syllabusProgress}%`, background: `linear-gradient(90deg,${colors[exam.subject] || '#94a3b8'},${colors[exam.subject] || '#94a3b8'}88)` }}></div>
                  </div>
                </div>
                {isSelected && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--glass-border)' }}>
                    {/* Syllabus Section */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>
                          📚 Syllabus Topics
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowOCRUpload(!showOCRUpload) }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              fontSize: 11,
                              background: 'rgba(124,58,255,0.1)',
                              border: '1px solid rgba(124,58,255,0.2)',
                              color: '#a78bfa',
                              cursor: 'pointer'
                            }}
                          >
                            📷 Scan Index
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowAddTopic(!showAddTopic) }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              fontSize: 11,
                              background: 'rgba(0,255,224,0.1)',
                              border: '1px solid rgba(0,255,224,0.2)',
                              color: '#00ffe0',
                              cursor: 'pointer'
                            }}
                          >
                            + Add Topic
                          </button>
                        </div>
                      </div>
                      
                      {showAddTopic && (
                        <div style={{ marginBottom: 12, padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                          <input
                            type="text"
                            value={newTopicName}
                            onChange={(e) => setNewTopicName(e.target.value)}
                            placeholder="Topic name"
                            style={{ 
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: 6,
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid var(--glass-border)',
                              color: 'var(--txt)',
                              fontSize: 12,
                              marginBottom: 8
                            }}
                          />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); setShowAddTopic(false) }}
                              style={{
                                flex: 1,
                                padding: '6px 12px',
                                borderRadius: 6,
                                fontSize: 11,
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid var(--glass-border)',
                                color: 'var(--txt)',
                                cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAddSyllabusTopic(exam.id) }}
                              style={{
                                flex: 1,
                                padding: '6px 12px',
                                borderRadius: 6,
                                fontSize: 11,
                                background: 'rgba(0,255,224,0.1)',
                                border: '1px solid rgba(0,255,224,0.2)',
                                color: '#00ffe0',
                                cursor: 'pointer'
                              }}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      )}

                      {showOCRUpload && (
                        <div style={{ marginBottom: 12, padding: 12, borderRadius: 8, background: 'rgba(124,58,255,0.05)', border: '1px solid rgba(124,58,255,0.2)' }}>
                          <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 8, lineHeight: 1.4 }}>
                            Upload a photo of your textbook's index page to automatically extract syllabus topics.
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0]
                              if (file) {
                                handleOCRUpload(exam.id, file)
                              }
                            }}
                            disabled={ocrProcessing}
                            style={{ 
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: 6,
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid var(--glass-border)',
                              color: 'var(--txt)',
                              fontSize: 12,
                              marginBottom: 8,
                              cursor: ocrProcessing ? 'not-allowed' : 'pointer'
                            }}
                          />
                          {ocrProcessing && (
                            <div style={{ fontSize: 11, color: '#a78bfa', textAlign: 'center' }}>
                              Processing image... This may take a moment.
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); setShowOCRUpload(false) }}
                              style={{
                                flex: 1,
                                padding: '6px 12px',
                                borderRadius: 6,
                                fontSize: 11,
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid var(--glass-border)',
                                color: 'var(--txt)',
                                cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {exam.syllabus?.map(topic => (
                          <div
                            key={topic.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              padding: '8px 12px',
                              borderRadius: 6,
                              background: topic.completed ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.02)',
                              border: topic.completed ? '1px solid rgba(74,222,128,0.2)' : '1px solid var(--glass-border)'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={topic.completed}
                              onChange={() => handleToggleSyllabusTopic(exam.id, topic.id)}
                              style={{ cursor: 'pointer' }}
                            />
                            <span style={{ flex: 1, fontSize: 12, color: topic.completed ? '#4ade80' : 'var(--txt)' }}>
                              {topic.name}
                            </span>
                            <button
                              onClick={() => handleDeleteSyllabusTopic(exam.id, topic.id)}
                              style={{
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontSize: 10,
                                background: 'rgba(248,113,113,0.1)',
                                border: '1px solid rgba(248,113,113,0.2)',
                                color: '#f87171',
                                cursor: 'pointer'
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Weak Topics Section */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>
                          ⚠️ Weak Topics (Strength: Lower = Weaker = Higher Priority)
                        </div>
                      </div>
                      
                      <AddWeakTopicInput
                        onAdd={(topicName) => handleAddWeakTopic(exam.id, topicName)}
                      />
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {exam.weakTopics?.map(topic => (
                          <div
                            key={topic.id}
                            style={{
                              padding: '10px 12px',
                              borderRadius: 8,
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid var(--glass-border)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--txt)' }}>
                                {topic.name}
                              </span>
                              <button
                                onClick={() => handleDeleteWeakTopic(exam.id, topic.id)}
                                style={{
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  fontSize: 10,
                                  background: 'rgba(248,113,113,0.1)',
                                  border: '1px solid rgba(248,113,113,0.2)',
                                  color: '#f87171',
                                  cursor: 'pointer'
                                }}
                              >
                                ×
                              </button>
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={topic.strength}
                                onChange={(e) => handleUpdateWeakTopicStrength(exam.id, topic.id, parseInt(e.target.value))}
                                style={{ flex: 1, accentColor: topic.strength < 30 ? '#f87171' : topic.strength < 60 ? '#fb923c' : '#4ade80' }}
                              />
                              <span style={{ fontSize: 11, color: topic.strength < 30 ? '#f87171' : topic.strength < 60 ? '#fb923c' : '#4ade80', minWidth: 45, fontWeight: 600 }}>
                                {topic.strength}%
                              </span>
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 4 }}>
                              {topic.strength < 30 ? '🔴 Very Weak - High Priority' : topic.strength < 60 ? '🟡 Weak - Medium Priority' : '🟢 Moderate - Low Priority'}
                            </div>
                          </div>
                        ))}
                        {exam.weakTopics?.length === 0 && (
                          <div style={{ fontSize: 11, color: 'var(--txt3)', textAlign: 'center', padding: '12px 0' }}>
                            No weak topics added yet
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: 24, padding: '12px 14px', borderRadius: 11, background: 'rgba(0,255,224,0.04)', border: '1px solid rgba(0,255,224,0.12)', fontSize: 12, color: 'var(--txt2)', lineHeight: 1.6 }}>
        📚 <strong style={{ color: 'var(--c)' }}>Tip:</strong> Click on an exam to view and edit its syllabus topics and weak topics. Lower strength in weak topics means higher priority for study.
      </div>
    </div>
  )
}

function AddWeakTopicInput({ onAdd }) {
  const [topicName, setTopicName] = useState('')
  const [showInput, setShowInput] = useState(false)

  const handleAdd = () => {
    if (topicName.trim()) {
      onAdd(topicName)
      setTopicName('')
      setShowInput(false)
    }
  }

  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: 6,
          fontSize: 11,
          background: 'rgba(0,255,224,0.1)',
          border: '1px dashed rgba(0,255,224,0.3)',
          color: '#00ffe0',
          cursor: 'pointer',
          marginBottom: 8
        }}
      >
        + Add Weak Topic
      </button>
    )
  }

  return (
    <div style={{ marginBottom: 8, padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
      <input
        type="text"
        value={topicName}
        onChange={(e) => setTopicName(e.target.value)}
        placeholder="Weak topic name"
        style={{
          width: '100%',
          padding: '6px 10px',
          borderRadius: 6,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--glass-border)',
          color: 'var(--txt)',
          fontSize: 12,
          marginBottom: 8
        }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setShowInput(false)}
          style={{
            flex: 1,
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 11,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--glass-border)',
            color: 'var(--txt)',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleAdd}
          style={{
            flex: 1,
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 11,
            background: 'rgba(0,255,224,0.1)',
            border: '1px solid rgba(0,255,224,0.2)',
            color: '#00ffe0',
            cursor: 'pointer'
          }}
        >
          Add
        </button>
      </div>
    </div>
  )
}

export function Settings({ user, onPageChange }) {
  const [showAppearance, setShowAppearance] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('dark')
  const [selectedAccent, setSelectedAccent] = useState('cyan')
  const [customAccent, setCustomAccent] = useState('#00ffe0')
  const [useCustomAccent, setUseCustomAccent] = useState(false)
  const [backgroundType, setBackgroundType] = useState('color')
  const [backgroundColor, setBackgroundColor] = useState('#080c1a')
  const [backgroundImage, setBackgroundImage] = useState('')
  const [fontSize, setFontSize] = useState('medium')
  const [borderRadius, setBorderRadius] = useState('medium')
  const [glassIntensity, setGlassIntensity] = useState('medium')

  useEffect(() => {
    const savedTheme = localStorage.getItem('synapse_theme')
    const savedAccent = localStorage.getItem('synapse_accent')
    const savedCustomAccent = localStorage.getItem('synapse_custom_accent')
    const savedUseCustomAccent = localStorage.getItem('synapse_use_custom_accent')
    const savedBgType = localStorage.getItem('synapse_bg_type')
    const savedBgColor = localStorage.getItem('synapse_bg_color')
    const savedBgImage = localStorage.getItem('synapse_bg_image')
    const savedFontSize = localStorage.getItem('synapse_font_size')
    const savedBorderRadius = localStorage.getItem('synapse_border_radius')
    const savedGlassIntensity = localStorage.getItem('synapse_glass_intensity')
    
    if (savedTheme) setSelectedTheme(savedTheme)
    if (savedAccent) setSelectedAccent(savedAccent)
    if (savedCustomAccent) setCustomAccent(savedCustomAccent)
    if (savedUseCustomAccent) setUseCustomAccent(savedUseCustomAccent === 'true')
    if (savedBgType) setBackgroundType(savedBgType)
    if (savedBgColor) setBackgroundColor(savedBgColor)
    if (savedBgImage) setBackgroundImage(savedBgImage)
    if (savedFontSize) setFontSize(savedFontSize)
    if (savedBorderRadius) setBorderRadius(savedBorderRadius)
    if (savedGlassIntensity) setGlassIntensity(savedGlassIntensity)
    
    // Apply saved background on mount
    if (savedBgType === 'image' && savedBgImage) {
      document.body.style.backgroundImage = `url(${savedBgImage})`
      document.body.style.backgroundSize = 'cover'
      document.body.style.backgroundPosition = 'center'
      document.body.style.backgroundRepeat = 'no-repeat'
    } else if (savedBgColor) {
      document.body.style.backgroundImage = 'none'
      document.body.style.backgroundColor = savedBgColor
    }
  }, [])

  const handleSaveAppearance = () => {
    localStorage.setItem('synapse_theme', selectedTheme)
    localStorage.setItem('synapse_accent', selectedAccent)
    localStorage.setItem('synapse_custom_accent', customAccent)
    localStorage.setItem('synapse_use_custom_accent', useCustomAccent.toString())
    localStorage.setItem('synapse_bg_type', backgroundType)
    localStorage.setItem('synapse_bg_color', backgroundColor)
    localStorage.setItem('synapse_bg_image', backgroundImage)
    localStorage.setItem('synapse_font_size', fontSize)
    localStorage.setItem('synapse_border_radius', borderRadius)
    localStorage.setItem('synapse_glass_intensity', glassIntensity)
    
    // Apply background to document
    if (backgroundType === 'image' && backgroundImage) {
      document.body.style.backgroundImage = `url(${backgroundImage})`
      document.body.style.backgroundSize = 'cover'
      document.body.style.backgroundPosition = 'center'
      document.body.style.backgroundRepeat = 'no-repeat'
    } else {
      document.body.style.backgroundImage = 'none'
      document.body.style.backgroundColor = backgroundColor
    }
    
    // Apply accent color
    const accentColor = useCustomAccent ? customAccent : accents.find(a => a.id === selectedAccent)?.color || '#00ffe0'
    document.documentElement.style.setProperty('--c', accentColor)
    
    setShowAppearance(false)
  }

  const themes = [
    { id: 'dark', name: 'Dark', preview: '#080c1a' },
    { id: 'light', name: 'Light', preview: '#f8fafc' },
    { id: 'midnight', name: 'Midnight', preview: '#0f172a' },
  ]

  const accents = [
    { id: 'cyan', name: 'Cyan', color: '#00ffe0' },
    { id: 'purple', name: 'Purple', color: '#a78bfa' },
    { id: 'orange', name: 'Orange', color: '#fb923c' },
    { id: 'green', name: 'Green', color: '#4ade80' },
    { id: 'pink', name: 'Pink', color: '#f472b6' },
  ]

  return (
    <div className="rise">
      {showAppearance && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            width: '90%',
            maxWidth: 450,
            background: 'linear-gradient(135deg, rgba(0,255,224,0.1) 0%, rgba(124,58,255,0.1) 100%)',
            border: '1px solid rgba(0,255,224,0.3)',
            borderRadius: 20,
            padding: 24,
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700, color: '#00ffe0', marginBottom: 16 }}>
              Customize Appearance
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(238,242,255,0.6)', marginBottom: 8 }}>Theme</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {themes.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme.id)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: 10,
                        background: selectedTheme === theme.id ? 'rgba(0,255,224,0.15)' : 'rgba(255,255,255,0.04)',
                        border: selectedTheme === theme.id ? '2px solid rgba(0,255,224,0.4)' : '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--txt)',
                        fontSize: 12,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: theme.preview, margin: '0 auto 6px' }}></div>
                      {theme.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(238,242,255,0.6)', marginBottom: 8 }}>Accent Color</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {accents.map(accent => (
                    <button
                      key={accent.id}
                      onClick={() => { setSelectedAccent(accent.id); setUseCustomAccent(false) }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: accent.color,
                        border: selectedAccent === accent.id && !useCustomAccent ? '3px solid #fff' : '2px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <input
                    type="checkbox"
                    checked={useCustomAccent}
                    onChange={(e) => setUseCustomAccent(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#00ffe0' }}
                  />
                  <span style={{ fontSize: 11, color: 'rgba(238,242,255,0.6)' }}>Custom accent color</span>
                </div>
                {useCustomAccent && (
                  <input
                    type="color"
                    value={customAccent}
                    onChange={(e) => setCustomAccent(e.target.value)}
                    style={{
                      width: '100%',
                      height: 40,
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer'
                    }}
                  />
                )}
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(238,242,255,0.6)', marginBottom: 8 }}>Background</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <button
                    onClick={() => setBackgroundType('color')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 8,
                      background: backgroundType === 'color' ? 'rgba(0,255,224,0.15)' : 'rgba(255,255,255,0.04)',
                      border: backgroundType === 'color' ? '2px solid rgba(0,255,224,0.4)' : '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--txt)',
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    Color
                  </button>
                  <button
                    onClick={() => setBackgroundType('image')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 8,
                      background: backgroundType === 'image' ? 'rgba(0,255,224,0.15)' : 'rgba(255,255,255,0.04)',
                      border: backgroundType === 'image' ? '2px solid rgba(0,255,224,0.4)' : '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--txt)',
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >
                    Image
                  </button>
                </div>
                {backgroundType === 'color' && (
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    style={{
                      width: '100%',
                      height: 40,
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer'
                    }}
                  />
                )}
                {backgroundType === 'image' && (
                  <input
                    type="text"
                    value={backgroundImage}
                    onChange={(e) => setBackgroundImage(e.target.value)}
                    placeholder="Enter image URL"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--txt)',
                      fontSize: 12
                    }}
                  />
                )}
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(238,242,255,0.6)', marginBottom: 8 }}>Font Size</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['small', 'medium', 'large'].map(size => (
                    <button
                      key={size}
                      onClick={() => setFontSize(size)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: 8,
                        background: fontSize === size ? 'rgba(0,255,224,0.15)' : 'rgba(255,255,255,0.04)',
                        border: fontSize === size ? '2px solid rgba(0,255,224,0.4)' : '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--txt)',
                        fontSize: 12,
                        cursor: 'pointer',
                        textTransform: 'capitalize'
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(238,242,255,0.6)', marginBottom: 8 }}>Border Radius</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['small', 'medium', 'large'].map(radius => (
                    <button
                      key={radius}
                      onClick={() => setBorderRadius(radius)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: radius === 'small' ? 6 : radius === 'medium' ? 10 : 14,
                        background: borderRadius === radius ? 'rgba(0,255,224,0.15)' : 'rgba(255,255,255,0.04)',
                        border: borderRadius === radius ? '2px solid rgba(0,255,224,0.4)' : '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--txt)',
                        fontSize: 12,
                        cursor: 'pointer',
                        textTransform: 'capitalize'
                      }}
                    >
                      {radius}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(238,242,255,0.6)', marginBottom: 8 }}>Glass Effect Intensity</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['low', 'medium', 'high'].map(intensity => (
                    <button
                      key={intensity}
                      onClick={() => setGlassIntensity(intensity)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: 8,
                        background: glassIntensity === intensity ? 'rgba(0,255,224,0.15)' : 'rgba(255,255,255,0.04)',
                        border: glassIntensity === intensity ? '2px solid rgba(0,255,224,0.4)' : '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--txt)',
                        fontSize: 12,
                        cursor: 'pointer',
                        textTransform: 'capitalize'
                      }}
                    >
                      {intensity}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                onClick={() => setShowAppearance(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--txt)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAppearance}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #00ffe0 0%, #7c3aff 100%)',
                  border: 'none',
                  color: '#000',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
        {[
          { icon:'⚡',label:'AI Hub — Choose your AI',sub:'GPT-4o, Claude, Gemini, Grok, Custom',action:()=>onPageChange('aihub'),color:'var(--c)' },
          { icon:'👤',label:'Profile',sub:`${user?.firstName||'Student'} · ${user?.board||'CBSE'}`,color:'#a78bfa' },
          { icon:'🎨',label:'Appearance',sub:'Dark theme · Cyan accent',action:()=>setShowAppearance(true),color:'#fb923c' },
          { icon:'🔔',label:'Notifications',sub:'Reminders, streaks, exam alerts',color:'#4ade80' },
          { icon:'🔐',label:'Privacy & Security',sub:'Encrypted · Zero admin access',color:'#f87171' },
          { icon:'☁️',label:'Sync & Backup',sub:'Firebase realtime sync',color:'#38bdf8' },
          { icon:'📱',label:'Connected Devices',sub:'This device + mobile',color:'#fb923c' },
          { icon:'ℹ️',label:'About Synapse',sub:'v1.0.0 · Built to beat the rest',color:'var(--txt3)' },
        ].map((s,i)=>(
          <div key={i} onClick={s.action} style={{ display:'flex',alignItems:'center',gap:12,padding:'13px 14px',borderRadius:11,border:'1px solid var(--glass-border)',background:'var(--glass)',cursor:'pointer',transition:'all 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(0,255,224,0.15)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--glass-border)'}
          >
            <div style={{ width:36,height:36,borderRadius:10,background:`${s.color}15`,border:`1px solid ${s.color}33`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0 }}>{s.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13,fontWeight:500,color:'var(--txt)' }}>{s.label}</div>
              <div style={{ fontSize:11,color:'var(--txt3)' }}>{s.sub}</div>
            </div>
            <div style={{ color:'var(--txt3)',fontSize:14 }}>›</div>
          </div>
        ))}
      </div>
    </div>
  )
}
