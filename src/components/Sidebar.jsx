const NAV = [
  {
    section: 'Main',
    items: [
      { id: 'dashboard', icon: '⌂', label: 'Dashboard' },
      { id: 'ai', icon: '◈', label: 'Synapse AI', badge: 'LIVE' },
      { id: 'planner', icon: '◷', label: 'Study Planner' },
    ]
  },
  {
    section: 'Study',
    items: [
      { id: 'notes', icon: '◻', label: 'Notes' },
      { id: 'flashcards', icon: '⧉', label: 'Flashcards' },
      { id: 'tests', icon: '◎', label: 'Mock Tests' },
      { id: 'timer', icon: '◑', label: 'Study Timer' },
    ]
  },
  {
    section: 'Track',
    items: [
      { id: 'analytics', icon: '◈', label: 'Analytics' },
      { id: 'exams', icon: '◷', label: 'Exam Tracker' },
      { id: 'groups', icon: '◉', label: 'Groups' },
    ]
  },
]

const BOTTOM_NAV = [
  { id: 'aihub', icon: '⚡', label: 'Synapse AI Hub' },
  { id: 'settings', icon: '◎', label: 'Settings' },
]

export default function Sidebar({ activePage, setActivePage, collapsed, setCollapsed, user, onLogout, mobileOpen, setMobileOpen }) {
  return (
    <div className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>

      {/* Top brand */}
      <div className="sidebar-top">
        <div className="sidebar-logo" onClick={() => setActivePage('dashboard')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>
          </svg>
        </div>
        <div className="sidebar-brand">
          <div className="sidebar-name">SYNAPSE</div>
          <div className="sidebar-tag">Academic AI</div>
        </div>
        <div className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '›' : '‹'}
        </div>
      </div>

      {/* User info */}
      {!collapsed && user && (
        <div style={{ padding:'10px 14px 6px', borderBottom:'1px solid var(--glass-border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,#7c3aff,#00ffe0)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'white',flexShrink:0 }}>
              {(user.firstName?.[0] || 'S').toUpperCase()}
            </div>
            <div style={{ overflow:'hidden' }}>
              <div style={{ fontSize:12,fontWeight:600,color:'var(--txt)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>
                {user.firstName || 'Student'}
              </div>
              <div style={{ fontSize:10,color:'var(--txt3)' }}>
                {user.stream === 'science' ? '🔬' : '📊'} {user.examGoal || 'PUC'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV.map(section => (
          <div key={section.section}>
            <div className="nav-section-label">{section.section}</div>
            {section.items.map(item => (
              <div
                key={item.id}
                className={`nav-item${activePage === item.id ? ' active' : ''}`}
                data-label={item.label}
                onClick={() => {
                  setActivePage(item.id)
                  if (mobileOpen) setMobileOpen(false)
                }}
              >
                <span className="nav-icon" style={{ fontStyle:'normal' }}>{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </div>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        {BOTTOM_NAV.map(item => (
          <div
            key={item.id}
            className={`nav-item${activePage === item.id ? ' active' : ''}`}
            data-label={item.label}
            onClick={() => {
              setActivePage(item.id)
              if (mobileOpen) setMobileOpen(false)
            }}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </div>
        ))}
        <div
          className="nav-item"
          data-label="Logout"
          onClick={() => {
            onLogout()
            if (mobileOpen) setMobileOpen(false)
          }}
          style={{ color:'rgba(255,45,120,0.6)' }}
        >
          <span className="nav-icon">⇤</span>
          <span className="nav-label">Logout</span>
        </div>
      </div>
    </div>
  )
}
