#!/usr/bin/env python3
"""Generate synthetic Serbian listening demos for optional B1/B2 capstones.
WARNING: mechanical validity is not linguistic QA and distribution rights need review.
"""
import concurrent.futures,hashlib,json,subprocess,tempfile
from pathlib import Path
R=Path(__file__).resolve().parents[1]
cases=json.loads((R/'src/content/capstones-b1-b2-v5.json').read_text())
index_path=R/'src/content/audio-index.json'
manifest_path=R/'public/audio/manifest.json'
index=json.loads(index_path.read_text())
manifest=json.loads(manifest_path.read_text())
def gen(c):
 text=c['passage']
 key=hashlib.sha256(text.encode('utf8')).hexdigest()[:20]
 path=R/'public/audio'/f'{key}.mp3'
 if not path.is_file():
  with tempfile.TemporaryDirectory() as tmp:
   wav=Path(tmp)/'audio.wav'
   subprocess.run(['espeak','-v','sr','-s','135','-w',str(wav),text],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=90)
   subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(wav),'-ac','1','-ar','24000','-c:a','libmp3lame','-b:a','48k',str(path)],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=90)
 if path.stat().st_size<5000:raise RuntimeError('Audio too small '+str(path))
 return c['id'],text,key,path.stat().st_size
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 result=sorted(pool.map(gen,cases))
for lid,text,key,size in result:
 index[text]=key
 manifest['entries'][key]={'text':text,'url':f'/audio/{key}.mp3','contentVersion':5,'reviewStatus':'unreviewed','provider':'eSpeak-sr','licenseReview':'pending_before_public_distribution'}
 print(lid, key, size)
index_path.write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('Added or updated',len(result),'synthetic capstone audio entries')
