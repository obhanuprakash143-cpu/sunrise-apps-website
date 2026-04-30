import { createClient } from '@supabase/supabase-js'

// Supabase URL ఎప్పుడూ 'https://' తో మొదలవ్వాలి
const supabaseUrl = 'https://onczdkiimtfpvohrpcxa.supabase.co'

// నీ Anon Key కరెక్ట్‌గానే ఉంది
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uY3pka2lpbXRmcHZvaHJwY3hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczOTQwMDUsImV4cCI6MjA5Mjk3MDAwNX0.1_tll-fX9DvrDiOEisWmz0VOt2qnFMlqYO0DRvv_Kv8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)