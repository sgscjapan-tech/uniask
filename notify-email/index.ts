// ═══════════════════════════════════════════════════════════════════════════
// UniAsk — Email Notification Edge Function
// Deploy via: supabase functions deploy notify-email
//
// FREE email service used: Resend.com (3,000 emails/month free)
// Sign up at resend.com → get API key → add to Supabase secrets (see README)
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FROM_EMAIL     = 'UniAsk <noreply@yourdomain.com>'  // ← change to your domain

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function sendEmail(to: string, subject: string, html: string) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html })
  })
}

serve(async (req) => {
  const body = await req.json()
  const { old_status, new_status, question_id, student_id, assigned_to, rejected_by, remind_at_changed, answer_changed } = body

  // Fetch question details
  const { data: q } = await supabase.from('questions').select('*').eq('id', question_id).single()
  if (!q) return new Response('ok')

  // Fetch student profile
  const { data: student } = await supabase.from('profiles').select('email, name, notif_email').eq('id', student_id).single()

  // ── Event 1: Question answered → notify student ──────────────────────────
  if (old_status !== 'answered' && new_status === 'answered' && student?.notif_email) {
    await sendEmail(student.email, 'Your question has been answered — UniAsk', `
      <h2 style="color:#534AB7">Your question was answered!</h2>
      <p style="color:#666">Hi ${student.name},</p>
      <p>Your question has received a response:</p>
      <blockquote style="border-left:3px solid #534AB7;padding:8px 16px;background:#f5f4ed;margin:12px 0">
        <p><strong>Q:</strong> ${q.question}</p>
        <p><strong>A:</strong> ${q.answer}</p>
        <p style="font-size:12px;color:#999">Answered by ${q.answered_by_name}</p>
      </blockquote>
      <a href="${Deno.env.get('SITE_URL')}" style="background:#534AB7;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:12px">
        View on UniAsk
      </a>
    `)
  }

  // ── Event 2: Question assigned → notify alumni ───────────────────────────
  if (old_status === 'open' && new_status === 'assigned' && assigned_to?.length > 0) {
    for (const alumniId of assigned_to) {
      const { data: alumni } = await supabase.from('profiles').select('email, name, notif_email, student_code').eq('id', alumniId).single()
      if (alumni?.notif_email) {
        await sendEmail(alumni.email, 'New question assigned to you — UniAsk', `
          <h2 style="color:#534AB7">You have a new question</h2>
          <p>Hi ${alumni.name}, a student question has been assigned to you:</p>
          <blockquote style="border-left:3px solid #1D9E75;padding:8px 16px;background:#f0faf5;margin:12px 0">
            <p><strong>Student ${q.student_code}:</strong></p>
            <p>${q.question}</p>
          </blockquote>
          <a href="${Deno.env.get('SITE_URL')}" style="background:#534AB7;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:12px">
            Answer on UniAsk
          </a>
        `)
      }
    }
  }

  // ── Event 3: Reminder pressed → notify assigned alumni + admin ───────────
  if (remind_at_changed && q.assigned_to?.length > 0) {
    // Notify assigned alumni
    for (const alumniId of q.assigned_to) {
      const { data: alumni } = await supabase.from('profiles').select('email, name, notif_email').eq('id', alumniId).single()
      if (alumni?.notif_email) {
        await sendEmail(alumni.email, 'Reminder: A student is waiting for your answer — UniAsk', `
          <h2 style="color:#854F0B">Reminder from a student</h2>
          <p>Hi ${alumni.name}, a student is still waiting for your answer:</p>
          <blockquote style="border-left:3px solid #EF9F27;padding:8px 16px;background:#fefbf3;margin:12px 0">
            <p>${q.question}</p>
          </blockquote>
          <a href="${Deno.env.get('SITE_URL')}" style="background:#534AB7;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:12px">
            Answer on UniAsk
          </a>
        `)
      }
    }
    // Also notify admin
    const { data: admins } = await supabase.from('profiles').select('email, name').eq('role', 'admin')
    for (const admin of admins || []) {
      await sendEmail(admin.email, 'Student sent a reminder — UniAsk', `
        <h2 style="color:#854F0B">Student reminder received</h2>
        <p>Student ${q.student_code} pressed the remind button on their question:</p>
        <blockquote style="border-left:3px solid #EF9F27;padding:8px 16px;background:#fefbf3;margin:12px 0">
          <p>${q.question}</p>
        </blockquote>
        <a href="${Deno.env.get('SITE_URL')}" style="background:#534AB7;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:12px">
          View on UniAsk
        </a>
      `)
    }
  }

  // ── Event 4: Alumni rejected → notify admin ──────────────────────────────
  if (rejected_by?.length > (q.rejected_by?.length || 0)) {
    const { data: admins } = await supabase.from('profiles').select('email, name').eq('role', 'admin')
    for (const admin of admins || []) {
      await sendEmail(admin.email, 'An alumni rejected a question — UniAsk', `
        <h2 style="color:#A32D2D">Alumni rejected a question</h2>
        <p>An assigned alumni cannot answer this question and it needs reassignment:</p>
        <blockquote style="border-left:3px solid #E24B4A;padding:8px 16px;background:#fef2f2;margin:12px 0">
          <p>${q.question}</p>
        </blockquote>
        <a href="${Deno.env.get('SITE_URL')}" style="background:#534AB7;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:12px">
          Reassign on UniAsk
        </a>
      `)
    }
  }

  // ── Event 5: Answer edited → notify student ──────────────────────────────
  if (answer_changed && new_status === 'answered' && student?.notif_email) {
    await sendEmail(student.email, 'An answer to your question was updated — UniAsk', `
      <h2 style="color:#534AB7">Your answer was updated</h2>
      <p>Hi ${student.name}, the response to your question was edited:</p>
      <blockquote style="border-left:3px solid #534AB7;padding:8px 16px;background:#f5f4ed;margin:12px 0">
        <p><strong>Q:</strong> ${q.question}</p>
        <p><strong>Updated answer:</strong> ${q.answer}</p>
      </blockquote>
      <a href="${Deno.env.get('SITE_URL')}" style="background:#534AB7;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:12px">
        View on UniAsk
      </a>
    `)
  }

  return new Response('ok', { status: 200 })
})
