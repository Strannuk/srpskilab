import{Link,NavLink,useLocation}from 'react-router-dom';
import{useEffect,useState,type ReactNode}from 'react';
import{House,BookOpen,Languages,Layers,GraduationCap,ChartNoAxesColumn,Settings,Menu,LogOut,BookText,Volume2,Cloud,CloudOff,Loader2,UserRound,ArrowRight,Headphones}from 'lucide-react';
import{useAuth,useProgress}from '../lib/session';
import{useVoice}from '../lib/voice';
import{lessonStatus,nextLesson,completionPercent}from '../lib/access';
import{lessons,chooseScript}from '../lib/catalog';
const links=[{to:'/dashboard',name:'Главная',icon:House},{to:'/course',name:'Все уроки',icon:BookOpen},{to:'/dictionary',name:'Словарь',icon:Languages},{to:'/review',name:'Повторение',icon:Layers},{to:'/exams',name:'Экзамены',icon:GraduationCap},{to:'/progress',name:'Мой прогресс',icon:ChartNoAxesColumn},{to:'/settings',name:'Настройки',icon:Settings}];
export function Layout({children}:{children:ReactNode}){
 const{user,signOut}=useAuth();const data=useProgress();const{profile,lessons:done,exams,syncStatus}=data;
 const[menu,setMenu]=useState(false);const route=useLocation();
 const{stop,rate,setRate,status:audioStatus}=useVoice();
 useEffect(()=>{setMenu(false);stop()},[route.pathname]);
 const next=nextLesson(done,exams),count=lessons.filter(l=>lessonStatus(l,done,exams)==='completed').length;
 const script=profile?.script||'latin';
 return <div className={`shell ${menu?'menu-open':''}`}>
   {menu&&<button className="nav-overlay" aria-label="Закрыть меню" onClick={()=>setMenu(false)}/>}
   <aside className="sidebar">
    <Link className="brand" to="/dashboard"><span className="brand-symbol">Ђ<span>.</span></span><span><strong>SrpskiLab</strong><small>УЧИ СЕРБСКИЙ ПО-НАСТОЯЩЕМУ</small></span></Link>
    <div className="nav-caption">ОБУЧЕНИЕ</div><nav aria-label="Главная навигация">{links.slice(0,5).map(l=><NavLink key={l.to} to={l.to} className={({isActive})=>`nav-link ${isActive?'active':''}`}><l.icon size={18}/>{l.name}</NavLink>)}</nav>
    <div className="nav-caption second">ТВОЙ КАБИНЕТ</div><nav aria-label="Кабинет">{links.slice(5).map(l=><NavLink key={l.to} to={l.to} className={({isActive})=>`nav-link ${isActive?'active':''}`}><l.icon size={18}/>{l.name}</NavLink>)}</nav>
    <div className="side-bottom"><div className="side-goal"><div className="radial">{Math.round(count/lessons.length*100)}%</div><span><b>Большая цель — B2</b><small>{count} из {lessons.length} уроков</small><span className="side-bar"><i style={{width:`${completionPercent(undefined,done)}%`}}/></span></span></div><p>Сделано с заботой о тех, кто живёт в Сербии 🇷🇸</p></div>
   </aside>
   <div className="app-content"><header className="topbar">
     <div className="top-left"><button className="icon-button mobile-menu" onClick={()=>setMenu(true)} aria-label="Открыть меню"><Menu size={22}/></button><Link to="/dashboard" className="crumb">Главная</Link><span>/</span><b>{links.find(l=>route.pathname.startsWith(l.to))?.name||'Урок'}</b></div>
     <div className="top-right"><span className={`sync-pill ${syncStatus}`} title={data.syncError||''}>{syncStatus==='saved'?<Cloud size={15}/>:syncStatus==='saving'?<Loader2 size={15} className="spin"/>:<CloudOff size={15}/>}<span>{syncStatus==='saved'?'Сохранено':syncStatus==='saving'?'Сохранение…':syncStatus==='queued_offline'?'Ожидает сети':'Ошибка синхронизации'}</span></span>
      {audioStatus==='unavailable'&&<span className="audio-warning">Озвучка недоступна — проверь файлы/звук</span>}<div className="rate-control"><Volume2 size={15}/><select aria-label="Скорость аудио" value={rate} onChange={e=>setRate(Number(e.target.value))}><option value="0.75">0,75×</option><option value="1">1×</option><option value="1.25">1,25×</option></select></div>
      <Link className="round-user" to="/settings" title="Профиль"><UserRound size={18}/></Link><button className="icon-button signout" onClick={()=>void signOut()} title="Выйти"><LogOut size={18}/></button>
     </div>
   </header><main className="page">{children}</main><footer>SrpskiLab · Сербский A0–B2 · Прогресс хранится в твоём аккаунте</footer></div>
   <nav className="bottom-nav">{links.slice(0,5).map(l=><NavLink to={l.to} key={l.to} className={({isActive})=>isActive?'active':''}><l.icon size={19}/><span>{l.name==='Все уроки'?'Уроки':l.name}</span></NavLink>)}</nav>
   {user&&<div className="floating-continue" aria-label="Следующий урок"><Link to={`/lesson/${next.id}`}><Headphones size={17}/><span>{chooseScript(next.title,script)}</span><ArrowRight size={17}/></Link></div>}
 </div>;
}
export function PageHead({eyebrow,title,description,icon:Icon=BookText}:{eyebrow:string,title:string,description:string,icon?:typeof BookText}){
 return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div><span className="page-head-icon"><Icon size={37}/></span></div>;
}
export function Meter({value}:{value:number}){return <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><div style={{width:`${Math.min(100,Math.max(0,value))}%`}}/></div>}
export function Empty({icon:Icon=BookOpen,title,description}:{icon?:typeof BookOpen,title:string,description:string}){return <div className="empty"><Icon size={34}/><h3>{title}</h3><p>{description}</p></div>}
