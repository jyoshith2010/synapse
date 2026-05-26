// ─── Topbar.jsx ───
export default function Topbar({ title, sub, user, onPageChange, onMobileMenuToggle }) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <button 
          className="mobile-menu-btn"
          onClick={onMobileMenuToggle}
          aria-label="Toggle menu"
        >
          ☰
        </button>
        <div className="topbar-title">{title}</div>
        <div className="topbar-sub">{sub}</div>
      </div>
      <div className="topbar-right">
        <div className="search-wrap">
          <span className="search-icon">⌕</span>
          <input className="search-input" placeholder="Search anything..." />
        </div>
        <div
          className="ai-pill"
          onClick={() => onPageChange('aihub')}
          title="Switch AI engine"
        >
          <div className="ai-pill-dot"></div>
          <span id="active-ai-name">GPT-4o</span>
        </div>
        <div className="icon-btn" title="Notifications">🔔</div>
        <div
          className="avatar"
          title="Profile"
          onClick={() => onPageChange('settings')}
        >
          {(user?.firstName?.[0] || 'S').toUpperCase()}
        </div>
      </div>
    </div>
  )
}
