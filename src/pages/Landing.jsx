import { useEffect, useRef, useState } from 'react'

export default function Landing({ onGetStarted, onAdminAccess }) {
  const canvasRef = useRef()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const el = document.getElementById('ls')
    if (!el) return
    const fn = () => setScrolled(el.scrollTop > 40)
    el.addEventListener('scroll', fn)
    return () => el.removeEventListener('scroll', fn)
  }, [])

  // Scroll-triggered section animations
  useEffect(() => {
    const el = document.getElementById('ls')
    if (!el) return
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    })

    const sections = el.querySelectorAll('section')
    sections.forEach(section => observer.observe(section))

    return () => {
      sections.forEach(section => observer.unobserve(section))
    }
  }, [])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const cx = cv.getContext('2d')
    let W, H, pts = [], mx = 400, my = 300, raf
    const resize = () => { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight }
    resize()
    for (let i = 0; i < 75; i++) pts.push({
      x: Math.random()*W, y: Math.random()*H,
      vx:(Math.random()-.5)*.2, vy:(Math.random()-.5)*.2,
      r:Math.random()*1.3+.3,
      h:Math.random()>.5?'0,255,224':'124,58,255',
      a:Math.random()*.28+.06
    })
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', e => { mx=e.clientX; my=e.clientY })
    const draw = () => {
      cx.clearRect(0,0,W,H); cx.fillStyle='#04060f'; cx.fillRect(0,0,W,H)
      cx.strokeStyle='rgba(0,255,224,0.016)'; cx.lineWidth=.5
      for(let x=0;x<W;x+=80){cx.beginPath();cx.moveTo(x,0);cx.lineTo(x,H);cx.stroke()}
      for(let y=0;y<H;y+=80){cx.beginPath();cx.moveTo(0,y);cx.lineTo(W,y);cx.stroke()}
      const mg=cx.createRadialGradient(mx,my,0,mx,my,300)
      mg.addColorStop(0,'rgba(0,255,224,0.04)'); mg.addColorStop(1,'transparent')
      cx.fillStyle=mg; cx.fillRect(0,0,W,H)
      pts.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy
        if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0
        const d=Math.sqrt((p.x-mx)**2+(p.y-my)**2),b=d<180?1+.55*(1-d/180):1
        cx.beginPath();cx.arc(p.x,p.y,p.r*b,0,Math.PI*2)
        cx.fillStyle=`rgba(${p.h},${p.a*b})`;cx.fill()
      })
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){
        const d=Math.sqrt((pts[i].x-pts[j].x)**2+(pts[i].y-pts[j].y)**2)
        if(d<120){cx.beginPath();cx.moveTo(pts[i].x,pts[i].y);cx.lineTo(pts[j].x,pts[j].y);cx.strokeStyle=`rgba(0,255,224,${.038*(1-d/120)})`;cx.lineWidth=.5;cx.stroke()}
      }
      raf=requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize',resize) }
  }, [])

  return (
    <div id="ls" style={{background:'#04060f',color:'#eef2ff',fontFamily:'Inter,sans-serif',height:'100vh',overflowY:'auto',overflowX:'hidden',position:'relative'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box}
        #ls::-webkit-scrollbar{width:3px}
        #ls::-webkit-scrollbar-thumb{background:rgba(0,255,224,0.2);border-radius:3px}
        
        /* Enhanced Keyframe Animations */
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(0,255,224,0.3)}50%{box-shadow:0 0 40px rgba(0,255,224,0.6)}}
        @keyframes rise{from{opacity:0;transform:translateY(30px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes shimmer{0%{left:-100%}100%{left:100%}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes slideInLeft{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideInRight{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.8)}to{opacity:1;transform:scale(1)}}
        @keyframes blurIn{from{opacity:0;filter:blur(10px);transform:scale(1.05)}to{opacity:1;filter:blur(0);transform:scale(1)}}
        
        /* Animation Classes */
        .lrise{animation:rise 0.8s cubic-bezier(0.25,0.46,0.45,0.94) both}
        .d1{animation-delay:.05s}.d2{animation-delay:.15s}.d3{animation-delay:.25s}.d4{animation-delay:.35s}.d5{animation-delay:.45s}
        .fc{transition:all 0.4s cubic-bezier(0.25,0.46,0.45,0.94)}
        .fc:hover{border-color:rgba(0,255,224,0.28)!important;transform:translateY(-6px) scale(1.02)!important;box-shadow:0 24px 64px rgba(0,0,0,0.4)!important}
        .sr{transition:all 0.35s cubic-bezier(0.25,0.46,0.45,0.94)}
        .sr:hover{border-color:rgba(0,255,224,0.18)!important;background:rgba(0,255,224,0.03)!important;transform:translateX(8px)!important}
        .nl{color:rgba(238,242,255,0.52);text-decoration:none;font-size:14px;font-weight:500;transition:all 0.3s cubic-bezier(0.25,0.46,0.45,0.94);position:relative}
        .nl:hover{color:#00ffe0;transform:translateY(-2px)}
        .nl::after{content:'';position:absolute;bottom:-2px;left:0;width:0;height:1px;background:#00ffe0;transition:width 0.3s cubic-bezier(0.25,0.46,0.45,0.94)}
        .nl:hover::after{width:100%}
        .shine{position:relative;overflow:hidden}
        .shine::after{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent);animation:shimmer 3s ease-in-out infinite}
        
        /* Section Animations */
        section{opacity:0;transform:translateY(40px);transition:all 0.8s cubic-bezier(0.25,0.46,0.45,0.94)}
        section.visible{opacity:1;transform:translateY(0)}
        
        /* Smooth Scroll */
        html{scroll-behavior:smooth}
      `}</style>

      <canvas ref={canvasRef} style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none'}} />

      {/* ── NAVBAR ── */}
      <nav style={{position:'sticky',top:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 56px',height:68,background:scrolled?'rgba(4,6,15,0.96)':'rgba(4,6,15,0.5)',borderBottom:`1px solid ${scrolled?'rgba(255,255,255,0.08)':'transparent'}`,backdropFilter:'blur(24px)',transition:'all 0.35s ease'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:38,height:38,borderRadius:11,background:'linear-gradient(135deg,#7c3aff,#00ffe0)',display:'flex',alignItems:'center',justifyContent:'center',animation:'glow 3s ease-in-out infinite'}}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>
            </svg>
          </div>
          <span style={{fontFamily:'Syne,sans-serif',fontSize:21,fontWeight:800,background:'linear-gradient(90deg,#fff,rgba(0,255,224,0.85))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>SYNAPSE</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:36}}>
          {['Features','How it Works','Streams','Pricing'].map(l=>(
            <a key={l} className="nl" href={`#${l.toLowerCase().replace(/ /g,'-')}`}>{l}</a>
          ))}
        </div>
        <button className="shine" onClick={onGetStarted}
          style={{padding:'10px 26px',borderRadius:11,background:'linear-gradient(135deg,rgba(0,255,224,0.13),rgba(124,58,255,0.13))',border:'1px solid rgba(0,255,224,0.32)',color:'#eef2ff',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'Syne,sans-serif',transition:'all 0.25s cubic-bezier(0.22,1,0.36,1)'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(0,255,224,0.6)';e.currentTarget.style.boxShadow='0 0 28px rgba(0,255,224,0.2)';e.currentTarget.style.transform='translateY(-1px)'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(0,255,224,0.32)';e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='none'}}
        >Sign In →</button>
      </nav>

      {/* ── HERO ── */}
      <section style={{position:'relative',zIndex:1,minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px 24px 100px',textAlign:'center'}}>
        <div className="lrise d1" style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 18px',borderRadius:100,background:'rgba(0,255,224,0.07)',border:'1px solid rgba(0,255,224,0.2)',fontSize:12,color:'#00ffe0',fontWeight:500,marginBottom:30,letterSpacing:.8}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:'#00ffe0',boxShadow:'0 0 8px #00ffe0',animation:'pulse 2s infinite'}}></div>
          India's Most Advanced AI Study Platform · 100% Free to Start
        </div>
        <h1 className="lrise d2" style={{fontFamily:'Syne,sans-serif',fontSize:'clamp(40px,6.5vw,86px)',fontWeight:800,lineHeight:1.04,letterSpacing:'-3px',marginBottom:26,maxWidth:1000}}>
          Study Smarter.<br/>
          <span style={{background:'linear-gradient(135deg,#00ffe0 0%,#7c3aff 50%,#ff2d78 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>Think Sharper.</span><br/>
          Score Higher.
        </h1>
        <p className="lrise d3" style={{fontSize:'clamp(15px,2vw,19px)',color:'rgba(238,242,255,0.5)',lineHeight:1.75,maxWidth:640,marginBottom:52,fontWeight:300}}>
          The AI-powered academic ecosystem built exclusively for Indian PUC students — intelligent planning, OCR textbook scanning, smart flashcards, mock tests, and real-time collaboration. Powered by free Gemini AI.
        </p>
        <div className="lrise d4" style={{display:'flex',gap:14,flexWrap:'wrap',justifyContent:'center',marginBottom:80}}>
          <button className="shine" onClick={onGetStarted}
            style={{padding:'17px 44px',borderRadius:14,background:'linear-gradient(135deg,rgba(0,255,224,0.16),rgba(124,58,255,0.16))',border:'1px solid rgba(0,255,224,0.42)',color:'#eef2ff',fontSize:17,fontWeight:800,cursor:'pointer',fontFamily:'Syne,sans-serif',boxShadow:'0 0 44px rgba(0,255,224,0.15)',transition:'all 0.3s cubic-bezier(0.22,1,0.36,1)'}}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 0 70px rgba(0,255,224,0.3)'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 0 44px rgba(0,255,224,0.15)'}}
          >Get Started Free →</button>
          <button style={{padding:'17px 34px',borderRadius:14,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(238,242,255,0.6)',fontSize:16,fontWeight:500,cursor:'pointer',fontFamily:'Inter,sans-serif',transition:'all 0.25s'}}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)';e.currentTarget.style.color='#eef2ff'}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.color='rgba(238,242,255,0.6)'}}
          >▶ Watch Demo</button>
        </div>
        <div className="lrise d5" style={{display:'flex',gap:0,background:'rgba(8,12,26,0.75)',borderRadius:18,border:'1px solid rgba(255,255,255,0.07)',backdropFilter:'blur(20px)',overflow:'hidden'}}>
          {[{v:'100%',l:'Free to start'},{v:'Gemini AI',l:'Default — free'},{v:'JEE · NEET',l:'Science exams'},{v:'CUET · IPMAT',l:'Commerce exams'}].map((s,i)=>(
            <div key={i} style={{padding:'20px 38px',borderRight:i<3?'1px solid rgba(255,255,255,0.07)':'none',textAlign:'center'}}>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:800,background:'linear-gradient(135deg,#00ffe0,#7c3aff)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{s.v}</div>
              <div style={{fontSize:11,color:'rgba(238,242,255,0.36)',marginTop:4}}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{position:'relative',zIndex:1,padding:'100px 56px',maxWidth:1280,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:72}}>
          <div style={{fontSize:11,letterSpacing:3,textTransform:'uppercase',color:'#00ffe0',marginBottom:14,fontWeight:500}}>Everything you need</div>
          <h2 style={{fontFamily:'Syne,sans-serif',fontSize:'clamp(28px,4vw,54px)',fontWeight:800,letterSpacing:-1.5,marginBottom:16}}>
            Built to make you <span style={{background:'linear-gradient(135deg,#00ffe0,#7c3aff)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>unstoppable</span>
          </h2>
          <p style={{fontSize:16,color:'rgba(238,242,255,0.43)',maxWidth:520,margin:'0 auto',lineHeight:1.7,fontWeight:300}}>Every feature designed to save time, deepen understanding, and maximise your score.</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:14}}>
          {[
            {icon:'◈',title:'Synapse AI',desc:'Built-in academic AI — doubts, notes, flashcards, exam strategy. Ready the moment you log in. No API keys.',color:'#00ffe0',tag:'Built-in · Free'},
            {icon:'📷',title:'Textbook OCR Scanner',desc:'Photograph any textbook page or handwritten note. Tesseract OCR extracts text and AI generates notes and flashcards instantly.',color:'#7c3aff',tag:'Free · Tesseract.js'},
            {icon:'⚡',title:'Smart Flashcards',desc:'Auto-generated from your notes, scanned textbooks, and uploads. Definitions, formulas, theorems — exactly what exams test.',color:'#ff2d78',tag:'AI generated'},
            {icon:'📋',title:'AI Study Planner',desc:"Tell Synapse what was taught today. Get tomorrow's full timetable, revision schedule, and weekend plan with burnout prevention.",color:'#fb923c',tag:'Personalised daily'},
            {icon:'📝',title:'Mock Tests',desc:'Admin-uploaded entrance papers and AI-generated chapter tests. Full analytics — accuracy, time, weak topics, progress.',color:'#4ade80',tag:'JEE · NEET · CUET'},
            {icon:'👥',title:'Study Groups',desc:'Create groups with classmates. Share notes, scores, and daily progress. Real-time Firebase sync keeps everyone aligned.',color:'#38bdf8',tag:'Real-time sync'},
            {icon:'🎯',title:'Exam Tracker',desc:'Countdown timers, syllabus completion %, revision gaps. Know exactly where you stand against every exam you target.',color:'#00ffe0',tag:'Live countdowns'},
            {icon:'📊',title:'Performance Analytics',desc:'Subject-wise accuracy graphs, consistency scores, study hour tracking, and AI-predicted rank — all visualised beautifully.',color:'#7c3aff',tag:'Deep insights'},
            {icon:'📷',title:'In-app OCR Scanner',desc:'Tesseract runs inside Synapse — scan textbook pages and handwritten notes without leaving the app.',color:'#ff2d78',tag:'Built-in scanner'},
          ].map((f,i)=>(
            <div key={i} className="fc" style={{padding:'28px',borderRadius:16,background:'rgba(8,12,26,0.88)',border:'1px solid rgba(255,255,255,0.07)',cursor:'default',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${f.color}55,transparent)`}}></div>
              <div style={{fontSize:34,marginBottom:16}}>{f.icon}</div>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:700,marginBottom:8}}>{f.title}</div>
              <div style={{fontSize:13.5,color:'rgba(238,242,255,0.46)',lineHeight:1.7,marginBottom:14,fontWeight:300}}>{f.desc}</div>
              <div style={{display:'inline-block',padding:'3px 11px',borderRadius:100,fontSize:10,fontWeight:600,background:`${f.color}15`,color:f.color,border:`1px solid ${f.color}33`}}>{f.tag}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{position:'relative',zIndex:1,padding:'100px 56px',maxWidth:880,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:64}}>
          <div style={{fontSize:11,letterSpacing:3,textTransform:'uppercase',color:'#00ffe0',marginBottom:14,fontWeight:500}}>Simple setup</div>
          <h2 style={{fontFamily:'Syne,sans-serif',fontSize:'clamp(28px,4vw,54px)',fontWeight:800,letterSpacing:-1.5}}>
            Up and running in <span style={{background:'linear-gradient(135deg,#00ffe0,#7c3aff)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>2 minutes</span>
          </h2>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {[
            {n:'01',t:'Sign in with Google',d:'One tap. Your account is created instantly. No forms, no waiting, no credit card required.',c:'#00ffe0'},
            {n:'02',t:'Choose stream & subjects',d:'Science or Commerce. Pick your subject combination, second language (optional for CBSE), and entrance exam goal.',c:'#7c3aff'},
            {n:'03',t:'Synapse AI is ready',d:'No setup. Open Synapse AI and start asking doubts — tuned for PUC, JEE, NEET & CUET.',c:'#ff2d78'},
            {n:'04',t:'Start studying smarter',d:'Scan textbooks in Notes, chat with Synapse AI, build flashcards. Everything stays inside Synapse.',c:'#fb923c'},
          ].map((s,i)=>(
            <div key={i} className="sr" style={{display:'flex',gap:24,padding:'24px 28px',borderRadius:14,background:'rgba(8,12,26,0.88)',border:'1px solid rgba(255,255,255,0.07)',transition:'all 0.25s',alignItems:'flex-start',cursor:'default'}}>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:42,fontWeight:800,color:s.c,opacity:0.32,lineHeight:1,flexShrink:0,minWidth:58}}>{s.n}</div>
              <div>
                <div style={{fontFamily:'Syne,sans-serif',fontSize:19,fontWeight:700,marginBottom:6}}>{s.t}</div>
                <div style={{fontSize:14,color:'rgba(238,242,255,0.46)',lineHeight:1.65,fontWeight:300}}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── STREAMS ── */}
      <section id="streams" style={{position:'relative',zIndex:1,padding:'100px 56px',maxWidth:1200,margin:'0 auto'}}>
        <div style={{textAlign:'center',marginBottom:64}}>
          <div style={{fontSize:11,letterSpacing:3,textTransform:'uppercase',color:'#00ffe0',marginBottom:14,fontWeight:500}}>Built for Indian students</div>
          <h2 style={{fontFamily:'Syne,sans-serif',fontSize:'clamp(28px,4vw,54px)',fontWeight:800,letterSpacing:-1.5}}>
            Science or Commerce,<br/>
            <span style={{background:'linear-gradient(135deg,#00ffe0,#7c3aff)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Synapse has you covered</span>
          </h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          {[
            {s:'🔬 Science Stream',c:'#00ffe0',sub:['Physics','Chemistry','Biology','Mathematics','Computer Science'],ex:['JEE Mains','JEE Advanced','NEET'],b:['CBSE','ISC','State Board']},
            {s:'📊 Commerce Stream',c:'#ff2d78',sub:['Accountancy','Business Studies','Economics','Statistics','Basic Maths'],ex:['CUET UG','IPMAT','NPAT','SET'],b:['CBSE','ISC','State Board']},
          ].map((st,i)=>(
            <div key={i} style={{padding:'36px',borderRadius:18,background:'rgba(8,12,26,0.88)',border:`1px solid ${st.c}22`,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${st.c},transparent)`}}></div>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:24,fontWeight:800,marginBottom:28}}>{st.s}</div>
              <div style={{marginBottom:20}}>
                <div style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:'rgba(238,242,255,0.27)',marginBottom:10}}>Subjects</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {st.sub.map(s=><span key={s} style={{padding:'5px 13px',borderRadius:100,fontSize:12,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(238,242,255,0.62)'}}>{s}</span>)}
                  <span style={{padding:'5px 13px',borderRadius:100,fontSize:12,background:`${st.c}12`,border:`1px solid ${st.c}33`,color:st.c,fontWeight:600}}>English ✓</span>
                </div>
              </div>
              <div style={{marginBottom:20}}>
                <div style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:'rgba(238,242,255,0.27)',marginBottom:10}}>Entrance Exams</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {st.ex.map(e=><span key={e} style={{padding:'5px 13px',borderRadius:100,fontSize:12,background:`${st.c}12`,border:`1px solid ${st.c}33`,color:st.c,fontWeight:700}}>{e}</span>)}
                </div>
              </div>
              <div>
                <div style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:'rgba(238,242,255,0.27)',marginBottom:10}}>Boards</div>
                <div style={{display:'flex',gap:6}}>
                  {st.b.map(b=><span key={b} style={{padding:'5px 13px',borderRadius:100,fontSize:12,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(238,242,255,0.52)'}}>{b}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{marginTop:14,padding:'18px 28px',borderRadius:12,background:'rgba(124,58,255,0.06)',border:'1px solid rgba(124,58,255,0.15)',fontSize:14,color:'rgba(238,242,255,0.48)',textAlign:'center',lineHeight:1.6}}>
          Can't find your combination? <strong style={{color:'#a78bfa'}}>Build a custom stream</strong> — Synapse AI maps your syllabus and creates a personalised study plan just for you.
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{position:'relative',zIndex:1,padding:'100px 56px',maxWidth:860,margin:'0 auto',textAlign:'center'}}>
        <div style={{fontSize:11,letterSpacing:3,textTransform:'uppercase',color:'#00ffe0',marginBottom:14,fontWeight:500}}>Pricing</div>
        <h2 style={{fontFamily:'Syne,sans-serif',fontSize:'clamp(28px,4vw,54px)',fontWeight:800,letterSpacing:-1.5,marginBottom:16}}>
          Free. Forever. <span style={{background:'linear-gradient(135deg,#00ffe0,#7c3aff)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>For real.</span>
        </h2>
        <p style={{fontSize:16,color:'rgba(238,242,255,0.43)',maxWidth:500,margin:'0 auto 52px',lineHeight:1.7,fontWeight:300}}>Synapse AI and Tesseract OCR are built into the app. Students sign in and start — no external setup.</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr',gap:16,maxWidth:420,margin:'0 auto'}}>
          {[
            {n:'Synapse Free',p:'₹0',per:'forever',c:'#00ffe0',f:['Synapse AI — built-in','Tesseract OCR scanner','All study features','Firebase cloud sync','Unlimited notes & scans','Made for PUC students'],cta:'Get Started Free'},
          ].map((p,i)=>(
            <div key={i} style={{padding:'36px',borderRadius:18,background:'rgba(8,12,26,0.9)',border:`1px solid ${p.c}33`,position:'relative',overflow:'hidden',textAlign:'left'}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${p.c},transparent)`}}></div>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:15,fontWeight:700,marginBottom:8,color:p.c}}>{p.n}</div>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:36,fontWeight:800,marginBottom:4}}>{p.p}</div>
              <div style={{fontSize:11,color:'rgba(238,242,255,0.28)',marginBottom:28}}>{p.per}</div>
              <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:32}}>
                {p.f.map(f=>(
                  <div key={f} style={{display:'flex',gap:9,fontSize:13.5,color:'rgba(238,242,255,0.6)',alignItems:'center'}}>
                    <span style={{color:p.c,fontWeight:700,fontSize:15}}>✓</span>{f}
                  </div>
                ))}
              </div>
              <button onClick={onGetStarted} style={{width:'100%',padding:'14px',borderRadius:11,background:`${p.c}18`,border:`1px solid ${p.c}44`,color:p.c,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'Syne,sans-serif',transition:'all 0.25s'}}
                onMouseEnter={e=>{e.currentTarget.style.background=`${p.c}2e`;e.currentTarget.style.borderColor=p.c;e.currentTarget.style.transform='translateY(-1px)'}}
                onMouseLeave={e=>{e.currentTarget.style.background=`${p.c}18`;e.currentTarget.style.borderColor=`${p.c}44`;e.currentTarget.style.transform='none'}}
              >{p.cta}</button>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{position:'relative',zIndex:1,padding:'100px 56px',textAlign:'center'}}>
        <div style={{maxWidth:780,margin:'0 auto',padding:'76px 60px',borderRadius:24,background:'rgba(8,12,26,0.94)',border:'1px solid rgba(0,255,224,0.15)',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,transparent,#00ffe0,#7c3aff,#ff2d78,transparent)'}}></div>
          <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 50% 0%,rgba(0,255,224,0.05) 0%,transparent 65%)',pointerEvents:'none'}}></div>
          <div style={{fontSize:11,letterSpacing:3,textTransform:'uppercase',color:'#00ffe0',marginBottom:20,fontWeight:500}}>Ready to start?</div>
          <h2 style={{fontFamily:'Syne,sans-serif',fontSize:'clamp(28px,4vw,58px)',fontWeight:800,letterSpacing:-2,marginBottom:18,lineHeight:1.04}}>
            Your JEE / NEET / CUET<br/>
            <span style={{background:'linear-gradient(135deg,#00ffe0,#7c3aff,#ff2d78)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>journey starts here.</span>
          </h2>
          <p style={{fontSize:17,color:'rgba(238,242,255,0.46)',marginBottom:48,lineHeight:1.7,fontWeight:300,maxWidth:480,margin:'0 auto 48px'}}>
            Join thousands of PUC students using Synapse to study smarter, track progress, and ace their exams — completely free.
          </p>
          <button className="shine" onClick={onGetStarted}
            style={{padding:'20px 64px',borderRadius:16,background:'linear-gradient(135deg,rgba(0,255,224,0.18),rgba(124,58,255,0.18))',border:'1px solid rgba(0,255,224,0.45)',color:'#eef2ff',fontSize:20,fontWeight:800,cursor:'pointer',fontFamily:'Syne,sans-serif',boxShadow:'0 0 52px rgba(0,255,224,0.18)',transition:'all 0.3s cubic-bezier(0.22,1,0.36,1)',display:'inline-block'}}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow='0 0 90px rgba(0,255,224,0.38)'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 0 52px rgba(0,255,224,0.18)'}}
          >Get Started — It's Free →</button>
          <div style={{marginTop:20,fontSize:12,color:'rgba(238,242,255,0.26)'}}>No credit card required · Free Gemini AI included · Setup in 2 minutes</div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{position:'relative',zIndex:1,padding:'36px 56px',borderTop:'1px solid rgba(255,255,255,0.06)',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:16}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:30,height:30,borderRadius:8,background:'linear-gradient(135deg,#7c3aff,#00ffe0)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
          </div>
          <span style={{fontFamily:'Syne,sans-serif',fontSize:16,fontWeight:800,background:'linear-gradient(90deg,#fff,rgba(0,255,224,0.85))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>SYNAPSE</span>
        </div>
        <div style={{fontSize:12,color:'rgba(238,242,255,0.2)'}}>© 2026 Synapse. Built for Indian students. 🇮🇳</div>
        <div style={{display:'flex',gap:24}}>
          {['Privacy','Terms','Contact'].map(l=>(
            <a key={l} href="#" style={{fontSize:12,color:'rgba(238,242,255,0.26)',textDecoration:'none',transition:'color 0.2s'}}
              onMouseEnter={e=>e.currentTarget.style.color='#00ffe0'}
              onMouseLeave={e=>e.currentTarget.style.color='rgba(238,242,255,0.26)'}
            >{l}</a>
          ))}
          {onAdminAccess && (
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); onAdminAccess(); }}
              style={{fontSize:12,color:'rgba(238,242,255,0.15)',textDecoration:'none',transition:'color 0.2s'}}
              onMouseEnter={e=>e.currentTarget.style.color='rgba(238,242,255,0.4)'}
              onMouseLeave={e=>e.currentTarget.style.color='rgba(238,242,255,0.15)'}
            >Admin</a>
          )}
        </div>
      </footer>
    </div>
  )
}