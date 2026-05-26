import { useState, useEffect } from 'react'
import { saveCustomAPIKeys, getCustomAPIKeys } from '../firebase/config'

const FEATURES = [
  { icon: '◈', title: 'AI Chat Assistant', desc: 'Ask doubts, get step-by-step solutions, exam tips, and summaries. Context-aware for Indian PUC.', page: 'ai', color: '#7c3aff' },
  { icon: '📷', title: 'Textbook Scanner', desc: 'Tesseract OCR built-in. Scan pages, clean text with AI, and create study materials.', page: 'notes', color: '#00ffe0' },
  { icon: '📚', title: 'Smart Flashcards', desc: 'Generate flashcards from any conversation or note with one click. Perfect for revision.', page: 'ai', color: '#fb923c' },
  { icon: '📝', title: 'Study Summaries', desc: 'Turn long content into exam-ready summaries. Quick revision before tests.', page: 'ai', color: '#4ade80' },
  { icon: '📅', title: 'Study Planner', desc: 'Get personalized study plans for any subject. Daily schedules and revision strategies.', page: 'ai', color: '#38bdf8' },
  { icon: '🎯', title: 'Subject-Specific', desc: 'Physics, Chemistry, Maths, Biology, Commerce — AI tuned for your subjects.', page: 'ai', color: '#f472b6' },
]

export default function AIHub({ user, onPageChange }) {
  const [ping, setPing] = useState(false)
  const [showApiKeys, setShowApiKeys] = useState(false)
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    anthropic: '',
    google: '',
    grok: '',
    custom: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user?.uid) {
      loadApiKeys()
    }
  }, [user])

  const loadApiKeys = async () => {
    try {
      const result = await getCustomAPIKeys(user.uid)
      if (result.success && result.data) {
        setApiKeys(result.data)
      }
    } catch (err) {
      console.error('Failed to load API keys:', err)
    }
  }

  const handleSaveApiKeys = async () => {
    setSaving(true)
    try {
      await saveCustomAPIKeys(user.uid, apiKeys)
      setShowApiKeys(false)
    } catch (err) {
      console.error('Failed to save API keys:', err)
      alert('Failed to save API keys. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rise">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(0,255,224,0.3); }
          50% { box-shadow: 0 0 40px rgba(0,255,224,0.5); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .feature-card {
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.3);
        }
      `}</style>

      <div style={{ textAlign: 'center', marginBottom: 28, padding: '28px 20px', borderRadius: 18, background: 'linear-gradient(135deg,rgba(124,58,255,0.15),rgba(0,255,224,0.1))', border: '1px solid rgba(0,255,224,0.25)', backdropFilter: 'blur(10px)' }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px', background: 'linear-gradient(135deg,#7c3aff 0%,#00ffe0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, boxShadow: '0 0 50px rgba(0,255,224,0.3)', animation: 'pulse-glow 3s ease-in-out infinite' }}>
          ◈
        </div>
        <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 26, fontWeight: 800, marginBottom: 10, background: 'linear-gradient(135deg, #fff, rgba(0,255,224,0.9))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Synapse AI
        </div>
        <div style={{ fontSize: 14, color: 'var(--txt2)', lineHeight: 1.7, maxWidth: 400, margin: '0 auto' }}>
          Your personal academic AI — tuned for Indian PUC Science & Commerce. No API keys. No external websites. Everything runs inside Synapse.
        </div>
        <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 18px', borderRadius: 100, background: 'linear-gradient(135deg, rgba(74,222,128,0.15), rgba(34,197,94,0.15))', border: '1px solid rgba(74,222,128,0.3)', fontSize: 13, color: '#4ade80', fontWeight: 600 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 12px #4ade80' }} />
          Powered by Llama 3.3
        </div>
      </div>

      <div className="section-label" style={{ marginBottom: 16 }}>AI-Powered Features</div>
      
      {/* Custom API Keys Section */}
      <div style={{ marginBottom: 24 }}>
        <button
          type="button"
          onClick={() => setShowApiKeys(!showApiKeys)}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.03)',
            color: 'var(--txt)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0,255,224,0.3)'
            e.currentTarget.style.background = 'rgba(0,255,224,0.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
          }}
        >
          <span>🔑 Custom API Keys</span>
          <span style={{ fontSize: 18 }}>{showApiKeys ? '−' : '+'}</span>
        </button>

        {showApiKeys && (
          <div style={{
            marginTop: 12,
            padding: 16,
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.02)',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 12, lineHeight: 1.6 }}>
              Add your own API keys to use any AI model you want. Keys are encrypted and stored securely in Firebase.
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 6 }}>OpenAI API Key (GPT-4, GPT-3.5)</div>
                <input
                  type="password"
                  value={apiKeys.openai}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, openai: e.target.value }))}
                  placeholder="sk-..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--txt)',
                    fontSize: 13
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 6 }}>Anthropic API Key (Claude)</div>
                <input
                  type="password"
                  value={apiKeys.anthropic}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, anthropic: e.target.value }))}
                  placeholder="sk-ant-..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--txt)',
                    fontSize: 13
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 6 }}>Google API Key (Gemini)</div>
                <input
                  type="password"
                  value={apiKeys.google}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, google: e.target.value }))}
                  placeholder="AIza..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--txt)',
                    fontSize: 13
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 6 }}>xAI API Key (Grok)</div>
                <input
                  type="password"
                  value={apiKeys.grok}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, grok: e.target.value }))}
                  placeholder="xai-..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--txt)',
                    fontSize: 13
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 6 }}>Custom API Endpoint</div>
                <input
                  type="text"
                  value={apiKeys.custom}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, custom: e.target.value }))}
                  placeholder="https://api.example.com/v1"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--txt)',
                    fontSize: 13
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={handleSaveApiKeys}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #7c3aff 0%, #00ffe0 100%)',
                    border: 'none',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  {saving ? 'Saving...' : 'Save Keys'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowApiKeys(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--txt)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="section-label" style={{ marginBottom: 16 }}>AI-Powered Features</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginBottom: 24 }}>
        {FEATURES.map((f, i) => (
          <button
            key={f.title}
            type="button"
            onClick={() => onPageChange?.(f.page)}
            className="feature-card"
            style={{
              textAlign: 'left',
              padding: '18px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.03)',
              cursor: 'pointer',
              color: 'inherit',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = f.color
              e.currentTarget.style.background = `${f.color}15`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: f.color }} />
            <div style={{ fontSize: 28, marginBottom: 10, animation: `float 3s ease-in-out ${i * 0.2}s infinite` }}>{f.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: 'var(--txt)' }}>{f.title}</div>
            <div style={{ fontSize: 12, color: 'var(--txt3)', lineHeight: 1.5 }}>{f.desc}</div>
          </button>
        ))}
      </div>

      <div style={{ padding: '18px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(66,133,244,0.08), rgba(124,58,255,0.08))', border: '1px solid rgba(66,133,244,0.2)', fontSize: 13, color: 'var(--txt2)', lineHeight: 1.8 }}>
        <strong style={{ color: '#93c5fd', fontSize: 14 }}>Why Synapse AI beats generic chatbots</strong>
        <ul style={{ margin: '12px 0 0 20px', padding: 0 }}>
          <li style={{ marginBottom: 8 }}>Knows PUC subjects, boards (CBSE/ISC), and entrance exams (JEE, NEET, CUET)</li>
          <li style={{ marginBottom: 8 }}>Step-by-step maths & science explanations with reasoning</li>
          <li style={{ marginBottom: 8 }}>Works with scanned textbook pages (OCR + AI cleaning)</li>
          <li style={{ marginBottom: 8 }}>Students never leave the app or paste API keys</li>
          <li>Generate flashcards, summaries, and study plans instantly</li>
        </ul>
      </div>

      <button
        type="button"
        className="btn btn-primary"
        style={{ 
          width: '100%', 
          marginTop: 20, 
          justifyContent: 'center',
          padding: '14px',
          fontSize: 15,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #7c3aff 0%, #00ffe0 100%)',
          border: 'none',
          boxShadow: '0 4px 20px rgba(124,58,255,0.3)',
          transition: 'all 0.3s ease'
        }}
        onClick={() => {
          setPing(true)
          onPageChange?.('ai')
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 6px 30px rgba(124,58,255,0.4)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,255,0.3)'
        }}
      >
        {ping ? 'Opening…' : 'Start chatting with Synapse AI →'}
      </button>
    </div>
  )
}
