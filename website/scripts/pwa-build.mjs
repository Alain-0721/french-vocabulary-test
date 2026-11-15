import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const workerTemplate=readFileSync(fileURLToPath(new URL('../src/service-worker.js',import.meta.url)),'utf8');
const publicFiles=['/favicon.svg','/manifest.webmanifest','/icons/icon-192.png','/icons/icon-512.png','/icons/icon-maskable-512.png','/icons/apple-touch-icon.png'];
// 数据块（data-*.js）不在版本化预缓存里：它们按需下载，由 Service Worker
// 运行时缓存；数据更新只换数据块，不让整包重新下载。
const DATA_CHUNK=/^assets\/data-.*\.js$/;
export function pwaBuild(){return {
 name:'franmo-pwa',apply:'build',
 generateBundle:{order:'post',handler(_options,bundle){
  // Hosting workers are server code, never part of the installed app shell.
  const output=Object.values(bundle).filter(item=>item.fileName==='index.html'||/^assets\/.*\.(js|css)$/.test(item.fileName));
  const shell=output.filter(item=>!DATA_CHUNK.test(item.fileName));
  const hash=createHash('sha256').update(workerTemplate);
  for(const item of shell)hash.update(item.fileName).update(item.type==='chunk'?item.code:String(item.source));
  for(const file of publicFiles)hash.update(readFileSync(fileURLToPath(new URL('../public'+file,import.meta.url))));
  const files=['/index.html',...shell.filter(item=>item.fileName!=='index.html').map(item=>'/'+item.fileName),...publicFiles];
  this.emitFile({type:'asset',fileName:'sw.js',source:workerTemplate.replace('__CACHE_VERSION__',hash.digest('hex').slice(0,16)).replace('__PRECACHE_FILES__',JSON.stringify(files))});
 }}
};}
