import {defineConfig,type Plugin} from 'vite';
import react from '@vitejs/plugin-react';
import {createReadStream,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

/** Editorial pilot demo audio, served only by the LOCAL Vite dev server. Not part of dist/Workers. */
function editorialPilotAudio():Plugin {
  const root=path.dirname(fileURLToPath(import.meta.url));
  const source=path.join(root,'editorial/pilot-audio');
  return {
    name:'srpskilab-local-pilot-audio',
    apply:'serve',
    configureServer(server){
      server.middlewares.use('/__pilot_audio',(req,res)=>{
        const raw=(req.url??'/').split('?')[0].replace(/^\//,'');
        if(!/^(manifest\.json|[0-9a-f]{20}\.mp3)$/.test(raw)){res.statusCode=404;res.end('Not found');return}
        const name=path.join(source,raw);
        if(!existsSync(name)){res.statusCode=404;res.end('Not found');return}
        res.setHeader('Content-Type',raw.endsWith('.mp3')?'audio/mpeg':'application/json; charset=utf-8');
        res.setHeader('Cache-Control','no-store');
        createReadStream(name).on('error',()=>{if(!res.headersSent){res.statusCode=500;res.end('Read error')}else res.destroy()}).pipe(res);
      });
    }
  };
}
export default defineConfig({plugins:[react(),editorialPilotAudio()],server:{port:5173},build:{target:'es2022',sourcemap:false}});
