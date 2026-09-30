import{useState,type ChangeEvent}from 'react';
import{Link}from 'react-router-dom';
import{Cloud,Download,Upload,Settings as SettingsIcon,ShieldCheck,AlertTriangle,Trash2,Volume2,UserRound,KeyRound,Mail,RotateCcw}from 'lucide-react';
import{PageHead}from '../components/Layout';
import{useAuth,useProgress}from '../lib/session';
import{getSupabase,errorMessage}from '../lib/supabase';
import{useVoice}from '../lib/voice';
import{audioUrl}from '../lib/audio';
export default function Settings(){const{user,signOut}=useAuth();const{profile,saveProfile,importLegacy,refresh,resetLearning}=useProgress();
 const[name,setName]=useState<string|undefined>(undefined),[script,setScript]=useState<string|undefined>(undefined),[theme,setTheme]=useState<string|undefined>(undefined),[goal,setGoal]=useState<number|undefined>(undefined);
 const[message,setMessage]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[password,setPassword]=useState(''),[resetInput,setResetInput]=useState('');const{play,status,rate,setRate}=useVoice();
 const n=name??profile?.display_name??'Ученик',s=script??profile?.script??'latin',t=theme??profile?.theme??'light',g=goal??profile?.daily_goal??1;
 async function store(){setBusy(true);setError('');try{await saveProfile(n,s,t,g);setMessage('Настройки сохранены в облаке.')}catch(e){setError(errorMessage(e))}finally{setBusy(false)}}
 async function download(){
  if(!user)return;
  setBusy(true);setError('');setMessage('');
  try{
   const client=getSupabase();
   // Supabase can limit each request to 1,000 rows: paginate to archive all attempts.
   async function allRows(table:string){
    const rows:Record<string,unknown>[]=[];let offset=0;
    while(true){
     const {data,error}=await client.from(table).select('*').eq('user_id',user!.id).range(offset,offset+499);
     if(error)throw error;
     rows.push(...((data||[]) as Record<string,unknown>[]));
     if((data||[]).length<500)break;
     offset+=500;
     if(offset>=100000)throw Error('Экспорт слишком велик: обратись к администратору за полным архивом.');
    }
    return rows;
   }
   const [lessonAttempts,examAttempts,wordEvents,legacyExams,imports,legacyLessons,lessonHistory,wordHistory]=await Promise.all([
    allRows('lesson_attempts'),allRows('exam_attempts'),allRows('word_review_events'),
    allRows('legacy_exam_progress'),allRows('import_jobs'),
    allRows('legacy_imported_progress'),allRows('lesson_progress'),allRows('user_word_progress')
   ]);
   const payload={exportVersion:3,exportedAt:new Date().toISOString(),
    warning:'Archive only: this file is NOT supported by automatic restore.',
    profile:profile?{display_name:profile.display_name,script:profile.script,theme:profile.theme,daily_goal:profile.daily_goal,timezone:profile.timezone}:null,
    lesson_progress:lessonHistory,lesson_attempts:lessonAttempts,exam_attempts:examAttempts,
    user_word_progress:wordHistory,word_review_events:wordEvents,
    legacy_imported_progress:legacyLessons,legacy_exam_progress:legacyExams,
    import_jobs:imports.map(({snapshot_json,...rest})=>rest)};
   const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),
    url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download=`srpskilab-cloud-archive-${new Date().toISOString().slice(0,10)}.json`;a.click();
   setTimeout(()=>URL.revokeObjectURL(url),2000);
   setMessage('Архив с уроками, попытками, экзаменами и карточками сохранён. Файл не предназначен для автоматического восстановления после сброса.');
  }catch(e){setError('Ошибка экспорта: '+errorMessage(e))}finally{setBusy(false)}
 }

 async function importFile(e:ChangeEvent<HTMLInputElement>){const file=e.target.files?.[0];e.target.value='';if(!file)return;setBusy(true);setError('');setMessage('');try{
  if(file.size>2_000_000)throw Error('Слишком большой JSON (лимит 2 МБ)');const raw=await file.text();const data=JSON.parse(raw);
  if(data.version!==1||!data.lessons||typeof data.lessons!=='object'||Array.isArray(data.lessons))throw Error('Выбери экспорт старой версии SrpskiLab (version: 1).');
  const lessonMap=data.lessons as Record<string,unknown>;
  const sha=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));const hash=[...new Uint8Array(sha)].map(n=>n.toString(16).padStart(2,'0')).join('');
  if(!window.confirm(`Найдено ${Object.keys(lessonMap).length} записей из старого курса. Они сохранятся как исторические (непроверенные) и не обойдут разблокировку. Импортировать?`))return;
  const summary=await importLegacy(hash,data);setMessage(summary.duplicate?'Этот файл уже был импортирован.':`Импортировано: ${summary.count} записей уроков, ${summary.exams} экзаменов и ${summary.words} слов.`);
 }catch(e){setError(errorMessage(e))}finally{setBusy(false)}}
 async function changePassword(){if(password.length<8){setError('Пароль должен содержать не менее 8 символов.');return}setBusy(true);try{const{error}=await getSupabase().auth.updateUser({password});if(error)throw error;setPassword('');setMessage('Пароль изменён.')}catch(e){setError(errorMessage(e))}finally{setBusy(false)}}
 async function resetProgress(){
  if(resetInput.trim()!=='СБРОСИТЬ'){setError('Введи СБРОСИТЬ заглавными буквами.');return}
  if(!window.confirm('Сбросить результаты всех уроков, экзаменов, карточек и старого импорта? Это необратимое действие; аккаунт останется.'))return;
  setBusy(true);setError('');setMessage('');
  try{
   await resetLearning();setResetInput('');
   setMessage('Учебные результаты удалены с сервера. Можно начинать с первого урока.');
  }catch(e){setError('Не удалось сбросить прогресс: '+errorMessage(e))}
  finally{setBusy(false)}
 }
 async function deleteAccount(){if(!window.confirm('Удалить аккаунт и всю связанную историю обучения без возможности восстановления? Перед удалением скачай резервную копию.'))return;
  const typed=window.prompt('Для подтверждения введи УДАЛИТЬ');if(typed!=='УДАЛИТЬ')return;
  setBusy(true);setError('');try{const{error}=await getSupabase().functions.invoke('delete-account',{body:{confirm:'УДАЛИТЬ'}});if(error)throw error;await signOut();window.location.assign('/');}catch(e){setError(`Удаление не выполнено: ${errorMessage(e)}. Убедись, что Edge Function delete-account опубликована.`)}finally{setBusy(false)}}
 return <><PageHead eyebrow="ТВОЙ КАБИНЕТ" title="Настройки" description="Личные данные, удобный формат занятий, экспорт прогресса и проверка озвучки." icon={SettingsIcon}/><div className="two-col settings-panels"><section className="panel"><h2><UserRound size={22}/> Мой профиль</h2><label className="form-label">Как к тебе обращаться<input className="form-control" maxLength={60} value={n} onChange={e=>setName(e.target.value)}/></label><label className="form-label">Письменность<select className="form-control" value={s} onChange={e=>setScript(e.target.value)}><option value="latin">Latinica — Zdravo</option><option value="cyrillic">Ћирилица — Здраво</option></select></label><label className="form-label">Тема оформления<select className="form-control" value={t} onChange={e=>setTheme(e.target.value)}><option value="light">Светлая</option><option value="dark">Тёмная</option><option value="system">Как в системе</option></select></label><label className="form-label">Цель — уроков в день<select className="form-control" value={g} onChange={e=>setGoal(Number(e.target.value))}>{Array.from({length:10},(_,i)=>i+1).map(x=><option key={x} value={x}>{x}</option>)}</select></label><button className="button button-primary" disabled={busy} onClick={()=>void store()}>Сохранить настройки</button></section>
 <section className="panel"><h2><Volume2 size={22}/> Озвучка</h2><p>Все основные сербские слова и примеры курса имеют предварительно сгенерированную звуковую дорожку. Базовый голос синтетический, не заменяет проверку произношения с носителем.</p><label className="form-label">Скорость воспроизведения<select className="form-control" value={rate} onChange={e=>setRate(Number(e.target.value))}><option value="0.75">Медленно 0,75×</option><option value="1">Обычная 1×</option><option value="1.25">Быстрее 1,25×</option></select></label><button className="button button-secondary" onClick={()=>void play('Dobar dan!')}><Volume2 size={19}/> Проверить произношение</button><p className="tiny muted">Аудиофайл: {audioUrl('Dobar dan!')?'записан в проект':'нет файла'} · Состояние: {status}</p><div className="callout mint"><ShieldCheck size={22}/><div><b>Облачное хранение</b><p>Результаты сохраняются в Supabase. Ты можешь продолжить занятия после входа на другом устройстве.</p></div></div></section>
 <section className="panel"><h2><Cloud size={22}/> Данные и резервные копии</h2><p>Сохрани личный архив: уроки, история попыток, экзамены, карточки и настройки. Важное ограничение: этот JSON предназначен для хранения, автоматическое восстановление после сброса не поддерживается.</p><button disabled={busy} className="button button-secondary fill" onClick={()=>void download()}><Download size={19}/> Скачать архив прогресса</button><div className="section-divider"/><h3>Перенести старый SrpskiLab</h3><p>Экспортируй `srpskilab_progress_v1` из старой версии. Перенесём историю, результаты экзаменов, словарь, карточки и сохранённые события. Импортированные уроки не будут считаться подтверждённым серверным зачётом.</p><label className="button button-secondary fill file-label"><Upload size={18}/> Выбрать старый JSON<input type="file" accept=".json,application/json" onChange={e=>void importFile(e)} hidden/></label><button className="button button-link" onClick={()=>void refresh()}>Обновить данные с сервера</button></section>
 <section className="panel"><h2><ShieldCheck size={22}/> Безопасность</h2><p className="muted">Текущий аккаунт: {user?.email||'—'}</p><h3><KeyRound size={18}/> Сменить пароль</h3><input type="password" className="form-control" autoComplete="new-password" value={password} placeholder="Новый пароль от 8 символов" onChange={e=>setPassword(e.target.value)}/><button disabled={busy||password.length<8} className="button button-secondary" onClick={()=>void changePassword()}>Изменить пароль</button><div className="section-divider"/><h3><Mail size={18}/> Сброс пароля по почте</h3><Link to="/auth/forgot-password">Получить ссылку для восстановления →</Link><div className="section-divider"/><h3><RotateCcw size={18}/> Сброс результатов обучения</h3><p>Удаляет результаты уроков и экзаменов, карточки, историю повторений и импортированный учебный прогресс только в твоём аккаунте. Профиль, email и настройки останутся. Очередь офлайн-попыток и локальные учебные черновики на ЭТОМ устройстве будут очищены после подтверждения сервера.</p><p className="muted">Перед сбросом сохрани архив. Восстановление из этого архива через интерфейс не поддерживается. Старые офлайн-операции с другого устройства больше не смогут вернуть удалённые результаты.</p><label className="form-label" htmlFor="reset-confirm">Для подтверждения напиши СБРОСИТЬ</label><input id="reset-confirm" className="form-control" autoComplete="off" value={resetInput} onChange={e=>setResetInput(e.target.value)} placeholder="СБРОСИТЬ"/><button disabled={busy||resetInput.trim()!=='СБРОСИТЬ'} className="button button-danger" type="button" onClick={()=>void resetProgress()}><AlertTriangle size={17}/> Сбросить результаты обучения</button><div className="section-divider"/><h3><Trash2 size={18}/> Удалить аккаунт</h3><p>Необратимо удаляет профиль и историю на сервере. Сначала скачай резервную копию.</p><button disabled={busy} className="button button-danger" onClick={()=>void deleteAccount()}><AlertTriangle size={17}/> Удалить аккаунт</button></section></div>
 {message&&<div className="form-success" role="status">{message}</div>}{error&&<div className="form-error" role="alert">{error}</div>}
 <div className="callout"><ShieldCheck size={22}/><div><b>Приватность данных</b><p>К чужим результатам доступа нет: Supabase использует RLS, а завершение урока подтверждается серверной функцией.</p></div></div>
 </>;
}
