import { DEFAULT_AI_PROVIDER } from './ai/providers'
import { syncToCloud } from './sync'

const AI_CONFIG_KEY = 'synapse_ai_config'
const NOTES_KEY = 'synapse_notes'
const TASKS_KEY = 'synapse_tasks'
const STUDY_SESSIONS_KEY = 'synapse_study_sessions'
const EXAM_DATE_KEY = 'synapse_exam_date'
const WEAK_TOPICS_KEY = 'synapse_weak_topics'
const FLASHCARDS_KEY = 'synapse_flashcards'

// Performance optimization: Simple in-memory cache
const cache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function getCached(key, fetchFn) {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }
  const data = fetchFn()
  cache.set(key, { data, timestamp: Date.now() })
  return data
}

// Clear cache periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > CACHE_DURATION) {
        cache.delete(key)
      }
    }
  }, 10 * 60 * 1000) // Clean every 10 minutes
}

let currentUid = null

// Set current user ID for sync
export function setCurrentUserUid(uid) {
  currentUid = uid
}

export async function getAiConfig() {
  return getCached('ai_config', () => {
    try {
      const raw = localStorage.getItem(AI_CONFIG_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
}

export async function saveAiConfig(config) {
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config))
  cache.delete('ai_config')
  if (currentUid) syncToCloud(currentUid)
}

/** Preferred provider when nothing saved yet (Gemini). */
export function getSuggestedAiProvider() {
  return DEFAULT_AI_PROVIDER
}

export function getNotes() {
  return getCached('notes', () => {
    try {
      const raw = localStorage.getItem(NOTES_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
}

export function saveNotes(notes) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
  cache.delete('notes')
  if (currentUid) syncToCloud(currentUid)
}

export function getTasks() {
  return getCached('tasks', () => {
    try {
      const raw = localStorage.getItem(TASKS_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
}

export function saveTasks(tasks) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
  cache.delete('tasks')
  if (currentUid) syncToCloud(currentUid)
}

export function getStudySessions() {
  return getCached('study_sessions', () => {
    try {
      const raw = localStorage.getItem(STUDY_SESSIONS_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
}

export function saveStudySessions(sessions) {
  localStorage.setItem(STUDY_SESSIONS_KEY, JSON.stringify(sessions))
  cache.delete('study_sessions')
  if (currentUid) syncToCloud(currentUid)
}

export function getExamDate() {
  try {
    const raw = localStorage.getItem(EXAM_DATE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveExamDate(examDate) {
  localStorage.setItem(EXAM_DATE_KEY, JSON.stringify(examDate))
  if (currentUid) syncToCloud(currentUid)
}

export function getExams() {
  return getCached('exams', () => {
    try {
      const raw = localStorage.getItem(EXAM_DATE_KEY)
      const data = raw ? JSON.parse(raw) : null
      // Handle both old format (single exam) and new format (array of exams)
      if (Array.isArray(data)) {
        return data
      } else if (data && data.date) {
        // Convert old format to new format
        return [{ id: 1, name: data.name || 'Exam', date: data.date }]
      }
      return []
    } catch {
      return []
    }
  })
}

export function saveExams(exams) {
  localStorage.setItem(EXAM_DATE_KEY, JSON.stringify(exams))
  cache.delete('exams')
  if (currentUid) syncToCloud(currentUid)
}

export function getWeakTopics() {
  return getCached('weak_topics', () => {
    try {
      const raw = localStorage.getItem(WEAK_TOPICS_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
}

export function saveWeakTopics(topics) {
  localStorage.setItem(WEAK_TOPICS_KEY, JSON.stringify(topics))
  cache.delete('weak_topics')
  if (currentUid) syncToCloud(currentUid)
}

export function getFlashcards() {
  return getCached('flashcards', () => {
    try {
      const raw = localStorage.getItem(FLASHCARDS_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
}

export function saveFlashcards(cards) {
  localStorage.setItem(FLASHCARDS_KEY, JSON.stringify(cards))
  cache.delete('flashcards')
  if (currentUid) syncToCloud(currentUid)
}
