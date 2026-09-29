/** Exercise the real React study components over every lesson without browser/server creds. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
require.extensions['.css'] = (module) => { module.exports = {}; };
for (const suffix of ['.ts', '.tsx']) {
  require.extensions[suffix] = (mod, filename) => {
    const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      resolveJsonModule: true,
    }}).outputText;
    mod._compile(compiled, filename);
  };
}
const {studyProgram} = require('../src/lib/study.ts');
const {VoiceProvider} = require('../src/lib/voice.tsx');
const {StudyOverview, StudyDialogue, StudyDrills} = require('../src/components/StudyUnit.tsx');
for (const unit of studyProgram) {
  for (const Component of [StudyOverview, StudyDialogue, StudyDrills]) {
    const html = renderToStaticMarkup(React.createElement(VoiceProvider, null, React.createElement(Component, {unit, script:'latin'})));
    assert(html.length > 150, `${unit.id}: ${Component.name} empty`);
    assert(html.includes('audio-btn') || Component === StudyDrills, `${unit.id}: audio button not rendered`);
  }
}
console.log(`PASS: rendered overview, dialogue, and practice components for all ${studyProgram.length} lessons (795 React SSR renders)`);
