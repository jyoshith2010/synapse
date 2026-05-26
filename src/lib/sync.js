import { saveToRTDB, getFromRTDB, listenToRTDB } from '../firebase/config'

let syncEnabled = false
let syncInterval = null
let currentUid = null

// Initialize sync for a user
export const initializeSync = (uid) => {
  if (syncEnabled && currentUid === uid) return
  
  currentUid = uid
  syncEnabled = true
  
  // Load data from RTDB on initialization
  loadDataFromCloud(uid)
  
  // Set up real-time listener for changes
  const unsubscribe = listenToRTDB(uid, 'syncData', (data) => {
    if (data && data.lastSync) {
      const localLastSync = parseInt(localStorage.getItem('synapse_last_sync') || '0')
      if (data.lastSync > localLastSync) {
        // Cloud data is newer, load it
        applyCloudData(data)
      }
    }
  })
  
  // Auto-sync every 30 seconds
  syncInterval = setInterval(() => {
    syncToCloud(uid)
  }, 30000)
  
  return unsubscribe
}

// Stop sync
export const stopSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
  }
  syncEnabled = false
  currentUid = null
}

// Sync current localStorage data to cloud
export const syncToCloud = async (uid) => {
  if (!syncEnabled || !uid) return
  
  try {
    const data = {
      tasks: JSON.parse(localStorage.getItem('synapse_tasks') || '[]'),
      weakTopics: JSON.parse(localStorage.getItem('synapse_weak_topics') || '[]'),
      exams: JSON.parse(localStorage.getItem('synapse_exam_date') || '[]'),
      studySessions: JSON.parse(localStorage.getItem('synapse_study_sessions') || '[]'),
      notes: JSON.parse(localStorage.getItem('synapse_notes') || '[]'),
      flashcards: JSON.parse(localStorage.getItem('synapse_flashcards') || '[]'),
      mockTests: JSON.parse(localStorage.getItem('synapse_mock_tests') || '[]'),
      adminSyllabi: JSON.parse(localStorage.getItem('synapse_admin_syllabi') || '[]'),
      widgetPreferences: JSON.parse(localStorage.getItem('synapse_widget_preferences') || '{}'),
      widgetOrder: JSON.parse(localStorage.getItem('synapse_widget_order') || '[]'),
      backgroundImage: localStorage.getItem('synapse_background_image') || '',
      accentColor: localStorage.getItem('synapse_accent_color') || '#00ffe0',
      widgetOpacity: parseFloat(localStorage.getItem('synapse_widget_opacity') || '0.88'),
      gridColumns: parseInt(localStorage.getItem('synapse_grid_columns') || '2'),
      widgetSize: localStorage.getItem('synapse_widget_size') || 'medium',
      aiConfig: JSON.parse(localStorage.getItem('synapse_ai_config') || 'null'),
      lastSync: Date.now()
    }
    
    await saveToRTDB(uid, 'syncData', data)
    localStorage.setItem('synapse_last_sync', data.lastSync.toString())
  } catch (err) {
    console.error('Sync to cloud error:', err)
  }
}

// Load data from cloud
export const loadDataFromCloud = async (uid) => {
  try {
    const result = await getFromRTDB(uid, 'syncData')
    if (result.success && result.data) {
      applyCloudData(result.data)
    }
  } catch (err) {
    console.error('Load from cloud error:', err)
  }
}

// Apply cloud data to localStorage
const applyCloudData = (data) => {
  if (data.tasks) localStorage.setItem('synapse_tasks', JSON.stringify(data.tasks))
  if (data.weakTopics) localStorage.setItem('synapse_weak_topics', JSON.stringify(data.weakTopics))
  if (data.exams) localStorage.setItem('synapse_exam_date', JSON.stringify(data.exams))
  if (data.studySessions) localStorage.setItem('synapse_study_sessions', JSON.stringify(data.studySessions))
  if (data.notes) localStorage.setItem('synapse_notes', JSON.stringify(data.notes))
  if (data.flashcards) localStorage.setItem('synapse_flashcards', JSON.stringify(data.flashcards))
  if (data.mockTests) localStorage.setItem('synapse_mock_tests', JSON.stringify(data.mockTests))
  if (data.adminSyllabi) localStorage.setItem('synapse_admin_syllabi', JSON.stringify(data.adminSyllabi))
  if (data.widgetPreferences) localStorage.setItem('synapse_widget_preferences', JSON.stringify(data.widgetPreferences))
  if (data.widgetOrder) localStorage.setItem('synapse_widget_order', JSON.stringify(data.widgetOrder))
  if (data.backgroundImage) localStorage.setItem('synapse_background_image', data.backgroundImage)
  if (data.accentColor) localStorage.setItem('synapse_accent_color', data.accentColor)
  if (data.widgetOpacity) localStorage.setItem('synapse_widget_opacity', data.widgetOpacity.toString())
  if (data.gridColumns) localStorage.setItem('synapse_grid_columns', data.gridColumns.toString())
  if (data.widgetSize) localStorage.setItem('synapse_widget_size', data.widgetSize)
  if (data.aiConfig) localStorage.setItem('synapse_ai_config', JSON.stringify(data.aiConfig))
  if (data.lastSync) localStorage.setItem('synapse_last_sync', data.lastSync.toString())
  
  // Dispatch event to notify components
  window.dispatchEvent(new CustomEvent('synapse-data-synced'))
}

// Manual sync trigger
export const triggerSync = async (uid) => {
  await syncToCloud(uid)
  await loadDataFromCloud(uid)
}

// Check if sync is enabled
export const isSyncEnabled = () => syncEnabled
