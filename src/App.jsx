import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zayrdykafxnaqozagsll.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpheXJkeWthZnhuYXFvemFnc2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODA2MzgsImV4cCI6MjA5MjI1NjYzOH0.feZ0XfYrBaIrsPC92Do8q59t-O-3gh0I2rbt2sJvq8k'
)

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (id) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
    setProfile(data)
    setLoading(false)
  }

  const logout = () => supabase.auth.signOut()
  const updateProfile = async (patch) => {
    await supabase.from('profiles').update(patch).eq('id', profile.id)
    setProfile(p => ({ ...p, ...patch }))
  }

  if (loading) return <div style={s.center}><p>Loading…</p></div>
  if (!session || !profile) return <AuthPage />

  return (
    <div>
      <div style={s.topbar}>
        <span style={s.logo}>UniAsk</span>
        <div style={s.row}>
          <span style={{fontSize:12,color:'#666',marginRight:8}}>{profile.name}</span>
          <span style={{...s.chip, background:'#EEEDFE', color:'#3C3489', marginRight:8}}>{profile.role}</span>
          <button style={s.btn} onClick={logout}>Log out</button>
        </div>
      </div>
      {profile.role === 'student' && <StudentApp profile={profile} updateProfile={updateProfile} />}
      {profile.role === 'alumni'  && <AlumniApp  profile={profile} updateProfile={updateProfile} />}
      {profile.role === 'admin'   && <AdminApp   profile={profile} updateProfile={updateProfile} />}
    </div>
  )
}

function AuthPage() {
  const [mode, setMode] = useState('login')
  const [role, setRole] = useState('student')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState(false)
  const [busy, setBusy] = useState(false)

  const go = async () => {
    if (!email || !pw) { setMsg('All fields required'); return }
    setBusy(true); setMsg('')
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
      if (error) { setMsg(error.message); setBusy(false) }
    } else {
      if (!name || !code) { setMsg('All fields required'); setBusy(false); return }
      if (role === 'admin' && code !== 'WaWaWaWa') { setMsg('Invalid admin code'); setBusy(false); return }
      if (role !== 'admin') {
        const { data: school } = await supabase.from('schools').select('id').eq('code', code).single()
        if (!school) { setMsg('School code not found'); setBusy(false); return }
      }
      const sc = (role === 'admin' ? 'ADM-' : role === 'alumni' ? 'ALM-' : 'STU-') + String(Math.floor(Math.random()*9000)+1000)
      const { error } = await supabase.auth.signUp({ email, password: pw, options: { data: { name, role, school_code: code, student_code: sc } } })
      if (error) setMsg(error.message)
      else { setMsg('Check your email to confirm your account!'); setOk(true) }
      setBusy(false)
    }
  }

  return (
    <div style={s.center}>
      <div style={{width:'100%',maxWidth:380}}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={s.logo}>UniAsk</div>
          <p style={{color:'#666',fontSize:13}}>University Application Q&A</p>
        </div>
        <div style={s.card}>
          <div style={{...s.row,marginBottom:14,gap:6}}>
            {['login','register'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{...s.btn, flex:1, background: mode===m ? '#534AB7':'transparent', color: mode===m ? '#fff':'#1a1a1a', borderColor: mode===m ? '#534AB7':'rgba(0,0,0,0.28)'}}>{m === 'login' ? 'Log in' : 'Register'}</button>
            ))}
          </div>
          <div style={{...s.row,gap:4,marginBottom:14}}>
            {['student','alumni','admin'].map(r => (
              <button key={r} onClick={() => setRole(r)} style={{...s.btn, flex:1, fontSize:12, background: role===r ? '#EEEDFE':'transparent', color: role===r ? '#3C3489':'#666', borderColor: role===r ? '#AFA9EC':'rgba(0,0,0,0.2)'}}>{r === 'student' ? 'student/parent' : r}</button>
            ))}
          </div>
          <div style={s.stack}>
            {mode==='register' && <Inp label="Full name" value={name} onChange={setName} />}
            <Inp label="Email" value={email} onChange={setEmail} placeholder="your@email.com" />
            <Inp label="Password" type="password" value={pw} onChange={setPw} placeholder="••••••••" onKeyDown={e => e.key==='Enter' && go()} />
            <Inp label={role==='admin' ? 'Admin code' : 'School code'} value={code} onChange={setCode} placeholder={role==='admin' ? '' : 'e.g. 12345'} />
            {msg && <p style={{fontSize:12, color: ok ? '#27500A' : '#A32D2D'}}>{msg}</p>}
            <button style={{...s.btn, background:'#534AB7', color:'#fff', borderColor:'#534AB7', padding:'9px', width:'100%'}} onClick={go} disabled={busy}>{busy ? 'Loading…' : (mode==='login' ? 'Log in' : 'Register')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StudentApp({ profile, updateProfile }) {
  const [tab, setTab] = useState('ask')
  return (
    <div style={s.page}>
      <TabBar tabs={[['ask','Ask a question'],['myq','My questions'],['faq','FAQ'],['settings','Settings']]} active={tab} onChange={setTab} />
      {tab==='ask'      && <AskForm profile={profile} onDone={() => setTab('myq')} />}
      {tab==='myq'      && <MyQuestions profile={profile} />}
      {tab==='faq'      && <FaqView />}
      {tab==='settings' && <ProfileSettings profile={profile} updateProfile={updateProfile} />}
    </div>
  )
}

function AskForm({ profile, onDone }) {
  const [question, setQuestion] = useState('')
  const [target, setTarget] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!question.trim()) return
    setBusy(true)
    const tName = target.trim() || 'Anyone'
    await supabase.from('questions').insert({ student_id: profile.id, student_code: profile.student_code, question: question.trim(), target_name: tName, status: 'open' })
    setBusy(false); setDone(true)
  }

  if (done) return (
    <div style={{...s.card, textAlign:'center', padding:'2rem'}}>
      <div style={{width:48,height:48,background:'#EAF3DE',borderRadius:'50%',margin:'0 auto 12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,color:'#27500A'}}>✓</div>
      <p style={{fontWeight:500,marginBottom:8}}>Question submitted!</p>
      <p style={{color:'#666',fontSize:13,marginBottom:16}}>You'll be notified by email when answered.</p>
      <button style={{...s.btn,...s.pri}} onClick={() => { setDone(false); setQuestion(''); setTarget(''); onDone() }}>View my questions</button>
    </div>
  )

  return (
    <div style={s.card}>
      <p style={{fontWeight:500,marginBottom:14}}>Ask a question</p>
      <div style={s.stack}>
        <div>
          <label style={s.lbl}>Who are you asking? (optional — leave blank for anyone)</label>
          <input value={target} onChange={e=>setTarget(e.target.value)} placeholder="Type a name, or leave blank for anyone" style={s.input}/>
        </div>
        <div>
          <label style={s.lbl}>Question</label>
          <textarea value={question} onChange={e=>setQuestion(e.target.value)} rows={5} placeholder="Type your question here…" style={s.input} />
        </div>
        <div style={{display:'flex',justifyContent:'flex-end'}}>
          <button style={{...s.btn,...s.pri}} onClick={submit} disabled={!question.trim()||busy}>{busy?'Sending…':'Submit question'}</button>
        </div>
      </div>
    </div>
  )
}

function EditableQuestion({ q, onSave }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(q.question)
  const save = async () => {
    await supabase.from('questions').update({ question: val.trim() }).eq('id', q.id)
    setEditing(false); onSave()
  }
  if (editing) return (
    <div style={{marginBottom:8}}>
      <textarea value={val} onChange={e=>setVal(e.target.value)} rows={4} style={{...s.input,marginBottom:6}}/>
      <div style={{display:'flex',gap:6}}>
        <button style={s.btn} onClick={()=>setEditing(false)}>Cancel</button>
        <button style={{...s.btn,...s.pri}} onClick={save}>Save</button>
      </div>
    </div>
  )
  return <button style={{...s.btn,fontSize:12,padding:'4px 10px',marginBottom:8}} onClick={()=>setEditing(true)}>Edit question</button>
}

function MyQuestions({ profile }) {
  const [tab, setTab] = useState('waiting')
  const [qs, setQs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('questions').select('*').eq('student_id', profile.id).order('created_at', { ascending: false })
    setQs(data||[]); setLoading(false)
  }, [profile.id])

  useEffect(() => { load() }, [load])

  const remind = async (q) => {
    await supabase.from('questions').update({ remind_at: new Date().toISOString() }).eq('id', q.id)
    load()
  }

  const waiting  = qs.filter(q => q.status !== 'answered')
  const answered = [...qs.filter(q => q.status === 'answered')].sort((a,b) => new Date(b.answered_at||b.created_at) - new Date(a.answered_at||a.created_at))

  if (loading) return <div style={s.empty}>Loading…</div>

  return (
    <div>
      <div style={{display:'flex',gap:6,marginBottom:14}}>
        {[['waiting','Unanswered',waiting.length],['answered','Answered',answered.length]].map(([k,label,cnt]) => (
          <button key={k} style={{...s.btn, background:tab===k?'#534AB7':'transparent', color:tab===k?'#fff':'#1a1a1a', borderColor:tab===k?'#534AB7':'rgba(0,0,0,0.28)', borderRadius:20, padding:'5px 14px'}} onClick={() => setTab(k)}>{label}{cnt>0 && <span style={{background:'rgba(255,255,255,0.3)',borderRadius:10,padding:'0 6px',fontSize:11,marginLeft:4}}>{cnt}</span>}</button>
        ))}
      </div>
      {tab==='waiting' && (waiting.length===0 ? <div style={s.empty}>No questions yet</div> : waiting.map(q => (
        <div key={q.id} style={s.qcard}>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginBottom:6}}>
            <span style={{...s.chip,background:q.status==='assigned'?'#FAEEDA':'#E6F1FB',color:q.status==='assigned'?'#633806':'#0C447C'}}>{q.status==='assigned'?'In progress':'Waiting'}</span>
            {q.open_to_alumni && <span style={{...s.chip,background:'#EEEDFE',color:'#3C3489'}}>Open to all alumni</span>}
            <span style={{fontSize:12,color:'#999'}}>To: {q.target_name}</span>
            <span style={{fontSize:12,color:'#999',marginLeft:'auto'}}>{fmt(q.created_at)}</span>
          </div>
          <p style={{fontSize:14,lineHeight:1.65,marginBottom:10}}>{q.question}</p>
          <EditableQuestion q={q} onSave={load} />
<button style={{...s.btn,background:'#854F0B',color:'#fff',borderColor:'#854F0B',padding:'4px 10px',fontSize:12}} onClick={() => remind(q)}>Send reminder</button>
        </div>
      )))}
      {tab==='answered' && (answered.length===0 ? <div style={s.empty}>No answered questions yet</div> : answered.map(q => (
        <div key={q.id} style={s.qcard}>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginBottom:6}}>
            <span style={{...s.chip,background:'#EAF3DE',color:'#085041'}}>Answered</span>
            <span style={{fontSize:12,color:'#999'}}>Asked: {fmt(q.created_at)}</span>
            {q.edited_at && <span style={{fontSize:12,color:'#999'}}>Edited: {fmt(q.edited_at)}</span>}
            <span style={{fontSize:12,color:'#999',marginLeft:'auto'}}>Answered: {fmt(q.answered_at)}</span>
          </div>
          <p style={{fontSize:14,lineHeight:1.65,marginBottom:8}}>{q.question}</p>
          <div style={{background:'#f5f4ed',borderLeft:'3px solid #534AB7',padding:'10px 14px',borderRadius:'0 8px 8px 0'}}>
            <p style={{fontSize:12,color:'#534AB7',fontWeight:500,marginBottom:3}}>{q.answered_by_name} · {fmt(q.answered_at)}</p>
            <p style={{fontSize:13,lineHeight:1.7}}>{q.answer}</p>
          </div>
          {/* Show alumni_answers if any */}
          {q.alumni_answers && q.alumni_answers.length > 0 && (
            <div style={{marginTop:10}}>
              <p style={{fontSize:12,color:'#666',fontWeight:500,marginBottom:6}}>Additional responses:</p>
              {q.alumni_answers.map((a,i) => (
                <div key={i} style={{background:'#f5f4ed',borderLeft:'3px solid #AFA9EC',padding:'10px 14px',borderRadius:'0 8px 8px 0',marginBottom:6}}>
                  <p style={{fontSize:12,color:'#534AB7',fontWeight:500,marginBottom:3}}>{a.by_name} · {fmt(a.at)}</p>
                  <p style={{fontSize:13,lineHeight:1.7}}>{a.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )))}
    </div>
  )
}

function AlumniApp({ profile, updateProfile }) {
  const [tab, setTab] = useState('inbox')
  const [cnt, setCnt] = useState(0)
  const [openCnt, setOpenCnt] = useState(0)
  return (
    <div style={s.page}>
      <TabBar tabs={[['inbox',`Inbox${cnt>0?' ('+cnt+')':''}`],['open',`Open Questions${openCnt>0?' ('+openCnt+')':''}`],['past','Past answers'],['faq','FAQ'],['settings','Settings']]} active={tab} onChange={setTab} />
      {tab==='inbox'    && <AlumniInbox profile={profile} onCount={setCnt} />}
      {tab==='open'     && <AlumniOpenQuestions profile={profile} onCount={setOpenCnt} />}
      {tab==='past'     && <AlumniPast profile={profile} />}
      {tab==='faq'      && <FaqView />}
      {tab==='settings' && <ProfileSettings profile={profile} updateProfile={updateProfile} />}
    </div>
  )
}

// NEW: Alumni view for open-to-all questions
function AlumniOpenQuestions({ profile, onCount }) {
  const [qs, setQs] = useState([])
  const [sel, setSel] = useState(null)
  const [ans, setAns] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase.from('questions').select('*').eq('open_to_alumni', true).order('created_at', { ascending: false })
    const d = data||[]; setQs(d); onCount(d.length)
  }, [onCount])

  useEffect(() => { load() }, [load])

  const send = async () => {
    setBusy(true)
    const existing = sel.alumni_answers || []
    const newAnswer = { text: ans.trim(), by: profile.id, by_name: 'Alumni ' + profile.student_code, at: new Date().toISOString() }
    await supabase.from('questions').update({ alumni_answers: [...existing, newAnswer] }).eq('id', sel.id)
    setSel(null); setAns(''); setBusy(false); load()
  }

  if (sel) return (
    <div>
      <button style={{...s.btn,marginBottom:14}} onClick={() => { setSel(null); setAns('') }}>← Back</button>
      <div style={{...s.card,marginBottom:12}}>
        <div style={{display:'flex',gap:6,marginBottom:8}}>
          <span style={{...s.chip,background:'#EEEDFE',color:'#3C3489'}}>Open to all alumni</span>
          <span style={{fontSize:12,color:'#999',marginLeft:'auto'}}>{fmt(sel.created_at)}</span>
        </div>
        <p style={{fontSize:14,lineHeight:1.65,marginBottom:10}}>{sel.question}</p>
        {/* Show existing alumni answers */}
        {sel.alumni_answers && sel.alumni_answers.length > 0 && (
          <div style={{marginTop:8}}>
            <p style={{fontSize:12,color:'#666',fontWeight:500,marginBottom:6}}>Previous responses:</p>
            {sel.alumni_answers.map((a,i) => (
              <div key={i} style={{background:'#f5f4ed',borderLeft:'3px solid #AFA9EC',padding:'10px 14px',borderRadius:'0 8px 8px 0',marginBottom:6}}>
                <p style={{fontSize:12,color:'#534AB7',fontWeight:500,marginBottom:3}}>{a.by_name} · {fmt(a.at)}</p>
                <p style={{fontSize:13,lineHeight:1.7}}>{a.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={s.card}>
        <label style={s.lbl}>Add your response</label>
        <textarea value={ans} onChange={e=>setAns(e.target.value)} rows={5} placeholder="Type your response…" style={{...s.input,marginTop:6}} />
        <div style={{display:'flex',justifyContent:'flex-end',marginTop:10}}>
          <button style={{...s.btn,...s.pri}} onClick={send} disabled={!ans.trim()||busy}>{busy?'Sending…':'Send response'}</button>
        </div>
      </div>
    </div>
  )

  return qs.length===0 ? <div style={s.empty}>No open questions right now</div> : (
    <div>
      <p style={{fontSize:13,color:'#666',marginBottom:14}}>These questions are open for any alumni to respond to.</p>
      {qs.map(q => (
        <div key={q.id} style={{...s.qcard,cursor:'pointer'}} onClick={() => { setSel(q); setAns('') }}>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginBottom:6}}>
            <span style={{...s.chip,background:'#EEEDFE',color:'#3C3489'}}>Open to all alumni</span>
            <span style={{fontSize:12,color:'#999'}}>{q.alumni_answers?.length||0} response{q.alumni_answers?.length!==1?'s':''}</span>
            <span style={{fontSize:12,color:'#999',marginLeft:'auto'}}>{fmt(q.created_at)}</span>
          </div>
          <p style={{fontSize:14,lineHeight:1.65}}>{q.question}</p>
        </div>
      ))}
    </div>
  )
}

function AlumniInbox({ profile, onCount }) {
  const [qs, setQs] = useState([])
  const [sel, setSel] = useState(null)
  const [ans, setAns] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase.from('questions').select('*').contains('assigned_to',[profile.id]).neq('status','answered').order('created_at',{ascending:true})
    const d = data||[]; setQs(d); onCount(d.length)
  }, [profile.id, onCount])

  useEffect(() => { load() }, [load])

  const send = async () => {
    setBusy(true)
    await supabase.from('questions').update({ status:'answered', answer:ans.trim(), answered_by:profile.id, answered_by_name:'Alumni '+profile.student_code, answered_at:new Date().toISOString() }).eq('id',sel.id)
    setSel(null); setAns(''); setBusy(false); load()
  }

  const reject = async (q) => {
    const rejected = [...(q.rejected_by||[]), profile.id]
    const still = (q.assigned_to||[]).filter(x=>x!==profile.id)
    await supabase.from('questions').update({ rejected_by:rejected, assigned_to:still, status:still.length?'assigned':'open' }).eq('id',q.id)
    setSel(null); load()
  }

  if (sel) return (
    <div>
      <button style={{...s.btn,marginBottom:14}} onClick={() => { setSel(null); setAns('') }}>← Back</button>
      <div style={{...s.card,marginBottom:12}}>
        <div style={{display:'flex',gap:6,marginBottom:8}}>
          <span style={{...s.chip,background:'#E6F1FB',color:'#0C447C'}}>Student {sel.student_code}</span>
          <span style={{fontSize:12,color:'#999',marginLeft:'auto'}}>{fmt(sel.created_at)}</span>
        </div>
        <p style={{fontSize:14,lineHeight:1.65,marginBottom:10}}>{sel.question}</p>
        <button style={{...s.btn,background:'#A32D2D',color:'#fff',borderColor:'#A32D2D',fontSize:12,padding:'4px 10px'}} onClick={() => reject(sel)}>Cannot answer — reassign</button>
      </div>
      <div style={s.card}>
        <label style={s.lbl}>Your answer</label>
        <textarea value={ans} onChange={e=>setAns(e.target.value)} rows={5} placeholder="Type your answer…" style={{...s.input,marginTop:6}} />
        <div style={{display:'flex',justifyContent:'flex-end',marginTop:10}}>
          <button style={{...s.btn,...s.pri}} onClick={send} disabled={!ans.trim()||busy}>{busy?'Sending…':'Send answer'}</button>
        </div>
      </div>
    </div>
  )

  return qs.length===0 ? <div style={s.empty}>No questions assigned yet</div> : (
    <div>
      {qs.map(q => (
        <div key={q.id} style={{...s.qcard,cursor:'pointer'}} onClick={() => { setSel(q); setAns('') }}>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginBottom:6}}>
            <span style={{...s.chip,background:'#FAEEDA',color:'#633806'}}>Assigned</span>
            <span style={{fontSize:12,color:'#999'}}>Student {q.student_code}</span>
            {q.remind_at && <span style={{...s.chip,background:'#FAEEDA',color:'#633806'}}>Reminder sent</span>}
            <span style={{fontSize:12,color:'#999',marginLeft:'auto'}}>{fmt(q.created_at)}</span>
          </div>
          <p style={{fontSize:14,lineHeight:1.65}}>{q.question}</p>
        </div>
      ))}
    </div>
  )
}

function AlumniPast({ profile }) {
  const [qs, setQs] = useState([])
  const [editing, setEditing] = useState(null)
  const [val, setVal] = useState('')
  const load = () => supabase.from('questions').select('*').eq('answered_by',profile.id).eq('status','answered').order('answered_at',{ascending:false}).then(({data})=>setQs(data||[]))
  useEffect(() => { load() }, [])
  const saveEdit = async (q) => {
    const edits = [...(q.edits||[]),{text:q.answer,at:q.answered_at}]
    await supabase.from('questions').update({answer:val,edits,answered_at:new Date().toISOString(),edited_at:new Date().toISOString()}).eq('id',q.id)
    setEditing(null); load()
  }
  return qs.length===0 ? <div style={s.empty}>No past answers yet</div> : (
    <div>
      {qs.map(q => (
        <div key={q.id} style={s.qcard}>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginBottom:6}}>
            <span style={{...s.chip,background:'#EAF3DE',color:'#085041'}}>Answered</span>
            <span style={{fontSize:12,color:'#999'}}>Student {q.student_code}</span>
            <span style={{fontSize:12,color:'#999',marginLeft:'auto'}}>{fmt(q.answered_at)}</span>
          </div>
          <p style={{fontSize:14,lineHeight:1.65,marginBottom:8}}>{q.question}</p>
          {editing===q.id ? (
            <div>
              <textarea value={val} onChange={e=>setVal(e.target.value)} rows={4} style={{...s.input,marginBottom:8}}/>
              <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                <button style={s.btn} onClick={()=>setEditing(null)}>Cancel</button>
                <button style={{...s.btn,...s.pri}} onClick={()=>saveEdit(q)}>Save</button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{background:'#f5f4ed',borderLeft:'3px solid #534AB7',padding:'10px 14px',borderRadius:'0 8px 8px 0',marginBottom:8}}><p style={{fontSize:13,lineHeight:1.7}}>{q.answer}</p></div>
              <button style={{...s.btn,fontSize:12,padding:'4px 10px'}} onClick={()=>{setEditing(q.id);setVal(q.answer)}}>Edit</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function AdminApp({ profile, updateProfile }) {
  const [tab, setTab] = useState('assign')
  const [cnt, setCnt] = useState(0)
  return (
    <div style={s.page}>
      <TabBar tabs={[['assign',`Inbox${cnt>0?' ('+cnt+')':''}`],['allq','All questions'],['faq','FAQ'],['schools','Schools'],['users','Users'],['settings','Settings']]} active={tab} onChange={setTab} />
      {tab==='assign'   && <AdminAssign onCount={setCnt} />}
      {tab==='allq'     && <AdminAllQ />}
      {tab==='faq'      && <AdminFaq />}
      {tab==='schools'  && <SchoolMgr />}
      {tab==='users'    && <UserMgr />}
      {tab==='settings' && <ProfileSettings profile={profile} updateProfile={updateProfile} />}
    </div>
  )
}

function AdminAssign({ onCount }) {
  const [sub, setSub] = useState('open')
  const [qs, setQs] = useState([])
  const [alumni, setAlumni] = useState([])
  const [sel, setSel] = useState(null)
  const [picked, setPicked] = useState([])
  const [search, setSearch] = useState('')
  const [adminAns, setAdminAns] = useState('')
  const [editing, setEditing] = useState(null)
  const [editVal, setEditVal] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase.from('questions').select('*').eq('is_faq',false).order('created_at',{ascending:false})
    const d = data||[]; setQs(d); onCount(d.filter(q=>q.status==='open').length)
  }, [onCount])

  useEffect(() => { load() }, [load])
  useEffect(() => { supabase.from('profiles').select('id,name,student_code').eq('role','alumni').then(({data})=>setAlumni(data||[])) }, [])

  const open     = qs.filter(q=>q.status==='open')
  const assigned = qs.filter(q=>q.status==='assigned')
  const answered = qs.filter(q=>q.status==='answered')
  const rejected = open.filter(q=>q.rejected_by?.length>0)
  const normal   = open.filter(q=>!q.rejected_by?.length)
  const displayOpen = [...rejected,...normal].sort((a,b)=>new Date(b.remind_at||b.created_at)-new Date(a.remind_at||a.created_at))

  const doAssign = async () => {
    setBusy(true)
    const { error } = await supabase.from('questions').update({
      status: 'assigned',
      assigned_to: picked,
      assigned_at: new Date().toISOString()
    }).eq('id', sel.id)
    console.log('assign error:', error)
    setSel(null);setPicked([]);setSearch('');setBusy(false);load()
  }

  const doAdminAns = async () => {
    setBusy(true)
    await supabase.from('questions').update({status:'answered',answer:adminAns.trim(),answered_by:'admin',answered_by_name:'Admin',answered_at:new Date().toISOString()}).eq('id',sel.id)
    setSel(null);setAdminAns('');setBusy(false);load()
  }

  const doEdit = async (q) => {
    const edits=[...(q.edits||[]),{text:q.answer,at:q.answered_at}]
    await supabase.from('questions').update({answer:editVal,edits,answered_at:new Date().toISOString(),edited_at:new Date().toISOString()}).eq('id',q.id)
    setEditing(null);load()
  }

  // Toggle open_to_alumni
  const toggleOpenToAlumni = async (q) => {
    setBusy(true)
    await supabase.from('questions').update({ open_to_alumni: !q.open_to_alumni }).eq('id', q.id)
    setBusy(false); load()
    // Update sel if we're viewing this question
    if (sel && sel.id === q.id) setSel(s => ({...s, open_to_alumni: !s.open_to_alumni}))
  }

  const filteredAlumni = alumni.filter(a=>(a.name+' '+a.student_code).toLowerCase().includes(search.toLowerCase()))
  const tabs = [['open','Unassigned',displayOpen.length],['assigned','In progress',assigned.length],['answered','Answered',answered.length]]
  const display = sub==='open'?displayOpen:sub==='assigned'?[...assigned].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)):[...answered].sort((a,b)=>new Date(b.answered_at)-new Date(a.answered_at))

  if (sel) {
    const fq = qs.find(q=>q.id===sel.id)||sel
    return (
      <div>
        <button style={{...s.btn,marginBottom:14}} onClick={()=>{setSel(null);setPicked([]);setAdminAns('')}}>← Back</button>
        <div style={{...s.card,marginBottom:12}}>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginBottom:8}}>
            <span style={{...s.chip,background:fq.status==='answered'?'#EAF3DE':fq.status==='assigned'?'#FAEEDA':'#E6F1FB',color:fq.status==='answered'?'#085041':fq.status==='assigned'?'#633806':'#0C447C'}}>{fq.status}</span>
            {fq.rejected_by?.length>0 && <span style={{...s.chip,background:'#FCEBEB',color:'#791F1F'}}>Rejected — needs reassign</span>}
            {fq.open_to_alumni && <span style={{...s.chip,background:'#EEEDFE',color:'#3C3489'}}>Open to all alumni</span>}
            <span style={{fontSize:12,color:'#999'}}>from: {fq.student_name||fq.student_code}</span>
<span style={{fontSize:12,color:'#999'}}>requested: {fq.target_name||'Anyone'}</span>
            <span style={{fontSize:12,color:'#999',marginLeft:'auto'}}>{fmt(fq.created_at)}</span>
          </div>
          <p style={{fontSize:14,lineHeight:1.65,marginBottom:12}}>{fq.question}</p>
          {/* Open to alumni toggle */}
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:fq.open_to_alumni?'#EEEDFE':'#f9f9f9',borderRadius:8,border:'0.5px solid rgba(0,0,0,0.1)'}}>
            <div style={{flex:1}}>
              <p style={{fontSize:13,fontWeight:500,color:fq.open_to_alumni?'#3C3489':'#1a1a1a'}}>Open to all alumni</p>
              <p style={{fontSize:12,color:'#666'}}>Any alumni can view and respond to this question</p>
            </div>
            <button
              style={{...s.btn, background:fq.open_to_alumni?'#534AB7':'transparent', color:fq.open_to_alumni?'#fff':'#1a1a1a', borderColor:fq.open_to_alumni?'#534AB7':'rgba(0,0,0,0.28)', fontSize:12, padding:'5px 14px', whiteSpace:'nowrap'}}
              onClick={()=>toggleOpenToAlumni(fq)}
              disabled={busy}
            >
              {fq.open_to_alumni ? '✓ On — click to turn off' : 'Turn on'}
            </button>
          </div>
          {/* Show alumni responses if any */}
          {fq.alumni_answers && fq.alumni_answers.length > 0 && (
            <div style={{marginTop:12}}>
              <p style={{fontSize:12,color:'#666',fontWeight:500,marginBottom:6}}>Alumni responses ({fq.alumni_answers.length}):</p>
              {fq.alumni_answers.map((a,i) => (
                <div key={i} style={{background:'#f5f4ed',borderLeft:'3px solid #AFA9EC',padding:'10px 14px',borderRadius:'0 8px 8px 0',marginBottom:6}}>
                  <p style={{fontSize:12,color:'#534AB7',fontWeight:500,marginBottom:3}}>{a.by_name} · {fmt(a.at)}</p>
                  <p style={{fontSize:13,lineHeight:1.7}}>{a.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        {fq.status!=='answered' && (
          <>
            <div style={{...s.card,marginBottom:12}}>
              <p style={{fontWeight:500,marginBottom:10}}>Assign to alumni</p>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search alumni…" style={{...s.input,marginBottom:10}}/>
              <div style={{border:'0.5px solid rgba(0,0,0,0.14)',borderRadius:8,maxHeight:150,overflowY:'auto'}}>
                {filteredAlumni.map(a=>(
                  <div key={a.id} onClick={()=>setPicked(p=>p.includes(a.id)?p.filter(x=>x!==a.id):[...p,a.id])} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 12px',cursor:'pointer',background:picked.includes(a.id)?'#EEEDFE':'transparent',fontSize:13}}>
                    <div style={{width:16,height:16,borderRadius:4,border:'0.5px solid rgba(0,0,0,0.28)',background:picked.includes(a.id)?'#534AB7':'#fff',flexShrink:0}}/>
                    <span style={{fontWeight:500}}>{a.student_code}</span><span style={{color:'#666'}}> ({a.name})</span>
                  </div>
                ))}
              </div>
              {picked.length>0 && (
                <div style={{display:'flex',gap:6,marginTop:10,flexWrap:'wrap',alignItems:'center'}}>
                  {picked.map(id=><span key={id} style={{...s.chip,background:'#FAEEDA',color:'#633806'}}>{alumni.find(a=>a.id===id)?.student_code}</span>)}
                  <button style={{...s.btn,...s.pri,fontSize:12,padding:'4px 10px',marginLeft:'auto'}} onClick={doAssign} disabled={busy}>Assign</button>
                </div>
              )}
            </div>
            <div style={{...s.card,marginBottom:12}}>
              <label style={s.lbl}>Or answer directly (admin)</label>
              <textarea value={adminAns} onChange={e=>setAdminAns(e.target.value)} rows={4} placeholder="Type answer…" style={{...s.input,marginTop:6}}/>
              <div style={{display:'flex',justifyContent:'flex-end',marginTop:8}}>
                <button style={{...s.btn,...s.pri,fontSize:12,padding:'5px 12px'}} onClick={doAdminAns} disabled={!adminAns.trim()||busy}>Send answer</button>
              </div>
            </div>
          </>
        )}
        {fq.status==='answered' && (
          <div style={s.card}>
            <p style={{fontWeight:500,marginBottom:8}}>Answer</p>
            {editing===fq.id ? (
              <div>
                <textarea value={editVal} onChange={e=>setEditVal(e.target.value)} rows={4} style={{...s.input,marginBottom:8}}/>
                <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                  <button style={s.btn} onClick={()=>setEditing(null)}>Cancel</button>
                  <button style={{...s.btn,...s.pri}} onClick={()=>doEdit(fq)}>Save</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{background:'#f5f4ed',borderLeft:'3px solid #534AB7',padding:'10px 14px',borderRadius:'0 8px 8px 0',marginBottom:8}}>
                  <p style={{fontSize:12,color:'#534AB7',fontWeight:500,marginBottom:3}}>{fq.answered_by_name} · {fmt(fq.answered_at)}</p>
                  <p style={{fontSize:13,lineHeight:1.7}}>{fq.answer}</p>
                </div>
                {fq.edits?.map((e,i)=><p key={i} style={{fontSize:12,color:'#999',marginBottom:4}}>v{i+1}: "{e.text?.slice(0,50)}…" — {fmt(e.at)}</p>)}
                <button style={{...s.btn,fontSize:12,padding:'4px 10px'}} onClick={()=>{setEditing(fq.id);setEditVal(fq.answer)}}>Edit</button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
        {tabs.map(([k,label,cnt])=>(
          <button key={k} style={{...s.btn,background:sub===k?'#534AB7':'transparent',color:sub===k?'#fff':'#1a1a1a',borderColor:sub===k?'#534AB7':'rgba(0,0,0,0.28)',borderRadius:20,padding:'5px 14px',fontSize:13}} onClick={()=>setSub(k)}>
            {label}{cnt>0&&<span style={{marginLeft:4,opacity:0.8}}>({cnt})</span>}
          </button>
        ))}
      </div>
      {display.length===0 ? <div style={s.empty}>No questions</div> : display.map(q=>(
        <div key={q.id} style={{...s.qcard,cursor:'pointer',borderLeft:q.rejected_by?.length>0?'3px solid #E24B4A':undefined}} onClick={()=>setSel(q)}>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginBottom:6}}>
            {q.rejected_by?.length>0&&<span style={{...s.chip,background:'#FCEBEB',color:'#791F1F'}}>Rejected</span>}
            {q.remind_at&&<span style={{...s.chip,background:'#FAEEDA',color:'#633806'}}>Reminded</span>}
            {q.open_to_alumni&&<span style={{...s.chip,background:'#EEEDFE',color:'#3C3489'}}>Open to alumni</span>}
            <span style={{...s.chip,background:q.status==='answered'?'#EAF3DE':q.status==='assigned'?'#FAEEDA':'#E6F1FB',color:q.status==='answered'?'#085041':q.status==='assigned'?'#633806':'#0C447C'}}>{q.status}</span>
            <span style={{fontSize:12,color:'#999'}}>{q.student_name||q.student_code}</span>
            <span style={{fontSize:12,color:'#999',marginLeft:'auto'}}>{fmt(q.created_at)}</span>
          </div>
          <p style={{fontSize:13,lineHeight:1.6}}>{q.question?.length>110?q.question.slice(0,110)+'…':q.question}</p>
        </div>
      ))}
    </div>
  )
}

function AdminAllQ() {
  const [qs, setQs] = useState([])
  const [search, setSearch] = useState('')
  useEffect(() => { supabase.from('questions').select('*').eq('is_faq',false).order('created_at',{ascending:false}).then(({data})=>setQs(data||[])) }, [])
  const filtered = search ? qs.filter(q=>(q.question+' '+(q.answer||'')).toLowerCase().includes(search.toLowerCase())) : qs
  return (
    <div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={{...s.input,marginBottom:14}}/>
      {filtered.length===0?<div style={s.empty}>No questions</div>:filtered.map(q=>(
        <div key={q.id} style={s.qcard}>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginBottom:6}}>
            <span style={{...s.chip,background:q.status==='answered'?'#EAF3DE':q.status==='assigned'?'#FAEEDA':'#E6F1FB',color:q.status==='answered'?'#085041':q.status==='assigned'?'#633806':'#0C447C'}}>{q.status}</span>
            {q.open_to_alumni&&<span style={{...s.chip,background:'#EEEDFE',color:'#3C3489'}}>Open to alumni</span>}
            <span style={{fontSize:12,color:'#999'}}>{q.student_name||q.student_code}</span>
            <span style={{fontSize:12,color:'#999',marginLeft:'auto'}}>{fmt(q.created_at)}</span>
          </div>
          <p style={{fontSize:13,lineHeight:1.6,marginBottom:4}}>{q.question}</p>
          {q.answer&&<p style={{fontSize:12,color:'#666'}}>{q.answer.slice(0,100)}{q.answer.length>100?'…':''}</p>}
        </div>
      ))}
    </div>
  )
}

function FaqView() {
  const [faqs, setFaqs] = useState([])
  const [search, setSearch] = useState('')
  useEffect(() => { supabase.from('questions').select('*').eq('is_faq',true).order('created_at',{ascending:false}).then(({data})=>setFaqs(data||[])) }, [])
  const filtered = search ? faqs.filter(q=>(q.question+' '+(q.answer||'')+' '+(q.faq_category||'')).toLowerCase().includes(search.toLowerCase())) : faqs
  return (
    <div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search FAQs…" style={{...s.input,marginBottom:14}}/>
      {filtered.length===0?<div style={s.empty}>No FAQs yet</div>:filtered.map(q=>(
        <div key={q.id} style={s.qcard}>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginBottom:6}}>
            <span style={{...s.chip,background:'#EEEDFE',color:'#3C3489'}}>FAQ</span>
            {q.faq_category&&<span style={{fontSize:12,color:'#999'}}>{q.faq_category}</span>}
            <span style={{fontSize:12,color:'#999',marginLeft:'auto'}}>Posted: {fmt(q.created_at)}{q.edited_at&&` · Edited: ${fmt(q.edited_at)}`}</span>
          </div>
          <p style={{fontSize:14,fontWeight:500,lineHeight:1.65,marginBottom:4}}>{q.question}</p>
          <p style={{fontSize:13,color:'#666',lineHeight:1.7}}>{q.answer}</p>
        </div>
      ))}
    </div>
  )
}

function AdminFaq() {
  const [faqs, setFaqs] = useState([])
  const [allAns, setAllAns] = useState([])
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({q:'',a:'',cat:''})
  const [editing, setEditing] = useState(null)
  const [ef, setEf] = useState({})
  const loadFaqs = () => supabase.from('questions').select('*').eq('is_faq',true).order('created_at',{ascending:false}).then(({data})=>setFaqs(data||[]))
  const loadAns  = () => supabase.from('questions').select('*').eq('status','answered').eq('is_faq',false).then(({data})=>setAllAns(data||[]))
  useEffect(() => { loadFaqs(); loadAns() }, [])
  const smart = search ? [...faqs,...allAns].filter(q=>(q.question+' '+(q.answer||'')).toLowerCase().includes(search.toLowerCase())).slice(0,8) : [...faqs].sort((a,b)=>new Date(b.edited_at||b.created_at)-new Date(a.edited_at||a.created_at))
  const save = async () => {
    await supabase.from('questions').insert({question:form.q,answer:form.a,faq_category:form.cat,is_faq:true,status:'answered',student_code:'ADMIN',target_name:'Admin',answered_by:'admin',answered_by_name:'Admin',answered_at:new Date().toISOString()})
    setForm({q:'',a:'',cat:''});loadFaqs()
  }
  const saveEdit = async (q) => {
    await supabase.from('questions').update({question:ef.q,answer:ef.a,faq_category:ef.cat,edited_at:new Date().toISOString()}).eq('id',q.id)
    setEditing(null);loadFaqs()
  }
  const promote = async (q) => { await supabase.from('questions').update({is_faq:true}).eq('id',q.id); loadFaqs();loadAns() }
  return (
    <div>
      <div style={{...s.card,marginBottom:14}}>
        <p style={{fontWeight:500,marginBottom:6}}>Smart search — check before posting a new FAQ</p>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={s.input}/>
      </div>
      {search&&smart.some(q=>!q.is_faq)&&(
        <div style={{marginBottom:14}}>
          <p style={{fontSize:12,fontWeight:500,marginBottom:8}}>Related answered questions — promote to FAQ?</p>
          {smart.filter(q=>!q.is_faq).map(q=>(
            <div key={q.id} style={s.qcard}>
              <div style={{display:'flex',alignItems:'center',marginBottom:4}}>
                <span style={{...s.chip,background:'#EAF3DE',color:'#085041'}}>Answered</span>
                <button style={{...s.btn,...s.pri,fontSize:12,padding:'3px 10px',marginLeft:'auto'}} onClick={()=>promote(q)}>Make FAQ</button>
              </div>
              <p style={{fontSize:13}}>{q.question}</p>
            </div>
          ))}
          <hr style={{border:'none',borderTop:'0.5px solid rgba(0,0,0,0.1)',margin:'12px 0'}}/>
        </div>
      )}
      <div style={{marginBottom:14}}>
        {(search?smart.filter(q=>q.is_faq):smart).length===0?<div style={s.empty}>No FAQs yet</div>:(search?smart.filter(q=>q.is_faq):smart).map(q=>(
          <div key={q.id} style={s.qcard}>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginBottom:6}}>
              <span style={{...s.chip,background:'#EEEDFE',color:'#3C3489'}}>FAQ</span>
              {q.faq_category&&<span style={{fontSize:12,color:'#999'}}>{q.faq_category}</span>}
              <span style={{fontSize:12,color:'#999',marginLeft:'auto'}}>{fmt(q.created_at)}</span>
              <button style={{...s.btn,fontSize:12,padding:'3px 8px'}} onClick={()=>{setEditing(q.id);setEf({q:q.question,a:q.answer,cat:q.faq_category||''})}}>Edit</button>
            </div>
            {editing===q.id?(
              <div style={s.stack}>
                <input value={ef.q} onChange={e=>setEf(x=>({...x,q:e.target.value}))} placeholder="Question" style={s.input}/>
                <input value={ef.cat} onChange={e=>setEf(x=>({...x,cat:e.target.value}))} placeholder="Category" style={s.input}/>
                <textarea value={ef.a} onChange={e=>setEf(x=>({...x,a:e.target.value}))} rows={3} style={s.input}/>
                <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                  <button style={s.btn} onClick={()=>setEditing(null)}>Cancel</button>
                  <button style={{...s.btn,...s.pri}} onClick={()=>saveEdit(q)}>Save</button>
                </div>
              </div>
            ):(
              <div>
                <p style={{fontSize:14,fontWeight:500,marginBottom:4}}>{q.question}</p>
                <p style={{fontSize:13,color:'#666',lineHeight:1.7}}>{q.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={s.card}>
        <p style={{fontWeight:500,marginBottom:12}}>Post new FAQ</p>
        <div style={s.stack}>
          <Inp label="Category (optional)" value={form.cat} onChange={v=>setForm(x=>({...x,cat:v}))} placeholder="e.g. Deadlines, JLPT"/>
          <Inp label="Question" value={form.q} onChange={v=>setForm(x=>({...x,q:v}))} placeholder="FAQ question…"/>
          <div><label style={s.lbl}>Answer</label><textarea value={form.a} onChange={e=>setForm(x=>({...x,a:e.target.value}))} rows={4} placeholder="Answer…" style={s.input}/></div>
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <button style={{...s.btn,...s.pri}} onClick={save} disabled={!form.q.trim()||!form.a.trim()}>Post FAQ</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SchoolMgr() {
  const [schools, setSchools] = useState([])
  const [search, setSearch] = useState('')
  const [name, setName] = useState('')
  const load = () => supabase.from('schools').select('*').order('name').then(({data})=>setSchools(data||[]))
  useEffect(() => { load() }, [])
  const add = async () => {
    if (!name.trim()) return
    const existing = schools.map(s=>s.code)
    let code; do { code=String(Math.floor(Math.random()*90000)+10000) } while(existing.includes(code))
    await supabase.from('schools').insert({name:name.trim(),code})
    setName('');load()
  }
  const filtered = schools.filter(s=>s.name.toLowerCase().includes(search.toLowerCase()))
  return (
    <div>
      <div style={{...s.card,marginBottom:14}}>
        <p style={{fontWeight:500,marginBottom:10}}>School codes</p>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search school…" style={{...s.input,marginBottom:10}}/>
        <div style={{border:'0.5px solid rgba(0,0,0,0.14)',borderRadius:8,overflow:'hidden'}}>
          {filtered.map((sch,i)=>(
            <div key={sch.id} style={{display:'flex',alignItems:'center',padding:'9px 14px',borderTop:i>0?'0.5px solid rgba(0,0,0,0.1)':'none',fontSize:13}}>
              <span style={{flex:1}}>{sch.name}</span>
              <code style={{background:'#f5f4ed',padding:'2px 8px',borderRadius:6,fontSize:12}}>{sch.code}</code>
            </div>
          ))}
        </div>
      </div>
      <div style={s.card}>
        <p style={{fontWeight:500,marginBottom:10}}>Add new school</p>
        <div style={{display:'flex',gap:8}}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="School name" style={s.input} onKeyDown={e=>e.key==='Enter'&&add()}/>
          <button style={{...s.btn,...s.pri,whiteSpace:'nowrap'}} onClick={add} disabled={!name.trim()}>Generate code</button>
        </div>
      </div>
    </div>
  )
}

function UserMgr() {
  const [users, setUsers] = useState([])
  const [schools, setSchools] = useState([])
  const [search, setSearch] = useState('')
  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at',{ascending:false}).then(({data})=>setUsers(data||[]))
    supabase.from('schools').select('*').then(({data})=>setSchools(data||[]))
  }, [])
  const sName = code => schools.find(s=>s.code===code)?.name||code
  const filtered = users.filter(u=>(u.name+' '+u.email+' '+u.student_code).toLowerCase().includes(search.toLowerCase()))
  return (
    <div style={s.card}>
      <p style={{fontWeight:500,marginBottom:10}}>Registered users</p>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={{...s.input,marginBottom:10}}/>
      <div style={{border:'0.5px solid rgba(0,0,0,0.14)',borderRadius:8,overflow:'hidden'}}>
        {filtered.map((u,i)=>(
          <div key={u.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 14px',borderTop:i>0?'0.5px solid rgba(0,0,0,0.1)':'none',flexWrap:'wrap'}}>
            <div style={{width:34,height:34,borderRadius:'50%',background:'#EEEDFE',color:'#3C3489',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:500,flexShrink:0}}>{u.name?.slice(0,2).toUpperCase()}</div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:13,fontWeight:500}}>{u.name}</p>
              <p style={{fontSize:12,color:'#999'}}>{u.email} · {sName(u.school_code)}</p>
            </div>
            <code style={{background:'#f5f4ed',padding:'2px 6px',borderRadius:6,fontSize:11}}>{u.student_code}</code>
            <span style={{...s.chip,background:u.role==='admin'?'#EEEDFE':u.role==='alumni'?'#EAF3DE':'#E6F1FB',color:u.role==='admin'?'#3C3489':u.role==='alumni'?'#085041':'#0C447C'}}>{u.role}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProfileSettings({ profile, updateProfile }) {
  const [name, setName] = useState(profile.name||'')
  const [email, setEmail] = useState(profile.email||'')
  const [pw, setPw] = useState('')
  const [saved, setSaved] = useState('')
  const [del, setDel] = useState('')
  const save = async (field) => {
    if (field==='name') await updateProfile({name})
    if (field==='email') await supabase.auth.updateUser({email})
    if (field==='pw'&&pw) await supabase.auth.updateUser({password:pw})
    setSaved(field); setTimeout(()=>setSaved(''),2000)
  }
  const deleteAcc = async () => { if(del!=='DELETE')return; await updateProfile({deleted:true}); await supabase.auth.signOut() }
  return (
    <div style={s.stack}>
      <div style={s.card}>
        <p style={{fontWeight:500,marginBottom:12}}>Edit profile</p>
        <div style={s.stack}>
          {[['name','Full name',name,setName],['email','Email',email,setEmail]].map(([field,label,val,setVal])=>(
            <div key={field}>
              <label style={s.lbl}>{label}</label>
              <div style={{display:'flex',gap:8}}>
                <input value={val} onChange={e=>setVal(e.target.value)} style={s.input}/>
                <button style={{...s.btn,...s.pri,fontSize:12,padding:'5px 12px',whiteSpace:'nowrap'}} onClick={()=>save(field)}>{saved===field?'Saved!':'Save'}</button>
              </div>
            </div>
          ))}
          <div>
            <label style={s.lbl}>New password</label>
            <div style={{display:'flex',gap:8}}>
              <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Leave blank to keep current" style={s.input}/>
              <button style={{...s.btn,...s.pri,fontSize:12,padding:'5px 12px',whiteSpace:'nowrap'}} onClick={()=>save('pw')} disabled={!pw}>{saved==='pw'?'Saved!':'Save'}</button>
            </div>
          </div>
          <p style={{fontSize:12,color:'#999'}}>Code: <code style={{background:'#f5f4ed',padding:'1px 5px',borderRadius:4}}>{profile.student_code}</code></p>
        </div>
      </div>
      <div style={{...s.card,borderColor:'#F09595'}}>
        <p style={{fontWeight:500,color:'#A32D2D',marginBottom:6}}>Delete account</p>
        <p style={{fontSize:12,color:'#666',marginBottom:10}}>Type DELETE to confirm. Cannot be undone.</p>
        <div style={{display:'flex',gap:8}}>
          <input value={del} onChange={e=>setDel(e.target.value)} placeholder="DELETE" style={{...s.input,maxWidth:140}}/>
          <button style={{...s.btn,background:'#A32D2D',color:'#fff',borderColor:'#A32D2D',fontSize:12,padding:'5px 12px'}} onClick={deleteAcc} disabled={del!=='DELETE'}>Delete</button>
        </div>
      </div>
    </div>
  )
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{display:'flex',gap:2,borderBottom:'0.5px solid rgba(0,0,0,0.12)',marginBottom:'1.25rem',flexWrap:'wrap',overflowX:'auto'}}>
      {tabs.map(([k,label]) => (
        <button key={k} onClick={() => onChange(k)} style={{padding:'8px 14px',fontSize:13,border:'none',background:'transparent',cursor:'pointer',borderBottom:active===k?'2px solid #534AB7':'2px solid transparent',color:active===k?'#534AB7':'#666',fontWeight:active===k?500:400,fontFamily:'inherit',whiteSpace:'nowrap'}}>
          {label}
        </button>
      ))}
    </div>
  )
}
function Inp({ label, value, onChange, type='text', placeholder, onKeyDown }) {
  return (
    <div>
      {label && <label style={s.lbl}>{label}</label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} onKeyDown={onKeyDown} style={s.input}/>
    </div>
  )
}

const fmt = ts => ts ? new Date(ts).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : ''
const s = {
  center:  { display:'flex', alignItems:'center', justifyContent:'center', minHeight:'90vh', padding:'1rem' },
  page:    { maxWidth:900, margin:'0 auto', padding:'1.25rem' },
  topbar:  { background:'#fff', borderBottom:'0.5px solid rgba(0,0,0,0.12)', padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, position:'sticky', top:0, zIndex:10 },
  logo:    { fontSize:17, fontWeight:600, color:'#534AB7' },
  card:    { background:'#fff', border:'0.5px solid rgba(0,0,0,0.14)', borderRadius:12, padding:'1rem 1.25rem' },
  qcard:   { background:'#fff', border:'0.5px solid rgba(0,0,0,0.14)', borderRadius:10, padding:'.9rem 1.1rem', marginBottom:10 },
  stack:   { display:'flex', flexDirection:'column', gap:12 },
  row:     { display:'flex', alignItems:'center' },
  chip:    { display:'inline-flex', alignItems:'center', fontSize:11, padding:'2px 8px', borderRadius:20, fontWeight:500, whiteSpace:'nowrap' },
  input:   { fontFamily:'inherit', fontSize:14, padding:'8px 12px', border:'0.5px solid rgba(0,0,0,0.28)', borderRadius:8, background:'#fff', color:'#1a1a1a', width:'100%', outline:'none' },
  btn:     { fontFamily:'inherit', cursor:'pointer', borderRadius:8, fontSize:13, padding:'7px 14px', border:'0.5px solid rgba(0,0,0,0.28)', background:'transparent', color:'#1a1a1a' },
  pri:     { background:'#534AB7', color:'#fff', borderColor:'#534AB7' },
  lbl:     { fontSize:12, color:'#666', marginBottom:4, display:'block', fontWeight:500 },
  empty:   { textAlign:'center', padding:'2.5rem', color:'#999', fontSize:13 },
}
