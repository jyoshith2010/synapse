import { useState, useEffect } from 'react'

const ADMIN_CREDENTIALS = {
  id: 'admin',
  passcode: 'synapse2024'
}

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Accountancy', 'Business Studies', 'Economics', 'Statistics', 'Computer Science']

const DEFAULT_SYLLABI = {
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
  Economics: [
    { id: 1, name: 'Microeconomics', completed: false },
    { id: 2, name: 'Macroeconomics', completed: false },
    { id: 3, name: 'Indian Economic Development', completed: false },
  ],
  'Computer Science': [
    { id: 1, name: 'Programming Fundamentals', completed: false },
    { id: 2, name: 'Data Structures', completed: false },
    { id: 3, name: 'Algorithms', completed: false },
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
  'Statistics': [
    { id: 1, name: 'Measures of Central Tendency', completed: false },
    { id: 2, name: 'Measures of Dispersion', completed: false },
    { id: 3, name: 'Correlation', completed: false },
    { id: 4, name: 'Index Numbers', completed: false },
    { id: 5, name: 'Probability Theory', completed: false },
    { id: 6, name: 'Sampling Methods', completed: false },
  ]
}

export default function Admin({ onBack }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [adminId, setAdminId] = useState('')
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('mocktests')
  
  // Mock tests state
  const [mockTests, setMockTests] = useState([])
  const [selectedTest, setSelectedTest] = useState(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showAnswerKeyModal, setShowAnswerKeyModal] = useState(false)
  
  // Syllabus state
  const [syllabi, setSyllabi] = useState(DEFAULT_SYLLABI)
  const [selectedSubject, setSelectedSubject] = useState('Physics')
  const [showAddTopicModal, setShowAddTopicModal] = useState(false)
  const [newTopicName, setNewTopicName] = useState('')

  useEffect(() => {
    const savedTests = JSON.parse(localStorage.getItem('synapse_mock_tests') || '[]')
    setMockTests(savedTests)
    
    const savedSyllabi = JSON.parse(localStorage.getItem('synapse_admin_syllabi') || 'null')
    if (savedSyllabi) {
      setSyllabi(savedSyllabi)
    }
  }, [])

  const handleLogin = (e) => {
    e.preventDefault()
    if (adminId === ADMIN_CREDENTIALS.id && passcode === ADMIN_CREDENTIALS.passcode) {
      setAuthenticated(true)
      setError('')
    } else {
      setError('Invalid ID or passcode')
    }
  }

  const handleLogout = () => {
    setAuthenticated(false)
    setAdminId('')
    setPasscode('')
  }

  // Mock test handlers
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
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
          const updatedTests = [...mockTests, newTest]
          setMockTests(updatedTests)
          localStorage.setItem('synapse_mock_tests', JSON.stringify(updatedTests))
          setShowUploadModal(false)
        } catch {
          alert('Invalid JSON file format')
        }
      }
      reader.readAsText(file)
    }
  }

  const handleAnswerKeyUpload = (e) => {
    const file = e.target.files[0]
    if (file && selectedTest) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const answerKey = JSON.parse(event.target.result)
          const updatedTests = mockTests.map(test => {
            if (test.id === selectedTest.id) {
              return {
                ...test,
                questions: test.questions.map((q, idx) => ({
                  ...q,
                  correct: answerKey.answers?.[idx] !== undefined ? answerKey.answers[idx] : q.correct
                }))
              }
            }
            return test
          })
          setMockTests(updatedTests)
          localStorage.setItem('synapse_mock_tests', JSON.stringify(updatedTests))
          setShowAnswerKeyModal(false)
          setSelectedTest(null)
        } catch {
          alert('Invalid JSON file format')
        }
      }
      reader.readAsText(file)
    }
  }

  const handleDeleteTest = (testId) => {
    if (confirm('Are you sure you want to delete this test?')) {
      const updatedTests = mockTests.filter(t => t.id !== testId)
      setMockTests(updatedTests)
      localStorage.setItem('synapse_mock_tests', JSON.stringify(updatedTests))
    }
  }

  // Syllabus handlers
  const handleAddTopic = () => {
    if (newTopicName.trim()) {
      const updatedSyllabi = {
        ...syllabi,
        [selectedSubject]: [
          ...syllabi[selectedSubject],
          { id: Date.now(), name: newTopicName, completed: false }
        ]
      }
      setSyllabi(updatedSyllabi)
      localStorage.setItem('synapse_admin_syllabi', JSON.stringify(updatedSyllabi))
      setNewTopicName('')
      setShowAddTopicModal(false)
    }
  }

  const handleDeleteTopic = (topicId) => {
    const updatedSyllabi = {
      ...syllabi,
      [selectedSubject]: syllabi[selectedSubject].filter(t => t.id !== topicId)
    }
    setSyllabi(updatedSyllabi)
    localStorage.setItem('synapse_admin_syllabi', JSON.stringify(updatedSyllabi))
  }

  const handleToggleTopic = (topicId) => {
    const updatedSyllabi = {
      ...syllabi,
      [selectedSubject]: syllabi[selectedSubject].map(t =>
        t.id === topicId ? { ...t, completed: !t.completed } : t
      )
    }
    setSyllabi(updatedSyllabi)
    localStorage.setItem('synapse_admin_syllabi', JSON.stringify(updatedSyllabi))
  }

  if (!authenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #04060f 0%, #0c1124 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, sans-serif',
        color: '#eef2ff'
      }}>
        <div style={{
          padding: '48px',
          borderRadius: 20,
          background: 'rgba(8, 12, 26, 0.9)',
          border: '1px solid rgba(0, 255, 224, 0.2)',
          backdropFilter: 'blur(20px)',
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 0 60px rgba(0, 255, 224, 0.1)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #7c3aff, #00ffe0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: 28
            }}>⚡</div>
            <h1 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 28,
              fontWeight: 800,
              marginBottom: 8,
              background: 'linear-gradient(90deg, #fff, rgba(0, 255, 224, 0.85))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Synapse Admin</h1>
            <p style={{ color: 'rgba(238, 242, 255, 0.5)', fontSize: 14 }}>Secure admin access</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'rgba(238, 242, 255, 0.5)', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>Admin ID</label>
              <input
                type="text"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="Enter admin ID"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#eef2ff',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'all 0.3s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(0, 255, 224, 0.3)'
                  e.target.style.background = 'rgba(0, 255, 224, 0.04)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  e.target.style.background = 'rgba(255, 255, 255, 0.04)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'rgba(238, 242, 255, 0.5)', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>Passcode</label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#eef2ff',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'all 0.3s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(0, 255, 224, 0.3)'
                  e.target.style.background = 'rgba(0, 255, 224, 0.04)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  e.target.style.background = 'rgba(255, 255, 255, 0.04)'
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '12px',
                borderRadius: 8,
                background: 'rgba(248, 113, 113, 0.1)',
                border: '1px solid rgba(248, 113, 113, 0.2)',
                color: '#f87171',
                fontSize: 13,
                textAlign: 'center'
              }}>{error}</div>
            )}

            <button
              type="submit"
              style={{
                padding: '14px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(0, 255, 224, 0.16), rgba(124, 58, 255, 0.16))',
                border: '1px solid rgba(0, 255, 224, 0.4)',
                color: '#eef2ff',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Syne, sans-serif',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 0 30px rgba(0, 255, 224, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'none'
                e.target.style.boxShadow = 'none'
              }}
            >Access Admin Panel</button>
          </form>

          <button
            onClick={onBack}
            style={{
              marginTop: 24,
              padding: '12px',
              borderRadius: 12,
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(238, 242, 255, 0.5)',
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.3s',
              width: '100%'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.04)'
              e.target.style.color = '#eef2ff'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent'
              e.target.style.color = 'rgba(238, 242, 255, 0.5)'
            }}
          >← Back to App</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #04060f 0%, #0c1124 100%)',
      fontFamily: 'Inter, sans-serif',
      color: '#eef2ff'
    }}>
      {/* Header */}
      <div style={{
        padding: '24px 48px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(4, 6, 15, 0.8)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #7c3aff, #00ffe0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20
          }}>⚡</div>
          <div>
            <h1 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 20,
              fontWeight: 800,
              marginBottom: 2,
              background: 'linear-gradient(90deg, #fff, rgba(0, 255, 224, 0.85))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Synapse Admin</h1>
            <p style={{ fontSize: 12, color: 'rgba(238, 242, 255, 0.5)' }}>Management Dashboard</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onBack}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(238, 242, 255, 0.7)',
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.08)'
              e.target.style.color = '#eef2ff'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.04)'
              e.target.style.color = 'rgba(238, 242, 255, 0.7)'
            }}
          >← Back to App</button>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              background: 'rgba(248, 113, 113, 0.1)',
              border: '1px solid rgba(248, 113, 113, 0.2)',
              color: '#f87171',
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(248, 113, 113, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(248, 113, 113, 0.1)'
            }}
          >Logout</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '24px 48px 0' }}>
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {[
            { id: 'mocktests', label: 'Mock Tests', icon: '📝' },
            { id: 'syllabus', label: 'Syllabus', icon: '📋' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '14px 24px',
                borderRadius: '12px 12px 0 0',
                background: activeTab === tab.id ? 'rgba(0, 255, 224, 0.08)' : 'transparent',
                border: activeTab === tab.id ? '1px solid rgba(0, 255, 224, 0.2)' : 'none',
                borderBottom: activeTab === tab.id ? '2px solid #00ffe0' : 'none',
                color: activeTab === tab.id ? '#00ffe0' : 'rgba(238, 242, 255, 0.5)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.3s'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '32px 48px' }}>
        {activeTab === 'mocktests' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 700 }}>Mock Tests Management</h2>
              <button
                onClick={() => setShowUploadModal(true)}
                style={{
                  padding: '12px 24px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(0, 255, 224, 0.16), rgba(124, 58, 255, 0.16))',
                  border: '1px solid rgba(0, 255, 224, 0.4)',
                  color: '#eef2ff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'Syne, sans-serif',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 0 30px rgba(0, 255, 224, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'none'
                  e.target.style.boxShadow = 'none'
                }}
              >+ Upload New Test</button>
            </div>

            {mockTests.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 80,
                borderRadius: 16,
                background: 'rgba(8, 12, 26, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No Mock Tests Yet</h3>
                <p style={{ color: 'rgba(238, 242, 255, 0.5)', fontSize: 14 }}>Upload your first mock test to get started</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
                {mockTests.map(test => (
                  <div key={test.id} style={{
                    padding: 20,
                    borderRadius: 16,
                    background: 'rgba(8, 12, 26, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    transition: 'all 0.3s'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{test.title}</h3>
                        <p style={{ fontSize: 12, color: 'rgba(238, 242, 255, 0.5)' }}>{test.subject}</p>
                      </div>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 100,
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        background: test.difficulty === 'easy' ? 'rgba(74, 222, 128, 0.1)' : test.difficulty === 'medium' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                        color: test.difficulty === 'easy' ? '#4ade80' : test.difficulty === 'medium' ? '#fbbf24' : '#f87171',
                        border: test.difficulty === 'easy' ? '1px solid rgba(74, 222, 128, 0.2)' : test.difficulty === 'medium' ? '1px solid rgba(251, 191, 36, 0.2)' : '1px solid rgba(248, 113, 113, 0.2)'
                      }}>{test.difficulty}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'rgba(238, 242, 255, 0.5)', marginBottom: 16 }}>
                      <span>⏱ {test.duration} min</span>
                      <span>📊 {test.questions?.length || 0} questions</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => {
                          setSelectedTest(test)
                          setShowAnswerKeyModal(true)
                        }}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: 10,
                          background: 'rgba(124, 58, 255, 0.1)',
                          border: '1px solid rgba(124, 58, 255, 0.2)',
                          color: '#a78bfa',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(124, 58, 255, 0.2)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(124, 58, 255, 0.1)'
                        }}
                      >Upload Answer Key</button>
                      <button
                        onClick={() => handleDeleteTest(test.id)}
                        style={{
                          padding: '10px 16px',
                          borderRadius: 10,
                          background: 'rgba(248, 113, 113, 0.1)',
                          border: '1px solid rgba(248, 113, 113, 0.2)',
                          color: '#f87171',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(248, 113, 113, 0.2)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(248, 113, 113, 0.1)'
                        }}
                      >Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'syllabus' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 700 }}>Syllabus Management</h2>
              <div style={{ display: 'flex', gap: 12 }}>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#eef2ff',
                    fontSize: 14,
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  {SUBJECTS.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowAddTopicModal(true)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, rgba(0, 255, 224, 0.16), rgba(124, 58, 255, 0.16))',
                    border: '1px solid rgba(0, 255, 224, 0.4)',
                    color: '#eef2ff',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'Syne, sans-serif',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)'
                    e.target.style.boxShadow = '0 0 30px rgba(0, 255, 224, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'none'
                    e.target.style.boxShadow = 'none'
                  }}
                >+ Add Topic</button>
              </div>
            </div>

            <div style={{
              padding: 24,
              borderRadius: 16,
              background: 'rgba(8, 12, 26, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{selectedSubject} Syllabus</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {syllabi[selectedSubject]?.map(topic => (
                  <div key={topic.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    borderRadius: 10,
                    background: topic.completed ? 'rgba(74, 222, 128, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    border: topic.completed ? '1px solid rgba(74, 222, 128, 0.2)' : '1px solid rgba(255, 255, 255, 0.08)',
                    transition: 'all 0.3s'
                  }}>
                    <button
                      onClick={() => handleToggleTopic(topic.id)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        background: topic.completed ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                        border: topic.completed ? '1px solid rgba(74, 222, 128, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
                        color: topic.completed ? '#4ade80' : 'rgba(238, 242, 255, 0.5)',
                        fontSize: 14,
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                    >
                      {topic.completed ? '✓' : ''}
                    </button>
                    <span style={{ flex: 1, fontSize: 14, color: topic.completed ? 'rgba(74, 222, 128, 0.8)' : '#eef2ff' }}>{topic.name}</span>
                    <button
                      onClick={() => handleDeleteTopic(topic.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: 'rgba(248, 113, 113, 0.1)',
                        border: '1px solid rgba(248, 113, 113, 0.2)',
                        color: '#f87171',
                        fontSize: 12,
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(248, 113, 113, 0.2)'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(248, 113, 113, 0.1)'
                      }}
                    >Delete</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Test Modal */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '90%',
            maxWidth: 500,
            padding: 32,
            borderRadius: 20,
            background: 'rgba(8, 12, 26, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Upload Mock Test</h2>
            <p style={{ fontSize: 13, color: 'rgba(238, 242, 255, 0.5)', marginBottom: 24, lineHeight: 1.6 }}>
              Upload a JSON file containing the test data. The file should include title, subject, duration, difficulty, and questions array.
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#eef2ff',
                fontSize: 14,
                marginBottom: 16
              }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(238, 242, 255, 0.7)',
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)'
                  e.target.style.color = '#eef2ff'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.04)'
                  e.target.style.color = 'rgba(238, 242, 255, 0.7)'
                }}
              >Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Answer Key Modal */}
      {showAnswerKeyModal && selectedTest && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '90%',
            maxWidth: 500,
            padding: 32,
            borderRadius: 20,
            background: 'rgba(8, 12, 26, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Upload Answer Key</h2>
            <p style={{ fontSize: 13, color: 'rgba(238, 242, 255, 0.5)', marginBottom: 4 }}>Test: {selectedTest.title}</p>
            <p style={{ fontSize: 12, color: 'rgba(238, 242, 255, 0.4)', marginBottom: 24, lineHeight: 1.6 }}>
              Upload a JSON file with answer keys. Format: {`{"answers": {"0": 1, "1": 2, ...}}`}
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleAnswerKeyUpload}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#eef2ff',
                fontSize: 14,
                marginBottom: 16
              }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => {
                  setShowAnswerKeyModal(false)
                  setSelectedTest(null)
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(238, 242, 255, 0.7)',
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)'
                  e.target.style.color = '#eef2ff'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.04)'
                  e.target.style.color = 'rgba(238, 242, 255, 0.7)'
                }}
              >Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Topic Modal */}
      {showAddTopicModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '90%',
            maxWidth: 500,
            padding: 32,
            borderRadius: 20,
            background: 'rgba(8, 12, 26, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Add New Topic</h2>
            <p style={{ fontSize: 13, color: 'rgba(238, 242, 255, 0.5)', marginBottom: 24 }}>Subject: {selectedSubject}</p>
            <input
              type="text"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              placeholder="Enter topic name"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#eef2ff',
                fontSize: 14,
                marginBottom: 16,
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(0, 255, 224, 0.3)'
                e.target.style.background = 'rgba(0, 255, 224, 0.04)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                e.target.style.background = 'rgba(255, 255, 255, 0.04)'
              }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => {
                  setShowAddTopicModal(false)
                  setNewTopicName('')
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(238, 242, 255, 0.7)',
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)'
                  e.target.style.color = '#eef2ff'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.04)'
                  e.target.style.color = 'rgba(238, 242, 255, 0.7)'
                }}
              >Cancel</button>
              <button
                onClick={handleAddTopic}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(0, 255, 224, 0.16), rgba(124, 58, 255, 0.16))',
                  border: '1px solid rgba(0, 255, 224, 0.4)',
                  color: '#eef2ff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'Syne, sans-serif',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 0 30px rgba(0, 255, 224, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'none'
                  e.target.style.boxShadow = 'none'
                }}
              >Add Topic</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
