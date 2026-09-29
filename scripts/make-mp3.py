import pathlib,subprocess,concurrent.futures,time
root=pathlib.Path(__file__).resolve().parent.parent/'public/audio'
files=list(root.glob('*.opus'))

def convert(f):
    out=f.with_suffix('.mp3')
    if out.exists() and out.stat().st_size>100:return None
    p=subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(f),'-ar','24000','-ac','1','-c:a','libmp3lame','-b:a','32k',str(out)],capture_output=True,timeout=20)
    return p.stderr.decode(errors='replace')[:120] if p.returncode else None
bad=[];start=time.time()
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as ex:
    for i,error in enumerate(ex.map(convert,files),1):
        if error:bad.append(error)
        if i%250==0:print('MP3',i,len(files),int(time.time()-start),flush=True)
print('MP3 finished',len(list(root.glob('*.mp3'))),'errors',bad[:5],flush=True)
