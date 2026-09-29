"""Produce UNREVIEWED local Serbian eSpeak demo assets for the DEV-ONLY A0 m1l1..m4l5 drafts.
NOT approved for publication or pronunciation certification until human QA and license review.
"""
import json,subprocess,hashlib,pathlib,tempfile,concurrent.futures
ROOT=pathlib.Path(__file__).resolve().parents[1]
lessons=[json.loads(p.read_text(encoding='utf-8')) for p in sorted(ROOT.glob('supabase/private/pilot-editorial-originals/m*l*.json'))]
texts=set()
for lesson in lessons:
    texts.update(w['sr'] for w in lesson['words'])
    texts.update(e['sr'] for e in lesson['examples'])
    texts.update(x['sr'] for x in lesson['dialogue']['turns'])
    texts.add(lesson['listening']['script'])
assetdir=ROOT/'editorial/pilot-audio';assetdir.mkdir(parents=True,exist_ok=True)
def one(text):
    digest=hashlib.sha256(text.strip().encode('utf8')).hexdigest()[:20]
    out=assetdir/(digest+'.mp3')
    if not out.exists():
        with tempfile.TemporaryDirectory() as td:
            wav=pathlib.Path(td)/'voice.wav'
            a=subprocess.run(['espeak','-v','sr','-s','125','-w',str(wav),text],capture_output=True,timeout=25)
            if a.returncode: raise RuntimeError(f'espeak failed for {text}: {a.stderr[:150]!r}')
            b=subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(wav),'-ac','1','-ar','24000','-c:a','libmp3lame','-b:a','48k',str(out)],capture_output=True,timeout=25)
            if b.returncode: raise RuntimeError(f'ffmpeg failed for {text}: {b.stderr[:150]!r}')
    if out.stat().st_size<400: raise RuntimeError(f'Invalid audio for {text}')
    return text,digest
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    entries=dict(pool.map(one,sorted(texts)))
manifest={'lessonIds':[l['id'] for l in lessons],'contentVersion':2,'locale':'sr-RS','provider':'espeak-sr',
          'reviewStatus':'UNREVIEWED_DEMO_ONLY',
          'licensingStatus':'PENDING_REVIEW_DO_NOT_PUBLISH',
          'entries':{t:{'file':'/__pilot_audio/'+id+'.mp3','audioId':id} for t,id in entries.items()}}
(assetdir/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('PILOT AUDIO GENERATED',len(entries),'assets;',sum(f.stat().st_size for f in assetdir.glob('*.mp3')),'bytes; NOT approved for production')
