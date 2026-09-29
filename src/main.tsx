import React from 'react';
import{createRoot}from 'react-dom/client';
import{BrowserRouter,Navigate,Route,Routes,useLocation}from 'react-router-dom';
import{AuthProvider,ProgressProvider,useAuth,useProgress}from './lib/session';
import{VoiceProvider}from './lib/voice';
import{ready}from './lib/supabase';
import{Layout}from './components/Layout';
import Home from './pages/Home';
import Auth,{Callback}from './pages/Auth';
import Course from './pages/Course';
import Lesson from './pages/Lesson';
import Dictionary from './pages/Dictionary';
import Review from './pages/Review';
import Exams from './pages/Exams';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import{BookOpen,CloudOff,Loader2}from 'lucide-react';
import './style.css';
function Protected({children}:{children:React.ReactNode}){const{user,loading}=useAuth(),loc=useLocation();if(loading)return <div className="startup"><Loader2 size={36} className="spin"/><h2>Загружаем профиль…</h2></div>;
 if(!user)return <Navigate to="/auth/sign-in" state={{from:loc.pathname}} replace/>;return <>{children}</>}
function Wrapped({children}:{children:React.ReactNode}){const data=useProgress();const theme=data.profile?.theme||'light';React.useEffect(()=>{document.documentElement.dataset.theme=theme==='system'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):theme},[theme]);if(data.syncError&&!data.profile)return <main className="startup"><CloudOff size={45}/><h2>Не удалось загрузить облачный прогресс</h2><p>{data.syncError}</p><button className="button button-primary" onClick={()=>void data.refresh()}>Повторить</button></main>;return <Layout>{children}</Layout>}
function NeedSetup(){return <main className="setup-page"><div className="setup-card"><div className="brand-symbol">Ђ<span>.</span></div><span className="eyebrow">SRPSKILAB · ПЕРВЫЙ ЗАПУСК</span><h1>Осталось подключить облако</h1><p>Приложение, 265 уроков и аудиодорожки находятся в проекте. Чтобы заработали регистрация и серверное сохранение, создай Supabase-проект и добавь два публичных ключа в переменные окружения.</p><ol><li>Открой Supabase → Project Settings → API.</li><li>В Cloudflare Workers → srpskilab → Settings → Build variables and secrets добавь <code>VITE_SUPABASE_URL</code> и <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>.</li><li>Выполни SQL-миграции из <code>supabase/migrations</code>.</li><li>Выполни новый Deploy.</li></ol><a className="button button-primary" href="https://supabase.com/dashboard/projects" target="_blank" rel="noreferrer">Открыть Supabase →</a><p className="muted">Подробная инструкция есть в README.md рядом с кодом проекта.</p></div></main>}
const DevCurriculum = import.meta.env.DEV ? React.lazy(() => import('./pages/CurriculumWorkshop')) : null;
function App(){if(import.meta.env.DEV&&DevCurriculum&&window.location.pathname==='/editorial/curriculum')return <React.Suspense fallback={<main className="startup">Загружаю редакторский каталог…</main>}><DevCurriculum/></React.Suspense>;return <AuthProvider><ProgressProvider><VoiceProvider>{!ready?<NeedSetup/>:<BrowserRouter><Routes><Route path="/" element={<Navigate to="/dashboard" replace/>}/><Route path="/auth/sign-in" element={<Auth mode="sign-in"/>}/><Route path="/auth/sign-up" element={<Auth mode="sign-up"/>}/><Route path="/auth/forgot-password" element={<Auth mode="forgot"/>}/><Route path="/auth/reset-password" element={<Auth mode="reset"/>}/><Route path="/auth/callback" element={<Callback/>}/><Route path="/dashboard" element={<Protected><Wrapped><Home/></Wrapped></Protected>}/><Route path="/course" element={<Protected><Wrapped><Course/></Wrapped></Protected>}/><Route path="/course/:level" element={<Protected><Wrapped><Course/></Wrapped></Protected>}/><Route path="/lesson/:id" element={<Protected><Wrapped><Lesson/></Wrapped></Protected>}/><Route path="/review" element={<Protected><Wrapped><Review/></Wrapped></Protected>}/><Route path="/dictionary" element={<Protected><Wrapped><Dictionary/></Wrapped></Protected>}/><Route path="/exams" element={<Protected><Wrapped><Exams/></Wrapped></Protected>}/><Route path="/exam/:level" element={<Protected><Wrapped><Exams/></Wrapped></Protected>}/><Route path="/progress" element={<Protected><Wrapped><Progress/></Wrapped></Protected>}/><Route path="/settings" element={<Protected><Wrapped><Settings/></Wrapped></Protected>}/><Route path="*" element={<main className="startup"><BookOpen size={50}/><h1>Страница не найдена</h1><a href="/course">Открыть программу</a></main>}/></Routes></BrowserRouter>}</VoiceProvider></ProgressProvider></AuthProvider>}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
