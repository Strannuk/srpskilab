// Deploy with Supabase CLI: supabase functions deploy delete-account
// Server-only: SUPABASE_SERVICE_ROLE_KEY is supplied by Supabase Secrets, NEVER from VITE_ vars.
import { createClient } from 'npm:@supabase/supabase-js@2';
const cors={ 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods':'POST, OPTIONS' };
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return Response.json({error:'method not allowed'},{status:405,headers:cors});
 const auth=req.headers.get('authorization')||'';
 if(!auth.startsWith('Bearer '))return Response.json({error:'sign in required'},{status:401,headers:cors});
 const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!url||!key)return Response.json({error:'server not configured'},{status:503,headers:cors});
 try{
  const body=await req.json();if(body?.confirm!=='УДАЛИТЬ')return Response.json({error:'confirmation required'},{status:400,headers:cors});
  const admin=createClient(url,key,{auth:{persistSession:false}});
  // getUser(JWT) performs server-side auth verification. Never trust a user_id sent from the browser.
  const{data:{user},error:authError}=await admin.auth.getUser(auth.slice(7));
  if(authError||!user)return Response.json({error:'unauthorized'},{status:401,headers:cors});
  const{error}=await admin.auth.admin.deleteUser(user.id);
  if(error)throw error;
  return Response.json({deleted:true},{status:200,headers:cors});
 }catch(e){return Response.json({error:'delete failed',detail:'Please contact the administrator'},{status:500,headers:cors})}
});
