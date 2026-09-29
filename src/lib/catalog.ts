import original from '../content/catalog.json';
import type{Lesson,Module,Level,Word,Question}from './types';
export const modules=original.modules as Module[];
export const alphabet=original.alphabet as [string,string,string][];
export const lessons=original.lessons as Lesson[];
export const examQuestions=original.examQuestions as Record<Level,Question[]>;
export const levels:Level[]=['A0','A1','A2','B1','B2'];
export const lessonById=new Map(lessons.map(l=>[l.id,l]));
export const lessonIndex=new Map(lessons.map((l,i)=>[l.id,i]));
export const dictionary=original.dictionary as (Word & {level:Level})[];
export const dictionaryById=new Map(dictionary.map(w=>[w.id,w]));
export const levelNames:Record<Level,string>={A0:'С самого начала',A1:'Базовое общение',A2:'Жизнь в Сербии',B1:'Самостоятельная речь',B2:'Уверенная коммуникация'};
export const LEVEL_COLORS:Record<Level,string>={A0:'#668777',A1:'#35868a',A2:'#5682ad',B1:'#8167a7',B2:'#d39a54'};
export const levelLessons=(level:Level)=>lessons.filter(l=>l.level===level);
export function normalize(text:string){return text.normalize('NFKC').toLocaleLowerCase('sr').replace(/[!?.,:;«»„“"'()—–]/g,'').replace(/\s+/g,' ').trim()}
const latinToCyr:Record<string,string>={a:'а',b:'б',v:'в',g:'г',d:'д',đ:'ђ',e:'е',ž:'ж',z:'з',i:'и',j:'ј',k:'к',l:'л',lj:'љ',m:'м',n:'н',nj:'њ',o:'о',p:'п',r:'р',s:'с',t:'т',ć:'ћ',u:'у',f:'ф',h:'х',c:'ц',č:'ч',dž:'џ',š:'ш'};
const cyrToLatin=Object.fromEntries(Object.entries(latinToCyr).map(([key,value])=>[value,key]));
export function toCyr(text:string){return text.replace(/dž|lj|nj|[a-zčćđšž]/gi,t=>{const v=latinToCyr[t.toLowerCase()];return v?(t===t.toUpperCase()?v.toUpperCase():v):t;})}
export function toLatin(text:string){return text.replace(/[абвгдђежзијклљмнњопрстћуфхцчџш]/gi,t=>{const v=cyrToLatin[t.toLowerCase()];return v?(t===t.toUpperCase()?v[0].toUpperCase()+v.slice(1):v):t;})}
export function chooseScript(text:string,script:'latin'|'cyrillic'){return script==='cyrillic'?toCyr(text):text}
