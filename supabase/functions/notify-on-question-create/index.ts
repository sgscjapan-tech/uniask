// Supabase Edge Function: notify-on-question-create
// Fires when a new question is inserted
// Notifies admin that a new question has arrived

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const APP_URL = Deno.env.get('APP_URL') || 'https://uniask.vercel.app'
const FROM_EMAIL = 'UniAsk <notifications@uniask.jp>'

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    const question = payload.record

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    )

    // Get admin profiles who want email notifications
    const { data: admins } = await supabase
      .from('profiles')
      .select('email, name, notif_email')
      .eq('role', 'admin')
      .eq('notif_email', true)

    if (!admins || admins.length === 0) {
      return new Response(JSON.stringify({ message: 'No admins to notify' }), { status: 200 })
    }

    // Send email to each admin
    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: 'New question submitted — UniAsk',
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
            <h2 style="color:#534AB7;margin-bottom:8px">New question submitted</h2>
            <p style="color:#666;margin-bottom:20px">A student has submitted a new question on UniAsk.</p>
            
            <div style="background:#f5f4ed;border-radius:10px;padding:16px;margin-bottom:20px">
              <p style="font-size:13px;color:#666;margin-bottom:4px">Student code</p>
              <p style="font-weight:500;margin-bottom:12px">${question.student_code}</p>
              <p style="font-size:13px;color:#666;margin-bottom:4px">Question</p>
              <p style="line-height:1.6">${question.question}</p>
              <p style="font-size:13px;color:#666;margin-top:12px;margin-bottom:4px">Directed to</p>
              <p>${question.target_name}</p>
            </div>
            
            <a href="${APP_URL}" style="display:inline-block;background:#534AB7;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px">
              Go to UniAsk admin →
            </a>
            
            <p style="color:#999;font-size:12px;margin-top:24px">
              You're receiving this because you have email notifications enabled in UniAsk.
            </p>
          </div>
        `
      })
    }

    return new Response(JSON.stringify({ message: 'Notified admins' }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})

async function sendEmail({ to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Resend error: ${text}`)
  }
  return res.json()
}
