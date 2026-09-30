import {useEffect,useState} from 'react';
import data from '../content/capstones-b1-b2-v5.json';
import {AudioButton} from './AudioButton';
import {chooseScript} from '../lib/catalog';
import {SpeakingRecorder} from './StudyEnrichment';
import './StudyEnrichment.styles.css';

type Capstone=typeof data[number];
const map=new Map(data.map(x=>[x.id,x]));
export const getCapstone=(id:string|undefined)=>id?map.get(id):undefined;

/** An original additional reading/listening workshop for the 14 B1/B2 capstones.
 * Automated grades are NOT awarded for uncontrolled writing/speech.
 */
export function CapstoneWorkshop({unit,script,ownerId,learningEpoch}:{unit:Capstone,script:'latin'|'cyrillic',ownerId:string,learningEpoch:string}){
 const key=`srpskilab-v5-capstone:${ownerId}:${learningEpoch}:${unit.id}`;
 const [summary,setSummary]=useState('');
 const [showTranscript,setShowTranscript]=useState(false);
 const [answers,setAnswers]=useState<Record<string,string>>({});
 const [models,setModels]=useState<Record<string,boolean>>({});
 const [writing,setWriting]=useState('');
 const [loaded,setLoaded]=useState(false);
 const [saved,setSaved]=useState(true);
 useEffect(()=>{
  setLoaded(false);setSummary('');setShowTranscript(false);setAnswers({});setModels({});setWriting('');
  try{const old=localStorage.getItem(key);if(old){const v=JSON.parse(old) as {summary?:string,answers?:Record<string,string>,writing?:string};setSummary(v.summary||'');setAnswers(v.answers||{});setWriting(v.writing||'')}}catch{/* storage may be unavailable */}
  setLoaded(true);
 },[key]);
 useEffect(()=>{if(!loaded)return;try{localStorage.setItem(key,JSON.stringify({summary,answers,writing}));setSaved(true)}catch{setSaved(false)}},[key,loaded,summary,answers,writing]);
 function clear(){try{localStorage.removeItem(key)}catch{setSaved(false)}setSummary('');setAnswers({});setModels({});setWriting('');setShowTranscript(false)}
 return <section className="capstone-workshop expanded-practice" aria-label={`Расширенный практикум ${unit.level}`}>
  <div className="expanded-card">
   <span className="eyebrow">ДОПОЛНИТЕЛЬНЫЙ ПРАКТИКУМ · {unit.level} · {unit.id}</span>
   <h3>{unit.title}</h3>
   <p>Оригинальный учебный текст. Сначала проверь слух без видимого транскрипта; если аудио недоступно, перейди к чтению.</p>
   <p className="study-disclaimer">Аудиозапись синтетическая, фонетически не проверена носителем. Свободные ответы не оцениваются автоматически и не меняют зачёт урока.</p>
   <AudioButton text={unit.passage}/>
   <label htmlFor={`capstone-summary-${unit.id}`} className="form-label">Что произошло? Запиши основную мысль на русском или сербском ДО просмотра текста.</label>
   <textarea id={`capstone-summary-${unit.id}`} rows={4} className="form-control textarea" value={summary} onChange={e=>{setSummary(e.target.value);setShowTranscript(false)}} placeholder="Сначала прослушай запись…"/>
   <button className="button button-secondary" disabled={!summary.trim()} onClick={()=>setShowTranscript(v=>!v)}>{showTranscript?'Скрыть текст':'Открыть транскрипт после попытки'}</button>
   {showTranscript&&<div className="expanded-reveal" style={{whiteSpace:'pre-line'}} lang="sr"><p>{chooseScript(unit.passage,script)}</p></div>}
  </div>
  <div className="expanded-card">
   <h3>Четыре вопроса на понимание и интерпретацию</h3>
   <p>Ответь без переписывания текста. Сравни смысл и аргументацию, а не отдельные слова.</p>
   {unit.questions.map((q,i)=><div className="expanded-task" key={q.id}>
    <label className="form-label" htmlFor={q.id}>Вопрос {i+1}. {q.question}</label>
    <textarea id={q.id} className="form-control textarea" rows={3} value={answers[q.id]||''} onChange={e=>{setAnswers(old=>({...old,[q.id]:e.target.value}));setModels(old=>({...old,[q.id]:false}))}} placeholder="Твой ответ…"/>
    <button className="button button-secondary" disabled={!answers[q.id]?.trim()} onClick={()=>setModels(old=>({...old,[q.id]:!old[q.id]}))}>{models[q.id]?'Скрыть модель':'Открыть ориентир после ответа'}</button>
    {models[q.id]&&<div className="expanded-reveal"><strong>Ориентир:</strong> {q.model}</div>}
   </div>)}
  </div>
  <div className="expanded-card">
   <span className="eyebrow">ПИСЬМО · ОТКРЫТАЯ ЗАДАЧА</span>
   <h3>Самостоятельный текст</h3><p>{unit.writing}</p>
   <label className="form-label" htmlFor={`capstone-writing-${unit.id}`}>Твой текст на сербском</label>
   <textarea id={`capstone-writing-${unit.id}`} className="form-control textarea" rows={9} value={writing} onChange={e=>setWriting(e.target.value)} placeholder="Напиши самостоятельно, затем перечитай и исправь ошибки…"/>
   <p className="muted">Слов: {writing.trim()?writing.trim().split(/\s+/).length:0}. {saved?'Черновик сохраняется в этом браузере.':'Локальное сохранение недоступно — скопируй свой текст.'}</p>
   <h4>Рубрика самопроверки</h4>
   <ol><li>Ответ соответствует поставленной задаче и адресату.</li><li>Есть вступление, несколько связанных мыслей и вывод.</li><li>Использованы точные грамматические формы и уместные связки.</li><li>Позиция другой стороны передана без искажения там, где это нужно.</li><li>Ошибки и спорные выражения отмечены для проверки с преподавателем.</li></ol>
  </div>
  <div className="expanded-card">
   <span className="eyebrow">ГОВОРЕНИЕ · НЕАВТОМАТИЧЕСКАЯ ОЦЕНКА</span>
   <h3>Ответ без подсказок</h3><p>{unit.speaking}</p><SpeakingRecorder keyLabel={'capstone-'+unit.id}/>
   <p className="muted">Для внешнего подтверждения B1/B2 требуется независимая оценка речи и письма. Пройденный тест на платформе не равен сертификату.</p>
   <button className="button button-secondary" onClick={clear}>Удалить этот локальный черновик</button>
  </div>
 </section>;
}
