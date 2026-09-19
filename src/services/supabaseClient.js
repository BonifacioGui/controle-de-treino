// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigurationError = !supabaseUrl || !supabaseAnonKey
  ? 'A conexão com o Supabase não foi configurada neste ambiente.'
  : null

if (supabaseConfigurationError) console.error(supabaseConfigurationError)

// Mantém a interface recuperável mesmo quando o ambiente foi publicado sem secrets.
// As telas de autenticação exibem a falha em vez de deixar uma splash infinita.
export const supabase = createClient(
  supabaseUrl || 'https://configuracao-ausente.supabase.co',
  supabaseAnonKey || 'configuracao-ausente',
)
