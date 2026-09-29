import {useState} from 'react';
import {AudioButton} from './AudioButton';
import {chooseScript} from '../lib/catalog';
import type{StudyUnit}from '../lib/study';
import './StudyUnit.css';

type Script='latin'|'cyrillic';

/** Creative exercises are self-checked; independent seven-question v3 Supabase RPC
 * grades lesson completion, not free speech or original writing. */
export function StudyOverview({unit,script}:{unit:StudyUnit,script:Script}){
 return <div className="study-overview">
  <div className="study-goal"><span className="eyebrow">Индивидуальная учебная цель · {unit.id}</span><strong>{unit.canDo}</strong>
  <p>Убедись, что можешь выполнить задачу своими словами, а не только выбрать перевод.</p></div>
  {unit.secondaryExplanation?.map((point,i)=><section className="study-theory" key={i}><h3>{point.title}</h3><p>{point.text}</p><p className="study-tip">{point.tip}</p></section>)}
  <h3>Целевые реплики урока</h3><p className="muted">Попробуй сначала понять сербское предложение и только потом посмотри русский перевод.</p>
  <div className="study-phrases">{unit.dialogue.turns.map((turn,i)=><div className="study-phrase" key={i}><AudioButton text={turn.sr}/><div><strong>{chooseScript(turn.sr,script)}</strong><small>{turn.ru}</small></div></div>)}</div>
  <div className="study-checkpoints"><h3>Что потребуется сделать самостоятельно</h3><ol>{unit.successCriteria.map((v,i)=><li key={i}>{v}</li>)}</ol></div>
  {!unit.validatedByHuman&&<p className="study-disclaimer">Учебная редакция: новые материалы и синтетическая озвучка не проходили независимую проверку сербоязычным преподавателем. Особенно внимательно проверяй фонетику и письменные формулировки.</p>}
 </div>;
}
export function StudyDialogue({unit,script}:{unit:StudyUnit,script:Script}){
 const[translations,setTranslations]=useState(false);
 const[heard,setHeard]=useState('');const[revealed,setRevealed]=useState(false);
 return <div className="study-dialogue">
  <p className="muted">{unit.dialogue.scenario}</p>
  <div className="study-thread">{unit.dialogue.turns.map((turn,i)=><div key={i} className={'study-turn '+(i%2?'reply':'')}><span>{turn.by}</span><div><AudioButton text={turn.sr} small/><strong>{chooseScript(turn.sr,script)}</strong>{translations&&<small>{turn.ru}</small>}</div></div>)}</div>
  <button type="button" className="button button-secondary" onClick={()=>setTranslations(p=>!p)}>{translations?'Скрыть перевод':'Показать перевод'}</button>
  <section className="study-listening"><span className="eyebrow">Аудирование без транскрипта</span><h3>Послушай отдельную реплику</h3><p>Это запись из исходного корпуса: сначала слушай, затем передай смысл своими словами.</p>
  <AudioButton text={unit.listening.sr}/><label className="form-label" htmlFor={'listen-'+unit.id}>{unit.listening.question}</label><textarea id={'listen-'+unit.id} className="form-control textarea" rows={3} value={heard} placeholder="Напиши, что услышал и понял…" onChange={e=>{setHeard(e.target.value);setRevealed(false)}}/>
  <button type="button" className="button button-secondary" disabled={!heard.trim()} onClick={()=>setRevealed(true)}>Посмотреть транскрипт после своей попытки</button>
  {revealed&&<div className="study-reveal"><b>{chooseScript(unit.listening.sr,script)}</b><p>{unit.listening.ru}</p><small>Это образец для сравнения, а не автоматическая проверка восприятия на слух.</small></div>}</section>
 </div>;
}
export function StudyDrills({unit,script}:{unit:StudyUnit,script:Script}){
 const[attempts,setAttempts]=useState<Record<string,string>>({});
 const[revealed,setRevealed]=useState<Record<string,boolean>>({});
 return <section className="study-drills">
  <h3>Пять заданий на активное воспроизведение</h3><p>Сначала напиши собственный ответ, затем открой образец. Здесь нет автоматического процента: несколько разных ответов могут быть правильными.</p>
  {unit.guided.map((g,i)=><div key={g.id} className="study-task"><span className="eyebrow">ЗАДАНИЕ {i+1} / {unit.guided.length}</span><h4>{g.prompt}</h4>
   {g.kind==='choice'&&g.options.length>0?<div className="study-task-choices">{g.options.map(o=><label key={o}><input name={g.id} type="radio" checked={attempts[g.id]===o} onChange={()=>{setAttempts(a=>({...a,[g.id]:o}));setRevealed(x=>({...x,[g.id]:false}))}}/>{chooseScript(o,script)}</label>)}</div>:<textarea className="form-control textarea" rows={2} aria-label={'Ответ на '+g.id} placeholder="Сначала напиши свой ответ…" value={attempts[g.id]||''} onChange={e=>{const next=e.target.value;setAttempts(a=>({...a,[g.id]:next}));setRevealed(x=>({...x,[g.id]:false}))}}/>}
   <button type="button" className="button button-secondary" disabled={!attempts[g.id]?.trim()} onClick={()=>setRevealed(x=>({...x,[g.id]:true}))}>Сравнить с образцом</button>
   {revealed[g.id]&&<div className="study-reveal"><b>Один из образцов: {chooseScript(g.answer,script)}</b><p>{g.explanation}</p>{g.kind==='choice'&&<p>{attempts[g.id]===g.answer?'Выбран образец.':'Ты выбрал другой вариант — проверь правило ещё раз.'}</p>}</div>}</div>)}
  <div className="study-production"><h3>Самостоятельное письмо и разговор</h3><p>{unit.writingPrompt}</p><p><strong>Проговори вслух:</strong> {unit.oralPrompt}</p><h4>Критерии самопроверки</h4><ul>{unit.rubric.map((r,i)=><li key={i}>{r}</li>)}</ul><p className="muted">Свободное письмо и произношение требуют самостоятельной или преподавательской проверки; они не считаются автоматически оценёнными.</p></div>
  <div className="study-homework"><h3>Домашнее задание</h3><ol>{unit.homework.map((h,i)=><li key={i}>{h}</li>)}</ol></div>
 </section>;
}
