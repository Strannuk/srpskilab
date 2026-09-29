import{useState,type FormEvent}from 'react';
import{Link,Navigate,useLocation,useNavigate}from 'react-router-dom';
import{ArrowRight,BookOpen,CheckCircle2,Eye,EyeOff,Lock,Mail,ShieldCheck}from 'lucide-react';
import{getSupabase,ready,errorMessage}from '../lib/supabase';
import{useAuth}from '../lib/session';
export default function Auth({mode}:{mode:'sign-in'|'sign-up'|'forgot'|'reset'}){
 const{user,loading}=useAuth(),location=useLocation(),navigate=useNavigate();
 const[email,setEmail]=useState(''),[password,setPassword]=useState(''),[name,setName]=useState(''),[show,setShow]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[accept,setAccept]=useState(false);
 const redirect=(location.state as{from?:string}|null)?.from||'/dashboard';
 if(!loading&&user&&mode!=='reset')return <Navigate to={redirect} replace/>;
 const heading={"sign-in":'С возвращением!',"sign-up":'Создай свой аккаунт',forgot:'Восстановление пароля',reset:'Новый пароль'}[mode];
 const sub={"sign-in":'Продолжи изучать сербский с того же места.',"sign-up":'Все твои результаты будут храниться в облаке.',forgot:'Мы отправим письмо для восстановления доступа.',reset:'Установи новый пароль для своего аккаунта.'}[mode];
 async function submit(e:FormEvent){e.preventDefault();if(busy)return;setBusy(true);setError('');setMessage('');try{
  const api=getSupabase();if(mode==='sign-in'){const{error}=await api.auth.signInWithPassword({email,password});if(error)throw error;navigate(redirect,{replace:true})}
  if(mode==='sign-up'){if(!accept)throw Error('Нужно принять условия обработки данных.');const{data,error}=await api.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+'/auth/callback',data:{display_name:name||'Ученик'}}});if(error)throw error;
   if(data.session)navigate('/dashboard',{replace:true});else setMessage('Проверь почту и перейди по ссылке подтверждения. После подтверждения войди в аккаунт.')}
  if(mode==='forgot'){const{error}=await api.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+'/auth/reset-password'});if(error)throw error;setMessage('Если этот адрес зарегистрирован, мы отправили письмо для восстановления пароля.')}
  if(mode==='reset'){if(password.length<8)throw Error('Пароль должен содержать не менее 8 символов.');const{error}=await api.auth.updateUser({password});if(error)throw error;setMessage('Пароль изменён. Теперь можешь продолжить обучение.');}
 }catch(e){setError(errorMessage(e))}finally{setBusy(false)}}
 return <main className="auth-page"><div className="auth-background"><Link className="brand" to="/"><span className="brand-symbol">Ђ<span>.</span></span><span><strong>SrpskiLab</strong><small>УЧИ СЕРБСКИЙ ПО-НАСТОЯЩЕМУ</small></span></Link><div className="auth-big"><span className="eyebrow light">ТВОЁ ПРОСТРАНСТВО ДЛЯ ЯЗЫКА</span><h1>Uči srpski.<br/>Govori slobodno.</h1><p>265 уроков, словарь, аудио и персональный маршрут обучения. Урок за уроком — от первых фраз до уверенного общения.</p><div className="auth-benefits"><span><ShieldCheck size={18}/> Прогресс в облаке</span><span><BookOpen size={18}/> Последовательное обучение</span><span><CheckCircle2 size={18}/> Собственный темп</span></div></div></div><div className="auth-right"><div className="auth-card"><span className="eyebrow">СРПСКИ ЛАБ · НАЧИНАЕМ ВМЕСТЕ</span><h2>{heading}</h2><p>{sub}</p>{!ready&&<div className="form-error">Регистрация пока не подключена: укажи VITE_SUPABASE_URL и VITE_SUPABASE_PUBLISHABLE_KEY в .env.local (инструкция — README.md).</div>}
 <form onSubmit={e=>void submit(e)}>
 {mode==='sign-up'&&<label className="form-label">Как тебя зовут<input className="form-control" value={name} maxLength={60} placeholder="Имя или псевдоним" onChange={e=>setName(e.target.value)}/></label>}
 {mode!=='reset'&&<label className="form-label">Email<div className="input-with-icon"><Mail size={18}/><input className="form-control" required type="email" autoComplete="email" value={email} placeholder="name@example.com" onChange={e=>setEmail(e.target.value)}/></div></label>}
 {mode!=='forgot'&&<label className="form-label">{mode==='reset'?'Новый пароль':'Пароль'}<div className="input-with-icon"><Lock size={18}/><input className="form-control" required minLength={8} type={show?'text':'password'} value={password} placeholder="Минимум 8 символов" onChange={e=>setPassword(e.target.value)} autoComplete={mode==='sign-in'?'current-password':'new-password'}/><button type="button" className="eye-button" onClick={()=>setShow(s=>!s)} aria-label={show?'Скрыть пароль':'Показать пароль'}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>}
 {mode==='sign-up'&&<label className="checkbox-line"><input type="checkbox" checked={accept} onChange={e=>setAccept(e.target.checked)}/>Я согласен с условиями обработки персональных данных в соответствии с политикой проекта.</label>}
 {error&&<div className="form-error" role="alert">{error}</div>}{message&&<div className="form-success" role="status">{message}</div>}
 <button className="button button-primary fill" disabled={!ready||busy} type="submit">{busy?'Подождите…':mode==='sign-in'?'Войти':mode==='sign-up'?'Зарегистрироваться':mode==='forgot'?'Отправить письмо':'Сохранить новый пароль'} <ArrowRight size={18}/></button>
 </form>
 <div className="auth-foot">{mode==='sign-in'?<><Link to="/auth/forgot-password">Забыл пароль?</Link><span>Нет аккаунта? <Link to="/auth/sign-up">Зарегистрироваться</Link></span></>:mode==='sign-up'?<span>Уже есть аккаунт? <Link to="/auth/sign-in">Войти</Link></span>:<Link to="/auth/sign-in">Вернуться к входу</Link>}</div>
 <div className="auth-note">Пароли обрабатываются Supabase Auth. SrpskiLab не хранит их в собственной базе.</div>
 </div></div></main>;
}
export function Callback(){return <main className="auth-page simple"><section className="auth-card"><CheckCircle2 size={42} color="#258b6c"/><h1>Проверяем подтверждение…</h1><p>Если переход по ссылке успешен, ты автоматически войдёшь в аккаунт.</p><Link className="button button-primary" to="/dashboard">Перейти к обучению</Link></section></main>}
