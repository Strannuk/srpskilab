/** Development-only editorial browser. NO write path to Supabase, NO artificial pass status. */
import {useMemo,useState} from 'react';
import {ArrowLeft,AudioLines,BookOpen,CheckCircle2,ClipboardCheck,Search} from 'lucide-react';
import workbooks from '../content/editorial/workbooks-265.json';
import './CurriculumWorkshop.css';
const levels=['Все','A0','A1','A2','B1','B2'] as const;
type Level=typeof levels[number];
export default function CurriculumWorkshop(){
 const[level,setLevel]=useState<Level>('Все');const[query,setQuery]=useState('');const[selected,setSelected]=useState('m1l1');
 const[showTranscript,setShowTranscript]=useState(false);const[free,setFree]=useState('');
 const filtered=useMemo(()=>workbooks.filter(w=>(level==='Все'||w.level===level)&&`${w.id} ${w.title} ${w.canDo}`.toLocaleLowerCase('ru').includes(query.toLocaleLowerCase('ru'))),[level,query]);
 const item=workbooks.find(w=>w.id===selected)||workbooks[0];
 function choose(id:string){setSelected(id);setShowTranscript(false);setFree('');window.scrollTo({top:0,behavior:'smooth'});}
 return <main className="curr-root">
  <header className="curr-head"><div><span className="curr-kicker">SRPSKILAB 3.0 · РЕДАКТОРСКАЯ МАСТЕРСКАЯ</span><h1>План всех 265 занятий</h1><p>Это не готовый курс: 265 индивидуальных паспортов, практических задач и предварительно подобранных аудиофрагментов. Полные отдельные учебные черновики — первые 20 уроков A0 (m1l1–m4l5). Публиковать остальные как завершённые нельзя.</p></div><a href="/course"><ArrowLeft size={17}/> Старая версия курса</a></header>
  <div className="curr-layout"><aside className="curr-aside">
   <label className="curr-search"><Search size={16}/><input type="search" aria-label="Найти урок" placeholder="Найти ID, тему, умение…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
   <div className="curr-tabs">{levels.map(l=><button type="button" key={l} className={l===level?'selected':''} onClick={()=>setLevel(l)}>{l}</button>)}</div>
   <p>Найдено: {filtered.length} / 265</p>
   <div className="curr-scroll">{filtered.map(x=><button key={x.id} className={selected===x.id?'active':''} onClick={()=>choose(x.id)}><small>{x.id} · {x.level}</small><b>{x.title}</b></button>)}</div>
  </aside>
  <article className="curr-panel" key={item.id}>
   <div className="curr-tags"><span>Уровень {item.level}</span><span>{item.id}</span><span className="curr-draft">Черновик: без зачёта</span></div>
   <h2>{item.title}</h2><section><h3><CheckCircle2 size={20}/> Реальный результат</h3><p>{item.canDo}</p></section>
   {item.level==='A0'&&<a className="curr-action" href={'/lesson/'+item.id}><BookOpen size={17}/> Открыть черновик урока {item.id}</a>}
   <section><h3>Объяснение из прежнего курса (требует расширения)</h3><p>{item.languageFocusNote}</p>{item.extendedSourceNote&&<p>{item.extendedSourceNote}</p>}</section>
   <section><h3>Ситуация для практики</h3><p>{item.scenario}</p><h4>Слова для работы</h4><div className="curr-words">{item.newVocabulary.map(w=><span key={w.id}><b>{w.sr}</b> — {w.ru}</span>)}</div></section>
   <section><h3><AudioLines size={20}/> Отдельное аудирование</h3><p>{item.independentListening.question}</p><audio controls preload="none" src={'/audio/'+item.independentListening.audioId+'.mp3'}/><button className="curr-secondary" onClick={()=>setShowTranscript(v=>!v)}>{showTranscript?'Скрыть текст':'Показать запись ПОСЛЕ прослушивания'}</button>{showTranscript&&<blockquote><b>{item.independentListening.sr}</b><br/>{item.independentListening.ru}</blockquote>}<small>Аудио взято из прежнего модуля и может требовать замены на специальное упражнение по цели урока.</small></section>
   <section><h3><ClipboardCheck size={20}/> Три самостоятельные задачи</h3><ol>{item.controlledTasks.map(t=><li key={t.id}><b>{t.instruction}</b> {t.wordHint&&<span>Вспомогательное слово: {t.wordHint}</span>}</li>)}</ol></section>
   <section><h3>Свободное применение</h3><p>{item.production.assignment}</p><label htmlFor="curr-free">Черновик ответа (только в памяти текущей вкладки)</label><textarea id="curr-free" value={free} onChange={e=>setFree(e.target.value)} placeholder="Сформулируй ответ своими словами по-сербски…"/><h4>Критерии самостоятельной проверки</h4><ul>{item.production.rubric.map(r=><li key={r}>{r}</li>)}</ul><p className="curr-warning">Заполнение текста не является оценкой знаний. Проверка речи и письма человеком ещё не проведена.</p></section>
   <p className="curr-muted">{item.editorNotes}</p>
  </article></div>
 </main>;
}
