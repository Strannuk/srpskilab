import{createContext,useContext,useEffect,useState,useCallback,useRef,type ReactNode}from 'react';
import type{User}from '@supabase/supabase-js';
import{getSupabase,supabase,errorMessage}from './supabase';
import type{Profile,LessonProgress,ExamAttempt,WordProgress,LegacyProgress,AttemptResult}from './types';
import{queueAttempt,takeQueue,removeAttempt}from './offline';

type AuthContextType={user:User|null,loading:boolean,signOut:()=>Promise<void>};
const AuthContext=createContext<AuthContextType>({user:null,loading:true,signOut:async()=>{}});
export const useAuth=()=>useContext(AuthContext);
export function AuthProvider({children}:{children:ReactNode}){
 const[user,setUser]=useState<User|null>(null);const[loading,setLoading]=useState(true);
 useEffect(()=>{if(!supabase){setLoading(false);return;}
 let live=true;void supabase.auth.getUser().then(({data})=>{if(live)setUser(data.user)}).catch(()=>{if(live)setUser(null)}).finally(()=>{if(live)setLoading(false)});
 const{data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{setUser(session?.user||null);setLoading(false)});
 return()=>{live=false;subscription.unsubscribe()};
 },[]);
 const signOut=useCallback(async()=>{await getSupabase().auth.signOut();setUser(null)},[]);
 return <AuthContext.Provider value={{user,loading,signOut}}>{children}</AuthContext.Provider>;
}

type UploadResult=AttemptResult|{queued:true};
type ProgressContextType={
 profile:Profile|null,lessons:Record<string,LessonProgress>,exams:ExamAttempt[],words:Record<string,WordProgress>,legacy:LegacyProgress[],
 loading:boolean,syncStatus:'saved'|'saving'|'queued_offline'|'failed',syncError:string|null,refresh:()=>Promise<void>,
 saveProfile:(name:string,script:string,theme:string,goal:number)=>Promise<void>,
 saveStep:(lessonId:string,step:string)=>Promise<void>,markWords:(ids:string[])=>Promise<void>,
 submitLesson:(lessonId:string,answers:Record<string,string>,key:string)=>Promise<UploadResult>,
 submitExam:(level:string,answers:Record<string,string>,key:string)=>Promise<AttemptResult>,reviewWord:(id:string,grade:string,key:string)=>Promise<void>,
 importLegacy:(hash:string,archive:Record<string,unknown>)=>Promise<{count:number,words:number,exams:number,duplicate:boolean}>};
const ProgressContext=createContext<ProgressContextType|null>(null);
export function useProgress(){const c=useContext(ProgressContext);if(!c)throw new Error('Missing ProgressProvider');return c}
const emptyState={profile:null,lessons:{},exams:[],words:{},legacy:[]};
export function ProgressProvider({children}:{children:ReactNode}){
 const{user}=useAuth(),uid=user?.id??null,activeId=useRef<string|null>(uid);
 activeId.current=uid;
 const[profile,setProfile]=useState<Profile|null>(null);
 const[lessons,setLessons]=useState<Record<string,LessonProgress>>({});
 const[exams,setExams]=useState<ExamAttempt[]>([]);const[words,setWords]=useState<Record<string,WordProgress>>({});
 const[legacy,setLegacy]=useState<LegacyProgress[]>([]);const[loading,setLoading]=useState(Boolean(uid));
 const[dataFor,setDataFor]=useState<string|null>(null);
 const[syncStatus,setSyncStatus]=useState<ProgressContextType['syncStatus']>('saved');const[syncError,setSyncError]=useState<string|null>(null);
 const refresh=useCallback(async()=>{
   if(!uid){setDataFor(null);setProfile(null);setLessons({});setExams([]);setWords({});setLegacy([]);setLoading(false);return;}
   setLoading(true);
   try{
     const api=getSupabase();
     const result=await Promise.all([
       api.from('profiles').select('*').eq('user_id',uid).maybeSingle(),
       api.from('lesson_progress').select('*').eq('user_id',uid),
       api.from('exam_attempts').select('level,score,passed,submitted_at').eq('user_id',uid).order('submitted_at',{ascending:false}),
       api.from('user_word_progress').select('*').eq('user_id',uid),
       api.from('legacy_imported_progress').select('lesson_id,legacy_done,legacy_score').eq('user_id',uid)
     ]);
     const failure=result.find(v=>v.error)?.error;if(failure)throw failure;
     if(activeId.current!==uid)return;
     setProfile(result[0].data as Profile|null);
     setLessons(Object.fromEntries(((result[1].data||[]) as LessonProgress[]).map(x=>[x.lesson_id,x])));
     setExams((result[2].data||[]) as ExamAttempt[]);
     setWords(Object.fromEntries(((result[3].data||[]) as WordProgress[]).map(x=>[x.word_id,x])));
     setLegacy((result[4].data||[]) as LegacyProgress[]);
     setDataFor(uid);
     setSyncStatus(prev=>prev==='queued_offline'?prev:'saved');setSyncError(null);
   }catch(e){if(activeId.current===uid){setSyncStatus('failed');setSyncError(errorMessage(e))}}
   finally{if(activeId.current===uid)setLoading(false)}
 },[uid]);
 useEffect(()=>{
  setDataFor(null);setProfile(emptyState.profile);setLessons({});setExams([]);setWords({});setLegacy([]);setSyncError(null);setSyncStatus('saved');setLoading(Boolean(uid));
  void refresh();
 },[refresh,uid]);
 const flush=useCallback(async()=>{
   if(!uid||!navigator.onLine)return;
   const pending=await takeQueue(uid);
   if(!pending.length)return;
   for(const a of pending){try{
     const{data,error}=await getSupabase().rpc('submit_lesson_attempt',{p_lesson_id:a.lessonId,p_attempt_key:a.key,p_answers:a.answers});
     if(error)throw error;
     if(data)await removeAttempt(a.key);
   }catch(e){setSyncError(`Несинхронизированная попытка: ${errorMessage(e)}`);setSyncStatus('failed');return}}
   setSyncStatus('saved');await refresh();
 },[uid,refresh]);
 useEffect(()=>{if(!uid)return;void flush();window.addEventListener('online',flush);return()=>window.removeEventListener('online',flush)},[uid,flush]);
 const saveProfile=async(name:string,script:string,theme:string,goal:number)=>{
   setSyncStatus('saving');const{error}=await getSupabase().rpc('save_profile',{p_display_name:name,p_script:script,p_theme:theme,p_goal:goal});
   if(error){setSyncStatus('failed');throw error;}await refresh();setSyncStatus('saved');
 };
 const saveStep=async(lessonId:string,step:string)=>{
   if(!uid)return;
   const {error}=await getSupabase().rpc('save_lesson_step',{p_lesson_id:lessonId,p_step:step});
   if(error){setSyncStatus('failed');setSyncError(errorMessage(error));throw error;}
 };
 const markWords=async(ids:string[])=>{
   if(!uid||ids.length===0)return;
   const{error}=await getSupabase().rpc('mark_words_seen',{p_word_ids:ids});
   if(error)throw error;await refresh();
 };
 const submitLesson=async(lessonId:string,answers:Record<string,string>,key:string):Promise<UploadResult>=>{
   if(!uid)throw Error('Требуется вход');setSyncStatus('saving');
   if(!navigator.onLine){await queueAttempt({userId:uid,lessonId,answers,key,createdAt:new Date().toISOString()});setSyncStatus('queued_offline');return{queued:true}}
   try{
     const{data,error}=await getSupabase().rpc('submit_lesson_attempt',{p_lesson_id:lessonId,p_attempt_key:key,p_answers:answers});
     if(error)throw error;
     await refresh();setSyncStatus('saved');return data as AttemptResult;
   }catch(e){
     if(!navigator.onLine||/failed to fetch|network|load failed/i.test(errorMessage(e))){
       await queueAttempt({userId:uid,lessonId,answers,key,createdAt:new Date().toISOString()});setSyncStatus('queued_offline');return{queued:true};
     }
     setSyncStatus('failed');setSyncError(errorMessage(e));throw e;
   }
 };
 const submitExam=async(level:string,answers:Record<string,string>,key:string)=>{
   setSyncStatus('saving');const{data,error}=await getSupabase().rpc('submit_exam_attempt',{p_level:level,p_attempt_key:key,p_answers:answers});
   if(error){setSyncStatus('failed');throw error;}await refresh();setSyncStatus('saved');return data as AttemptResult;
 };
 const reviewWord=async(id:string,grade:string,key:string)=>{
   setSyncStatus('saving');const{error}=await getSupabase().rpc('review_word',{p_word_id:id,p_grade:grade,p_event_key:key});
   if(error){setSyncStatus('failed');throw error;}await refresh();setSyncStatus('saved');
 };
 const importLegacy=async(hash:string,archive:Record<string,unknown>):Promise<{count:number,words:number,exams:number,duplicate:boolean}>=>{
   setSyncStatus('saving');const{data,error}=await getSupabase().rpc('import_legacy_archive',{p_source_hash:hash,p_lessons:archive});
   if(error){setSyncStatus('failed');throw error;}await refresh();setSyncStatus('saved');return data as{count:number,words:number,exams:number,duplicate:boolean};
 };
 const belongs=uid!==null&&dataFor===uid;
 return <ProgressContext.Provider value={{profile:belongs?profile:null,lessons:belongs?lessons:{},exams:belongs?exams:[],words:belongs?words:{},legacy:belongs?legacy:[],loading:loading||Boolean(uid&&!belongs&&!syncError),syncStatus,syncError,refresh,saveProfile,saveStep,markWords,submitLesson,submitExam,reviewWord,importLegacy}}>{children}</ProgressContext.Provider>;
}
