import { useState } from 'react'
import { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } from '../firebase/config'

// ── SCREENS ──
const SCREEN = { LOGIN: 'login', FORGOT: 'forgot', FORGOT_SENT: 'forgot_sent' }

export default function Login({ onLogin, onBack }) {
  const [tab, setTab] = useState('signin')
  const [screen, setScreen] = useState(SCREEN.LOGIN)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const passMatch = tab === 'signup' ? password === confirmPass : true
  const passStrong = password.length >= 6

  // ── GOOGLE ──
  const handleGoogle = async () => {
    setLoading(true); setError('')
    const result = await signInWithGoogle()
    if (!result.success) {
      setError(result.error || 'Google sign-in failed. Please try again.')
      setLoading(false)
    }
    // If success, onAuthChange in App.jsx handles routing automatically
  }

  // ── EMAIL ──
  const handleEmail = async () => {
    setError('')
    if (!email || !password) { setError('Please fill in all fields'); return }
    if (tab === 'signup') {
      if (!passStrong) { setError('Password must be at least 6 characters'); return }
      if (!passMatch) { setError('Passwords do not match'); return }
    }
    setLoading(true)
    const fn = tab === 'signin' ? signInWithEmail : signUpWithEmail
    const result = await fn(email, password)
    if (!result.success) { setError(result.error); setLoading(false) }
    // If success, onAuthChange handles routing
  }

  // ── FORGOT PASSWORD ──
  const handleForgot = async () => {
    if (!resetEmail) { setError('Please enter your email address'); return }
    setLoading(true); setError('')
    const result = await resetPassword(resetEmail)
    setLoading(false)
    if (result.success) setScreen(SCREEN.FORGOT_SENT)
    else setError(result.error)
  }

  // ── STYLES ──
  const inp = (focused) => ({
    width: '100%', padding: '13px 42px 13px 42px',
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${focused ? 'rgba(0,255,224,0.35)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 10, color: '#eef2ff', fontSize: 14,
    fontFamily: 'Inter,sans-serif', outline: 'none', transition: 'all 0.22s',
  })

  // ── FORGOT SENT ──
  if (screen === SCREEN.FORGOT_SENT) return (
    <PageWrap onBack={onBack}>
      <Card>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Check your email</div>
          <div style={{ fontSize: 14, color: 'rgba(238,242,255,0.5)', lineHeight: 1.7, marginBottom: 28 }}>
            We sent a password reset link to<br/>
            <strong style={{ color: '#00ffe0' }}>{resetEmail}</strong><br/>
            Click the link to create a new password.
          </div>
          <Btn onClick={() => { setScreen(SCREEN.LOGIN); setResetEmail('') }}>
            Back to Sign in
          </Btn>
          <div style={{ marginTop: 14, fontSize: 12, color: 'rgba(238,242,255,0.3)' }}>
            Didn't receive it? Check your spam folder.
          </div>
        </div>
      </Card>
    </PageWrap>
  )

  // ── FORGOT PASSWORD SCREEN ──
  if (screen === SCREEN.FORGOT) return (
    <PageWrap onBack={() => { setScreen(SCREEN.LOGIN); setError('') }}>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Reset password</div>
          <div style={{ fontSize: 13, color: 'rgba(238,242,255,0.45)', lineHeight: 1.6 }}>
            Enter your email and we'll send you a link to reset your password.
          </div>
        </div>
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(238,242,255,0.3)', fontSize: 15, pointerEvents: 'none' }}>✉</span>
          <input
            style={{ ...inp(false), paddingLeft: 42 }}
            type="email" placeholder="Your email address"
            value={resetEmail} onChange={e => { setResetEmail(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleForgot()}
            onFocus={e => { e.target.style.borderColor = 'rgba(0,255,224,0.35)'; e.target.style.background = 'rgba(0,255,224,0.04)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.03)' }}
          />
        </div>
        {error && <ErrBox msg={error} />}
        <Btn onClick={handleForgot} disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link →'}
        </Btn>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <span onClick={() => { setScreen(SCREEN.LOGIN); setError('') }}
            style={{ fontSize: 13, color: 'rgba(0,255,224,0.7)', cursor: 'pointer', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#00ffe0'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(0,255,224,0.7)'}
          >← Back to sign in</span>
        </div>
      </Card>
    </PageWrap>
  )

  // ── MAIN LOGIN / SIGNUP ──
  return (
    <PageWrap onBack={onBack}>
      <Card>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, padding: 3, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 11, marginBottom: 24 }}>
          {['signin', 'signup'].map(t => (
            <button key={t} onClick={() => { setTab(t); setError(''); setPassword(''); setConfirmPass('') }}
              style={{ flex: 1, padding: '9px', borderRadius: 8, fontSize: 12.5, fontWeight: 500, cursor: 'pointer', border: tab === t ? '1px solid rgba(0,255,224,0.22)' : '1px solid transparent', background: tab === t ? 'rgba(0,255,224,0.09)' : 'transparent', color: tab === t ? '#00ffe0' : 'rgba(238,242,255,0.35)', transition: 'all 0.25s', fontFamily: 'Inter,sans-serif' }}>
              {t === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        {/* Google */}
        <button onClick={handleGoogle} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#eef2ff', fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)', fontFamily: 'Inter,sans-serif', width: '100%', marginBottom: 20 }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = 'rgba(234,67,53,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(234,67,53,0.08)' } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908C16.658 14.013 17.64 11.705 17.64 9.2z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          <span style={{ flex: 1, textAlign: 'left' }}>{loading ? 'Signing in...' : `Continue with Google`}</span>
          <span style={{ color: 'rgba(238,242,255,0.3)' }}>›</span>
        </button>

        {/* OR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }}></div>
          <div style={{ fontSize: 10, color: 'rgba(238,242,255,0.25)', letterSpacing: 1.5 }}>OR EMAIL</div>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }}></div>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>

          {/* Email */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(238,242,255,0.3)', fontSize: 15, pointerEvents: 'none' }}>✉</span>
            <input
              style={{ ...inp(false), paddingLeft: 42, paddingRight: 14 }}
              type="email" placeholder="Email address"
              value={email} onChange={e => { setEmail(e.target.value); setError('') }}
              onFocus={e => { e.target.style.borderColor = 'rgba(0,255,224,0.35)'; e.target.style.background = 'rgba(0,255,224,0.04)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.03)' }}
            />
          </div>

          {/* Password */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(238,242,255,0.3)', fontSize: 15, pointerEvents: 'none' }}>🔒</span>
            <input
              style={{ ...inp(false), paddingLeft: 42, paddingRight: 44 }}
              type={showPass ? 'text' : 'password'}
              placeholder={tab === 'signup' ? 'Create password (min 6 chars)' : 'Password'}
              value={password} onChange={e => { setPassword(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && tab === 'signin' && handleEmail()}
              onFocus={e => { e.target.style.borderColor = 'rgba(0,255,224,0.35)'; e.target.style.background = 'rgba(0,255,224,0.04)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.03)' }}
            />
            <span onClick={() => setShowPass(!showPass)}
              style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(238,242,255,0.3)', fontSize: 12, cursor: 'pointer', userSelect: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#00ffe0'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(238,242,255,0.3)'}
            >{showPass ? 'Hide' : 'Show'}</span>
          </div>

          {/* Password strength — signup only */}
          {tab === 'signup' && password.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 3, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 3, width: password.length < 6 ? '30%' : password.length < 10 ? '65%' : '100%', background: password.length < 6 ? '#f87171' : password.length < 10 ? '#fb923c' : '#4ade80', transition: 'all 0.3s ease' }}></div>
              </div>
              <span style={{ fontSize: 11, color: password.length < 6 ? '#f87171' : password.length < 10 ? '#fb923c' : '#4ade80', minWidth: 40 }}>
                {password.length < 6 ? 'Weak' : password.length < 10 ? 'OK' : 'Strong'}
              </span>
            </div>
          )}

          {/* Confirm Password — signup only */}
          {tab === 'signup' && (
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: confirmPass && passMatch ? '#4ade80' : confirmPass && !passMatch ? '#f87171' : 'rgba(238,242,255,0.3)', fontSize: 15, pointerEvents: 'none' }}>
                {confirmPass ? (passMatch ? '✓' : '✗') : '🔒'}
              </span>
              <input
                style={{
                  ...inp(false),
                  paddingLeft: 42, paddingRight: 44,
                  borderColor: confirmPass ? (passMatch ? 'rgba(74,222,128,0.35)' : 'rgba(248,113,113,0.35)') : 'rgba(255,255,255,0.08)',
                  background: confirmPass ? (passMatch ? 'rgba(74,222,128,0.04)' : 'rgba(248,113,113,0.04)') : 'rgba(255,255,255,0.03)',
                }}
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirmPass} onChange={e => { setConfirmPass(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleEmail()}
              />
              <span onClick={() => setShowConfirm(!showConfirm)}
                style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(238,242,255,0.3)', fontSize: 12, cursor: 'pointer', userSelect: 'none' }}
              >{showConfirm ? 'Hide' : 'Show'}</span>
              {confirmPass && !passMatch && (
                <div style={{ fontSize: 11, color: '#f87171', marginTop: 4, paddingLeft: 4 }}>Passwords do not match</div>
              )}
              {confirmPass && passMatch && password.length >= 6 && (
                <div style={{ fontSize: 11, color: '#4ade80', marginTop: 4, paddingLeft: 4 }}>✓ Passwords match</div>
              )}
            </div>
          )}

          {/* Forgot password link — signin only */}
          {tab === 'signin' && (
            <div style={{ textAlign: 'right', marginTop: -4 }}>
              <span onClick={() => { setScreen(SCREEN.FORGOT); setResetEmail(email); setError('') }}
                style={{ fontSize: 12, color: 'rgba(0,255,224,0.6)', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#00ffe0'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(0,255,224,0.6)'}
              >Forgot password?</span>
            </div>
          )}

          {/* Error */}
          {error && <ErrBox msg={error} />}

          {/* Submit */}
          <Btn onClick={handleEmail} disabled={loading || (tab === 'signup' && (!passMatch || !passStrong))} style={{ marginTop: 4 }}>
            {loading ? 'Please wait...' : (tab === 'signin' ? 'Sign in to Synapse →' : 'Create Synapse Account →')}
          </Btn>
        </div>
      </Card>

      {/* Privacy */}
      <div style={{ marginTop: 14, padding: '11px 16px', borderRadius: 11, background: 'rgba(0,255,224,0.03)', border: '1px solid rgba(0,255,224,0.1)', fontSize: 11, color: 'rgba(238,242,255,0.3)', lineHeight: 1.6, textAlign: 'center' }}>
        🔐 <strong style={{ color: 'rgba(238,242,255,0.5)' }}>Zero-access privacy.</strong> Your data is encrypted and invisible to Synapse admins.
      </div>
    </PageWrap>
  )
}

// ── REUSABLE COMPONENTS ──
function PageWrap({ children, onBack }) {
  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <button onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'rgba(238,242,255,0.38)', fontSize: 13, cursor: 'pointer', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Inter,sans-serif', padding: 0, transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#00ffe0'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(238,242,255,0.38)'}
        >← Back to home</button>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: 'linear-gradient(135deg,#7c3aff,#00ffe0)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 28px rgba(0,255,224,0.3)' }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, background: 'linear-gradient(90deg,#fff,rgba(0,255,224,0.85))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SYNAPSE</div>
              <div style={{ fontSize: 10, color: 'rgba(238,242,255,0.3)', letterSpacing: 2, textTransform: 'uppercase' }}>Academic Intelligence</div>
            </div>
          </div>
          <div style={{ fontSize: 14, color: 'rgba(238,242,255,0.45)' }}>Welcome — let's get you in</div>
        </div>
        {children}
      </div>
    </div>
  )
}

function Card({ children }) {
  return (
    <div style={{ background: 'rgba(8,12,26,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '32px 36px', backdropFilter: 'blur(24px)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(0,255,224,0.4),transparent)' }}></div>
      {children}
    </div>
  )
}

function ErrBox({ msg }) {
  return (
    <div style={{ padding: '10px 14px', borderRadius: 9, background: 'rgba(255,45,120,0.08)', border: '1px solid rgba(255,45,120,0.2)', fontSize: 12.5, color: '#ff6b9d', lineHeight: 1.5, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <span>⚠</span><span>{msg}</span>
    </div>
  )
}

function Btn({ children, onClick, disabled, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width: '100%', padding: '14px', borderRadius: 11, background: disabled ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,rgba(0,255,224,0.14),rgba(124,58,255,0.14))', border: `1px solid ${disabled ? 'rgba(255,255,255,0.08)' : 'rgba(0,255,224,0.3)'}`, color: disabled ? 'rgba(238,242,255,0.3)' : '#eef2ff', fontSize: 14, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'Syne,sans-serif', transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)', ...style }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = 'rgba(0,255,224,0.55)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(0,255,224,0.15)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = disabled ? 'rgba(255,255,255,0.08)' : 'rgba(0,255,224,0.3)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
    >{children}</button>
  )
}