import { createClient } from '@supabase/supabase-js'

// Replace with your actual details from Supabase
const supabaseUrl = 'https://onczdkiimtfpvohrpcxa.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uY3pka2lpbXRmcHZvaHJwY3hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczOTQwMDUsImV4cCI6MjA5Mjk3MDAwNX0.1_tll-fX9DvrDiOEisWmz0VOt2qnFMlqYO0DRvv_Kv8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)