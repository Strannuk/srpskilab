import{useEffect,useMemo,useState}from 'react';
import{Link,useParams}from 'react-router-dom';
import{ArrowRight,Check,LockKeyhole,Play,Search,BookText}from 'lucide-react';
import {
  modules,
  lessons,
  levels,
  LEVEL_COLORS
} from '../lib/catalog';
import{lessonStatus}from '../lib/access';
import{useProgress}from '../lib/session';
import{PageHead,Meter}from '../components/Layout';
import type{Level}from '../lib/types';
export default function Course(){const params=useParams(),initial=(params.level?.toUpperCase()||'all') as Level|'all';const[tab,setTab]=useState(initial);const[query,setQuery]=useState('');
 useEffect(()=>setTab(initial),[initial]);
 const{lessons:progress,exams}=useProgress();const filtered=useMemo(()=>modules.filter(m=>(tab==='all'||m.level===tab)&&(!query||m.name.toLowerCase().includes(query.toLowerCase())||lessons.some(l=>l.moduleId===m.id&&l.title.toLowerCase().includes(query.toLowerCase())))),[tab,query]);
 return <><PageHead eyebrow="ОБУЧЕНИЕ / ПРОГРАММА" title="Все уроки" description="Открывай занятия по порядку: следующий урок станет доступен только после успешного теста." icon={BookText}/>
 <div className="course-controls"><div className="segmented"><button className={tab==='all'?'active':''} onClick={()=>setTab('all')}>Все уровни</button>{levels.map(l=><button key={l} className={tab===l?'active':''} onClick={()=>setTab(l)}>{l}</button>)}</div><div className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Найти тему или урок" aria-label="Поиск уроков"/></div></div>
 {filtered.map(m=>{const entries=lessons.filter(l=>l.moduleId===m.id),completed=entries.filter(l=>progress[l.id]?.status==='completed').length;return <section className="panel module-section" key={m.id}><div className="module-top"><span className="level-badge" style={{background:LEVEL_COLORS[m.level]}}>{m.level}</span><div><div className="eyebrow">МОДУЛЬ {m.id} · {completed}/{entries.length} УРОКОВ</div><h2>{m.name}</h2><p>{m.desc}</p></div><strong className="module-percent">{Math.round(completed/entries.length*100)}%</strong></div><Meter value={completed/entries.length*100}/><div className="lesson-grid">{entries.map(l=>{const status=lessonStatus(l,progress,exams),locked=status==='locked';return <div className={`lesson-list-item ${locked?'locked':''}`} key={l.id}><div className={`lesson-state ${status}`}>{status==='completed'?<Check size={17}/>:locked?<LockKeyhole size={16}/>:<Play size={16}/>}</div><div className="lesson-list-info"><span className="muted tiny">Урок {l.order}</span><b>{l.title}</b><small>{locked?'Сначала пройди предыдущий урок':status==='completed'?`Пройден · ${progress[l.id].best_score}%`:status==='in_progress'?'Продолжить с сохранённого места':'Доступен для изучения'}</small></div>{locked?<span className="state-label"><LockKeyhole size={15}/> Закрыт</span>:<Link className="icon-link" to={`/lesson/${l.id}`} aria-label={`Открыть урок ${l.title}`}><ArrowRight size={19}/></Link>}</div>})}</div></section>})}
 {filtered.length===0&&<div className="panel empty"><Search size={30}/><h3>Ничего не найдено</h3><p>Попробуй другое название темы.</p></div>}
 </>;
}
