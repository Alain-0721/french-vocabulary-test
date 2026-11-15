import {defineConfig,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import {pwaBuild} from './scripts/pwa-build.mjs';
import {cloudflareBuild} from './scripts/cloudflare-build.mjs';
import {releaseFilesGuard} from './scripts/release-files.mjs';
import {fileURLToPath} from 'node:url';
export default defineConfig(({mode,command})=>{
 const env={...loadEnv(mode,process.cwd(),''),...process.env};
 const grammarPreview=mode==='franlumi-android';
 const cloudflare=!grammarPreview&&mode!=='android';
 if(!grammarPreview&&command==='build'&&env.FRANMOTEST_ALLOW_UNCONFIGURED!=='true'){
  for(const name of ['VITE_SITE_URL','VITE_SUPABASE_URL','VITE_SUPABASE_ANON_KEY'])if(!env[name])throw Error('Missing backend configuration: '+name);
  for(const name of ['VITE_SITE_URL','VITE_SUPABASE_URL'])if(new URL(env[name]).protocol!=='https:')throw Error('Backend URLs must use HTTPS.');
  const key=env.VITE_SUPABASE_ANON_KEY;
  if(!key.startsWith('sb_publishable_')){
   let role;try{role=JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString()).role;}catch{}
   if(role!=='anon')throw Error('Only a public Supabase anon/publishable key may enter the browser build.');
  }
 }
 return {define:{'import.meta.env.VITE_NATIVE_APP':JSON.stringify(mode==='android'||grammarPreview?'true':'false')},
  plugins:[react(),...(cloudflare?[pwaBuild(),cloudflareBuild()]:[]),releaseFilesGuard()],
  build:{modulePreload:false,rollupOptions:{...(grammarPreview?{input:fileURLToPath(new URL('./franlumi-preview.html',import.meta.url))}:{}),output:{manualChunks(id){
   // 词库与语法数据各自成块，按需加载；PWA 只预缓存应用外壳，不预缓存这些数据块。
   if(id.includes('textbook-bank.json'))return 'data-b1';
   if(id.includes('inspire-a1-bank.json')||id.includes('inspire-a1-titles.json'))return 'data-inspire-a1';
   if(id.includes('edito-a2-2022-bank.json')||id.includes('edito-a2-2022-titles.json'))return 'data-a2';
   if(id.includes('edito-a1-2022-bank.json')||id.includes('edito-a1-2022-titles.json'))return 'data-a1';
   if(id.includes('vocabulary-mnemonics.json'))return 'data-mnemonics';
   if(id.includes('grammar-preview/bank.json'))return 'data-grammar';
   if(id.includes('tense-bank.json'))return 'data-tense';
   if(id.includes('conjugation-bank.json'))return 'data-conjugation';
  }}},outDir:grammarPreview?'dist-franlumi-preview':mode==='android'?'dist-android':'dist-cloudflare'},server:{host:'127.0.0.1',port:5173}};
});
