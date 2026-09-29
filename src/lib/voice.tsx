import{createContext,useContext,useEffect,useRef,useState,type ReactNode}from 'react';
import{audioUrl,serbianVoice}from './audio';
import{toLatin}from './catalog';
export type AudioContextValue={play:(text:string)=>Promise<void>,stop:()=>void,current:string|null,status:string,rate:number,setRate:(n:number)=>void};
const Context=createContext<AudioContextValue|null>(null);
export function VoiceProvider({children}:{children:ReactNode}){
 const ref=useRef<HTMLAudioElement|null>(null);const[current,setCurrent]=useState<string|null>(null);
 const[status,setStatus]=useState('ready');const[rate,setRateState]=useState(1);const rateRef=useRef(1);
 const stop=()=>{ref.current?.pause();ref.current=null;if('speechSynthesis'in window)window.speechSynthesis.cancel();setCurrent(null)};
 useEffect(()=>()=>{ref.current?.pause();if('speechSynthesis'in window)speechSynthesis.cancel()},[]);
 const setRate=(n:number)=>{rateRef.current=n;setRateState(n);if(ref.current)ref.current.playbackRate=n};
 const play=async(text:string)=>{
   const target=toLatin(text).replace(/\s+/g,' ').trim();
   if(current===target && ref.current&&!ref.current.paused){ref.current.pause();setStatus('paused');setCurrent(null);return}
   stop();setCurrent(target);setStatus('loading');const url=audioUrl(target);
   if(url){const audio=new Audio(url);ref.current=audio;audio.playbackRate=rateRef.current;
    audio.addEventListener('ended',()=>{setStatus('ready');setCurrent(null)},{once:true});
    try{await audio.play();setStatus('playing');return}catch{/* fall back only to actual sr-RS voice */}}
   const voice=serbianVoice();
   if(voice){const speech=new SpeechSynthesisUtterance(target);speech.lang='sr-RS';speech.voice=voice;speech.rate=rateRef.current;speech.onend=()=>{setCurrent(null);setStatus('ready')};
    speech.onerror=()=>{setCurrent(null);setStatus('unavailable')};speechSynthesis.speak(speech);setStatus('playing');return}
   setCurrent(null);setStatus('unavailable');
 };
 return <Context.Provider value={{play,stop,current,status,rate,setRate}}>{children}</Context.Provider>;
}
export function useVoice(){const v=useContext(Context);if(!v)throw Error('Missing VoiceProvider');return v}
