"""Create Serbian audio from the locally installed eSpeak Serbian phoneme engine. No provider credentials needed."""
import concurrent.futures,hashlib,json,subprocess,tempfile,pathlib,sys,time
root=pathlib.Path(__file__).resolve().parent.parent
phrases=json.loads((root/'scripts/audio-phrases.json').read_text())
out=root/'public/audio';out.mkdir(parents=True,exist_ok=True)

def one(p):
    file=out/(p['id']+'.mp3')
    if file.is_file() and file.stat().st_size>100:return p['id'],None
    with tempfile.TemporaryDirectory() as tmp:
        wav=pathlib.Path(tmp)/'raw.wav'
        try:
            r=subprocess.run(['espeak','-v','sr','-s','145','-w',str(wav),p['text']],capture_output=True,timeout=18)
            if r.returncode: return p['id'],r.stderr.decode(errors='ignore')[:140]
            r=subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(wav),'-ac','1','-ar','24000','-c:a','libmp3lame','-b:a','32k',str(file)],capture_output=True,timeout=25)
            if r.returncode:return p['id'],r.stderr.decode(errors='ignore')[:140]
            return p['id'],None
        except Exception as ex:return p['id'],str(ex)
start=time.time();bad=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
    for i,(key,err) in enumerate(ex.map(one,phrases),1):
        if err:bad.append((key,err))
        if i%200==0:print('Generated',i,'/',len(phrases),'seconds',round(time.time()-start),flush=True)
manifest={'schemaVersion':1,'locale':'sr-RS','voice':'espeak-sr-basic','quality':'synthetic-basic-requires-human-review','licenseNote':'Generated with locally installed eSpeak Serbian voice; check voice/tool licensing for public redistribution.','entries':{p['id']:{'text':p['text'],'url':'/audio/'+p['id']+'.mp3','contentVersion':1,'reviewStatus':'unreviewed','provider':'eSpeak-sr'} for p in phrases if (out/(p['id']+'.mp3')).is_file()}}
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print('TOTAL',len(phrases),'files',len(manifest['entries']),'errors',len(bad),'MB',round(sum(f.stat().st_size for f in out.glob('*.mp3'))/1e6,1),'sec',round(time.time()-start,1));print('FAILED',bad[:5]);sys.exit(bool(bad))
