import {existsSync,readdirSync,readFileSync} from 'node:fs';
import {resolve,relative,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';

const publicFiles=new Set(['favicon.svg','manifest.webmanifest','android-update.json','.well-known/assetlinks.json','icons/apple-touch-icon.png','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png']);
const generatedFiles=new Set(['index.html','franlumi-preview.html','sw.js','_worker.js','_headers','_routes.json']);
const privateName=/(^|\/)(?:dev-[^/]*|\.env(?:\.[^/]*)?|[^/]*\.(?:jks|keystore|pem|key|sqlite3?|db))$/i;
const normalize=name=>name.replaceAll('\\','/');
function assertName(name,{publicOnly=false}={}){
 const file=normalize(name);
 if(file.startsWith('/')||file.split('/').some(part=>part==='..'||part==='.')||privateName.test(file))throw Error('禁止发布私有或调试文件：'+file);
 if(publicFiles.has(file)||!publicOnly&&(generatedFiles.has(file)||/^assets\/[a-z0-9_.-]+\.(?:js|css|woff2?|png|svg|webp)$/i.test(file)))return;
 throw Error('文件不在发布白名单中：'+file);
}
export function assertReleaseDirectory(directory,options={}){
 const root=resolve(directory);
 if(!existsSync(root))throw Error('发布目录不存在：'+root);
 const files=[];
 const walk=dir=>{for(const entry of readdirSync(dir,{withFileTypes:true})){
  const full=join(dir,entry.name),name=normalize(relative(root,full));
  if(entry.isSymbolicLink())throw Error('发布目录不能包含符号链接：'+name);
  if(entry.isDirectory())walk(full);
  else if(entry.isFile()){assertName(name,options);files.push(name);}
  else throw Error('发布目录含不支持的文件：'+name);
 }};
 walk(root);return files;
}

// Read names from the central directory without extracting or executing archives.
// APKs may include a signing block, so local-file-header scanning is insufficient.
export function assertReleaseArchive(filename){
 const bytes=readFileSync(filename);let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(bytes.readUInt32LE(i)===0x06054b50&&i+22+bytes.readUInt16LE(i+20)===bytes.length){end=i;break;}
 if(end<0)throw Error('无法读取 ZIP/APK 目录。');
 const count=bytes.readUInt16LE(end+10),size=bytes.readUInt32LE(end+12),offset=bytes.readUInt32LE(end+16);
 if(bytes.readUInt16LE(end+4)||bytes.readUInt16LE(end+6)||count===65535||offset===0xffffffff||offset+size>end)throw Error('不支持分卷或 ZIP64 发布包。');
 const native=extname(filename).toLowerCase()==='.apk',seen=new Set();let cursor=offset,appFiles=0;
 for(let i=0;i<count;i++){
  if(cursor+46>offset+size||bytes.readUInt32LE(cursor)!==0x02014b50)throw Error('发布包目录损坏。');
  const length=bytes.readUInt16LE(cursor+28),extra=bytes.readUInt16LE(cursor+30),comment=bytes.readUInt16LE(cursor+32);
  if(cursor+46+length+extra+comment>offset+size)throw Error('发布包目录越界。');
  const name=normalize(bytes.subarray(cursor+46,cursor+46+length).toString('utf8'));
  if(seen.has(name)||name.includes('\0')||name.startsWith('/')||name.split('/').includes('..')||privateName.test(name))throw Error('发布包包含不安全文件：'+name);
  seen.add(name);cursor+=46+length+extra+comment;
  if(name.endsWith('/'))continue;
  if(native){if(name.startsWith('assets/public/')){assertName(name.slice(14));appFiles++;}}
  else{assertName(name);appFiles++;}
 }
 if(cursor!==offset+size||!appFiles)throw Error('发布包缺少有效应用文件。');
 return {files:count,appFiles};
}

export function releaseFilesGuard(){
 let config,written=false;
 return {name:'franlumi-release-files',apply:'build',enforce:'post',
  configResolved(value){config=value;},
  buildStart(){if(config.publicDir)assertReleaseDirectory(config.publicDir,{publicOnly:true});},
  generateBundle(_options,bundle){for(const name of Object.keys(bundle))assertName(name);},
  writeBundle(){written=true;},
  closeBundle:{order:'post',handler(){
   if(!written||config.build.write===false)return;
   if(config.publicDir)assertReleaseDirectory(config.publicDir,{publicOnly:true});
   assertReleaseDirectory(resolve(config.root,config.build.outDir));
  }}
 };
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const targets=process.argv.slice(2);if(!targets.length)throw Error('用法：node scripts/release-files.mjs <dist 目录 | 网站 ZIP | APK> ...');
 for(const target of targets){const result=/\.(zip|apk)$/i.test(target)?assertReleaseArchive(target):{files:assertReleaseDirectory(target).length};console.log(JSON.stringify({target,...result}));}
}
