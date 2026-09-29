"""Synthesize unreviewed Serbian demos for unique lesson dialogues.
Generated audio is not independently validated for pronunciation or redistribution.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,as_completed
import hashlib,json,subprocess,tempfile,os
R=Path(__file__).resolve().parents[1]
program=json.loads((R/'src/content/study-program-v3.json').read_text(encoding='utf-8'))
index_path=R/'src/content/audio-index.json'
manifest_path=R/'public/audio/manifest.json'
index=json.loads(index_path.read_text(encoding='utf-8'))
manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
phrases=sorted({turn['sr'].strip() for lesson in program for turn in lesson['dialogue']['turns']})
missing=[text for text in phrases if text not in index]
folder=R/'public/audio';folder.mkdir(exist_ok=True)

def synthesize(text):
    sha=hashlib.sha256(text.encode('utf-8')).hexdigest()[:20]
    target=folder/(sha+'.mp3')
    if not target.exists():
        with tempfile.TemporaryDirectory() as td:
            wav=Path(td)/'speech.wav'
            s=subprocess.run(['espeak','-v','sr','-s','135','-w',str(wav),text],capture_output=True,timeout=20)
            if s.returncode:raise RuntimeError('espeak '+text[:45]+':'+s.stderr.decode(errors='replace')[:200])
            s=subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(wav),'-ac','1','-ar','24000','-c:a','libmp3lame','-b:a','48k',str(target)],capture_output=True,timeout=30)
            if s.returncode:raise RuntimeError('ffmpeg '+text[:45]+':'+s.stderr.decode(errors='replace')[:200])
    if target.stat().st_size<450:raise RuntimeError('Tiny audio '+str(target))
    return text,sha

with ThreadPoolExecutor(max_workers=7) as executor:
    for future in as_completed([executor.submit(synthesize,t) for t in missing]):
        t,sha=future.result()
        index[t]=sha
        manifest['entries'][sha]={
            'text':t,'url':'/audio/'+sha+'.mp3','contentVersion':2,
            'reviewStatus':'unreviewed','provider':'eSpeak-sr',
            'licenseReview':'pending_before_public_distribution'}
index_path.write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('LESSONS',len(program),'DIALOGUE PHRASES',len(phrases),'NEW AUDIO FILES',len(missing),'TOTAL AUDIO INDEX',len(index))
