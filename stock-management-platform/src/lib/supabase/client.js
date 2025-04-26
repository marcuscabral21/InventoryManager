// src/lib/supabase/client.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Adicione este debug temporariamente:
console.log('[DEBUG] Supabase Config:', { supabaseUrl, supabaseKey });

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variáveis de ambiente do Supabase não carregadas!');
}

export const supabase = createClient(supabaseUrl, supabaseKey);