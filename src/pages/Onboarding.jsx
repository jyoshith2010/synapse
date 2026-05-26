// Onboarding.jsx
import { saveOnboardingData } from '../firebase/config'
import { useState } from 'react'

const SCI_SUBJ = ['Physics','Chemistry','Biology','Mathematics','Computer Science']
const COM_SUBJ = ['Accountancy','Business Studies','Economics','Statistics','Basic Maths']
const SCI_EXAMS = ['JEE Mains','JEE Advanced','NEET']
const COM_EXAMS = ['CUET UG','IPMAT','NPAT','SET']

export default function Onboarding({ user, onComplete }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ firstName:'', lastName:'', cls:'', board:'', school:'', city:'' })
  const [stream, setStream] = useState('')
  const [subjects, setSubjects] = useState([])
  const [lang, setLang] = useState('')
  const [exam, setExam] = useState('')
  const [customSubj, setCustomSubj] = useState('')
  const [customExam, setCustomExam] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [showCustomExam, setShowCustomExam] = useState(false)

  const pool = stream === 'science' ? SCI_SUBJ : COM_SUBJ
  const exams = stream === 'science' ? SCI_EXAMS : COM_EXAMS

  const toggleSubj = (s) => {
    if (subjects.includes(s)) setSubjects(subjects.filter(x=>x!==s))
    else if (subjects.length < 4) setSubjects([...subjects,s])
  }

const finish = async () => {
  const profileData = {
    firstName: form.firstName,
    lastName: form.lastName,
    cls: form.cls,
    board: form.board,
    school: form.school,
    city: form.city,
    stream,
    subjects: [...subjects, 'English', lang].filter(Boolean),
    lang,
    examGoal: exam || customExam,
    customSubjects: customSubj,
  }
  if (user?.uid) {
    await saveOnboardingData(user.uid, profileData)
  }
  onComplete(profileData)
}
  

  const steps = ['Details','Stream','Subjects','Language','Goal']

  return (
    <div style={{ position:'relative',zIndex:1,minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20 }}>
      {/* Stepper */}
      <div style={{ display:'flex',alignItems:'center',gap:0,marginBottom:28 }}>
        {steps.map((s,i) => (
          <div key={s} style={{ display:'flex',alignItems:'center' }}>
            <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:4 }}>
              <div style={{ width:28,height:28,borderRadius:'50%',border:`1px solid ${i+1<step?'rgba(0,255,224,0.4)':i+1===step?'rgba(0,255,224,0.6)':'var(--glass-border)'}`,background:i+1<step?'rgba(0,255,224,0.1)':i+1===step?'rgba(0,255,224,0.15)':'var(--glass)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,color:i+1<=step?'var(--c)':'var(--txt3)',transition:'all 0.4s',boxShadow:i+1===step?'0 0 12px rgba(0,255,224,0.2)':'none' }}>
                {i+1<step?'✓':i+1}
              </div>
              <div style={{ fontSize:9,color:i+1<=step?'var(--txt2)':'var(--txt3)',letterSpacing:.5,whiteSpace:'nowrap' }}>{s}</div>
            </div>
            {i<4 && <div style={{ width:24,height:1,background:i+1<step?'rgba(0,255,224,0.3)':'var(--glass-border)',margin:'0 4px',marginBottom:16,transition:'background 0.4s' }}></div>}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="glass-card card-pad rise" style={{ width:'100%',maxWidth:480 }}>

        {/* STEP 1 */}
        {step===1 && <>
          <div style={{ fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:700,marginBottom:4 }}>Tell us about you</div>
          <div style={{ fontSize:12,color:'var(--txt2)',marginBottom:20 }}>Personalise your Synapse experience</div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10 }}>
            {[{label:'First Name',key:'firstName',ph:'Arjun',icon:'👤'},{label:'Last Name',key:'lastName',ph:'Sharma',icon:'👤'}].map(f=>(
              <div key={f.key}>
                <div className="field-label">{f.label}</div>
                <div className="field-wrap">
                  <span className="field-icon">{f.icon}</span>
                  <input className="field-input" placeholder={f.ph} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10 }}>
            <div>
              <div className="field-label">Class</div>
              <div className="field-wrap">
                <span className="field-icon">🏫</span>
                <select className="field-select" value={form.cls} onChange={e=>setForm({...form,cls:e.target.value})}>
                  <option value="">Select</option>
                  <option>Class 11</option><option>Class 12</option>
                </select>
              </div>
            </div>
            <div>
              <div className="field-label">Board</div>
              <div className="field-wrap">
                <span className="field-icon">📜</span>
                <select className="field-select" value={form.board} onChange={e=>setForm({...form,board:e.target.value})}>
                  <option value="">Select</option>
                  <option>CBSE</option><option>ISC</option><option>State Board</option><option>ICSE</option>
                </select>
              </div>
            </div>
          </div>
          <div style={{ marginBottom:10 }}>
            <div className="field-label">School Name</div>
            <div className="field-wrap">
              <span className="field-icon">🏛</span>
              <input className="field-input" placeholder="DPS Bangalore" value={form.school} onChange={e=>setForm({...form,school:e.target.value})} />
            </div>
          </div>
          <div style={{ marginBottom:20 }}>
            <div className="field-label">City</div>
            <div className="field-wrap">
              <span className="field-icon">📍</span>
              <input className="field-input" placeholder="Bengaluru" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width:'100%',justifyContent:'center' }} onClick={()=>setStep(2)}>Continue →</button>
        </>}

        {/* STEP 2 */}
        {step===2 && <>
          <div style={{ fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:700,marginBottom:4 }}>Choose your stream</div>
          <div style={{ fontSize:12,color:'var(--txt2)',marginBottom:20 }}>This shapes your entire Synapse experience</div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20 }}>
            {[
              { id:'science',icon:'🔬',name:'Science',desc:'Physics, Chemistry, Biology, Maths, CS',badge:'JEE · NEET',color:'#00ffe0' },
              { id:'commerce',icon:'📊',name:'Commerce',desc:'Accountancy, Business Studies, Economics',badge:'CUET · IPMAT',color:'#ff2d78' },
            ].map(s=>(
              <div key={s.id} onClick={()=>setStream(s.id)} style={{ padding:20,borderRadius:12,border:`1px solid ${stream===s.id?s.color+'66':'var(--glass-border)'}`,background:stream===s.id?s.color+'0d':'var(--glass)',cursor:'pointer',transition:'all 0.25s cubic-bezier(0.22,1,0.36,1)',transform:stream===s.id?'translateY(-2px)':'none',boxShadow:stream===s.id?`0 0 24px ${s.color}15`:''  }}>
                <div style={{ fontSize:28,marginBottom:10 }}>{s.icon}</div>
                <div style={{ fontFamily:'Syne,sans-serif',fontSize:16,fontWeight:700,marginBottom:5 }}>{s.name}</div>
                <div style={{ fontSize:11,color:'var(--txt2)',lineHeight:1.5,marginBottom:8 }}>{s.desc}</div>
                <div style={{ display:'inline-block',padding:'3px 10px',borderRadius:100,fontSize:10,fontWeight:600,background:`${s.color}15`,color:s.color,border:`1px solid ${s.color}33` }}>{s.badge}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex',gap:8 }}>
            <button className="btn btn-ghost" style={{ flex:1,justifyContent:'center' }} onClick={()=>setStep(1)}>← Back</button>
            <button className="btn btn-primary" style={{ flex:1,justifyContent:'center' }} onClick={()=>stream&&setStep(3)}>Continue →</button>
          </div>
        </>}

        {/* STEP 3 */}
        {step===3 && <>
          <div style={{ fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:700,marginBottom:4 }}>Choose subjects</div>
          <div style={{ fontSize:12,color:'var(--txt2)',marginBottom:12 }}>Select 3–4 electives. English is compulsory.</div>
          <div style={{ padding:'8px 12px',borderRadius:8,background:'rgba(0,255,224,0.04)',border:'1px solid rgba(0,255,224,0.12)',fontSize:11,color:'var(--txt2)',marginBottom:14 }}>
            ✓ English auto-added · Choose <strong>{3 - Math.min(subjects.length,3)} more</strong> {subjects.length<3?'required':'(1 optional)'}
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:10 }}>
            {pool.map(s=>(
              <div key={s} className={`chip${subjects.includes(s)?' selected':''}`} onClick={()=>toggleSubj(s)} style={{ fontSize:11,padding:'10px 8px' }}>{s}</div>
            ))}
            <div className="chip compulsory" style={{ fontSize:11,padding:'10px 8px' }}>English ✓</div>
          </div>
          <button onClick={()=>setShowCustom(!showCustom)} style={{ width:'100%',padding:'9px',borderRadius:9,border:'1px dashed rgba(255,255,255,0.1)',background:'transparent',color:'var(--txt3)',fontSize:12,cursor:'pointer',marginBottom:showCustom?10:16,transition:'all 0.2s',fontFamily:'Inter,sans-serif' }}>
            + Can't find your combination? Build custom
          </button>
          {showCustom && (
            <div style={{ padding:12,borderRadius:10,background:'rgba(0,255,224,0.03)',border:'1px solid rgba(0,255,224,0.12)',marginBottom:14 }}>
              <div style={{ fontSize:11,color:'var(--txt2)',marginBottom:8,lineHeight:1.5 }}>Describe your subjects — AI will build a personalised syllabus for you. Won't be added to the main list.</div>
              <input className="field-input" style={{ paddingLeft:12 }} placeholder="e.g. Physics, Psychology, Fine Arts..." value={customSubj} onChange={e=>setCustomSubj(e.target.value)} />
            </div>
          )}
          <div style={{ display:'flex',gap:8 }}>
            <button className="btn btn-ghost" style={{ flex:1,justifyContent:'center' }} onClick={()=>setStep(2)}>← Back</button>
            <button className="btn btn-primary" style={{ flex:1,justifyContent:'center' }} onClick={()=>(subjects.length>=3||customSubj)&&setStep(4)}>Continue →</button>
          </div>
        </>}

        {/* STEP 4 */}
        {step===4 && <>
          <div style={{ fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:700,marginBottom:4 }}>Second language</div>
          <div style={{ fontSize:12,color:'var(--txt2)',marginBottom:18 }}>Choose one, or skip if your board doesn't require it.</div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:10 }}>
            {['Hindi','Kannada','French','Tamil','Telugu','Sanskrit'].map(l=>(
              <div key={l} className={`chip${lang===l?' selected':''}`} onClick={()=>setLang(l)} style={{ fontSize:12,padding:'12px 8px',textAlign:'center' }}>{l}</div>
            ))}
          </div>
          <button onClick={()=>{setLang('');setStep(5)}} style={{ width:'100%',padding:'10px',borderRadius:9,border:'1px dashed rgba(255,255,255,0.1)',background:'transparent',color:'var(--txt3)',fontSize:12,cursor:'pointer',marginBottom:16,fontFamily:'Inter,sans-serif' }}>
            Skip — my board doesn't require a second language
          </button>
          <div style={{ display:'flex',gap:8 }}>
            <button className="btn btn-ghost" style={{ flex:1,justifyContent:'center' }} onClick={()=>setStep(3)}>← Back</button>
            <button className="btn btn-primary" style={{ flex:1,justifyContent:'center' }} onClick={()=>setStep(5)}>Continue →</button>
          </div>
        </>}

        {/* STEP 5 */}
        {step===5 && <>
          <div style={{ fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:700,marginBottom:4 }}>Your exam goal</div>
          <div style={{ fontSize:12,color:'var(--txt2)',marginBottom:18 }}>Synapse will tailor everything towards your target.</div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10 }}>
            {exams.map(e=>(
              <div key={e} onClick={()=>setExam(e)} style={{ padding:'14px',borderRadius:10,border:`1px solid ${exam===e?'rgba(0,255,224,0.4)':'var(--glass-border)'}`,background:exam===e?'rgba(0,255,224,0.07)':'var(--glass)',cursor:'pointer',transition:'all 0.22s',transform:exam===e?'translateY(-1px)':'none' }}>
                <div style={{ fontFamily:'Syne,sans-serif',fontSize:14,fontWeight:600,marginBottom:3 }}>{e}</div>
                <div style={{ fontSize:10,color:'var(--txt3)' }}>{stream==='science'?'Entrance exam':'Management exam'}</div>
              </div>
            ))}
          </div>
          <button onClick={()=>setShowCustomExam(!showCustomExam)} style={{ width:'100%',padding:'9px',borderRadius:9,border:'1px dashed rgba(255,255,255,0.1)',background:'transparent',color:'var(--txt3)',fontSize:12,cursor:'pointer',marginBottom:showCustomExam?10:16,fontFamily:'Inter,sans-serif' }}>
            + My target exam isn't listed
          </button>
          {showCustomExam && (
            <div style={{ marginBottom:14,padding:12,borderRadius:10,background:'rgba(0,255,224,0.03)',border:'1px solid rgba(0,255,224,0.12)' }}>
              <input className="field-input" style={{ paddingLeft:12 }} placeholder="e.g. CLAT, NDA, CA Foundation..." value={customExam} onChange={e=>setCustomExam(e.target.value)} />
            </div>
          )}
          <div style={{ display:'flex',gap:8 }}>
            <button className="btn btn-ghost" style={{ flex:1,justifyContent:'center' }} onClick={()=>setStep(4)}>← Back</button>
            <button className="btn btn-primary" style={{ flex:2,justifyContent:'center' }} onClick={finish}>🚀 Launch Synapse</button>
          </div>
        </>}
      </div>

      <div style={{ marginTop:12,fontSize:11,color:'var(--txt3)',textAlign:'center' }}>Step {step} of 5</div>
    </div>
  )
}
