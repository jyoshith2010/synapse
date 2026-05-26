import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import './index.css'
import Canvas from './components/Canvas'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Admin from './pages/Admin'
const Dashboard = lazy(() => import('./pages/Dashboard'))
const AIAssistant = lazy(() => import('./pages/AIAssistant'))
const AIHub = lazy(() => import('./pages/AIHub'))
const Notes = lazy(() => import('./pages/Notes'))
import {
  StudyPlanner, Flashcards, MockTests,
  Timer, Analytics, Groups, ExamTracker, Settings
} from './pages/StubPages'
import { onAuthChange, getUserData, logOut } from './firebase/config'
import { initializeSync, stopSync } from './lib/sync'
import { setCurrentUserUid } from './lib/storage'

// Loading screen component
function LoadingScreen() {
  return (
    <>
      <Canvas />
      <div style={{
        position: 'relative', zIndex: 1, height: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
        animation: 'fadeIn 0.5s ease forwards'
      }}>
        <style>{`
          @keyframes fadeIn { from{opacity:0} to{opacity:1} }
          @keyframes lb { 0%{width:0%;margin-left:0} 50%{width:100%} 100%{width:0%;margin-left:100%} }
          @keyframes logoPulse { 0%,100%{box-shadow:0 0 40px rgba(0,255,224,0.35)} 50%{box-shadow:0 0 64px rgba(0,255,224,0.65),0 0 80px rgba(124,58,255,0.3)} }
          @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        `}</style>

        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg,#7c3aff,#00ffe0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'logoPulse 2s ease-in-out infinite, floatUp 3s ease-in-out infinite',
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>
          </svg>
        </div>

        <div style={{
          fontFamily: 'Syne,sans-serif', fontSize: 26, fontWeight: 800, letterSpacing: 1,
          background: 'linear-gradient(90deg,#fff,rgba(0,255,224,0.8))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>SYNAPSE</div>

        <div style={{ width: 160, height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg,#00ffe0,#7c3aff)', borderRadius: 2, animation: 'lb 1.4s ease-in-out infinite' }}></div>
        </div>

        <div style={{ fontSize: 12, color: 'rgba(238,242,255,0.28)', letterSpacing: 0.5 }}>
          Loading your workspace...
        </div>
      </div>
    </>
  )
}

const PAGES = {
  dashboard:  { component: Dashboard,    title: 'Dashboard',     sub: 'Your command centre' },
  ai:         { component: AIAssistant,  title: 'Synapse AI',      sub: 'Ask anything — ready when you log in' },
  planner:    { component: StudyPlanner, title: 'Study Planner', sub: "Today's plan" },
  notes:      { component: Notes,        title: 'Notes',         sub: 'Your knowledge base' },
  flashcards: { component: Flashcards,   title: 'Flashcards',    sub: 'Quick revision' },
  tests:      { component: MockTests,    title: 'Mock Tests',    sub: 'Practice & analyse' },
  timer:      { component: Timer,        title: 'Study Timer',   sub: 'Focus sessions' },
  analytics:  { component: Analytics,    title: 'Analytics',     sub: 'Your progress' },
  groups:     { component: Groups,       title: 'Groups',        sub: 'Collaborate' },
  exams:      { component: ExamTracker,  title: 'Exam Tracker',  sub: 'Countdowns & syllabus' },
  aihub:      { component: AIHub,        title: 'Synapse AI',    sub: 'Built-in academic intelligence' },
  settings:   { component: Settings,     title: 'Settings',      sub: 'Preferences' },
}

// ── PAGE TRANSITION HOOK ──
// Manages fade-out → swap → fade-in between any two screens
function usePageTransition(initialState) {
  const [current, setCurrent] = useState(initialState)
  const [next, setNext] = useState(null)
  const [phase, setPhase] = useState('idle') // idle | out | in
  const timerRef = useRef(null)

  const navigate = (newState) => {
    if (newState === current) return
    clearTimeout(timerRef.current)
    setNext(newState)
    setPhase('out')
    // After fade-out (0.35s), swap content
    timerRef.current = setTimeout(() => {
      setCurrent(newState)
      setNext(null)
      setPhase('in')
      // After fade-in (0.45s), go idle
      timerRef.current = setTimeout(() => {
        setPhase('idle')
      }, 450)
    }, 350)
  }

  // Force-set without animation (for auth state changes from Firebase)
  const set = (newState) => {
    clearTimeout(timerRef.current)
    if (newState === current) return
    setNext(newState)
    setPhase('out')
    timerRef.current = setTimeout(() => {
      setCurrent(newState)
      setNext(null)
      setPhase('in')
      timerRef.current = setTimeout(() => setPhase('idle'), 450)
    }, 350)
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return { current, phase, navigate, set }
}

export default function App() {
  const { current: authState, phase, navigate, set } = usePageTransition('loading')
  const [activePage, setActivePage] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [backgroundImage, setBackgroundImage] = useState('')
  const [accentColor, setAccentColor] = useState('#00ffe0')
  const updateTheme = (newBackground, newAccentColor) => {
    if (newBackground !== undefined) {
      // Optimize background image for mobile
      const isMobile = window.innerWidth < 768
      if (isMobile && newBackground.length > 50000) {
        // Don't use large background images on mobile
        setBackgroundImage('')
        localStorage.setItem('synapse_background_image', '')
      } else {
        setBackgroundImage(newBackground)
        localStorage.setItem('synapse_background_image', newBackground)
      }
    }
    if (newAccentColor !== undefined) {
      setAccentColor(newAccentColor)
      localStorage.setItem('synapse_accent_color', newAccentColor)
      document.body.style.setProperty('--accent-color', newAccentColor)
    }
  }

  useEffect(() => {
    // Load theme preferences from localStorage
    const savedBackground = localStorage.getItem('synapse_background_image')
    // Optimize background image for mobile
    const isMobile = window.innerWidth < 768
    if (savedBackground && !(isMobile && savedBackground.length > 50000)) {
      setBackgroundImage(savedBackground)
    }
    
    const savedAccentColor = localStorage.getItem('synapse_accent_color')
    if (savedAccentColor) {
      setAccentColor(savedAccentColor)
      document.body.style.setProperty('--accent-color', savedAccentColor)
    }
  }, [])

  // Update CSS variable when accent color changes
  useEffect(() => {
    if (accentColor) {
      document.body.style.setProperty('--accent-color', accentColor)
    }
  }, [accentColor])

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const result = await getUserData(firebaseUser.uid)
        const baseUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || '',
          firstName: firebaseUser.displayName?.split(' ')[0] || 'Student',
        }
        if (result.success && result.data) {
          setUser({ ...baseUser, ...result.data })
          set(result.data.onboarded === true ? 'app' : 'onboarding')
          
          // Initialize sync for logged-in user
          setCurrentUserUid(firebaseUser.uid)
          initializeSync(firebaseUser.uid)
        } else {
          setUser(baseUser)
          set('onboarding')
          
          // Initialize sync for new user
          setCurrentUserUid(firebaseUser.uid)
          initializeSync(firebaseUser.uid)
        }
      } else {
        setUser(null)
        set('landing')
        
        // Stop sync when user logs out
        stopSync()
        setCurrentUserUid(null)
      }
    })
    return () => unsub()
  }, [])

  const handleLogin = (userData) => { if (userData) setUser(userData) }

  const handleOnboardingComplete = (profileData) => {
    setUser(prev => ({ ...prev, ...profileData, onboarded: true }))
    navigate('app')
  }

  const handleLogout = async () => {
    await logOut()
    setUser(null)
    navigate('landing')
  }

  const handleActivePage = (page) => {
    if (page === activePage) return
    setActivePage(page)
    setMobileMenuOpen(false)
  }

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  // transition style for full-page screens
  const transStyle = {
    opacity: phase === 'out' ? 0 : phase === 'in' ? 1 : 1,
    transform: phase === 'out' ? 'translateY(12px) scale(0.99)' : phase === 'in' ? 'translateY(0) scale(1)' : 'translateY(0) scale(1)',
    transition: phase === 'out'
      ? 'opacity 0.35s cubic-bezier(0.4,0,1,1), transform 0.35s cubic-bezier(0.4,0,1,1)'
      : 'opacity 0.45s cubic-bezier(0,0,0.2,1), transform 0.45s cubic-bezier(0,0,0.2,1)',
    willChange: 'opacity, transform',
  }

  if (authState === 'loading') return <LoadingScreen />

  if (authState === 'landing') return (
    <div style={transStyle}>
      <Landing onGetStarted={() => navigate('login')} onAdminAccess={() => navigate('admin')} />
    </div>
  )

  if (authState === 'admin') return (
    <div style={transStyle}>
      <Admin onBack={() => navigate('landing')} />
    </div>
  )

  if (authState === 'login') return (
    <div style={transStyle}>
      <Canvas />
      <Login onLogin={handleLogin} onBack={() => navigate('landing')} />
    </div>
  )

  if (authState === 'onboarding') return (
    <div style={transStyle}>
      <Canvas />
      <Onboarding user={user} onComplete={handleOnboardingComplete} />
    </div>
  )

  // ── DASHBOARD / APP ──
  const pageInfo = PAGES[activePage] || PAGES.dashboard
  const CurrentPage = pageInfo.component

  return (
    <div style={transStyle}>
      <Canvas />
      <div className="shell">
        <Sidebar
          activePage={activePage}
          setActivePage={handleActivePage}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          user={user}
          onLogout={handleLogout}
          mobileOpen={mobileMenuOpen}
          setMobileOpen={setMobileMenuOpen}
        />
        <div className="main">
          <Topbar
            title={pageInfo.title}
            sub={pageInfo.sub}
            user={user}
            onPageChange={handleActivePage}
            onMobileMenuToggle={handleMobileMenuToggle}
          />
          <div className="page-content" style={{
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}>
            <Suspense fallback={<LoadingScreen />}>
              <PageSlide key={activePage}>
                <CurrentPage 
                  user={user} 
                  onPageChange={handleActivePage}
                  backgroundImage={backgroundImage}
                  accentColor={accentColor}
                  updateTheme={updateTheme}
                />
              </PageSlide>
            </Suspense>
          </div>
        </div>
        <div 
          className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(false)}
        />
      </div>
    </div>
  )
}

// ── INNER PAGE SLIDE (for sidebar nav changes) ──
function PageSlide({ children }) {
  const [vis, setVis] = useState(false)
  useEffect(() => {
    setVis(false)
    const t = setTimeout(() => setVis(true), 20)
    return () => clearTimeout(t)
  }, [children])

  return (
    <div style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(14px)',
      transition: 'opacity 0.4s cubic-bezier(0,0,0.2,1), transform 0.4s cubic-bezier(0,0,0.2,1)',
      willChange: 'opacity, transform',
    }}>
      {children}
    </div>
  )
}