import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth'
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore'
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  push
} from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyBTjxPvXWNHVfyO2QM4PVCzFXp9n-yeMpQ",
  authDomain: "synapse-742010.firebaseapp.com",
  projectId: "synapse-742010",
  storageBucket: "synapse-742010.firebasestorage.app",
  messagingSenderId: "788925800329",
  appId: "1:788925800329:web:5dde0778e1f35cd007cb58"
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const rtdb = getDatabase(app)
const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

// ── GOOGLE LOGIN (popup — works on localhost) ──
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    await createOrUpdateUser(result.user)
    return { success: true, user: result.user }
  } catch (err) {
    console.error('Google signin error:', err.code, err.message)
    return { success: false, error: err.message, code: err.code }
  }
}

// ── EMAIL LOGIN ──
export const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password)
    return { success: true, user: result.user }
  } catch (err) {
    return { success: false, error: getAuthError(err.code) }
  }
}

// ── EMAIL SIGNUP ──
export const signUpWithEmail = async (email, password) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await createOrUpdateUser(result.user)
    return { success: true, user: result.user }
  } catch (err) {
    return { success: false, error: getAuthError(err.code) }
  }
}

// ── FORGOT PASSWORD (sends reset email) ──
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email)
    return { success: true }
  } catch (err) {
    return { success: false, error: getAuthError(err.code) }
  }
}

// ── LOGOUT ──
export const logOut = async () => {
  try {
    await signOut(auth)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// ── CREATE OR UPDATE USER IN FIRESTORE ──
export const createOrUpdateUser = async (firebaseUser) => {
  try {
    const ref = doc(db, 'users', firebaseUser.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || '',
        photoURL: firebaseUser.photoURL || '',
        createdAt: serverTimestamp(),
        onboarded: false,
      })
    }
  } catch (err) {
    console.error('createOrUpdateUser error:', err)
  }
}

// ── SAVE ONBOARDING DATA ──
export const saveOnboardingData = async (uid, data) => {
  try {
    const ref = doc(db, 'users', uid)
    await updateDoc(ref, {
      ...data,
      onboarded: true,
      updatedAt: serverTimestamp(),
    })
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// ── GET USER DATA ──
export const getUserData = async (uid) => {
  try {
    const ref = doc(db, 'users', uid)
    const snap = await getDoc(ref)
    if (snap.exists()) return { success: true, data: snap.data() }
    return { success: false, error: 'User not found' }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// ── AUTH STATE LISTENER ──
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback)
}

// ── HUMAN READABLE ERROR MESSAGES ──
const getAuthError = (code) => {
  const errors = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'An account already exists with this email.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/popup-blocked': 'Popup blocked. Please allow popups for this site.',
    'auth/cancelled-popup-request': 'Sign in cancelled.',
    'auth/invalid-credential': 'Invalid email or password.',
  }
  return errors[code] || 'Something went wrong. Please try again.'
}

// ── REALTIME DATABASE SYNC FUNCTIONS ──

// Save user data to Realtime Database
export const saveToRTDB = async (uid, path, data) => {
  try {
    const dbRef = ref(rtdb, `users/${uid}/${path}`)
    await set(dbRef, data)
    return { success: true }
  } catch (err) {
    console.error('RTDB save error:', err)
    return { success: false, error: err.message }
  }
}

// Get user data from Realtime Database
export const getFromRTDB = async (uid, path) => {
  try {
    const dbRef = ref(rtdb, `users/${uid}/${path}`)
    const snapshot = await get(dbRef)
    if (snapshot.exists()) {
      return { success: true, data: snapshot.val() }
    }
    return { success: false, error: 'Data not found' }
  } catch (err) {
    console.error('RTDB get error:', err)
    return { success: false, error: err.message }
  }
}

// Update user data in Realtime Database
export const updateInRTDB = async (uid, path, data) => {
  try {
    const dbRef = ref(rtdb, `users/${uid}/${path}`)
    await update(dbRef, data)
    return { success: true }
  } catch (err) {
    console.error('RTDB update error:', err)
    return { success: false, error: err.message }
  }
}

// Delete user data from Realtime Database
export const deleteFromRTDB = async (uid, path) => {
  try {
    const dbRef = ref(rtdb, `users/${uid}/${path}`)
    await remove(dbRef)
    return { success: true }
  } catch (err) {
    console.error('RTDB delete error:', err)
    return { success: false, error: err.message }
  }
}

// Listen for real-time changes in RTDB
export const listenToRTDB = (uid, path, callback) => {
  const dbRef = ref(rtdb, `users/${uid}/${path}`)
  const unsubscribe = onValue(dbRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val())
    } else {
      callback(null)
    }
  })
  return unsubscribe
}

// Save custom API keys
export const saveCustomAPIKeys = async (uid, keys) => {
  return await saveToRTDB(uid, 'apiKeys', keys)
}

// Get custom API keys
export const getCustomAPIKeys = async (uid) => {
  return await getFromRTDB(uid, 'apiKeys')
}

// Save user preferences (customization)
export const saveUserPreferences = async (uid, preferences) => {
  return await saveToRTDB(uid, 'preferences', preferences)
}

// Get user preferences
export const getUserPreferences = async (uid) => {
  return await getFromRTDB(uid, 'preferences')
}

// Sync all user data from localStorage to RTDB
export const syncAllDataToRTDB = async (uid) => {
  try {
    const data = {
      tasks: JSON.parse(localStorage.getItem('synapse_tasks') || '[]'),
      weakTopics: JSON.parse(localStorage.getItem('synapse_weak_topics') || '[]'),
      exams: JSON.parse(localStorage.getItem('synapse_exam_date') || '[]'),
      studySessions: JSON.parse(localStorage.getItem('synapse_study_sessions') || '[]'),
      notes: JSON.parse(localStorage.getItem('synapse_notes') || '[]'),
      lastSync: Date.now()
    }
    await saveToRTDB(uid, 'syncData', data)
    return { success: true }
  } catch (err) {
    console.error('Sync error:', err)
    return { success: false, error: err.message }
  }
}

// Load all user data from RTDB to localStorage
export const loadDataFromRTDB = async (uid) => {
  try {
    const result = await getFromRTDB(uid, 'syncData')
    if (result.success && result.data) {
      const { tasks, weakTopics, exams, studySessions, notes } = result.data
      if (tasks) localStorage.setItem('synapse_tasks', JSON.stringify(tasks))
      if (weakTopics) localStorage.setItem('synapse_weak_topics', JSON.stringify(weakTopics))
      if (exams) localStorage.setItem('synapse_exam_date', JSON.stringify(exams))
      if (studySessions) localStorage.setItem('synapse_study_sessions', JSON.stringify(studySessions))
      if (notes) localStorage.setItem('synapse_notes', JSON.stringify(notes))
      return { success: true }
    }
    return { success: false, error: 'No synced data found' }
  } catch (err) {
    console.error('Load error:', err)
    return { success: false, error: err.message }
  }
}