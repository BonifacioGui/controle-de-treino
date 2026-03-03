// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validação de segurança para evitar a tela preta novamente
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("FALHA CRÍTICA: Variáveis de ambiente não carregadas. Verifique o arquivo .env")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)