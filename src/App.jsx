import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zayrdykafxnaqozagsll.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpheXJkeWthZnhuYXFvemFnc2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODA2MzgsImV4cCI6MjA5MjI1NjYzOH0.feZ0XfYrBaIrsPC92Do8q59t-O-3gh0I2rbt2sJvq8k'
)

const notify = async (type, questionId) => {
  if (!questionId) return
  try {
    const res = await fetch('https://zayrdykafxnaqozagsll.supabase.co/functions/v1/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ type: type, questionId: questionId })
    })
    console.log('notify response:', res.status)
  } catch(e) { console.log('notify error', e) }
}

const LangContext = createContext('en')
const useLang = () => useContext(LangContext)
const TR = {
  en: { logout:'Log out', translate:'Translate', showOriginal:'Show original', translating:'Translating…',
    ask:'Ask a question', myq:'My questions', faq:'FAQ', settings:'Settings', inbox:'Inbox',
    past:'Past answers', openQ:'Open Questions', allQ:'All questions', schools:'Schools', users:'Users',
    submit:'Submit question', sending:'Sending…', answered:'Answered', waiting:'Waiting',
    inProgress:'In progress', unanswered:'Unanswered', noQYet:'No questions yet',
    noAnswered:'No answered questions yet', sendReminder:'Send reminder', sendAnswer:'Send answer',
    back:'← Back', cannotAnswer:'Cannot answer — reassign', addResponse:'Add your response',
    whoAsking:'Who are you asking? (optional)', typeQuestion:'Type your question here…',
    questionSubmitted:'Question submitted!', notified:'You will be notified when answered.',
    viewMyQ:'View my questions', noAssigned:'No questions assigned yet', noPastAnswers:'No past answers yet',
    reminderSent:'Reminder sent', openToAlumni:'Open to all alumni', noOpenQ:'No open questions right now',
    openForAlumni:'These questions are open for any alumni to respond to.',
    edit:'Edit', save:'Save', cancel:'Cancel' },
  ja: { logout:'ログアウト', translate:'翻訳', showOriginal:'原文を表示', translating:'翻訳中…',
    ask:'質問する', myq:'自分の質問', faq:'よくある質問', settings:'設定', inbox:'受信箱',
    past:'過去の回答', openQ:'全員への質問', allQ:'全質問', schools:'学校', users:'ユーザー',
    submit:'質問を送信', sending:'送信中…', answered:'回答済み', waiting:'待機中',
    inProgress:'対応中', unanswered:'未回答', noQYet:'まだ質問がありません',
    noAnswered:'回答済みの質問はまだありません', sendReminder:'リマインダーを送る', sendAnswer:'回答を送る',
    back:'← 戻る', cannotAnswer:'回答不可 — 再割当て', addResponse:'回答を追加する',
    whoAsking:'誰に聞きますか？（任意）', typeQuestion:'ここに質問を入力…',
    questionSubmitted:'質問が送信されました！', notified:'回答が来たらお知らせします。',
    viewMyQ:'自分の質問を見る', noAssigned:'まだ割り当てられた質問がありません', noPastAnswers:'過去の回答はまだありません',
    reminderSent:'リマインダー送信済み', openToAlumni:'全卒業生に公開', noOpenQ:'現在公開中の質問はありません',
    openForAlumni:'これらの質問はすべての卒業生が回答できます。',
    edit:'編集', save:'保存', cancel:'キャンセル', delete:'削除', editProfile:'プロフィール編集', fullName:'フルネーム', email:'メールアドレス', newPassword:'新しいパスワード', deleteAccount:'アカウント削除', openToAlumni:'全卒業生に公開', openToAlumni:'全卒業生に公開', editProfile:'プロフィール編集', fullName:'フルネーム', newPassword:'新しいパスワード', deleteAccount:'アカウント削除' }
}
const t = (lang, key) => TR[lang]?.[key] || TR.en[key] || key



function LoginGuide({ role, lang }) {
  const guides = {
    en: {
      student: {
        title: 'For Students & Parents',
        steps: [
          '1. Register with your school code (given by your school admin)',
          '2. Ask questions to alumni about university applications',
          '3. Choose to ask anyone or a specific alumni',
          '4. Get notified via LINE when your question is answered',
          '5. View answered questions and FAQs for more information',
        ]
      },
      alumni: {
        title: 'For Alumni',
        steps: [
          '1. Register with your school code',
          '2. Check your inbox for questions assigned to you',
          '3. Answer questions from current students and parents',
          '4. Get notified via LINE when a new question is assigned',
          '5. View open questions available for all alumni to answer',
        ]
      },
      admin: {
        title: 'For Admins',
        steps: [
          '1. Register with the admin code provided to you',
          '2. Assign incoming questions to alumni',
          '3. Manage schools, users, and FAQs',
          '4. Get notified via LINE when new questions arrive',
          '5. Monitor all questions and responses in the system',
        ]
      }
    },
    ja: {
      student: {
        title: '生徒・保護者の方へ',
        steps: [
          '1. 学校コードを使って登録してください（学校の管理者から入手）',
          '2. 大学受験について卒業生に質問できます',
          '3. 特定の卒業生または誰でも質問できます',
          '4. 回答が届いたらLINEで通知が来ます',
          '5. 回答済みの質問やFAQも参考にしてください',
        ]
      },
      alumni: {
        title: '卒業生の方へ',
        steps: [
          '1. 学校コードを使って登録してください',
          '2. 受信箱で割り当てられた質問を確認してください',
          '3. 在校生や保護者からの質問に回答してください',
          '4. 新しい質問が届いたらLINEで通知が来ます',
          '5. 全卒業生向けの公開質問にも回答できます',
        ]
      },
      admin: {
        title: '管理者の方へ',
        steps: [
          '1. 管理者コードを使って登録してください',
          '2. 届いた質問を卒業生に割り当ててください',
          '3. 学校・ユーザー・FAQを管理してください',
          '4. 新しい質問が届いたらLINEで通知が来ます',
          '5. すべての質問と回答を管理パネルで確認できます',
        ]
      }
    }
  }
  const [open, setOpen] = useState(false)
  const g = guides[lang]?.[role] || guides.en[role]
  return (
    <div style={{marginTop:12}}>
      <button style={{fontSize:12,color:'#534AB7',background:'none',border:'none',cursor:'pointer',padding:0,textDecoration:'underline'}} onClick={()=>setOpen(o=>!o)}>
        {open ? (lang==='ja'?'▲ 閉じる':'▲ Hide guide') : (lang==='ja'?'▼ 使い方を見る':'▼ How to use UniAsk')}
      </button>
      {open && (
        <div style={{marginTop:10,background:'#f5f4ed',borderRadius:8,padding:'12px 14px'}}>
          <p style={{fontWeight:500,fontSize:13,marginBottom:8}}>{g.title}</p>
          {g.steps.map((step,i) => (
            <p key={i} style={{fontSize:12,color:'#444',lineHeight:1.7,marginBottom:4}}>{step}</p>
          ))}
        </div>
      )}
    </div>
  )
}

function SettingsGuide({ role, lang }) {
  const guides = {
    en: {
      student: [
        '📝 Ask a question: Go to "Ask a question" tab, type your question and submit. You can ask anyone or a specific alumni.',
        '📬 My questions: View all your questions. Unanswered questions can be edited or deleted. You can send a reminder if no response after a while.',
        '✅ Answered: Once answered, view responses in the "Answered" tab. Click the alumni name to see their profile.',
        '📖 FAQ: Browse frequently asked questions answered by alumni and admins.',
        '🌐 Translate: Click the "Translate" button on any question or answer to switch between English and Japanese.',
        '🔔 Notifications: Connect your LINE in Settings to get notified when your question is answered.',
        '👤 Profile: Add a bio in Settings so alumni can learn about you when you share your profile.',
      ],
      alumni: [
        '📬 Inbox: Check questions assigned to you. Click a question to view it and submit your answer.',
        '🌐 Open Questions: Questions open to all alumni. You can add your response to help more students.',
        '📝 Past answers: View and edit your previous answers.',
        '🔔 Notifications: Connect your LINE to get notified when a question is assigned to you.',
        '👤 Profile: Add a bio so students can learn about your background when you share your profile with an answer.',
        '❌ Cannot answer: If a question is outside your expertise, click "Cannot answer" to return it to admin for reassignment.',
      ],
      admin: [
        '📬 Inbox: View all incoming questions. Assign them to alumni or answer directly.',
        '👥 Users: View, edit, and manage all registered users. Approve pending users without a school code.',
        '🏫 Schools: Manage school codes. Approve or reject school requests from users.',
        '📖 FAQ: Create and manage FAQ entries. Promote answered questions to FAQ.',
        '🔔 Notifications: Connect your LINE to get notified of new questions and rejections.',
        '🌐 All questions: Search and view all questions in the system.',
        '⚠️ Rejected questions: If an alumni rejects a question, reassign it to another alumni from the Inbox.',
      ]
    },
    ja: {
      student: [
        '📝 質問する：「質問する」タブから質問を入力して送信。特定の卒業生または誰でも指定できます。',
        '📬 自分の質問：すべての質問を確認。未回答の質問は編集・削除可能。しばらく回答がない場合はリマインダーを送れます。',
        '✅ 回答済み：回答が届いたら「回答済み」タブで確認。卒業生の名前をクリックするとプロフィールが見られます。',
        '📖 よくある質問：卒業生や管理者が回答したFAQを閲覧できます。',
        '🌐 翻訳：質問や回答の「翻訳」ボタンで英語・日本語を切り替えられます。',
        '🔔 通知：設定からLINEを連携すると、回答が届いたときに通知が来ます。',
        '👤 プロフィール：設定で自己紹介を追加すると、卒業生があなたの背景を知ることができます。',
      ],
      alumni: [
        '📬 受信箱：割り当てられた質問を確認。質問をクリックして回答を入力・送信できます。',
        '🌐 全員への質問：全卒業生向けの公開質問。複数の卒業生が回答できます。',
        '📝 過去の回答：以前の回答を確認・編集できます。',
        '🔔 通知：LINEを連携すると、質問が割り当てられたときに通知が来ます。',
        '👤 プロフィール：自己紹介を追加すると、回答時に生徒があなたの経歴を確認できます。',
        '❌ 回答不可：専門外の質問は「回答不可」をクリックして管理者に返却できます。',
      ],
      admin: [
        '📬 受信箱：届いた質問を確認。卒業生に割り当てるか、直接回答できます。',
        '👥 ユーザー：全登録ユーザーの確認・編集・管理。学校コードなしで登録した保留中のユーザーを承認できます。',
        '🏫 学校：学校コードの管理。ユーザーからの学校追加リクエストを承認・拒否できます。',
        '📖 よくある質問：FAQの作成・管理。回答済み質問をFAQに昇格できます。',
        '🔔 通知：LINEを連携すると、新しい質問や拒否の通知が来ます。',
        '🌐 全質問：システム内のすべての質問を検索・閲覧できます。',
        '⚠️ 拒否された質問：卒業生が拒否した質問は受信箱から別の卒業生に再割り当てできます。',
      ]
    }
  }
  const [open, setOpen] = useState(false)
  const g = guides[lang]?.[role] || guides.en[role]
  return (
    <div style={s.card}>
      <button style={{width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',background:'none',border:'none',cursor:'pointer',padding:0}} onClick={()=>setOpen(o=>!o)}>
        <p style={{fontWeight:500,fontSize:13}}>{lang==='ja'?'📘 使い方ガイド':'📘 How to use UniAsk'}</p>
        <span style={{color:'#534AB7'}}>{open?'▲':'▼'}</span>
      </button>
      {open && (
        <div style={{marginTop:12}}>
          {g.map((item,i) => (
            <p key={i} style={{fontSize:12,color:'#444',lineHeight:1.8,marginBottom:6,paddingBottom:6,borderBottom:i<g.length-1?'0.5px solid rgba(0,0,0,0.06)':'none'}}>{item}</p>
          ))}
        </div>
      )}
    </div>
  )
}

function QRPopup({ lang }) {
  const [open, setOpen] = useState(false)
  const qr = 'data:image/png;base64,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'
  return (
    <div style={{marginBottom:8}}>
      <button style={{...s.btn, fontSize:12, padding:"4px 12px", color:"#534AB7", borderColor:"#534AB7"}} onClick={()=>setOpen(true)}>
        📷 {lang==="ja"?"QRコードを表示してLINEを追加":"Show QR code to add LINE bot"}
      </button>
      {open && (
        <>
          <div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:999}}/>
          <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"#fff",borderRadius:16,padding:"1.5rem",zIndex:1000,textAlign:"center",maxWidth:320,width:"90vw"}}>
            <p style={{fontWeight:500,marginBottom:12}}>{lang==="ja"?"UniAsk LINEボットを追加":"Add UniAsk LINE Bot"}</p>
            <img src={qr} alt="LINE QR Code" style={{width:220,height:220,marginBottom:12}}/>
            <p style={{fontSize:12,color:"#666",marginBottom:16}}>{lang==="ja"?"QRコードをスキャンしてLINEボットを友達追加してください":"Scan this QR code to add the UniAsk LINE bot as a friend"}</p>
            <button style={{...s.btn,...s.pri,width:"100%"}} onClick={()=>setOpen(false)}>{lang==="ja"?"閉じる":"Close"}</button>
          </div>
        </>
      )}
    </div>
  )
}

function BioPop({ code, name, role, bio, lang }) {
  const [open, setOpen] = useState(false)
  if (!bio) return <span style={{fontSize:11,color:'#999'}}>{code}</span>
  return (
    <span style={{position:'relative',display:'inline-block'}}>
      <button onClick={()=>setOpen(o=>!o)} style={{fontSize:11,color:'#534AB7',background:'none',border:'none',cursor:'pointer',padding:0,textDecoration:'underline'}}>{code}</button>
      {open && (
        <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:'#fff',border:'0.5px solid rgba(0,0,0,0.2)',borderRadius:12,padding:'1rem 1.25rem',zIndex:1000,maxWidth:340,width:'90vw',boxShadow:'0 8px 32px rgba(0,0,0,0.12)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div>
              <p style={{fontWeight:500,fontSize:14}}>{name}</p>
              <span style={{...s.chip,background:role==='alumni'?'#EAF3DE':'#E6F1FB',color:role==='alumni'?'#085041':'#0C447C'}}>{role}</span>
            </div>
            <button onClick={()=>setOpen(false)} style={{fontSize:18,background:'none',border:'none',cursor:'pointer',color:'#666'}}>✕</button>
          </div>
          <p style={{fontSize:13,lineHeight:1.7,color:'#444',whiteSpace:'pre-wrap'}}>{bio}</p>
        </div>
      )}
      {open && <div onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,zIndex:999}}/>}
    </span>
  )
}

function TranslateBtn({ text, lang }) {
  const [translated, setTranslated] = useState(null)
  const [busy, setBusy] = useState(false)
  const [showing, setShowing] = useState(false)
  const translate = async () => {
    if (showing) { setShowing(false); return }
    if (translated) { setShowing(true); return }
    setBusy(true)
    const from = lang==='ja'?'ja':'en'
    const to = lang==='ja'?'en':'ja'
    try {
      const url = 'https://lingva.ml/api/v1/'+from+'/'+to+'/'+encodeURIComponent(text)
      const res = await fetch(url)
      const data = await res.json()
      const result = data.translation
      setTranslated(result || (lang==='ja' ? '翻訳できませんでした' : 'Could not translate'))
      setShowing(true)
    } catch {
      try {
        const url2 = 'https://api.mymemory.translated.net/get?q='+encodeURIComponent(text)+'&langpair='+from+'|'+to
        const res2 = await fetch(url2)
        const data2 = await res2.json()
        setTranslated(data2.responseData?.translatedText || (lang==='ja' ? '翻訳エラー' : 'Translation error'))
        setShowing(true)
      } catch { setTranslated(lang==='ja' ? '翻訳エラー' : 'Translation error') }
    }
    setBusy(false)
  }
  return (
    <div style={{marginTop:4}}>
      <button style={{fontSize:11,color:'#534AB7',background:'none',border:'none',cursor:'pointer',padding:0,textDecoration:'underline'}} onClick={translate}>
        {busy ? (lang==='ja'?'翻訳中…':'Translating…') : showing ? (lang==='ja'?'原文を表示':'Show original') : (lang==='ja'?'🌐 翻訳':'🌐 Translate')}
      </button>
      {showing && translated && <p style={{fontSize:13,lineHeight:1.7,marginTop:4,color:'#444',background:'#f5f4ed',padding:'8px 12px',borderRadius:6,borderLeft:'3px solid #534AB7'}}>{translated}</p>}
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState('en')

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
  if (!session || !profile) return <LangContext.Provider value={lang}><AuthPage setLang={setLang} /></LangContext.Provider>

  return (
    <LangContext.Provider value={lang}>
    <div>
      <div style={s.topbar}>
        <span style={s.logo}>UniAsk</span>
        <div style={s.row}>
          <span style={{fontSize:12,color:'#666',marginRight:8}}>{profile.name}</span>
          <span style={{...s.chip, background:'#EEEDFE', color:'#3C3489', marginRight:8}}>{profile.role}</span>
          <button style={{...s.btn,marginRight:8,fontSize:12}} onClick={async()=>{const nl=lang==='en'?'ja':'en';setLang(nl);if(profile)await supabase.from('profiles').update({lang:nl}).eq('id',profile.id)}}>{lang==='en'?'🇯🇵 JP':'🇬🇧 EN'}</button>
          <button style={s.btn} onClick={logout}>{t(lang,'logout')}</button>
        </div>
      </div>
      {profile.role === 'student' && <StudentApp profile={profile} updateProfile={updateProfile} />}
      {profile.role === 'alumni'  && <AlumniApp  profile={profile} updateProfile={updateProfile} />}
      {profile.role === 'admin'   && <AdminApp   profile={profile} updateProfile={updateProfile} />}
    </div>
    </LangContext.Provider>
  )
}

function AuthPage({ setLang }) {
  const lang = useLang()
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
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><div style={s.logo}>UniAsk</div><button style={{...s.btn,fontSize:12}} onClick={()=>setLang&&setLang(l=>l==='en'?'ja':'en')}>{lang==='en'?'🇯🇵 JP':'🇬🇧 EN'}</button></div>
          <p style={{color:'#666',fontSize:13}}>{lang==='ja'?'大学受験Q&Aプラットフォーム':'University Application Q&A'}</p>
        </div>
        <div style={s.card}>
          <div style={{...s.row,marginBottom:14,gap:6}}>
            {['login','register'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{...s.btn, flex:1, background: mode===m ? '#534AB7':'transparent', color: mode===m ? '#fff':'#1a1a1a', borderColor: mode===m ? '#534AB7':'rgba(0,0,0,0.28)'}}>{m === 'login' ? (lang==='ja'?'ログイン':'Log in') : (lang==='ja'?'登録':'Register')}</button>
            ))}
          </div>
          <div style={{...s.row,gap:4,marginBottom:14}}>
            {['student','alumni','admin'].map(r => (
              <button key={r} onClick={() => { setRole(r); setNoCode(false) }} style={{...s.btn, flex:1, fontSize:12, background: role===r ? '#EEEDFE':'transparent', color: role===r ? '#3C3489':'#666', borderColor: role===r ? '#AFA9EC':'rgba(0,0,0,0.2)'}}>{r==='student'?(lang==='ja'?'生徒/保護者':'student/parent'):r==='alumni'?(lang==='ja'?'卒業生':'alumni'):(lang==='ja'?'管理者':'admin')}</button>
            ))}
          </div>
          <div style={s.stack}>
            {mode==='register' && <Inp label={lang==='ja'?'フルネーム':'Full name'} value={name} onChange={setName} />}
            <Inp label={lang==='ja'?'メールアドレス':'Email'} value={email} onChange={setEmail} placeholder="your@email.com" />
            <Inp label={lang==='ja'?'パスワード':'Password'} type="password" value={pw} onChange={setPw} placeholder="••••••••" onKeyDown={e => e.key==='Enter' && go()} />
            {mode==='register' && role==='admin' && <Inp label='Admin code' value={code} onChange={setCode} placeholder='' />}
            <LoginGuide role={role} lang={lang} />
          {msg && <p style={{fontSize:12, color: ok ? '#27500A' : '#A32D2D'}}>{msg}</p>}
            <button style={{...s.btn, background:'#534AB7', color:'#fff', borderColor:'#534AB7', padding:'9px', width:'100%'}} onClick={go} disabled={busy}>{busy ? (lang==='ja'?'読み込み中…':'Loading…') : (mode==='login' ? (lang==='ja'?'ログイン':'Log in') : (lang==='ja'?'登録':'Register'))}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StudentApp({ profile, updateProfile }) {
  const lang = useLang()
  const [tab, setTab] = useState('ask')
  return (
    <div style={s.page}>
      <TabBar tabs={[['ask',t(lang,'ask')],['myq',t(lang,'myq')],['faq',t(lang,'faq')],['settings',t(lang,'settings')]]} active={tab} onChange={setTab} />
      {tab==='ask'      && <AskForm profile={profile} onDone={() => setTab('myq')} />}
      {tab==='myq'      && <MyQuestions profile={profile} />}
      {tab==='faq'      && <FaqView />}
      {tab==='settings' && <ProfileSettings profile={profile} updateProfile={updateProfile} />}
    </div>
  )
}

function AskForm({ profile, onDone }) {
  const lang = useLang()
  const [question, setQuestion] = useState('')
  const [shareBio, setShareBio] = useState(true)
  const [target, setTarget] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!question.trim()) return
    setBusy(true)
    const tName = target.trim() || 'Anyone'
    const {data:newQ} = await supabase.from('questions').insert({ student_id: profile.id, student_code: profile.student_code, student_name: profile.name, student_bio: shareBio ? profile.bio : null, question: question.trim(), target_name: tName, status: 'open' }).select().single()
    if(newQ) notify('new_question', newQ.id)
    setBusy(false); setDone(true)
  }

  if (done) return (
    <div style={{...s.card, textAlign:'center', padding:'2rem'}}>
      <div style={{width:48,height:48,background:'#EAF3DE',borderRadius:'50%',margin:'0 auto 12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,color:'#27500A'}}>✓</div>
      <p style={{fontWeight:500,marginBottom:8}}>{t(lang,'questionSubmitted')}</p>
      <p style={{color:'#666',fontSize:13,marginBottom:16}}>{t(lang,'notified')}</p>
      <button style={{...s.btn,...s.pri}} onClick={() => { setDone(false); setQuestion(''); setTarget(''); onDone() }}>{t(lang,'viewMyQ')}</button>
    </div>
  )

  return (
    <div style={s.card}>
      <p style={{fontWeight:500,marginBottom:14}}>{t(lang,'ask')}</p>
      <div style={s.stack}>
        <div>
          <label style={s.lbl}>{t(lang,'whoAsking')}</label>
          <input value={target} onChange={e=>setTarget(e.target.value)} placeholder={t(lang,'whoAsking')} style={s.input}/>
        </div>
        <div>
          <label style={s.lbl}>{t(lang,'ask')}</label>
          <textarea value={question} onChange={e=>setQuestion(e.target.value)} rows={5} placeholder={t(lang,'typeQuestion')} style={s.input} />
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <label style={{fontSize:12,color:'#666',display:'flex',alignItems:'center',gap:6,cursor:'pointer'}}><input type='checkbox' checked={shareBio} onChange={e=>setShareBio(e.target.checked)}/>{lang==='ja'?'プロフィールを共有':'Share my profile'}</label>
          <button style={{...s.btn,...s.pri}} onClick={submit} disabled={!question.trim()||busy}>{busy?t(lang,'sending'):t(lang,'submit')}</button>
        </div>
      </div>
    </div>
  )
}


function EditableQuestion({ q, onSave, lang }) {
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
        <button style={s.btn} onClick={()=>setEditing(false)}>{lang==='ja'?'キャンセル':'Cancel'}</button>
        <button style={{...s.btn,...s.pri}} onClick={save}>{lang==='ja'?'保存':'Save'}</button>
      </div>
    </div>
  )
  return <button style={{...s.btn,fontSize:12,padding:'4px 10px',marginBottom:8}} onClick={()=>setEditing(true)}>{lang==='ja'?'質問を編集':'Edit question'}</button>
}

function MyQuestions({ profile }) {
  const lang = useLang()
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
    notify('reminded', q.id)
    load()
  }

  const waiting  = qs.filter(q => q.status !== 'answered')
  const answered = [...qs.filter(q => q.status === 'answered')].sort((a,b) => new Date(b.answered_at||b.created_at) - new Date(a.answered_at||a.created_at))

  if (loading) return <div style={s.empty}>Loading…</div>

  return (
    <div>
      <div style={{display:'flex',gap:6,marginBottom:14}}>
        {[['waiting',t(lang,'unanswered'),waiting.length],['answered',t(lang,'answered'),answered.length]].map(([k,label,cnt]) => (
          <button key={k} style={{...s.btn, background:tab===k?'#534AB7':'transparent', color:tab===k?'#fff':'#1a1a1a', borderColor:tab===k?'#534AB7':'rgba(0,0,0,0.28)', borderRadius:20, padding:'5px 14px'}} onClick={() => setTab(k)}>{label}{cnt>0 && <span style={{background:'rgba(255,255,255,0.3)',borderRadius:10,padding:'0 6px',fontSize:11,marginLeft:4}}>{cnt}</span>}</button>
        ))}
      </div>
      {tab==='waiting' && (waiting.length===0 ? <div style={s.empty}>{t(lang,'noQYet')}</div> : waiting.map(q => (
        <div key={q.id} style={s.qcard}>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginBottom:6}}>
            <span style={{...s.chip,background:q.status==='assigned'?'#FAEEDA':'#E6F1FB',color:q.status==='assigned'?'#633806':'#0C447C'}}>{q.status==='assigned'?t(lang,'inProgress'):t(lang,'waiting')}</span>
            {q.open_to_alumni && <span style={{...s.chip,background:'#EEEDFE',color:'#3C3489'}}>{t(lang,'openToAlumni')}</span>}
            <span style={{fontSize:12,color:'#999'}}>{lang==='ja'?'宛先: ':'To: '}{q.target_name}</span>
            <span style={{fontSize:12,color:'#999',marginLeft:'auto'}}>{fmt(q.created_at)}</span>
          </div>
          <p style={{fontSize:14,lineHeight:1.65,marginBottom:10}}>{q.question}</p>
          <TranslateBtn text={q.question} lang={lang} />
          <EditableQuestion q={q} onSave={load} lang={lang} />
          <button style={{...s.btn,background:'#A32D2D',color:'#fff',borderColor:'#A32D2D',padding:'4px 10px',fontSize:12,marginRight:6}} onClick={async()=>{if(window.confirm(lang==='ja'?'この質問を削除しますか？':'Delete this question?')){await supabase.from('questions').delete().eq('id',q.id);load()}}}>{'🗑'}</button>
          <button style={{...s.btn,background:'#854F0B',color:'#fff',borderColor:'#854F0B',padding:'4px 10px',fontSize:12}} onClick={() => remind(q)}>{t(lang,'sendReminder')}</button>
        </div>
      )))}
      {tab==='answered' && (answered.length===0 ? <div style={s.empty}>{t(lang,'noAnswered')}</div> : answered.map(q => (
        <div key={q.id} style={s.qcard}>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginBottom:6}}>
            <span style={{...s.chip,background:'#EAF3DE',color:'#085041'}}>Answered</span>
            <span style={{fontSize:12,color:'#999'}}>Asked: {fmt(q.created_at)}</span>
            {q.edited_at && <span style={{fontSize:12,color:'#999'}}>Edited: {fmt(q.edited_at)}</span>}
            <span style={{fontSize:12,color:'#999',marginLeft:'auto'}}>Answered: {fmt(q.answered_at)}</span>
          </div>
          <p style={{fontSize:14,lineHeight:1.65,marginBottom:8}}>{q.question}</p>
          <div style={{background:'#f5f4ed',borderLeft:'3px solid #534AB7',padding:'10px 14px',borderRadius:'0 8px 8px 0'}}>
            <p style={{fontSize:12,color:'#534AB7',fontWeight:500,marginBottom:3}}><BioPop code={q.answered_by_name} name={q.answered_by_name} role='alumni' bio={q.answered_by_bio} lang={lang}/> · {fmt(q.answered_at)}</p>
            <p style={{fontSize:13,lineHeight:1.7}}>{q.answer}</p>
            <TranslateBtn text={q.answer} lang={lang} />
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
  const lang = useLang()
  const [tab, setTab] = useState('inbox')
  const [cnt, setCnt] = useState(0)
  const [openCnt, setOpenCnt] = useState(0)
  return (
    <div style={s.page}>
      <TabBar tabs={[['inbox',t(lang,'inbox')+(cnt>0?' ('+cnt+')':'')],['open',t(lang,'openQ')+(openCnt>0?' ('+openCnt+')':'')],['past',t(lang,'past')],['faq',t(lang,'faq')],['settings',t(lang,'settings')]]} active={tab} onChange={setTab} />
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
  const lang = useLang()
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
      <button style={{...s.btn,marginBottom:14}} onClick={() => { setSel(null); setAns('') }}>{t(lang,'back')}</button>
      <div style={{...s.card,marginBottom:12}}>
        <div style={{display:'flex',gap:6,marginBottom:8}}>
          <span style={{...s.chip,background:'#EEEDFE',color:'#3C3489'}}>{t(lang,'openToAlumni')}</span>
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
        <label style={s.lbl}>{t(lang,'addResponse')}</label>
        <textarea value={ans} onChange={e=>setAns(e.target.value)} rows={5} placeholder="Type your response…" style={{...s.input,marginTop:6}} />
        <div style={{display:'flex',justifyContent:'flex-end',marginTop:10}}>
          <button style={{...s.btn,...s.pri}} onClick={send} disabled={!ans.trim()||busy}>{busy?'Sending…':'Send response'}</button>
        </div>
      </div>
    </div>
  )

  return qs.length===0 ? <div style={s.empty}>{t(lang,'noOpenQ')}</div> : (
    <div>
      <p style={{fontSize:13,color:'#666',marginBottom:14}}>{t(lang,'openForAlumni')}</p>
      {qs.map(q => (
        <div key={q.id} style={{...s.qcard,cursor:'pointer'}} onClick={() => { setSel(q); setAns('') }}>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginBottom:6}}>
            <span style={{...s.chip,background:'#EEEDFE',color:'#3C3489'}}>{t(lang,'openToAlumni')}</span>
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
  const lang = useLang()
  const [qs, setQs] = useState([])
  const [sel, setSel] = useState(null)
  const [ans, setAns] = useState('')
  const [busy, setBusy] = useState(false)
  const [shareAns, setShareAns] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase.from('questions').select('*').contains('assigned_to',[profile.id]).neq('status','answered').order('created_at',{ascending:true})
    const d = data||[]; setQs(d); onCount(d.length)
  }, [profile.id, onCount])

  useEffect(() => { load() }, [load])

  const send = async () => {
    setBusy(true)
    await supabase.from('questions').update({ status:'answered', answer:ans.trim(), answered_by:profile.id, answered_by_name:'Alumni '+profile.student_code, answered_by_bio: shareAns ? profile.bio : null, answered_at:new Date().toISOString() }).eq('id',sel.id)
    notify('answered', sel.id)
    setSel(null); setAns(''); setBusy(false); load()
  }

  const reject = async (q) => {
    const rejected = [...(q.rejected_by||[]), profile.id]
    const still = (q.assigned_to||[]).filter(x=>x!==profile.id)
    await supabase.from('questions').update({ rejected_by:rejected, assigned_to:still, status:still.length?'assigned':'open' }).eq('id',q.id)
    notify('rejected', q.id)
    setSel(null); load()
  }

  if (sel) return (
    <div>
      <button style={{...s.btn,marginBottom:14}} onClick={() => { setSel(null); setAns('') }}>← Back</button>
      <div style={{...s.card,marginBottom:12}}>
        <div style={{display:'flex',gap:6,marginBottom:8}}>
          <span style={{...s.chip,background:'#E6F1FB',color:'#0C447C'}}><BioPop code={'Student '+sel.student_code} name={sel.student_name||sel.student_code} role='student' bio={sel.student_bio} lang={lang}/></span>
          <span style={{fontSize:12,color:'#999',marginLeft:'auto'}}>{fmt(sel.created_at)}</span>
        </div>
        <p style={{fontSize:14,lineHeight:1.65,marginBottom:10}}>{sel.question}</p>
        <TranslateBtn text={sel.question} lang={lang} />
        <button style={{...s.btn,background:'#A32D2D',color:'#fff',borderColor:'#A32D2D',fontSize:12,padding:'4px 10px'}} onClick={() => reject(sel)}>{t(lang,'cannotAnswer')}</button>
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

  return qs.length===0 ? <div style={s.empty}>{t(lang,'noAssigned')}</div> : (
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
  const lang = useLang()
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
  return qs.length===0 ? <div style={s.empty}>{t(lang,'noPastAnswers')}</div> : (
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
                <button style={{...s.btn,...s.pri}} onClick={()=>saveEdit(q)}>{t(lang,'save')}</button>
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
  const lang = useLang()
  const [tab, setTab] = useState('assign')
  const [cnt, setCnt] = useState(0)
  return (
    <div style={s.page}>
      <TabBar tabs={[['assign',t(lang,'inbox')+(cnt>0?' ('+cnt+')':'')],['allq',t(lang,'allQ')],['faq',t(lang,'faq')],['schools',t(lang,'schools')],['users',t(lang,'users')],['settings',t(lang,'settings')]]} active={tab} onChange={setTab} />
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
  const lang = useLang()
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
    if(!error) notify('assigned', sel.id)
    setSel(null);setPicked([]);setSearch('');setBusy(false);load()
  }

  const doAdminAns = async () => {
    setBusy(true)
    await supabase.from('questions').update({status:'answered',answer:adminAns.trim(),answered_by:'admin',answered_by_name:'Admin',answered_at:new Date().toISOString()}).eq('id',sel.id)
    notify('answered', sel.id)
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
    const newVal = !q.open_to_alumni
    await supabase.from('questions').update({ open_to_alumni: newVal }).eq('id', q.id)
    if(newVal) notify('open_to_alumni', q.id)
    setBusy(false); load()
    // Update sel if we're viewing this question
    if (sel && sel.id === q.id) setSel(s => ({...s, open_to_alumni: !s.open_to_alumni}))
  }

  const filteredAlumni = alumni.filter(a=>(a.name+' '+a.student_code).toLowerCase().includes(search.toLowerCase()))
  const tabs = [['open','Unassigned',displayOpen.length],['assigned','In progress',assigned.length],['answered',t(lang,'answered'),answered.length]]
  const display = sub==='open'?displayOpen:sub==='assigned'?[...assigned].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)):[...answered].sort((a,b)=>new Date(b.answered_at)-new Date(a.answered_at))

  if (sel) {
    const fq = qs.find(q=>q.id===sel.id)||sel
    return (
      <div>
        <div style={{display:'flex',gap:8,marginBottom:14}}>
          <button style={{...s.btn}} onClick={()=>{setSel(null);setPicked([]);setAdminAns('')}}>← Back</button>
          <button style={{...s.btn,background:'#A32D2D',color:'#fff',borderColor:'#A32D2D',fontSize:12}} onClick={async()=>{if(window.confirm('Delete this question?')){await supabase.from('questions').delete().eq('id',sel.id);setSel(null);load()}}}>🗑 Delete question</button>
        </div>
        <div style={{...s.card,marginBottom:12}}>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginBottom:8}}>
            <span style={{...s.chip,background:fq.status==='answered'?'#EAF3DE':fq.status==='assigned'?'#FAEEDA':'#E6F1FB',color:fq.status==='answered'?'#085041':fq.status==='assigned'?'#633806':'#0C447C'}}>{fq.status}</span>
            {fq.rejected_by?.length>0 && <span style={{...s.chip,background:'#FCEBEB',color:'#791F1F'}}>Rejected — needs reassign</span>}
            {fq.open_to_alumni && <span style={{...s.chip,background:'#EEEDFE',color:'#3C3489'}}>{t(lang,'openToAlumni')}</span>}
            <span style={{fontSize:12,color:'#999'}}>from: {fq.student_name||fq.student_code}</span>
            <span style={{fontSize:12,color:'#999',marginLeft:'auto'}}>{fmt(fq.created_at)}</span>
          </div>
          <p style={{fontSize:14,lineHeight:1.65,marginBottom:12}}>{fq.question}</p>
          {/* Open to alumni toggle */}
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:fq.open_to_alumni?'#EEEDFE':'#f9f9f9',borderRadius:8,border:'0.5px solid rgba(0,0,0,0.1)'}}>
            <div style={{flex:1}}>
              <p style={{fontSize:13,fontWeight:500,color:fq.open_to_alumni?'#3C3489':'#1a1a1a'}}>{t(lang,'openToAlumni')}</p>
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
                <button style={{...s.btn,...s.pri,fontSize:12,padding:'5px 12px'}} onClick={doAdminAns} disabled={!adminAns.trim()||busy}>{t(lang,'sendAnswer')}</button>
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
  const lang = useLang()
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
  const lang = useLang()
  const [faqs, setFaqs] = useState([])
  const [search, setSearch] = useState('')
  useEffect(() => { supabase.from('questions').select('*').eq('is_faq',true).order('created_at',{ascending:false}).then(({data})=>setFaqs(data||[])) }, [])
  const filtered = search ? faqs.filter(q=>(q.question+' '+(q.answer||'')+' '+(q.faq_category||'')).toLowerCase().includes(search.toLowerCase())) : faqs
  return (
    <div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={lang==='ja'?'よくある質問を検索…':'Search FAQs…'} style={{...s.input,marginBottom:14}}/>
      {filtered.length===0?<div style={s.empty}>No FAQs yet</div>:filtered.map(q=>(
        <div key={q.id} style={s.qcard}>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginBottom:6}}>
            <span style={{...s.chip,background:'#EEEDFE',color:'#3C3489'}}>FAQ</span>
            {q.faq_category&&<span style={{fontSize:12,color:'#999'}}>{q.faq_category}</span>}
            <span style={{fontSize:12,color:'#999',marginLeft:'auto'}}>Posted: {fmt(q.created_at)}{q.edited_at&&` · Edited: ${fmt(q.edited_at)}`}</span>
          </div>
          <p style={{fontSize:14,fontWeight:500,lineHeight:1.65,marginBottom:4}}>{q.question}</p>
          <TranslateBtn text={q.question} lang={lang} />
          <p style={{fontSize:13,color:'#666',lineHeight:1.7,marginTop:6}}>{q.answer}</p>
          <TranslateBtn text={q.answer} lang={lang} />
        </div>
      ))}
    </div>
  )
}

function AdminFaq() {
  const lang = useLang()
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
  const lang = useLang()
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
  const lang = useLang()
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
  const lang = useLang()
  const [name, setName] = useState(profile.name||'')
  const [bio, setBio] = useState(profile.bio||'')
  const [lineId, setLineId] = useState(profile.line_id||'')
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
      <SettingsGuide role={profile.role} lang={lang} />
      <div style={s.card}>
        <p style={{fontWeight:500,marginBottom:12}}>{lang==='ja'?'プロフィール編集':'Edit profile'}</p>
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
            <label style={s.lbl}>{lang==='ja'?'新しいパスワード':'New password'}</label>
            <div style={{display:'flex',gap:8}}>
              <input type="password" value={pw} onChange={e=>setPw(e.target.value)} {...(lang==='ja'?{placeholder:'空白のままにすると変更なし'}:{placeholder:'Leave blank to keep current'})} style={s.input}/>
              <button style={{...s.btn,...s.pri,fontSize:12,padding:'5px 12px',whiteSpace:'nowrap'}} onClick={()=>save('pw')} disabled={!pw}>{saved==='pw'?'Saved!':'Save'}</button>
            </div>
          </div>
          <div>
                      <div>
            <label style={s.lbl}>{lang==='ja'?'LINE通知':'LINE Notifications'}</label>
            <p style={{fontSize:11,color:'#999',marginBottom:4}}>{lang==='ja'?'UniAsk LINEボットを友達追加して、受け取ったコードを貼り付けてください':'Add the UniAsk LINE bot as a friend, then paste the code it sends you'}</p>
            <QRPopup lang={lang} />
            <div style={{display:'flex',gap:8}}>
              <input value={lineId} onChange={e=>setLineId(e.target.value)} placeholder="U1234..." style={s.input}/>
              <button style={{...s.btn,...s.pri,fontSize:12,padding:'5px 12px',whiteSpace:'nowrap'}} onClick={async()=>{await updateProfile({line_id:lineId, notif_channel: lineId ? 'line' : 'none'});setSaved('line');setTimeout(()=>setSaved(''),2000)}}>{saved==='line'?(lang==='ja'?'保存済み！':'Saved!'):(lang==='ja'?'保存':'Save')}</button>
            </div>
            {profile.line_id&&<p style={{fontSize:11,color:'#27500A',marginTop:4}}>✓ {lang==='ja'?'LINE連携済み':'LINE connected'}</p>}
          </div>
          <label style={s.lbl}>{lang==='ja'?'自己紹介':'Bio'}</label>
            <p style={{fontSize:11,color:'#999',marginBottom:4}}>{profile.role==='alumni'?(lang==='ja'?'例：出身高校・大学・専攻・活動など':'e.g. University, major, high school, activities, regions applied to…'):(lang==='ja'?'例：学年・学校・志望地域/大学・興味ある専攻・活動・奨学金など':'e.g. Grade, school, target regions/unis, interested majors, activities, interested scholarships…')}</p>
            <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
              <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={4} placeholder={lang==='ja'?'自己紹介を入力…':'Write your bio…'} style={{...s.input,resize:'vertical'}}/>
              <button style={{...s.btn,...s.pri,fontSize:12,padding:'5px 12px',whiteSpace:'nowrap'}} onClick={async()=>{await updateProfile({bio});setSaved('bio');setTimeout(()=>setSaved(''),2000)}}>{saved==='bio'?(lang==='ja'?'保存済み！':'Saved!'):(lang==='ja'?'保存':'Save')}</button>
            </div>
          </div>
          <p style={{fontSize:12,color:'#999'}}>{lang==='ja'?'コード: ':'Code: '}<code style={{background:'#f5f4ed',padding:'1px 5px',borderRadius:4}}>{profile.student_code}</code></p>
        </div>
      </div>
      <div style={{...s.card,borderColor:'#F09595'}}>
        <p style={{fontWeight:500,color:'#A32D2D',marginBottom:6}}>{lang==='ja'?'アカウント削除':'Delete account'}</p>
        <p style={{fontSize:12,color:'#666',marginBottom:10}}>{lang==='ja'?'DELETEと入力して確認。取り消せません。':'Type DELETE to confirm. Cannot be undone.'}</p>
        <div style={{display:'flex',gap:8}}>
          <input value={del} onChange={e=>setDel(e.target.value)} placeholder="DELETE" style={{...s.input,maxWidth:140}}/>
          <button style={{...s.btn,background:'#A32D2D',color:'#fff',borderColor:'#A32D2D',fontSize:12,padding:'5px 12px'}} onClick={deleteAcc} disabled={del!=='DELETE'}>{t(lang,'delete')||'Delete'}</button>
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
// Tue Apr 28 20:48:39 JST 2026
// redeploy Thu Apr 30 11:24:21 JST 2026
// cache bust Fri May  1 16:38:53 JST 2026
