import { useState, useEffect, useMemo } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { getNotes, getTasks, saveTasks, getStudySessions, saveStudySessions, getExams, saveExams, getWeakTopics, saveWeakTopics } from '../lib/storage'

export default function Dashboard({ user, onPageChange }) {
  const [greeting, setGreeting] = useState('')
  const [date, setDate] = useState('')
  const [stats, setStats] = useState({ streak: 0, studyTime: 0, accuracy: 0, notesCount: 0 })
  const [streakTarget] = useState(20)
  const [tasks, setTasks] = useState([])
  const [weakTopics, setWeakTopics] = useState([])
  const [exams, setExams] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [newTask, setNewTask] = useState('')
  const [showAddTask, setShowAddTask] = useState(false)
  const [showAddExam, setShowAddExam] = useState(false)
  const [newExamName, setNewExamName] = useState('')
  const [newExamDate, setNewExamDate] = useState('')
  const [showLogStudy, setShowLogStudy] = useState(false)
  const [studyHours, setStudyHours] = useState('')
  const [studyMinutes, setStudyMinutes] = useState('')
  const [studySubject, setStudySubject] = useState('')
  const [showAddWeakTopic, setShowAddWeakTopic] = useState(false)
  const [newWeakTopic, setNewWeakTopic] = useState('')
  const [newWeakTopicAcc, setNewWeakTopicAcc] = useState('')
  const [newTaskSubject, setNewTaskSubject] = useState('General')
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editingTaskText, setEditingTaskText] = useState('')
  const [showWidgetCustomize, setShowWidgetCustomize] = useState(false)
  const [widgetPreferences, setWidgetPreferences] = useState({
    studyStreak: true,
    studyHistory: true,
    quickActions: true,
    todaysPlan: true,
    examCountdown: true,
    weakTopics: true
  })
  const [widgetOrder, setWidgetOrder] = useState(['studyStreak', 'studyHistory', 'quickActions', 'todaysPlan', 'examCountdown', 'weakTopics'])
  const [backgroundImage, setBackgroundImage] = useState('')
  const [accentColor, setAccentColor] = useState('#00ffe0')
  const [widgetOpacity, setWidgetOpacity] = useState(0.88)
  const [customAccentColor, setCustomAccentColor] = useState('#00ffe0')
  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false)
  const [gridColumns, setGridColumns] = useState(2)
  const [widgetSize, setWidgetSize] = useState('medium')
  
  const SUBJECTS = ['General', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Accountancy', 'Business Studies', 'Economics', 'Statistics', 'Computer Science']
  
  useEffect(() => {
    const hr = new Date().getHours()
    if (hr < 12) setGreeting('Good morning')
    else if (hr < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')
    
    const d = new Date()
    const opts = { weekday: 'long', day: 'numeric', month: 'long' }
    setDate(d.toLocaleDateString('en-IN', opts))
    
    // Load widget preferences
    const savedWidgetPrefs = localStorage.getItem('synapse_widget_preferences')
    if (savedWidgetPrefs) {
      const parsed = JSON.parse(savedWidgetPrefs)
      // Merge with default preferences to handle new widgets
      const defaultPrefs = {
        studyStreak: true,
        studyHistory: true,
        quickActions: true,
        todaysPlan: true,
        examCountdown: true,
        weakTopics: true
      }
      const mergedPrefs = { ...defaultPrefs, ...parsed }
      setWidgetPreferences(mergedPrefs)
    }
    
    // Load widget order
    const savedWidgetOrder = localStorage.getItem('synapse_widget_order')
    if (savedWidgetOrder) {
      const parsed = JSON.parse(savedWidgetOrder)
      // Filter out any widgets that no longer exist and add any new widgets
      const validWidgets = ['studyStreak', 'studyHistory', 'quickActions', 'todaysPlan', 'examCountdown', 'weakTopics']
      const filteredOrder = parsed.filter(w => validWidgets.includes(w))
      // Add any missing widgets at the end
      const missingWidgets = validWidgets.filter(w => !filteredOrder.includes(w))
      setWidgetOrder([...filteredOrder, ...missingWidgets])
    }
    
    // Load background image
    const savedBackground = localStorage.getItem('synapse_background_image')
    if (savedBackground) {
      setBackgroundImage(savedBackground)
    }
    
    // Load theme preferences
    const savedAccentColor = localStorage.getItem('synapse_accent_color')
    if (savedAccentColor) {
      setAccentColor(savedAccentColor)
    }
    
    const savedWidgetOpacity = localStorage.getItem('synapse_widget_opacity')
    if (savedWidgetOpacity) {
      setWidgetOpacity(parseFloat(savedWidgetOpacity))
    }
    
    // Load grid columns
    const savedGridColumns = localStorage.getItem('synapse_grid_columns')
    if (savedGridColumns) {
      setGridColumns(parseInt(savedGridColumns))
    }
    
    // Load widget size
    const savedWidgetSize = localStorage.getItem('synapse_widget_size')
    if (savedWidgetSize) {
      setWidgetSize(savedWidgetSize)
    }
    
    // Load real data from storage
    const notes = getNotes()
    const notesCount = notes.length
    const userTasks = getTasks()
    const userWeakTopics = getWeakTopics()
    const userExams = getExams()
    const studySessions = getStudySessions()
    
    setTasks(userTasks)
    setWeakTopics(userWeakTopics)
    setExams(userExams)
    
    // Calculate real stats from study sessions
    const today = new Date().toDateString()
    const todaySessions = studySessions.filter(s => new Date(s.date).toDateString() === today)
    const todayStudyTime = todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0)
    
    // Calculate streak
    const uniqueDays = [...new Set(studySessions.map(s => new Date(s.date).toDateString()))]
    const streak = uniqueDays.length
    
    // Calculate accuracy from loaded weak topics
    const avgAccuracy = userWeakTopics.length > 0 
      ? Math.round(userWeakTopics.reduce((acc, t) => acc + t.acc, 0) / userWeakTopics.length)
      : 70
    
    setTimeout(() => {
      setStats({
        streak: Math.min(20, streak),
        studyTime: Math.max(0, todayStudyTime.toFixed(1)),
        accuracy: avgAccuracy,
        notesCount
      })
      setIsLoading(false)
    }, 300)
  }, [])

  const toggleTask = (id) => {
    const updatedTasks = tasks.map(t => 
      t.id === id ? { ...t, done: !t.done } : t
    )
    setTasks(updatedTasks)
    saveTasks(updatedTasks)
  }

  const addTask = () => {
    if (newTask.trim()) {
      const newTaskObj = {
        id: Date.now(),
        subject: newTaskSubject,
        task: newTask,
        done: false
      }
      const updatedTasks = [...tasks, newTaskObj]
      setTasks(updatedTasks)
      saveTasks(updatedTasks)
      setNewTask('')
      setNewTaskSubject('General')
      setShowAddTask(false)
    }
  }

  const deleteTask = (id) => {
    const updatedTasks = tasks.filter(t => t.id !== id)
    setTasks(updatedTasks)
    saveTasks(updatedTasks)
  }

  const startEditTask = (task) => {
    setEditingTaskId(task.id)
    setEditingTaskText(task.task)
  }

  const saveEditTask = () => {
    if (editingTaskId && editingTaskText.trim()) {
      const updatedTasks = tasks.map(t => 
        t.id === editingTaskId ? { ...t, task: editingTaskText } : t
      )
      setTasks(updatedTasks)
      saveTasks(updatedTasks)
      setEditingTaskId(null)
      setEditingTaskText('')
    }
  }

  const cancelEditTask = () => {
    setEditingTaskId(null)
    setEditingTaskText('')
  }

  const addExam = () => {
    if (newExamName.trim() && newExamDate.trim()) {
      const newExam = {
        id: Date.now(),
        name: newExamName,
        date: newExamDate
      }
      const updatedExams = [...exams, newExam]
      setExams(updatedExams)
      saveExams(updatedExams)
      setNewExamName('')
      setNewExamDate('')
      setShowAddExam(false)
    }
  }

  const deleteExam = (id) => {
    const updatedExams = exams.filter(e => e.id !== id)
    setExams(updatedExams)
    saveExams(updatedExams)
  }

  const deleteWeakTopic = (id) => {
    const updatedTopics = weakTopics.filter(t => t.id !== id)
    setWeakTopics(updatedTopics)
    saveWeakTopics(updatedTopics)
    // Recalculate accuracy
    const avgAccuracy = updatedTopics.length > 0 
      ? Math.round(updatedTopics.reduce((acc, t) => acc + t.acc, 0) / updatedTopics.length)
      : 70
    setStats(prev => ({ ...prev, accuracy: avgAccuracy }))
  }

  const addWeakTopic = () => {
    if (newWeakTopic.trim() && newWeakTopicAcc.trim()) {
      const acc = parseInt(newWeakTopicAcc)
      if (acc >= 0 && acc <= 100) {
        const newTopic = { id: Date.now(), topic: newWeakTopic, acc }
        const updatedTopics = [...weakTopics, newTopic]
        setWeakTopics(updatedTopics)
        saveWeakTopics(updatedTopics)
        // Recalculate accuracy
        const avgAccuracy = updatedTopics.length > 0 
          ? Math.round(updatedTopics.reduce((acc, t) => acc + t.acc, 0) / updatedTopics.length)
          : 70
        setStats(prev => ({ ...prev, accuracy: avgAccuracy }))
        setNewWeakTopic('')
        setNewWeakTopicAcc('')
        setShowAddWeakTopic(false)
      }
    }
  }

  const studySessionsData = useMemo(() => getStudySessions(), [stats.studyTime, stats.streak])
  
  const streakData = useMemo(() => {
    const today = new Date()
    return [...Array(7)].map((_, i) => {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - (6 - i))
      const hasStudied = studySessionsData.some(s => new Date(s.date).toDateString() === checkDate.toDateString())
      return { hasStudied, date: checkDate.toDateString() }
    })
  }, [studySessionsData])

  const calculateDaysUntil = (examDate) => {
    const exam = new Date(examDate)
    const today = new Date()
    const diffTime = exam - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const logStudyTime = () => {
    const hours = parseFloat(studyHours) || 0
    const minutes = parseFloat(studyMinutes) || 0
    const totalHours = hours + (minutes / 60)
    
    if (totalHours > 0) {
      const newSession = {
        id: Date.now(),
        date: new Date().toISOString(),
        duration: totalHours,
        subject: studySubject || 'General'
      }
      
      const sessions = getStudySessions()
      const updatedSessions = [...sessions, newSession]
      saveStudySessions(updatedSessions)
      
      // Update stats
      const today = new Date().toDateString()
      const todaySessions = updatedSessions.filter(s => new Date(s.date).toDateString() === today)
      const todayStudyTime = todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0)
      
      setStats(prev => ({
        ...prev,
        studyTime: todayStudyTime.toFixed(1)
      }))
      
      setStudyHours('')
      setStudyMinutes('')
      setStudySubject('')
      setShowLogStudy(false)
    }
  }

  const toggleWidget = (widgetKey) => {
    const updated = { ...widgetPreferences, [widgetKey]: !widgetPreferences[widgetKey] }
    setWidgetPreferences(updated)
    localStorage.setItem('synapse_widget_preferences', JSON.stringify(updated))
  }

  const handleDragEnd = (result) => {
    if (!result.destination) return
    
    const items = Array.from(widgetOrder)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    
    setWidgetOrder(items)
    localStorage.setItem('synapse_widget_order', JSON.stringify(items))
  }

  const handleBackgroundUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result
        setBackgroundImage(base64String)
        localStorage.setItem('synapse_background_image', base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeBackground = () => {
    setBackgroundImage('')
    localStorage.removeItem('synapse_background_image')
  }

  const handleAccentColorChange = (color) => {
    setAccentColor(color)
    localStorage.setItem('synapse_accent_color', color)
  }

  const handleWidgetOpacityChange = (opacity) => {
    setWidgetOpacity(opacity)
    localStorage.setItem('synapse_widget_opacity', opacity.toString())
  }

  const handleCustomAccentColorChange = (color) => {
    setCustomAccentColor(color)
    setAccentColor(color)
    localStorage.setItem('synapse_accent_color', color)
  }

  const handleGridColumnsChange = (columns) => {
    setGridColumns(columns)
    localStorage.setItem('synapse_grid_columns', columns.toString())
  }

  const handleWidgetSizeChange = (size) => {
    setWidgetSize(size)
    localStorage.setItem('synapse_widget_size', size)
  }

  return (
    <div style={{ 
      padding: '0 4px',
      backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      minHeight: '100vh'
    }}>
      {isLoading ? (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '60vh',
          gap: 16 
        }}>
          <div style={{ 
            width: 48, 
            height: 48, 
            borderRadius: '50%', 
            border: '3px solid rgba(0,255,224,0.2)', 
            borderTopColor: '#00ffe0',
            animation: 'spin 1s linear infinite'
          }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
          <div style={{ fontSize: 14, color: 'rgba(238,242,255,0.5)' }}>Loading Dashboard...</div>
        </div>
      ) : (
        <>
      <style>{`
        .stat-card { transition: all 0.3s cubic-bezier(0.22,1,0.36,1) }
        .stat-card:hover { 
          border-color: ${accentColor}40!important;
          background: ${accentColor}10!important;
          transform: translateY(-2px)!important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15)!important;
        }
        .widget {
          transition: all 0.35s cubic-bezier(0.22,1,0.36,1);
          position: relative;
          overflow: hidden;
        }
        .widget::before {
          content: '';
          position: absolute;
          top: 0; left: -100%; right: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, ${accentColor}05, transparent);
          transition: all 0.6s;
        }
        .widget:hover::before { left: 100%; right: -100%; }
        .widget:hover {
          border-color: ${accentColor}38!important;
          transform: translateY(-3px)!important;
          box-shadow: 0 12px 40px rgba(0,0,0,0.25)!important;
        }
        .widget-title {
          background: linear-gradient(90deg, ${accentColor}, #7c3aff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .prog-fill {
          background: linear-gradient(90deg, ${accentColor}, #7c3aff);
          background-size: 200% 100%;
          animation: shimmer 2s linear infinite;
        }
        .streak-flame { animation: glow 2s ease-in-out infinite; }
        .task-item {
          transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
          cursor: pointer;
        }
        .task-item:hover {
          background: rgba(0,255,224,0.04)!important;
          border-left-color: #00ffe0!important;
          transform: translateX(4px);
        }
        .fade-in { animation: fadeIn 0.6s cubic-bezier(0,0,0.2,1) both; }
        .slide-in { animation: slideIn 0.5s cubic-bezier(0,0,0.2,1) both; }
      `}</style>

      {/* Header */}
      <div className="slide-in" style={{ marginBottom: 24, animationDelay: '0.05s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 32, fontWeight: 800, letterSpacing: '-1px', marginBottom: 4, background: 'linear-gradient(135deg, #fff, rgba(0,255,224,0.8))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {greeting}, {user?.firstName || 'Student'} 👋
          </div>
          <div style={{ fontSize: 13, color: 'rgba(238,242,255,0.4)' }}>
            {date} · {user?.stream === 'science' ? 'Science' : 'Commerce'} Stream · {user?.examGoal || 'JEE Mains'} Prep
          </div>
        </div>
        <button
          onClick={() => setShowWidgetCustomize(true)}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--txt)',
            fontSize: 12,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.08)' }}
          onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.04)' }}
        >
          ⚙️ Customize
        </button>
      </div>

      {/* Stats */}
      <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24, animationDelay: '0.15s' }}>
        
        {/* Streak */}
        <div className="stat-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 18, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(251,146,60,0.4), transparent)' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="streak-flame" style={{ fontSize: 24 }}>🔥</span>
            <div style={{ padding: '3px 10px', borderRadius: 100, fontSize: 10, fontWeight: 600, background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>
              {stats.streak > 0 ? `+${stats.streak}` : 'Start today'}
            </div>
          </div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 36, fontWeight: 800, color: '#fb923c', letterSpacing: '-1.5px', lineHeight: 1, marginBottom: 6, animation: 'countUp 0.8s cubic-bezier(0,0,0.2,1) both', animationDelay: '0.4s' }}>
            {stats.streak}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(238,242,255,0.35)', marginBottom: 10 }}>Day Streak</div>
          <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 5, overflow: 'hidden' }}>
            <div className="prog-fill" style={{ height: '100%', width: `${(stats.streak / streakTarget) * 100}%`, borderRadius: 5, transition: 'width 1.2s cubic-bezier(0.22,1,0.36,1) 0.5s' }}></div>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(238,242,255,0.25)', marginTop: 5 }}>{streakTarget - stats.streak} more days to hit {streakTarget} 🎯</div>
        </div>

        {/* Study Time */}
        <div className="stat-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 18, position: 'relative', overflow: 'hidden', cursor: 'pointer' }} onClick={() => setShowLogStudy(true)}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,255,224,0.4), transparent)' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 24 }}>⏱</span>
            <div style={{ padding: '3px 10px', borderRadius: 100, fontSize: 10, fontWeight: 600, background: 'rgba(0,255,224,0.1)', color: '#00ffe0', border: '1px solid rgba(0,255,224,0.2)' }}>
              +{stats.studyTime}h
            </div>
          </div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 36, fontWeight: 800, color: '#00ffe0', letterSpacing: '-1.5px', lineHeight: 1, marginBottom: 6, animation: 'countUp 0.8s cubic-bezier(0,0,0.2,1) both', animationDelay: '0.5s' }}>
            {stats.studyTime}<span style={{ fontSize: 18, color: 'rgba(0,255,224,0.5)' }}>h</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(238,242,255,0.35)' }}>Today's Study</div>
          <div style={{ fontSize: 10, color: 'rgba(238,242,255,0.25)', marginTop: 6 }}>Click to log time</div>
        </div>

        {/* Accuracy */}
        <div className="stat-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 18, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(124,58,255,0.4), transparent)' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 24 }}>📊</span>
            <div style={{ padding: '3px 10px', borderRadius: 100, fontSize: 10, fontWeight: 600, background: stats.accuracy >= 70 ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', color: stats.accuracy >= 70 ? '#4ade80' : '#f87171', border: stats.accuracy >= 70 ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(248,113,113,0.2)' }}>
              {stats.accuracy >= 70 ? 'Good' : 'Improve'}
            </div>
          </div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 36, fontWeight: 800, color: '#a78bfa', letterSpacing: '-1.5px', lineHeight: 1, marginBottom: 6, animation: 'countUp 0.8s cubic-bezier(0,0,0.2,1) both', animationDelay: '0.6s' }}>
            {stats.accuracy}<span style={{ fontSize: 18, color: 'rgba(167,139,250,0.5)' }}>%</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(238,242,255,0.35)' }}>Avg Accuracy</div>
        </div>
      </div>

      {/* Widget Customization Modal */}
      {showWidgetCustomize && (
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
            maxWidth: 400,
            background: 'linear-gradient(135deg, rgba(0,255,224,0.1) 0%, rgba(124,58,255,0.1) 100%)',
            border: '1px solid rgba(0,255,224,0.3)',
            borderRadius: 20,
            padding: 24,
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700, color: '#00ffe0', marginBottom: 16 }}>
              Customize Dashboard
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { key: 'studyStreak', label: '🔥 Study Streak', desc: 'Track your daily study streak' },
                { key: 'studyHistory', label: '⏱ Study History', desc: 'View recent study sessions' },
                { key: 'quickActions', label: '⚡ Quick Actions', desc: 'Quick access to key features' },
                { key: 'todaysPlan', label: '📋 Today\'s Plan', desc: 'Your daily task list' },
                { key: 'examCountdown', label: '🎯 Exam Countdown', desc: 'Countdown to your exams' },
                { key: 'weakTopics', label: '📉 Weak Topics', desc: 'Topics that need improvement' }
              ].map(widget => (
                <div key={widget.key} style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)', marginBottom: 2 }}>
                      {widget.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(238,242,255,0.4)' }}>
                      {widget.desc}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleWidget(widget.key)}
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 12,
                      background: widgetPreferences[widget.key] ? 'rgba(0,255,224,0.2)' : 'rgba(255,255,255,0.1)',
                      border: widgetPreferences[widget.key] ? '1px solid rgba(0,255,224,0.4)' : '1px solid rgba(255,255,255,0.2)',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      background: widgetPreferences[widget.key] ? '#00ffe0' : 'rgba(238,242,255,0.4)',
                      position: 'absolute',
                      top: 3,
                      left: widgetPreferences[widget.key] ? 'auto' : 3,
                      right: widgetPreferences[widget.key] ? 3 : 'auto',
                      transition: 'all 0.2s'
                    }}></div>
                  </button>
                </div>
              ))}
            </div>
            
            {/* Background Image Upload */}
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt)', marginBottom: 12 }}>
                🖼 Background Image
              </div>
              {backgroundImage ? (
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <img 
                    src={backgroundImage} 
                    alt="Background" 
                    style={{ 
                      width: '100%', 
                      height: 120, 
                      objectFit: 'cover', 
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.1)'
                    }} 
                  />
                  <button
                    onClick={removeBackground}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: 'rgba(248,113,113,0.9)',
                      border: '1px solid rgba(248,113,113,0.3)',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.target.style.background = 'rgba(248,113,113,1)' }}
                    onMouseLeave={(e) => { e.target.style.background = 'rgba(248,113,113,0.9)' }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      display: 'block',
                      padding: '16px',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.04)',
                      border: '2px dashed rgba(255,255,255,0.2)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.target.style.borderColor = 'rgba(0,255,224,0.4)' }}
                    onMouseLeave={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.2)' }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundUpload}
                      style={{ display: 'none' }}
                    />
                    <div style={{ fontSize: 24, marginBottom: 8 }}>📷</div>
                    <div style={{ fontSize: 13, color: 'var(--txt)', fontWeight: 500 }}>
                      Click to upload background
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(238,242,255,0.4)', marginTop: 4 }}>
                      Supports JPG, PNG, WebP
                    </div>
                  </label>
                </div>
              )}
            </div>
            
            {/* Theme Customization */}
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt)', marginBottom: 12 }}>
                🎨 Theme Options
              </div>
              
              {/* Accent Color */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'rgba(238,242,255,0.6)', marginBottom: 8 }}>
                  Accent Color
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['#00ffe0', '#7c3aff', '#ff2d78', '#fb923c', '#4ade80'].map(color => (
                    <button
                      key={color}
                      onClick={() => handleAccentColorChange(color)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: color,
                        border: accentColor === color ? '3px solid #fff' : '2px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => { e.target.style.transform = 'scale(1.1)' }}
                      onMouseLeave={(e) => { e.target.style.transform = 'scale(1)' }}
                    />
                  ))}
                  <button
                    onClick={() => setShowCustomColorPicker(!showCustomColorPicker)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'linear-gradient(135deg, #ff6b6b, #4ecdc4, #45b7d1)',
                      border: '2px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16
                    }}
                    onMouseEnter={(e) => { e.target.style.transform = 'scale(1.1)' }}
                    onMouseLeave={(e) => { e.target.style.transform = 'scale(1)' }}
                  >
                    +
                  </button>
                </div>
                {showCustomColorPicker && (
                  <div style={{ marginTop: 8 }}>
                    <input
                      type="color"
                      value={customAccentColor}
                      onChange={(e) => handleCustomAccentColorChange(e.target.value)}
                      style={{
                        width: '100%',
                        height: 40,
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                )}
              </div>
              
              {/* Grid Columns */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'rgba(238,242,255,0.6)', marginBottom: 8 }}>
                  Grid Columns: {gridColumns}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3].map(cols => (
                    <button
                      key={cols}
                      onClick={() => handleGridColumnsChange(cols)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: 8,
                        background: gridColumns === cols ? 'rgba(0,255,224,0.2)' : 'rgba(255,255,255,0.04)',
                        border: gridColumns === cols ? '1px solid rgba(0,255,224,0.4)' : '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--txt)',
                        fontSize: 12,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {cols} Column{cols > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Widget Size */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'rgba(238,242,255,0.6)', marginBottom: 8 }}>
                  Widget Size
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['small', 'medium', 'large'].map(size => (
                    <button
                      key={size}
                      onClick={() => handleWidgetSizeChange(size)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: 8,
                        background: widgetSize === size ? 'rgba(0,255,224,0.2)' : 'rgba(255,255,255,0.04)',
                        border: widgetSize === size ? '1px solid rgba(0,255,224,0.4)' : '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--txt)',
                        fontSize: 12,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Widget Opacity */}
              <div>
                <div style={{ fontSize: 12, color: 'rgba(238,242,255,0.6)', marginBottom: 8 }}>
                  Widget Opacity: {Math.round(widgetOpacity * 100)}%
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.05"
                  value={widgetOpacity}
                  onChange={(e) => handleWidgetOpacityChange(parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    height: 6,
                    borderRadius: 3,
                    background: 'rgba(255,255,255,0.1)',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                onClick={() => setShowWidgetCustomize(false)}
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
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Study Time Logging Modal */}
      {showLogStudy && (
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
            maxWidth: 400,
            background: 'linear-gradient(135deg, rgba(0,255,224,0.1) 0%, rgba(124,58,255,0.1) 100%)',
            border: '1px solid rgba(0,255,224,0.3)',
            borderRadius: 20,
            padding: 24,
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700, color: '#00ffe0', marginBottom: 16 }}>
              Log Study Time
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(238,242,255,0.6)', marginBottom: 6 }}>Subject</div>
                <input
                  type="text"
                  value={studySubject}
                  onChange={(e) => setStudySubject(e.target.value)}
                  placeholder="e.g., Physics, Maths"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--txt)',
                    fontSize: 14
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'rgba(238,242,255,0.6)', marginBottom: 6 }}>Hours</div>
                  <input
                    type="number"
                    value={studyHours}
                    onChange={(e) => setStudyHours(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.5"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--txt)',
                      fontSize: 14
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'rgba(238,242,255,0.6)', marginBottom: 6 }}>Minutes</div>
                  <input
                    type="number"
                    value={studyMinutes}
                    onChange={(e) => setStudyMinutes(e.target.value)}
                    placeholder="0"
                    min="0"
                    max="59"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--txt)',
                      fontSize: 14
                    }}
                  />
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(238,242,255,0.4)', marginTop: 4 }}>
                💡 Log time for any subject to track your daily study hours
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  onClick={logStudyTime}
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
                  onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)' }}
                >
                  Log Time
                </button>
                <button
                  onClick={() => {
                    setShowLogStudy(false)
                    setStudyHours('')
                    setStudyMinutes('')
                    setStudySubject('')
                  }}
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
                  onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.08)' }}
                  onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.04)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Widgets */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="widgets">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="fade-in"
              style={{ 
                display: 'grid', 
                gridTemplateColumns: `repeat(${gridColumns}, 1fr)`, 
                gap: 14, 
                animationDelay: '0.25s'
              }}
            >
              {widgetOrder.map((widgetId, index) => {
                if (!widgetPreferences[widgetId]) return null
                
                const widgetComponents = {
                  studyStreak: (
                    <div className="widget" style={{ 
                      background: `rgba(8,12,26,${widgetOpacity})`, 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      borderRadius: 14, 
                      padding: widgetSize === 'small' ? 12 : widgetSize === 'large' ? 28 : 20
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(251,146,60,0.3), transparent)' }}></div>
                      <div className="widget-title" style={{ fontSize: 12, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        🔥 Study Streak
                      </div>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                        {streakData.map((day, i) => (
                          <div key={i} style={{ 
                            flex: 1, height: 48, borderRadius: 8, 
                            background: day.hasStudied ? 'linear-gradient(135deg, rgba(251,146,60,0.2), rgba(251,146,60,0.08))' : 'rgba(255,255,255,0.04)', 
                            border: day.hasStudied ? '1px solid rgba(251,146,60,0.3)' : '1px solid rgba(255,255,255,0.06)', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            fontSize: 18, transition: 'all 0.3s' 
                          }}>
                            {day.hasStudied ? '🔥' : '·'}
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(238,242,255,0.35)' }}>
                        {stats.streak} day streak this week · Keep it going!
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(238,242,255,0.25)', marginTop: 6, lineHeight: 1.4 }}>
                        💡 Streak counts days you studied (created notes, used AI, etc.)
                      </div>
                    </div>
                  ),
                  studyHistory: (
                    <div className="widget" style={{ 
                      background: `rgba(8,12,26,${widgetOpacity})`, 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      borderRadius: 14, 
                      padding: widgetSize === 'small' ? 12 : widgetSize === 'large' ? 28 : 20
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,255,224,0.3), transparent)' }}></div>
                      <div className="widget-title" style={{ fontSize: 12, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        ⏱ Study History
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 150, overflowY: 'auto' }}>
                        {studySessionsData.slice(-5).reverse().map((session) => (
                          <div key={session.id} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: 6,
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)'
                          }}>
                            <div>
                              <div style={{ fontSize: 12, color: '#eef2ff' }}>{session.subject || 'General'}</div>
                              <div style={{ fontSize: 10, color: 'rgba(238,242,255,0.4)' }}>
                                {new Date(session.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                              </div>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#00ffe0' }}>
                              {session.duration?.toFixed(1)}h
                            </div>
                          </div>
                        ))}
                        {studySessionsData.length === 0 && (
                          <div style={{ fontSize: 11, color: 'rgba(238,242,255,0.35)', textAlign: 'center', padding: '20px 0' }}>
                            No study sessions logged yet
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                  quickActions: (
                    <div className="widget" style={{ 
                      background: `rgba(8,12,26,${widgetOpacity})`, 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      borderRadius: 14, 
                      padding: widgetSize === 'small' ? 12 : widgetSize === 'large' ? 28 : 20
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(124,58,255,0.3), transparent)' }}></div>
                      <div className="widget-title" style={{ fontSize: 12, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        ⚡ Quick Actions
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <button onClick={() => onPageChange('notes')} style={{ padding: '12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#eef2ff', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.08)' }} onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.04)' }}>
                          📝 New Note
                        </button>
                        <button onClick={() => onPageChange('planner')} style={{ padding: '12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#eef2ff', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.08)' }} onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.04)' }}>
                          📅 Plan Day
                        </button>
                        <button onClick={() => onPageChange('flashcards')} style={{ padding: '12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#eef2ff', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.08)' }} onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.04)' }}>
                          🎴 Flashcards
                        </button>
                        <button onClick={() => onPageChange('ai')} style={{ padding: '12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#eef2ff', fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.08)' }} onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.04)' }}>
                          🤖 Ask AI
                        </button>
                      </div>
                    </div>
                  ),
                  todaysPlan: (
                    <div className="widget" style={{ 
                      background: `rgba(8,12,26,${widgetOpacity})`, 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      borderRadius: 14, 
                      padding: widgetSize === 'small' ? 12 : widgetSize === 'large' ? 28 : 20
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(74,222,128,0.3), transparent)' }}></div>
                      <div className="widget-title" style={{ fontSize: 12, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        📋 Today's Plan
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 150, overflowY: 'auto' }}>
                        {tasks.filter(t => !t.done).slice(0, 4).map(task => (
                          <div key={task.id} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 10,
                            padding: '8px 10px',
                            borderRadius: 6,
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)'
                          }}>
                            <div style={{ width: 4, height: 4, borderRadius: 2, background: '#4ade80' }}></div>
                            <div style={{ flex: 1, fontSize: 12, color: '#eef2ff' }}>{task.task}</div>
                            <div style={{ fontSize: 10, color: 'rgba(238,242,255,0.4)' }}>{task.subject}</div>
                          </div>
                        ))}
                        {tasks.filter(t => !t.done).length === 0 && (
                          <div style={{ fontSize: 11, color: 'rgba(238,242,255,0.35)', textAlign: 'center', padding: '20px 0' }}>
                            All tasks completed! 🎉
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                  examCountdown: (
                    <div className="widget" style={{ 
                      background: `rgba(8,12,26,${widgetOpacity})`, 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      borderRadius: 14, 
                      padding: widgetSize === 'small' ? 12 : widgetSize === 'large' ? 28 : 20
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(251,146,60,0.3), transparent)' }}></div>
                      <div className="widget-title" style={{ fontSize: 12, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        🎯 Exam Countdown
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 150, overflowY: 'auto' }}>
                        {exams.length === 0 ? (
                          <div style={{ fontSize: 11, color: 'rgba(238,242,255,0.35)', textAlign: 'center', padding: '20px 0' }}>
                            No exams scheduled
                          </div>
                        ) : (
                          exams.slice(0, 3).map(exam => (
                            <div key={exam.id} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              padding: '8px 10px',
                              borderRadius: 6,
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                              <div>
                                <div style={{ fontSize: 12, color: '#eef2ff' }}>{exam.name}</div>
                                <div style={{ fontSize: 10, color: 'rgba(238,242,255,0.4)' }}>{exam.subject}</div>
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#fb923c' }}>
                                {calculateDaysUntil(exam.date)}d
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ),
                  weakTopics: (
                    <div className="widget" style={{ 
                      background: `rgba(8,12,26,${widgetOpacity})`, 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      borderRadius: 14, 
                      padding: widgetSize === 'small' ? 12 : widgetSize === 'large' ? 28 : 20
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(248,113,113,0.3), transparent)' }}></div>
                      <div className="widget-title" style={{ fontSize: 12, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        📉 Weak Topics
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 150, overflowY: 'auto' }}>
                        {weakTopics.length === 0 ? (
                          <div style={{ fontSize: 11, color: 'rgba(238,242,255,0.35)', textAlign: 'center', padding: '20px 0' }}>
                            No weak topics tracked
                          </div>
                        ) : (
                          weakTopics.slice(0, 4).map(topic => (
                            <div key={topic.id} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              padding: '8px 10px',
                              borderRadius: 6,
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                              <div style={{ fontSize: 12, color: '#eef2ff' }}>{topic.topic}</div>
                              <div style={{ 
                                fontSize: 11, 
                                fontWeight: 600, 
                                color: topic.acc < 50 ? '#f87171' : topic.acc < 70 ? '#fb923c' : '#4ade80'
                              }}>
                                {topic.acc}%
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )
                }

                return (
                  <Draggable key={widgetId} draggableId={widgetId} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          ...provided.draggableProps.style,
                          opacity: snapshot.isDragging ? 0.8 : 1,
                          cursor: 'move'
                        }}
                      >
                        {widgetComponents[widgetId]}
                      </div>
                    )}
                  </Draggable>
                )
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
        </>
      )}
    </div>
  )
}