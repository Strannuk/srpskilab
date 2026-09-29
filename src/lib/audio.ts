import ids from '../content/audio-index.json';
import {toLatin}from './catalog';
export const audioIds=ids as Record<string,string>;
export function audioUrl(text:string){const id=audioIds[toLatin(text).replace(/\s+/g,' ').trim()];return id?`/audio/${id}.mp3`:null;}
export function serbianVoice():SpeechSynthesisVoice|undefined{return typeof speechSynthesis!=='undefined'?speechSynthesis.getVoices().find(v=>/^sr([_-]|$)/i.test(v.lang)):undefined}
