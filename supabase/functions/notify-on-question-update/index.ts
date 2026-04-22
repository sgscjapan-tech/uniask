// Supabase Edge Function: notify-on-question-update
// Fires on every UPDATE to the questions table
// Handles: answered, assigned, reminded, rejected, FAQ edited

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const APP_URL = Deno.env.get('APP_URL') || 'https://uniask.vercel.app'
const FROM_EMAIL = 'UniAsk <notifications@uniask.jp>'

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    const newQ = payload.record
    const oldQ = payload.old_record

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    )

    // ── 1. Question was answered → notify student ──────────────────────────
    if (newQ.status === 'answered' && oldQ.status !== 'answered') {
      const { data: student } = await supabase
        .from('profiles')
        .select('email, name, notif_email')
        .eq('id', newQ.student_id)
        .single()

      if (student?.notif_email) {
        await sendEmail({
          to: student.email,
          subject: 'Your question has been answered — UniAsk',
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
              <h2 style="color:#534AB7;margin-bottom:8px">Your question has been answered!</h2>
              <p style="color:#666;margin-bottom:20px">Hi ${student.name}, a response is ready for you on UniAsk.</p>
              
              <div style="background:#f5f4ed;border-radius:10px;padding:16px;margin-bottom:16px">
                <p style="font-size:13px;color:#666;margin-bottom:4px">Your question</p>
                <p style="font-weight:500;line-height:1.6;margin-bottom:12px">${newQ.question}</p>
                <p style="font-size:13px;color:#666;margin-bottom:4px">Answer from ${newQ.answered_by_name}</p>
                <p style="line-height:1.7">${newQ.answer}</p>
              </div>
              
              <a href="${APP_URL}" style="display:inline-block;background:#534AB7;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px">
                View on UniAsk →
              </a>
            </div>
          `
        })
      }
    }

    // ── 2. Question assigned → notify alumni ──────────────────────────────
    const newlyAssigned = (newQ.assigned_to || []).filter(
      code => !(oldQ.assigned_to || []).includes(code)
    )

    if (newlyAssigned.length > 0) {
      const { data: alumni } = await supabase
        .from('profiles')
        .select('email, name, student_code, notif_email')
        .in('student_code', newlyAssigned)

      for (const alum of (alumni || [])) {
        if (!alum.notif_email) continue
        await sendEmail({
          to: alum.email,
          subject: 'A question has been assigned to you — UniAsk',
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
              <h2 style="color:#534AB7;margin-bottom:8px">You have a new question</h2>
              <p style="color:#666;margin-bottom:20px">Hi ${alum.name}, a student question has been assigned to you.</p>
              
              <div style="background:#f5f4ed;border-radius:10px;padding:16px;margin-bottom:16px">
                <p style="font-size:13px;color:#666;margin-bottom:4px">Student ${newQ.student_code} asks</p>
                <p style="line-height:1.7">${newQ.question}</p>
              </div>
              
              <a href="${APP_URL}" style="display:inline-block;background:#534AB7;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px">
                Answer on UniAsk →
              </a>
            </div>
          `
        })
      }
    }

    // ── 3. Reminder pressed → notify admin and assigned alumni ────────────
    if (newQ.remind_at && newQ.remind_at !== oldQ.remind_at) {
      // Notify admins
      const { data: admins } = await supabase
        .from('profiles')
        .select('email, notif_email')
        .eq('role', 'admin')
        .eq('notif_email', true)

      for (const admin of (admins || [])) {
        await sendEmail({
          to: admin.email,
          subject: 'Reminder: unanswered question — UniAsk',
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
              <h2 style="color:#854F0B;margin-bottom:8px">Student sent a reminder</h2>
              <p style="color:#666;margin-bottom:16px">Student ${newQ.student_code} is waiting for a response.</p>
              <div style="background:#FAEEDA;border-radius:10px;padding:16px;margin-bottom:16px">
                <p style="line-height:1.7">${newQ.question}</p>
              </div>
              <a href="${APP_URL}" style="display:inline-block;background:#534AB7;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px">
                Go to UniAsk →
              </a>
            </div>
          `
        })
      }

      // Also notify assigned alumni (if any)
      if ((newQ.assigned_to || []).length > 0) {
        const { data: assignedAlumni } = await supabase
          .from('profiles')
          .select('email, name, notif_email')
          .in('student_code', newQ.assigned_to)
          .eq('notif_email', true)

        for (const alum of (assignedAlumni || [])) {
          await sendEmail({
            to: alum.email,
            subject: 'Reminder: student is waiting for your answer — UniAsk',
            html: `
              <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
                <h2 style="color:#854F0B;margin-bottom:8px">A student is waiting for your answer</h2>
                <p style="color:#666;margin-bottom:16px">Hi ${alum.name}, Student ${newQ.student_code} sent a reminder about an unanswered question.</p>
                <div style="background:#FAEEDA;border-radius:10px;padding:16px;margin-bottom:16px">
                  <p style="line-height:1.7">${newQ.question}</p>
                </div>
                <a href="${APP_URL}" style="display:inline-block;background:#534AB7;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px">
                  Answer on UniAsk →
                </a>
              </div>
            `
          })
        }
      }
    }

    // ── 4. Alumni rejected → notify admin ────────────────────────────────
    const newlyRejected = (newQ.rejected_by || []).filter(
      code => !(oldQ.rejected_by || []).includes(code)
    )

    if (newlyRejected.length > 0) {
      const { data: admins } = await supabase
        .from('profiles')
        .select('email, notif_email')
        .eq('role', 'admin')
        .eq('notif_email', true)

      for (const admin of (admins || [])) {
        await sendEmail({
          to: admin.email,
          subject: 'Alumni cannot answer a question — reassignment needed',
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
              <h2 style="color:#A32D2D;margin-bottom:8px">Question needs reassignment</h2>
              <p style="color:#666;margin-bottom:16px">Alumni ${newlyRejected.join(', ')} cannot answer this question.</p>
              <div style="background:#FCEBEB;border-radius:10px;padding:16px;margin-bottom:16px">
                <p style="line-height:1.7">${newQ.question}</p>
              </div>
              <a href="${APP_URL}" style="display:inline-block;background:#534AB7;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px">
                Reassign on UniAsk →
              </a>
            </div>
          `
        })
      }
    }

    // ── 5. Answer was edited → notify student ────────────────────────────
    if (
      newQ.status === 'answered' &&
      newQ.answer !== oldQ.answer &&
      oldQ.answer !== null
    ) {
      const { data: student } = await supabase
        .from('profiles')
        .select('email, name, notif_email')
        .eq('id', newQ.student_id)
        .single()

      if (student?.notif_email) {
        await sendEmail({
          to: student.email,
          subject: 'Your answer was updated — UniAsk',
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
              <h2 style="color:#534AB7;margin-bottom:8px">An answer to your question was updated</h2>
              <p style="color:#666;margin-bottom:16px">Hi ${student.name}, ${newQ.answered_by_name} has updated their response.</p>
              <div style="background:#f5f4ed;border-radius:10px;padding:16px;margin-bottom:16px">
                <p style="font-size:13px;color:#666;margin-bottom:4px">Updated answer</p>
                <p style="line-height:1.7">${newQ.answer}</p>
              </div>
              <a href="${APP_URL}" style="display:inline-block;background:#534AB7;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px">
                View on UniAsk →
              </a>
            </div>
          `
        })
      }
    }

    return new Response(JSON.stringify({ message: 'Notifications sent' }), { status: 200 })
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
    body: JSON.stringify({
      from: 'UniAsk <notifications@uniask.jp>',
      to,
      subject,
      html,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Resend error: ${text}`)
  }
  return res.json()
}
