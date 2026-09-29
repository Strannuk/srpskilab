/** Server-render new enrichment without network or Vite; does not simulate a browser. */
const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
require.extensions['.css']=m=>{m.exports={}};
for(const suffix of ['.ts','.tsx'])require.extensions[suffix]=(mod,filename)=>{
 const js=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,resolveJsonModule:true}}).outputText;
 mod._compile(js,filename);
};
const {VoiceProvider}=require('../src/lib/voice.tsx');
const {getEnrichment,ExpandedTheory,ExpandedReading,ExpandedPractice}=require('../src/components/StudyEnrichment.tsx');
const ext=require('../src/content/enriched-245-v4.json');
let rendered=0;
for(const record of ext){
 const lesson=getEnrichment(record.id);assert(lesson&&lesson.id===record.id);
 for(const [C,props] of [[ExpandedTheory,{unit:lesson}],[ExpandedReading,{unit:lesson,script:'latin'}],[ExpandedPractice,{unit:lesson,ownerId:'integration-test',script:'latin'}]]){
  const html=renderToStaticMarkup(React.createElement(VoiceProvider,null,React.createElement(C,props)));
  assert(html.length>300,record.id+': missing content in '+C.name);
  assert(C===ExpandedTheory?html.includes(record.framework.title):(C===ExpandedReading?html.includes('expanded-reading-source')&&html.includes('audio-btn'):html.includes(record.title)),record.id+': no expected lesson content in '+C.name);
  rendered++;
 }
}
console.log('PASS: '+rendered+' React SSR renders of supplementary reading/theory/writing/speaking for all 245 targeted lessons.');
