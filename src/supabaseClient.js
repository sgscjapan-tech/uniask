import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zayrdykafxnaqozagsll.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpheXJkeWthZnhuYXFvemFnc2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODA2MzgsImV4cCI6MjA5MjI1NjYzOH0.feZ0XfYrBaIrsPC92Do8q59t-O-3gh0I2rbt2sJvq8k'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
