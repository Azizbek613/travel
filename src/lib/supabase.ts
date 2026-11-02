import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jwetzleezuoyzaxkgvrt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Kdwre8QFIR6cWvT4ECvCCg_lRJBRTUQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
