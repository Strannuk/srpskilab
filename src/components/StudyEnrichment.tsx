import {useEffect,useRef,useState} from 'react';
import enrichment from '../content/enriched-245-v4.json';
import {AudioButton} from './AudioButton';
import {chooseScript} from '../lib/catalog';
import './StudyEnrichment.styles.css';

type Script='latin'|'cyrillic';
type Enrichment=typeof enrichment[number];
const supplemental=new Map(enrichment.map(v=>[v.id,v]));
export function getEnrichment(id:string){return supplemental.get(id)}

export function ExpandedTheory({unit}:{unit:Enrichment}){
 return <div className="expanded-theory">
  <section className="expanded-card"><span className="eyebrow">РАЗБОР ТЕМЫ · САМОСТОЯТЕЛЬНАЯ ПРАКТИКА</span><h3>{unit.framework.title}</h3>
   <p>{unit.framework.concept}</p><h4>Правило именно этого урока</h4><p>{unit.framework.lessonRule}</p>
   <h4>Как тренировать</h4><p>{unit.framework.technique}</p>
   <p className="expanded-example">{unit.framework.comparison}</p>
   <p className="expanded-warning"><strong>Внимание:</strong> {unit.framework.warning}</p>
  </section>
  <p className="study-disclaimer">{unit.pedagogicNote}</p>
 </div>;
}

export function ExpandedReading({unit,script}:{unit:Enrichment,script:Script}){
 const [response,setResponse]=useState('');const [revealed,setRevealed]=useState(false);
 return <section className="expanded-card expanded-reading"><span className="eyebrow">ЧТЕНИЕ · БЕЗ ПЕРЕВОДА ДО ОТВЕТА</span>
  <h3>Разбери реплики самостоятельно</h3><p>{unit.reading.task}</p>
  <div className="expanded-reading-source">{unit.reading.passage.map((line,i)=><div key={i}><AudioButton text={line.sr} small/><strong>{chooseScript(line.sr,script)}</strong></div>)}</div>
  <label htmlFor={`expanded-reading-${unit.id}`} className="form-label">Объясни основную мысль своими словами</label>
  <textarea id={`expanded-reading-${unit.id}`} value={response} className="form-control textarea" rows={3} onChange={e=>{setResponse(e.target.value);setRevealed(false)}} placeholder="Сначала напиши самостоятельно…"/>
  <button className="button button-secondary" type="button" disabled={!response.trim()} onClick={()=>setRevealed(v=>!v)}>{revealed?'Скрыть подсказку':'Посмотреть перевод после ответа'}</button>
  {revealed&&<div className="expanded-reveal">{unit.reading.passage.map((line,i)=><p key={i}><b>{line.sr}</b> — {line.ru}</p>)}<small>{unit.reading.note}</small></div>}
 </section>;
}

/** Local-only audio recording: explicit click, no analytics, no uploads. */
export function SpeakingRecorder({keyLabel}:{keyLabel:string}){
 const media=useRef<MediaRecorder|null>(null);const tracks=useRef<MediaStream|null>(null);const audioUrl=useRef<string|null>(null);
 const [status,setStatus]=useState<'idle'|'recording'|'ready'>('idle');const [error,setError]=useState('');const [url,setUrl]=useState<string|null>(null);
 useEffect(()=>()=>{media.current?.state==='recording'&&media.current.stop();tracks.current?.getTracks().forEach(t=>t.stop());if(audioUrl.current)URL.revokeObjectURL(audioUrl.current)},[]);
 async function start(){
  setError('');
  if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){setError('Браузер не поддерживает запись. Произнеси ответ вслух или используй диктофон телефона.');return}
  try{
   const stream=await navigator.mediaDevices.getUserMedia({audio:true});tracks.current=stream;
   const recorder=new MediaRecorder(stream);media.current=recorder;const chunks:Blob[]=[];
   recorder.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data)};
   recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());tracks.current=null;
    if(chunks.length){const blob=new Blob(chunks,{type:recorder.mimeType||'audio/webm'});if(audioUrl.current)URL.revokeObjectURL(audioUrl.current);
     const next=URL.createObjectURL(blob);audioUrl.current=next;setUrl(next);setStatus('ready')}
    else setStatus('idle')};
   recorder.start();setStatus('recording');
  }catch{setError('Нет доступа к микрофону. Проверь разрешение браузера или проговори ответ без записи.');setStatus('idle')}
 }
 function stop(){const r=media.current;if(r?.state==='recording')r.stop()}
 return <div className="expanded-recorder"><div className="expanded-recorder-actions">
  {status!=='recording'?<button type="button" className="button button-secondary" onClick={()=>void start()}>🎙 Записать свою речь (локально)</button>:<button type="button" className="button button-primary" onClick={stop}>■ Остановить запись</button>}
  {status==='recording'&&<span role="status">Идёт запись…</span>}
 </div>{url&&<><label className="form-label" htmlFor={'voice-result-'+keyLabel}>Прослушай свой ответ</label><audio id={'voice-result-'+keyLabel} src={url} controls preload="none"/></>}
 {error&&<p role="alert" className="form-error">{error}</p>}
 <p className="muted">Запись остаётся только в этой вкладке браузера; на Supabase и другие серверы она не отправляется. При уходе со страницы она исчезнет. Разрешение на микрофон запрашивается только по нажатию.</p>
 </div>;
}

export function ExpandedPractice({unit,ownerId,learningEpoch}:{unit:Enrichment,ownerId:string,learningEpoch:string}){
 const storageKey=`srpskilab-v4-draft:${ownerId}:${learningEpoch}:${unit.id}`;
 const [inputs,setInputs]=useState<Record<string,string>>({});const [revealed,setRevealed]=useState<Record<string,boolean>>({});
 const [writing,setWriting]=useState('');const [loaded,setLoaded]=useState(false);const [storageStatus,setStorageStatus]=useState<'saved'|'unavailable'>('saved');
 useEffect(()=>{
  try{const raw=localStorage.getItem(storageKey);if(raw){const data=JSON.parse(raw) as {answers?:Record<string,string>,writing?:string};setInputs(data.answers||{});setWriting(data.writing||'')}}catch{/* Private browsing / blocked storage. */}
  setLoaded(true);
 },[storageKey]);
 useEffect(()=>{if(!loaded)return;try{localStorage.setItem(storageKey,JSON.stringify({answers:inputs,writing}));setStorageStatus('saved')}catch{setStorageStatus('unavailable')}},[storageKey,inputs,writing,loaded]);
 const wordCount=writing.trim()?writing.trim().split(/\s+/u).length:0;
 function eraseDraft(){setWriting('');setInputs({});setRevealed({});try{localStorage.removeItem(storageKey)}catch{setStorageStatus('unavailable')}}
 return <div className="expanded-practice">
  <section className="expanded-card"><span className="eyebrow">СЕМЬ ЗАДАНИЙ · НЕЗАВИСИМАЯ ПРАКТИКА</span><h3>Примени новый навык</h3>
   <p>Напиши ответ перед тем, как открыть образец. Система не ставит баллы за свободные ответы: разные формулировки могут быть правильны.</p>
   {unit.taskList.map((task,i)=><div className="expanded-task" key={task.id}><span className="eyebrow">ЗАДАНИЕ {i+1} / {unit.taskList.length} · {task.label}</span>
    <p>{task.instruction}</p><textarea value={inputs[task.id]||''} className="form-control textarea" rows={3} aria-label={`Ответ на задание ${i+1}`} placeholder="Твой ответ…" onChange={e=>{setInputs(old=>({...old,[task.id]:e.target.value}));setRevealed(old=>({...old,[task.id]:false}))}}/>
    <button type="button" className="button button-secondary" disabled={!inputs[task.id]?.trim()} onClick={()=>setRevealed(old=>({...old,[task.id]:!old[task.id]}))}>{revealed[task.id]?'Скрыть образец':'Открыть образец и критерии'}</button>
    {revealed[task.id]&&<div className="expanded-reveal"><p><b>Ориентир:</b> {task.model}</p><p><b>Проверь:</b> {task.check}</p></div>}
   </div>)}
  </section>
  <section className="expanded-card"><span className="eyebrow">ПИСЬМО · САМОСТОЯТЕЛЬНАЯ РАБОТА</span><h3>Напиши свой текст</h3><p>{unit.writing.prompt}</p>
   <label htmlFor={'writing-'+unit.id} className="form-label">Твой текст на сербском</label><textarea id={'writing-'+unit.id} className="form-control textarea" rows={7} value={writing} onChange={e=>setWriting(e.target.value)} placeholder="Составь сообщение самостоятельно…"/>
   <p className="muted" role="status">Написано слов: {wordCount}. {storageStatus==='saved'?'Черновик хранится локально в этом браузере для текущего аккаунта.':'Локальное сохранение заблокировано — скопируй текст перед выходом.'} Он не синхронизируется между устройствами и не является проверенной работой.</p><button type="button" className="button button-secondary" onClick={eraseDraft}>Очистить локальный черновик</button>
   <h4>Критерии самопроверки</h4><ol>{unit.writing.requirements.map((r,i)=><li key={i}>{r}</li>)}</ol>
  </section>
  <section className="expanded-card"><span className="eyebrow">ГОВОРЕНИЕ · ПРАКТИКА СВОЕЙ РЕЧИ</span><h3>Ответь вслух</h3><p>{unit.speaking.prompt}</p>
   <p>{unit.speaking.followUp}</p><p><b>Ориентир по длительности:</b> {unit.speaking.duration}</p><SpeakingRecorder keyLabel={unit.id}/>
   <h4>Что оценить после записи</h4><ol>{unit.speaking.selfReview.map((r,i)=><li key={i}>{r}</li>)}</ol>
   <p className="study-disclaimer">Распознавание речи и автоматическая оценка произношения отсутствуют. Для объективного зачёта говорения требуется преподаватель.</p>
  </section>
  <section className="expanded-card"><span className="eyebrow">ОТСРОЧЕННОЕ ЗАКРЕПЛЕНИЕ</span><h3>Вернись к теме позже</h3><ol>{unit.review.map((r,i)=><li key={i}>{r}</li>)}</ol></section>
 </div>;
}
