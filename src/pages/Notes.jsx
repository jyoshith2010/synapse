import { useState, useEffect, useRef, useMemo } from 'react'
import { getNotes, saveNotes } from '../lib/storage'
import { scanImageText } from '../lib/ocr/tesseract'
import { synapseSummarize, synapseCleanOcr, synapseFlashcards, formatSynapseError } from '../lib/ai/synapseAi'

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Accountancy', 'Business Studies', 'Economics', 'Statistics', 'Computer Science', 'Other']
const colors = {
  Physics: '#00ffe0',
  Chemistry: '#fb923c',
  Mathematics: '#7c3aff',
  Biology: '#4ade80',
  Accountancy: '#f472b6',
  'Business Studies': '#a78bfa',
  Economics: '#fbbf24',
  Statistics: '#22d3ee',
  'Computer Science': '#06b6d4',
  Other: '#94a3b8',
}

export default function Notes({ user, onPageChange }) {
  const [notes, setNotes] = useState([])
  const [scanOpen, setScanOpen] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanning, setScanning] = useState(false)
  const [extracted, setExtracted] = useState('')
  const [subject, setSubject] = useState('Physics')
  const [title, setTitle] = useState('')
  const [summarizing, setSummarizing] = useState(false)
  const [flashcards, setFlashcards] = useState(null)
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false)
  const fileRef = useRef(null)
  
  // New state for organization
  const [folders, setFolders] = useState([
    { id: 'all', name: 'All Notes', icon: '📚' },
    { id: 'favorites', name: 'Favorites', icon: '⭐' },
    { id: 'recent', name: 'Recent', icon: '🕐' },
  ])
  const [activeFolder, setActiveFolder] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [showTagInput, setShowTagInput] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [editingNoteId, setEditingNoteId] = useState(null)

  useEffect(() => {
    setNotes(getNotes())
  }, [])

  const persist = (list) => {
    setNotes(list)
    saveNotes(list)
  }

  // Filter notes based on folder, search, and tags
  const filteredNotes = useMemo(() => {
    let filtered = [...notes]
    
    // Filter by folder
    if (activeFolder === 'favorites') {
      filtered = filtered.filter(n => n.favorite)
    } else if (activeFolder === 'recent') {
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      filtered = filtered.filter(n => n.createdAt && n.createdAt > oneWeekAgo)
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(n => 
        n.topic?.toLowerCase().includes(query) ||
        n.body?.toLowerCase().includes(query) ||
        n.tags?.some(t => t.toLowerCase().includes(query))
      )
    }
    
    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(n => 
        selectedTags.every(tag => n.tags?.includes(tag))
      )
    }
    
    return filtered
  }, [notes, activeFolder, searchQuery, selectedTags])

  // Get all unique tags from notes
  const allTags = useMemo(() => {
    const tags = new Set()
    notes.forEach(note => {
      note.tags?.forEach(tag => tags.add(tag))
    })
    return Array.from(tags)
  }, [notes])

  // Toggle favorite
  const toggleFavorite = (id) => {
    const updated = notes.map(n => 
      n.id === id ? { ...n, favorite: !n.favorite } : n
    )
    persist(updated)
  }

  // Add tag to note
  const addTagToNote = (noteId, tag) => {
    const updated = notes.map(n => {
      if (n.id === noteId) {
        const existingTags = n.tags || []
        return { ...n, tags: [...existingTags, tag] }
      }
      return n
    })
    persist(updated)
  }

  // Remove tag from note
  const removeTagFromNote = (noteId, tagToRemove) => {
    const updated = notes.map(n => {
      if (n.id === noteId) {
        return { ...n, tags: n.tags?.filter(t => t !== tagToRemove) || [] }
      }
      return n
    })
    persist(updated)
  }

  // Create new folder
  const createFolder = (name) => {
    const newFolder = {
      id: `folder-${Date.now()}`,
      name,
      icon: '📁'
    }
    setFolders([...folders, newFolder])
  }

  // Delete note
  const deleteNote = (id) => {
    const updated = notes.filter(n => n.id !== id)
    persist(updated)
  }

  // Update note
  const updateNote = (id, updates) => {
    const updated = notes.map(n => 
      n.id === id ? { ...n, ...updates } : n
    )
    persist(updated)
  }

  const handleScan = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScanOpen(true)
    setScanning(true)
    setScanProgress(0)
    setExtracted('')
    try {
      const text = await scanImageText(file, setScanProgress)
      setExtracted(text || 'No text detected. Try a clearer photo with good lighting.')
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''))
    } catch (err) {
      setExtracted(`Scan failed: ${err.message}`)
    } finally {
      setScanning(false)
      e.target.value = ''
    }
  }

  const saveScannedNote = () => {
    if (!extracted.trim()) return
    const note = {
      id: Date.now().toString(),
      subj: subject,
      topic: title || 'Scanned note',
      preview: extracted.slice(0, 120),
      body: extracted,
      time: 'Just now',
      tag: 'Tesseract OCR',
      source: 'scan',
      tags: [],
      favorite: false,
      createdAt: Date.now(),
    }
    persist([note, ...notes])
    setScanOpen(false)
    setExtracted('')
    setTitle('')
  }

  const aiClean = async () => {
    if (!extracted.trim()) return
    setSummarizing(true)
    try {
      const cleaned = await synapseCleanOcr(extracted.slice(0, 12000), user)
      setExtracted(cleaned)
    } catch (err) {
      setExtracted((prev) => `${prev}\n\n[Clean-up failed: ${formatSynapseError(err)}]`)
    } finally {
      setSummarizing(false)
    }
  }

  const aiSummarize = async () => {
    if (!extracted.trim()) return
    setSummarizing(true)
    try {
      const summary = await synapseSummarize(extracted.slice(0, 12000), subject, user)
      setExtracted((prev) => `${prev}\n\n--- Synapse AI Summary ---\n${summary}`)
    } catch (err) {
      setExtracted((prev) => `${prev}\n\n[Summary failed: ${formatSynapseError(err)}]`)
    } finally {
      setSummarizing(false)
    }
  }

  const generateFlashcardsFromNote = async () => {
    if (!extracted.trim()) return
    setGeneratingFlashcards(true)
    try {
      const flashcardsData = await synapseFlashcards(extracted.slice(0, 12000), subject, user)
      
      // Parse the JSON response
      let parsedFlashcards
      try {
        parsedFlashcards = JSON.parse(flashcardsData)
      } catch {
        const jsonMatch = flashcardsData.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          parsedFlashcards = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('Could not parse flashcards data')
        }
      }

      if (Array.isArray(parsedFlashcards) && parsedFlashcards.length > 0) {
        setFlashcards(parsedFlashcards)
      } else {
        alert('Could not generate flashcards. Please try again with more content.')
      }
    } catch (err) {
      alert(`Flashcard generation failed: ${formatSynapseError(err)}`)
    } finally {
      setGeneratingFlashcards(false)
    }
  }

  return (
    <div className="rise">
      <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(0,255,224,0.04)', border: '1px solid rgba(0,255,224,0.12)', fontSize: 12, color: 'var(--txt2)', lineHeight: 1.6, marginBottom: 16 }}>
        📷 <strong style={{ color: 'var(--txt)' }}>Built-in scanner:</strong> Tesseract OCR runs inside Synapse.{' '}
        <strong style={{ color: 'var(--txt)' }}>Synapse AI</strong> cleans text and creates summaries — no setup needed.
      </div>

      {/* Folders and Search Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {/* Folder Navigation */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {folders.map(folder => (
            <button
              key={folder.id}
              onClick={() => setActiveFolder(folder.id)}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: activeFolder === folder.id ? '1px solid rgba(0,255,224,0.4)' : '1px solid var(--glass-border)',
                background: activeFolder === folder.id ? 'rgba(0,255,224,0.08)' : 'var(--glass)',
                color: activeFolder === folder.id ? 'var(--c)' : 'var(--txt2)',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s'
              }}
            >
              <span>{folder.icon}</span>
              <span>{folder.name}</span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div style={{ flex: 1, minWidth: 200, maxWidth: 400 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              background: 'var(--glass)',
              border: '1px solid var(--glass-border)',
              color: 'var(--txt)',
              fontSize: 13
            }}
          />
        </div>
      </div>

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Filter by tags
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => {
                  setSelectedTags(prev => 
                    prev.includes(tag) 
                      ? prev.filter(t => t !== tag)
                      : [...prev, tag]
                  )
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 100,
                  border: selectedTags.includes(tag) ? '1px solid rgba(0,255,224,0.4)' : '1px solid var(--glass-border)',
                  background: selectedTags.includes(tag) ? 'rgba(0,255,224,0.08)' : 'var(--glass)',
                  color: selectedTags.includes(tag) ? 'var(--c)' : 'var(--txt2)',
                  fontSize: 11,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tag}
                {selectedTags.includes(tag) && ' ×'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleScan} />
        <button type="button" className="btn btn-primary" style={{ fontSize: 12, padding: '8px 14px' }} onClick={() => fileRef.current?.click()}>
          📷 Scan textbook / notes
        </button>
        <button type="button" className="btn btn-ghost" style={{ fontSize: 12, padding: '8px 14px' }} onClick={() => onPageChange?.('ai')}>
          ◈ Synapse AI
        </button>
      </div>

      {scanOpen && (
        <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--glass)' }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
            Tesseract OCR Scanner
          </div>
          {scanning && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 6 }}>Reading image… {scanProgress}%</div>
              <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${scanProgress}%`, background: 'linear-gradient(90deg,#00ffe0,#7c3aff)', transition: 'width 0.2s' }} />
              </div>
            </div>
          )}
          {!scanning && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <input className="field-input" placeholder="Note title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ flex: 1, minWidth: 140 }} />
                <select className="field-input" value={subject} onChange={(e) => setSubject(e.target.value)} style={{ width: 130 }}>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                className="field-input"
                value={extracted}
                onChange={(e) => setExtracted(e.target.value)}
                rows={8}
                style={{ width: '100%', resize: 'vertical', marginBottom: 10, fontFamily: 'inherit', lineHeight: 1.5 }}
              />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setScanOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={aiClean} disabled={summarizing || !extracted}>
                  {summarizing ? 'Working…' : '✨ Clean text'}
                </button>
                <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={aiSummarize} disabled={summarizing || !extracted}>
                  {summarizing ? 'Working…' : '◈ Summary'}
                </button>
                <button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={generateFlashcardsFromNote} disabled={generatingFlashcards || !extracted}>
                  {generatingFlashcards ? 'Working…' : '📚 Flashcards'}
                </button>
                <button type="button" className="btn btn-primary" style={{ fontSize: 12 }} onClick={saveScannedNote} disabled={!extracted.trim()}>
                  Save note
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="section-label">Your notes ({filteredNotes.length})</div>
      {filteredNotes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--txt3)', fontSize: 13 }}>
          {searchQuery || selectedTags.length > 0 ? 'No notes match your filters.' : 'No notes yet. Scan a textbook page or handwritten notes to get started.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredNotes.map((n) => (
            <div
              key={n.id}
              style={{
                padding: '13px 14px',
                borderRadius: 11,
                border: '1px solid var(--glass-border)',
                background: 'var(--glass)',
                borderLeft: `3px solid ${colors[n.subj] || 'var(--c)'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => toggleFavorite(n.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 16,
                      opacity: n.favorite ? 1 : 0.3,
                      transition: 'opacity 0.2s'
                    }}
                  >
                    {n.favorite ? '⭐' : '☆'}
                  </button>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{n.topic}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{n.time}</div>
                  <button
                    onClick={() => deleteNote(n.id)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      background: 'rgba(248,113,113,0.1)',
                      border: '1px solid rgba(248,113,113,0.2)',
                      color: '#f87171',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 6, whiteSpace: 'pre-wrap', maxHeight: 80, overflow: 'hidden' }}>
                {n.preview}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: `${colors[n.subj]}15`, color: colors[n.subj] }}>
                  {n.subj}
                </span>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: 'var(--glass)', color: 'var(--txt3)', border: '1px solid var(--glass-border)' }}>
                  {n.tag}
                </span>
                {n.tags && n.tags.length > 0 && n.tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 100,
                      background: 'rgba(124,58,255,0.1)',
                      color: '#a78bfa',
                      border: '1px solid rgba(124,58,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    {tag}
                    <button
                      onClick={() => removeTagFromNote(n.id, tag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 10,
                        color: '#a78bfa',
                        padding: 0,
                        lineHeight: 1
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => {
                    const tag = prompt('Add tag:')
                    if (tag && tag.trim()) {
                      addTagToNote(n.id, tag.trim())
                    }
                  }}
                  style={{
                    fontSize: 10,
                    padding: '2px 8px',
                    borderRadius: 100,
                    background: 'rgba(0,255,224,0.1)',
                    border: '1px solid rgba(0,255,224,0.2)',
                    color: 'var(--c)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  + Tag
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
          <div style={{
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
                  {flashcards.length} cards generated from your note
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
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
                💡 <strong>Tip:</strong> Review these flashcards regularly for better retention.
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
