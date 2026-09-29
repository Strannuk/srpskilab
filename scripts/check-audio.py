"""Blocking check that every phrase referenced by source catalog has playable on-disk audio."""
import pathlib,json,subprocess,random,sys
root=pathlib.Path(__file__).resolve().parent.parent
expected=json.loads((root/'scripts/audio-phrases.json').read_text())
manifest=json.loads((root/'public/audio/manifest.json').read_text())
assets=root/'public/audio'
missing=[]
for p in expected:
    entry=manifest['entries'].get(p['id'])
    if not entry or entry['text']!=p['text'] or entry['url']!='/audio/'+p['id']+'.mp3':missing.append((p['id'],'manifest'))
    file=assets/(p['id']+'.mp3')
    if not file.is_file() or file.stat().st_size<500:missing.append((p['id'],'file'))
print('Required Serbian audio phrases:',len(expected))
print('Manifest entries:',len(manifest['entries']))
print('Missing/broken references:',len(missing))
assert not missing,missing[:20]
random.seed(42)
for e in random.sample(expected,min(32,len(expected))):
    path=assets/(e['id']+'.mp3')
    p=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(path)],capture_output=True,text=True)
    assert p.returncode==0 and p.stdout.strip() and float(p.stdout.strip())>0.12,e
print('Sampled audio files decodable (ffprobe):',min(32,len(expected)))
print('AUDIO ASSET CHECK PASSED — phonetic/native QA still required')
