import{Volume2,Pause,VolumeX}from 'lucide-react';
import{useVoice}from '../lib/voice';
import{toLatin}from '../lib/catalog';
export function AudioButton({text,small=false}:{text:string,small?:boolean}){
 const{play,current,status}=useVoice(),active=current===toLatin(text).replace(/\s+/g,' ').trim();
 return <button type="button" className={`audio-btn ${small?'small':''} ${active?'playing':''}`} title="Прослушать на сербском" aria-label={`Прослушать: ${text}`} onClick={()=>void play(text)}>
  {status==='unavailable'&&!active?<VolumeX size={small?15:18}/>:active&&status==='playing'?<Pause size={small?15:18}/>:<Volume2 size={small?15:18}/>}
 </button>;
}
