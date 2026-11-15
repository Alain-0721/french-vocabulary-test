import {defineConfig,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import {pwaBuild} from './scripts/pwa-build.mjs';
import {cloudflareBuild} from './scripts/cloudflare-build.mjs';
import {fileURLToPath} from 'node:url';
import {rmSync} from 'node:fs';
// Cloudflare Pages is the only web deployment: no Netlify mode remains.
const devPrivateFiles=()=>({apply:'build',enforce:'post',closeBundle(){for(const name of ['dev-backup.json','dev-import-backup.html'])try{rmSync(new URL('./dist-cloudflare/'+name,import.meta.url));rmSync(new URL('./dist-android/'+name,import.meta.url));rmSync(new URL('./dist-franlumi-preview/'+name,import.meta.url));}catch{}}});
export default defineConfig(({mode,command})=>{
 const env={...loadEnv(mode,process.cwd(),''),...process.env};
 const grammarPreview=mode==='franlumi-android';
 const cloudflare=!grammarPreview&&mode!=='android';
 if(cloudflare&&command==='build'&&env.FRANMOTEST_ALLOW_UNCONFIGURED!=='true'){
  for(const name of ['VITE_SITE_URL','VITE_SUPABASE_URL','VITE_SUPABASE_ANON_KEY'])if(!env[name])throw Error('Missing migration configuration: '+name);
  for(const name of ['VITE_SITE_URL','VITE_SUPABASE_URL'])if(new URL(env[name]).protocol!=='https:')throw Error('Migration URLs must use HTTPS.');
  const key=env.VITE_SUPABASE_ANON_KEY;
  if(!key.startsWith('sb_publishable_')){
   let role;try{role=JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString()).role;}catch{}
   if(role!=='anon')throw Error('Only a public Supabase anon/publishable key may enter the browser build.');
  }
 }
 return {define:{'import.meta.env.VITE_NATIVE_APP':JSON.stringify(mode==='android'||grammarPreview?'true':'false')},
  plugins:[react(),devPrivateFiles(),...(mode==='android'||grammarPreview?[]:[pwaBuild(),cloudflareBuild()])],
  build:{...(grammarPreview?{rollupOptions:{input:fileURLToPath(new URL('./franlumi-preview.html',import.meta.url))}}:{}),outDir:grammarPreview?'dist-franlumi-preview':mode==='android'?'dist-android':'dist-cloudflare'},server:{host:'127.0.0.1',port:5173}};
});
