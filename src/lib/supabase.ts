import{createClient,type SupabaseClient}from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL?.trim();
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
export const ready=Boolean(url&&key&&url.startsWith('https://'));
export const supabase:SupabaseClient|null=ready?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
export function getSupabase(){if(!supabase)throw new Error('Сначала настрой Supabase в файле .env.local.');return supabase}
export function errorMessage(e:unknown){if(e instanceof Error)return e.message;return String(e)}
