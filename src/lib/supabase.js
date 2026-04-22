import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export async function signUp({ email, password, name, role, schoolCode }) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error

  const { error: profileError } = await supabase.from('profiles').insert({
    id: data.user.id,
    name,
    email,
    role,
    school_code: schoolCode,
  })
  if (profileError) throw profileError

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()

  return profile
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()

  return profile
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return profile
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────

export async function updateProfile(userId, patch) {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteAccount(userId) {
  // Deletes profile (cascades to questions due to FK)
  const { error } = await supabase.from('profiles').delete().eq('id', userId)
  if (error) throw error
  await supabase.auth.signOut()
}

export async function getAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getAlumni() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, student_code, school_code')
    .eq('role', 'alumni')
    .order('name')
  if (error) throw error
  return data
}

// ─── SCHOOLS ──────────────────────────────────────────────────────────────────

export async function getSchools() {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

export async function addSchool(name, code) {
  const { data, error } = await supabase
    .from('schools')
    .insert({ name, code })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── QUESTIONS ────────────────────────────────────────────────────────────────

export async function submitQuestion({ studentId, studentCode, question, target, targetName }) {
  const { data, error } = await supabase.from('questions').insert({
    student_id: studentId,
    student_code: studentCode,
    question,
    target,
    target_name: targetName,
    status: 'open',
  }).select().single()
  if (error) throw error
  return data
}

export async function getMyQuestions(studentId) {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('student_id', studentId)
    .eq('is_faq', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getFaqs() {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('is_faq', true)
    .order('edited_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function sendReminder(questionId) {
  const { data, error } = await supabase
    .from('questions')
    .update({ remind_at: new Date().toISOString() })
    .eq('id', questionId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Alumni functions
export async function getAssignedQuestions(alumniStudentCode) {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .contains('assigned_to', [alumniStudentCode])
    .neq('status', 'answered')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function getPastAnswers(alumniId) {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('answered_by', alumniId)
    .eq('status', 'answered')
    .order('answered_at', { ascending: false })
  if (error) throw error
  return data
}

export async function submitAnswer(questionId, answer, alumniId, alumniCode) {
  const { data, error } = await supabase
    .from('questions')
    .update({
      answer,
      answered_by: alumniId,
      answered_by_name: `Alumni ${alumniCode}`,
      answered_at: new Date().toISOString(),
      status: 'answered',
    })
    .eq('id', questionId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function rejectQuestion(questionId, alumniCode, currentAssignedTo, currentRejectedBy) {
  const newAssigned = currentAssignedTo.filter(c => c !== alumniCode)
  const newRejected = [...currentRejectedBy, alumniCode]
  const { data, error } = await supabase
    .from('questions')
    .update({
      assigned_to: newAssigned,
      rejected_by: newRejected,
      status: newAssigned.length > 0 ? 'assigned' : 'open',
    })
    .eq('id', questionId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function editAnswer(questionId, newAnswer, oldAnswer, oldAnsweredAt) {
  const { data: current } = await supabase
    .from('questions')
    .select('edits')
    .eq('id', questionId)
    .single()

  const edits = [...(current?.edits || []), { text: oldAnswer, at: oldAnsweredAt }]

  const { data, error } = await supabase
    .from('questions')
    .update({
      answer: newAnswer,
      edits,
      answered_at: new Date().toISOString(),
    })
    .eq('id', questionId)
    .select()
    .single()
  if (error) throw error
  return data
}

// Admin functions
export async function getAllQuestions() {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('is_faq', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function assignQuestion(questionId, alumniCodes) {
  const { data, error } = await supabase
    .from('questions')
    .update({
      assigned_to: alumniCodes,
      assigned_at: new Date().toISOString(),
      status: 'assigned',
    })
    .eq('id', questionId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function adminAnswer(questionId, answer) {
  const { data, error } = await supabase
    .from('questions')
    .update({
      answer,
      answered_by_name: 'Admin',
      answered_at: new Date().toISOString(),
      status: 'answered',
    })
    .eq('id', questionId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function toggleFaq(questionId, isFaq, faqTitle, faqCategory) {
  const { data, error } = await supabase
    .from('questions')
    .update({ is_faq: isFaq, faq_title: faqTitle, faq_category: faqCategory, edited_at: new Date().toISOString() })
    .eq('id', questionId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function createFaq({ question, answer, faqCategory }) {
  const { data: profile } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('questions').insert({
    student_id: profile.user.id,
    student_code: 'ADMIN',
    question,
    faq_title: question,
    answer,
    faq_category: faqCategory,
    is_faq: true,
    status: 'answered',
    target: 'anyone',
    target_name: 'Admin',
    answered_by_name: 'Admin',
    answered_at: new Date().toISOString(),
  }).select().single()
  if (error) throw error
  return data
}

export async function updateFaq(questionId, patch) {
  const { data, error } = await supabase
    .from('questions')
    .update({ ...patch, edited_at: new Date().toISOString() })
    .eq('id', questionId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function searchQuestions(query) {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .or(`question.ilike.%${query}%,answer.ilike.%${query}%,faq_category.ilike.%${query}%`)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Real-time subscription helper
export function subscribeToQuestions(callback) {
  return supabase
    .channel('questions-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, callback)
    .subscribe()
}
