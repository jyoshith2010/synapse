import { useState, useEffect, useRef } from 'react'
import { synapseChat, synapseFlashcards, synapseSummarize, formatSynapseError } from '../lib/ai/synapseAi'
import { quickScan } from '../lib/ocr/tesseract'
import { getWeakTopics, getExams, getTasks } from '../lib/storage'

// Simple markdown parser for bold text
function parseMarkdown(text) {
  if (!text) return text
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/### (.*?)(\n|$)/g, '<h3 style="font-size: 16px; font-weight: 700; margin: 12px 0 8px 0; color: var(--txt);">$1</h3>')
    .replace(/## (.*?)(\n|$)/g, '<h2 style="font-size: 18px; font-weight: 700; margin: 14px 0 10px 0; color: var(--txt);">$1</h2>')
    .replace(/- (.*?)(\n|$)/g, '<li style="margin: 4px 0; margin-left: 20px;">$1</li>')
    .replace(/\n/g, '<br />')
}

const WELCOME =
  "Hi! I'm **Synapse AI** — built into Synapse for PUC students. Ask doubts, get step-by-step solutions, exam tips, or summaries. No setup needed."

const QUICK = [
  'Explain Newton\'s 3rd law simply',
  'Give me a 3-day plan for Organic Chemistry',
  'Difference between debit and credit note',
  'Create a study plan for my exams',
]

const SUBJECTS = ['General', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Accountancy', 'Business Studies', 'Economics', 'Statistics', 'Computer Science']

export default function AIAssistant({ user }) {
  const [msgs, setMsgs] = useState([{ role: 'ai', content: WELCOME }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [flashcards, setFlashcards] = useState(null)
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false)
  const [summary, setSummary] = useState(null)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [studyPlan, setStudyPlan] = useState(null)
  const [generatingStudyPlan, setGeneratingStudyPlan] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState('General')
  const [studentContext, setStudentContext] = useState(null)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    // Load student's subject preferences and context
    const weakTopics = getWeakTopics()
    const exams = getExams()
    const tasks = getTasks()
    
    const context = {
      weakTopics: weakTopics.map(t => ({ topic: t.topic, accuracy: t.acc })),
      upcomingExams: exams.map(e => ({ name: e.name, date: e.date, daysUntil: Math.ceil((new Date(e.date) - new Date()) / (1000 * 60 * 60 * 24)) })),
      recentTasks: tasks.slice(0, 5).map(t => ({ subject: t.subject, task: t.task })),
      subjects: user?.subjects || []
    }
    
    setStudentContext(context)
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  const send = async (textOverride) => {
    const text = (textOverride ?? input).trim()
    if (!text || loading) return

    // Add subject context if not General
    const subjectContext = selectedSubject !== 'General' 
      ? `[Subject: ${selectedSubject}] ` 
      : ''

    // Add student context to personalize responses
    let contextPrefix = ''
    if (studentContext) {
      const weakTopicsStr = studentContext.weakTopics.length > 0 
        ? `Weak topics: ${studentContext.weakTopics.map(t => t.topic).join(', ')}. ` 
        : ''
      const examsStr = studentContext.upcomingExams.length > 0
        ? `Upcoming exams: ${studentContext.upcomingExams.map(e => `${e.name} in ${e.daysUntil} days`).join(', ')}. `
        : ''
      const subjectsStr = studentContext.subjects.length > 0
        ? `Studying: ${studentContext.subjects.join(', ')}. `
        : ''
      
      contextPrefix = `[Student Context: ${subjectsStr}${weakTopicsStr}${examsStr}] `
    }

    const history = [...msgs, { role: 'user', content: contextPrefix + subjectContext + text }]
    setInput('')
    setMsgs(history)
    setLoading(true)

    try {
      const apiMsgs = history.filter((m) => !(m.role === 'ai' && m.content === WELCOME))
      const reply = await synapseChat(apiMsgs, user)
      setMsgs((m) => [...m, { role: 'ai', content: reply }])
    } catch (err) {
      setMsgs((m) => [...m, { role: 'ai', content: formatSynapseError(err) }])
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setScanning(true)
    setScanProgress(0)
    
    // Add a message showing the image is being scanned
    setMsgs((m) => [...m, { role: 'user', content: '📷 Scanning image...' }])

    try {
      const extractedText = await quickScan(file, (progress) => {
        setScanProgress(progress)
      })

      if (extractedText && extractedText.trim().length > 10) {
        // Replace the scanning message with the actual extracted text
        setMsgs((prev) => {
          const newMsgs = [...prev]
          newMsgs[newMsgs.length - 1] = {
            role: 'user',
            content: `📷 Image scanned. Here's the text:\n\n${extractedText}`
          }
          return newMsgs
        })

        // Automatically send to AI for analysis
        setInput(`Explain this: ${extractedText.slice(0, 500)}...`)
        setTimeout(() => send(`Explain this: ${extractedText.slice(0, 500)}...`), 500)
      } else {
        setMsgs((m) => [...m, { role: 'ai', content: 'Could not extract readable text from the image. Please try with a clearer photo.' }])
      }
    } catch (err) {
      setMsgs((m) => [...m, { role: 'ai', content: `Scanning failed: ${err.message}` }])
    } finally {
      setScanning(false)
      setScanProgress(0)
      e.target.value = ''
    }
  }

  const generateFlashcards = async () => {
    const conversationText = msgs
      .filter((m) => m.role === 'user' && m.content !== WELCOME)
      .map((m) => m.content)
      .join('\n\n')

    if (conversationText.length < 50) {
      setMsgs((m) => [...m, { role: 'ai', content: 'Please have a conversation first so I can create flashcards from the topics discussed.' }])
      return
    }

    setGeneratingFlashcards(true)
    setMsgs((m) => [...m, { role: 'ai', content: '📚 Generating flashcards from our conversation...' }])

    try {
      const flashcardsData = await synapseFlashcards(conversationText, null, user)
      
      // Parse the JSON response
      let parsedFlashcards
      try {
        parsedFlashcards = JSON.parse(flashcardsData)
      } catch {
        // If JSON parsing fails, try to extract JSON from the response
        const jsonMatch = flashcardsData.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          parsedFlashcards = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('Could not parse flashcards data')
        }
      }

      if (Array.isArray(parsedFlashcards) && parsedFlashcards.length > 0) {
        setFlashcards(parsedFlashcards)
        setMsgs((prev) => {
          const newMsgs = [...prev]
          newMsgs[newMsgs.length - 1] = {
            role: 'ai',
            content: `✅ Generated ${parsedFlashcards.length} flashcards! Click the "📚 Flashcards" button to review them.`
          }
          return newMsgs
        })
      } else {
        setMsgs((prev) => {
          const newMsgs = [...prev]
          newMsgs[newMsgs.length - 1] = {
            role: 'ai',
            content: 'Could not generate flashcards. Please try again with more content.'
          }
          return newMsgs
        })
      }
    } catch (err) {
      setMsgs((prev) => {
        const newMsgs = [...prev]
        newMsgs[newMsgs.length - 1] = {
          role: 'ai',
          content: `Flashcard generation failed: ${formatSynapseError(err)}`
        }
        return newMsgs
      })
    } finally {
      setGeneratingFlashcards(false)
    }
  }

  const generateSummary = async () => {
    const conversationText = msgs
      .filter((m) => m.role === 'user' && m.content !== WELCOME)
      .map((m) => m.content)
      .join('\n\n')

    if (conversationText.length < 50) {
      setMsgs((m) => [...m, { role: 'ai', content: 'Please have a conversation first so I can create a summary of the topics discussed.' }])
      return
    }

    setGeneratingSummary(true)
    setMsgs((m) => [...m, { role: 'ai', content: '📝 Generating study summary from our conversation...' }])

    try {
      const summaryData = await synapseSummarize(conversationText, null, user)
      setSummary(summaryData)
      setMsgs((prev) => {
        const newMsgs = [...prev]
        newMsgs[newMsgs.length - 1] = {
          role: 'ai',
          content: `✅ Generated study summary! Click the "📝 Summary" button to review it.`
        }
        return newMsgs
      })
    } catch (err) {
      setMsgs((prev) => {
        const newMsgs = [...prev]
        newMsgs[newMsgs.length - 1] = {
          role: 'ai',
          content: `Summary generation failed: ${formatSynapseError(err)}`
        }
        return newMsgs
      })
    } finally {
      setGeneratingSummary(false)
    }
  }

  const generateStudyPlan = async () => {
    const subjectContext = selectedSubject !== 'General' ? `for ${selectedSubject}` : ''
    const prompt = `Create a detailed study plan ${subjectContext} for exam preparation. Include daily schedule, topics to cover, and revision strategy.`

    setGeneratingStudyPlan(true)
    setMsgs((m) => [...m, { role: 'ai', content: '📅 Generating personalized study plan...' }])

    try {
      const history = [...msgs, { role: 'user', content: prompt }]
      const apiMsgs = history.filter((m) => !(m.role === 'ai' && m.content === WELCOME))
      const plan = await synapseChat(apiMsgs, user)
      setStudyPlan(plan)
      setMsgs((prev) => {
        const newMsgs = [...prev]
        newMsgs[newMsgs.length - 1] = {
          role: 'ai',
          content: `✅ Generated study plan! Click the "📅 Plan" button to review it.`
        }
        return newMsgs
      })
    } catch (err) {
      setMsgs((prev) => {
        const newMsgs = [...prev]
        newMsgs[newMsgs.length - 1] = {
          role: 'ai',
          content: `Study plan generation failed: ${formatSynapseError(err)}`
        }
        return newMsgs
      })
    } finally {
      setGeneratingStudyPlan(false)
    }
  }

  return (
    <div className="rise" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', background: 'linear-gradient(180deg, rgba(124,58,255,0.02) 0%, rgba(0,255,224,0.02) 100%)' }}>
      <style>{`
        @media (max-width: 768px) {
          .mobile-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .mobile-header-buttons {
            width: 100% !important;
            flex-wrap: wrap !important;
          }
          .mobile-header-buttons button {
            flex: 1 !important;
            min-width: 80px !important;
            font-size: 10px !important;
            padding: 5px 8px !important;
          }
          .mobile-header-buttons select {
            flex: 1 !important;
            min-width: 100px !important;
            font-size: 10px !important;
          }
          .mobile-quick-actions {
            display: none !important;
          }
          .mobile-input-area {
            flex-direction: column !important;
            gap: 8px !important;
          }
          .mobile-input-area button {
            width: 100% !important;
          }
          .mobile-input-area input {
            width: 100% !important;
          }
        }
        @media (max-width: 480px) {
          .modal-content {
            width: 95% !important;
            padding: 16px !important;
          }
          .modal-content h2 {
            font-size: 18px !important;
          }
          .flashcards-grid {
            gridTemplateColumns: 1fr !important;
          }
        }
      `}</style>
      {/* Header */}
      <div className="mobile-header" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '14px 16px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(124,58,255,0.08) 0%, rgba(0,255,224,0.08) 100%)', border: '1px solid rgba(124,58,255,0.15)', backdropFilter: 'blur(10px)' }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aff 0%,#00ffe0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 4px 15px rgba(124,58,255,0.3)' }}>
          ◈
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--txt)', marginBottom: 2 }}>Synapse AI</div>
          <div style={{ fontSize: 11, color: 'var(--txt2)', fontWeight: 500 }}>Powered by Llama 3.3 · Built for Indian PUC</div>
        </div>
        <div className="mobile-header-buttons" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            style={{
              fontSize: 11,
              padding: '6px 12px',
              borderRadius: 20,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--txt)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={generateStudyPlan}
            disabled={generatingStudyPlan || loading}
            style={{
              fontSize: 11,
              padding: '6px 12px',
              borderRadius: 20,
              background: studyPlan ? 'linear-gradient(135deg, rgba(124,58,255,0.2) 0%, rgba(0,255,224,0.2) 100%)' : 'rgba(255,255,255,0.04)',
              border: studyPlan ? '1px solid rgba(124,58,255,0.3)' : '1px solid rgba(255,255,255,0.1)',
              color: studyPlan ? '#00ffe0' : 'var(--txt2)',
              fontWeight: 600,
              cursor: (generatingStudyPlan || loading) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!(generatingStudyPlan || loading)) {
                e.target.style.background = 'rgba(124,58,255,0.15)'
                e.target.style.borderColor = 'rgba(124,58,255,0.3)'
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = studyPlan ? 'linear-gradient(135deg, rgba(124,58,255,0.2) 0%, rgba(0,255,224,0.2) 100%)' : 'rgba(255,255,255,0.04)'
              e.target.style.borderColor = studyPlan ? '1px solid rgba(124,58,255,0.3)' : '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {generatingStudyPlan ? '...' : '📅 Plan'}
          </button>
          <button
            onClick={generateSummary}
            disabled={generatingSummary || loading || msgs.length < 3}
            style={{
              fontSize: 11,
              padding: '6px 12px',
              borderRadius: 20,
              background: summary ? 'linear-gradient(135deg, rgba(124,58,255,0.2) 0%, rgba(0,255,224,0.2) 100%)' : 'rgba(255,255,255,0.04)',
              border: summary ? '1px solid rgba(124,58,255,0.3)' : '1px solid rgba(255,255,255,0.1)',
              color: summary ? '#00ffe0' : 'var(--txt2)',
              fontWeight: 600,
              cursor: (generatingSummary || loading || msgs.length < 3) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!(generatingSummary || loading || msgs.length < 3)) {
                e.target.style.background = 'rgba(124,58,255,0.15)'
                e.target.style.borderColor = 'rgba(124,58,255,0.3)'
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = summary ? 'linear-gradient(135deg, rgba(124,58,255,0.2) 0%, rgba(0,255,224,0.2) 100%)' : 'rgba(255,255,255,0.04)'
              e.target.style.borderColor = summary ? '1px solid rgba(124,58,255,0.3)' : '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {generatingSummary ? '...' : '📝 Summary'}
          </button>
          <button
            onClick={generateFlashcards}
            disabled={generatingFlashcards || loading || msgs.length < 3}
            style={{
              fontSize: 11,
              padding: '6px 12px',
              borderRadius: 20,
              background: flashcards ? 'linear-gradient(135deg, rgba(124,58,255,0.2) 0%, rgba(0,255,224,0.2) 100%)' : 'rgba(255,255,255,0.04)',
              border: flashcards ? '1px solid rgba(124,58,255,0.3)' : '1px solid rgba(255,255,255,0.1)',
              color: flashcards ? '#00ffe0' : 'var(--txt2)',
              fontWeight: 600,
              cursor: (generatingFlashcards || loading || msgs.length < 3) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!(generatingFlashcards || loading || msgs.length < 3)) {
                e.target.style.background = 'rgba(124,58,255,0.15)'
                e.target.style.borderColor = 'rgba(124,58,255,0.3)'
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = flashcards ? 'linear-gradient(135deg, rgba(124,58,255,0.2) 0%, rgba(0,255,224,0.2) 100%)' : 'rgba(255,255,255,0.04)'
              e.target.style.borderColor = flashcards ? '1px solid rgba(124,58,255,0.3)' : '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {generatingFlashcards ? '...' : '📚 Flashcards'}
          </button>
          <span style={{ fontSize: 10, padding: '6px 12px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(74,222,128,0.15) 0%, rgba(34,197,94,0.15) 100%)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', fontWeight: 600, letterSpacing: 0.5 }}>
            ONLINE
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mobile-quick-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, padding: '0 4px' }}>
        {QUICK.map((q, i) => (
          <button 
            key={q} 
            type="button" 
            className="btn btn-ghost" 
            style={{ 
              fontSize: 12, 
              padding: '8px 14px', 
              borderRadius: 20,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease',
              fontWeight: 500
            }} 
            onClick={() => send(q)} 
            disabled={loading}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(0,255,224,0.1)'
              e.target.style.borderColor = 'rgba(0,255,224,0.3)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.03)'
              e.target.style.borderColor = 'rgba(255,255,255,0.08)'
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16, padding: '0 4px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', animation: 'fadeIn 0.3s ease' }}>
            <div
              style={{
                maxWidth: '80%',
                padding: m.role === 'user' ? '14px 18px' : '16px 20px',
                borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: m.role === 'user' 
                  ? 'linear-gradient(135deg, rgba(0,255,224,0.12) 0%, rgba(124,58,255,0.12) 100%)' 
                  : 'rgba(255,255,255,0.06)',
                border: `1px solid ${m.role === 'user' ? 'rgba(0,255,224,0.2)' : 'rgba(255,255,255,0.1)'}`,
                fontSize: 14,
                color: 'var(--txt)',
                lineHeight: 1.7,
                boxShadow: m.role === 'user' ? '0 2px 12px rgba(0,255,224,0.1)' : '0 2px 8px rgba(0,0,0,0.15)',
                backdropFilter: 'blur(10px)',
              }}
              dangerouslySetInnerHTML={{ __html: parseMarkdown(m.content) }}
            />
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, fontSize: 13, color: 'var(--txt3)' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00ffe0', animation: 'pulse 1.5s infinite' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aff', animation: 'pulse 1.5s infinite 0.2s' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00ffe0', animation: 'pulse 1.5s infinite 0.4s' }} />
            </div>
            Synapse AI is thinking...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="mobile-input-area" style={{ display: 'flex', gap: 10, paddingTop: 16, paddingBottom: 8, borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageUpload}
          disabled={loading || scanning}
        />
        <button
          className="btn btn-ghost"
          style={{ 
            padding: '0 16px', 
            borderRadius: 12,
            height: 48,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: 18,
            transition: 'all 0.2s ease'
          }}
          onClick={() => fileInputRef.current?.click()}
          disabled={loading || scanning}
          title="Upload image to scan"
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(0,255,224,0.1)'
            e.target.style.borderColor = 'rgba(0,255,224,0.3)'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.04)'
            e.target.style.borderColor = 'rgba(255,255,255,0.1)'
          }}
        >
          📷
        </button>
        <input
          className="field-input"
          style={{ 
            flex: 1, 
            paddingLeft: 16,
            borderRadius: 12,
            height: 48,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: 14
          }}
          placeholder="Ask Synapse AI anything... or upload an image 📷"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          disabled={loading || scanning}
        />
        <button 
          className="btn btn-primary" 
          style={{ 
            padding: '0 20px', 
            borderRadius: 12,
            height: 48,
            background: 'linear-gradient(135deg, #7c3aff 0%, #00ffe0 100%)',
            border: 'none',
            fontSize: 16,
            fontWeight: 600,
            boxShadow: '0 4px 15px rgba(124,58,255,0.3)',
            transition: 'all 0.2s ease'
          }} 
          onClick={() => send()} 
          disabled={loading || scanning}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)'
            e.target.style.boxShadow = '0 6px 20px rgba(124,58,255,0.4)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = '0 4px 15px rgba(124,58,255,0.3)'
          }}
        >
          {loading || scanning ? '...' : '→'}
        </button>
      </div>

      {/* Scanning Progress */}
      {scanning && (
        <div style={{ marginTop: 12, padding: '14px 16px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(0,255,224,0.08) 0%, rgba(124,58,255,0.08) 100%)', border: '1px solid rgba(0,255,224,0.2)', backdropFilter: 'blur(10px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: 'var(--txt)', fontWeight: 600 }}>Scanning image...</div>
            <div style={{ fontSize: 13, color: '#00ffe0', fontWeight: 700 }}>{scanProgress}%</div>
          </div>
          <div style={{ height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${scanProgress}%`, background: 'linear-gradient(90deg,#00ffe0 0%,#7c3aff 100%)', transition: 'width 0.3s ease', borderRadius: 6 }} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes flipIn {
          0% { transform: rotateY(0); }
          100% { transform: rotateY(180deg); }
        }
      `}</style>

      {/* Flashcards Modal */}
      {flashcards && (
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
          <div className="modal-content" style={{
            width: '90%',
            maxWidth: 700,
            maxHeight: '80vh',
            background: 'linear-gradient(135deg, rgba(124,58,255,0.1) 0%, rgba(0,255,224,0.1) 100%)',
            border: '1px solid rgba(124,58,255,0.3)',
            borderRadius: 20,
            padding: 24,
            overflowY: 'auto',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--txt)', margin: 0 }}>
                  📚 Study Flashcards
                </h2>
                <p style={{ fontSize: 13, color: 'var(--txt2)', margin: '4px 0 0 0' }}>
                  {flashcards.length} cards generated from your conversation
                </p>
              </div>
              <button
                onClick={() => setFlashcards(null)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'var(--txt)',
                  fontSize: 18,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255,100,100,0.2)'
                  e.target.style.borderColor = 'rgba(255,100,100,0.3)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.1)'
                  e.target.style.borderColor = 'rgba(255,255,255,0.2)'
                }}
              >
                ×
              </button>
            </div>

            <div className="flashcards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {flashcards.map((card, index) => (
                <div
                  key={index}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: 16,
                    minHeight: 120,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    animation: `fadeIn 0.3s ease ${index * 0.05}s both`
                  }}
                >
                  <div style={{ fontSize: 12, color: '#00ffe0', fontWeight: 600, marginBottom: 8 }}>
                    Q{index + 1}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--txt)', fontWeight: 600, marginBottom: 12, lineHeight: 1.5 }}>
                    {card.question}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--txt2)', lineHeight: 1.6, padding: 12, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                    <strong style={{ color: '#7c3aff' }}>Answer:</strong> {card.answer}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, padding: 16, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--txt)', margin: 0, lineHeight: 1.6 }}>
                💡 <strong>Tip:</strong> Review these flashcards regularly for better retention. Click the "📚 Flashcards" button again to regenerate with new content.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {summary && (
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
          <div className="modal-content" style={{
            width: '90%',
            maxWidth: 700,
            maxHeight: '80vh',
            background: 'linear-gradient(135deg, rgba(124,58,255,0.1) 0%, rgba(0,255,224,0.1) 100%)',
            border: '1px solid rgba(124,58,255,0.3)',
            borderRadius: 20,
            padding: 24,
            overflowY: 'auto',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--txt)', margin: 0 }}>
                  📝 Study Summary
                </h2>
                <p style={{ fontSize: 13, color: 'var(--txt2)', margin: '4px 0 0 0' }}>
                  Exam-ready notes generated from your conversation
                </p>
              </div>
              <button
                onClick={() => setSummary(null)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'var(--txt)',
                  fontSize: 18,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255,100,100,0.2)'
                  e.target.style.borderColor = 'rgba(255,100,100,0.3)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.1)'
                  e.target.style.borderColor = 'rgba(255,255,255,0.2)'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ fontSize: 14, color: 'var(--txt)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: parseMarkdown(summary) }} />

            <div style={{ marginTop: 20, padding: 16, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--txt)', margin: 0, lineHeight: 1.6 }}>
                💡 <strong>Tip:</strong> Use this summary for quick revision before exams. Click the "📝 Summary" button again to regenerate with new content.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Study Plan Modal */}
      {studyPlan && (
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
          <div className="modal-content" style={{
            width: '90%',
            maxWidth: 700,
            maxHeight: '80vh',
            background: 'linear-gradient(135deg, rgba(124,58,255,0.1) 0%, rgba(0,255,224,0.1) 100%)',
            border: '1px solid rgba(124,58,255,0.3)',
            borderRadius: 20,
            padding: 24,
            overflowY: 'auto',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--txt)', margin: 0 }}>
                  📅 Study Plan
                </h2>
                <p style={{ fontSize: 13, color: 'var(--txt2)', margin: '4px 0 0 0' }}>
                  Personalized study plan for {selectedSubject !== 'General' ? selectedSubject : 'your exams'}
                </p>
              </div>
              <button
                onClick={() => setStudyPlan(null)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'var(--txt)',
                  fontSize: 18,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255,100,100,0.2)'
                  e.target.style.borderColor = 'rgba(255,100,100,0.3)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.1)'
                  e.target.style.borderColor = 'rgba(255,255,255,0.2)'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ fontSize: 14, color: 'var(--txt)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: parseMarkdown(studyPlan) }} />

            <div style={{ marginTop: 20, padding: 16, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--txt)', margin: 0, lineHeight: 1.6 }}>
                💡 <strong>Tip:</strong> Follow this plan consistently for best results. Click the "📅 Plan" button again to regenerate with new parameters.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
