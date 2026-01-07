import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// O segredo está neste "export" aqui embaixo
export const supabase = createClient(supabaseUrl, supabaseKey);