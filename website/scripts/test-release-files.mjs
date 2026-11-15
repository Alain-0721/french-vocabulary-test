import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {build} from 'vite';
import {assertReleaseDirectory,assertReleaseArchive,releaseFilesGuard} from './release-files.mjs';

const sandbox=resolve('.local/release-file-tests');mkdirSync(sandbox,{recursive:true});
const temporary=()=>mkdtempSync(join(sandbox,'case-'));
const write=(root,name,text='fixture')=>{const file=join(root,name);mkdirSync(resolve(file,'..'),{recursive:true});writeFileSync(file,text);return file;};
function cleanup(root){if(!root.startsWith(sandbox+'\\')&&!root.startsWith(sandbox+'/'))throw Error('Unsafe test cleanup');rmSync(root,{recursive:true,force:true});}

test('public files use an explicit allowlist and private fixtures are rejected without deletion',()=>{
 const root=temporary();try{
  write(root,'favicon.svg');write(root,'icons/icon-192.png');assert.equal(assertReleaseDirectory(root,{publicOnly:true}).length,2);
  const backup=write(root,'dev-backup.json','synthetic-private');
  assert.throws(()=>assertReleaseDirectory(root,{publicOnly:true}),/禁止发布/);assert.equal(readFileSync(backup,'utf8'),'synthetic-private');
 }finally{cleanup(root);}
});
test('unexpected nested files and renamed backups cannot slip into a release directory',()=>{
 for(const name of ['nested/notes.json','assets/private.json','credentials.jks','.env.production','copy-of-records.json']){
  const root=temporary();try{write(root,'index.html');write(root,name);assert.throws(()=>assertReleaseDirectory(root));}finally{cleanup(root);}
 }
});
test('guard supports a first build and custom outDir without depending on sibling dist directories',async()=>{
 const root=temporary();try{
  write(root,'index.html','<html><body>Safe test</body></html>');write(root,'public/favicon.svg','<svg/>');
  const outDir=join(root,'separate-output');
  await build({configFile:false,root,logLevel:'silent',plugins:[releaseFilesGuard()],build:{outDir}});
  assert.ok(existsSync(join(outDir,'index.html')));assert.equal(assertReleaseDirectory(outDir).length,2);
  write(root,'public/dev-import-backup.html');
  await assert.rejects(build({configFile:false,root,logLevel:'silent',plugins:[releaseFilesGuard()],build:{outDir}}),/禁止发布/);
 }finally{cleanup(root);}
});
test('guard fails on private files emitted by another build plugin',async()=>{
 const root=temporary();try{
  write(root,'index.html','<html><body>Safe test</body></html>');
  await assert.rejects(build({configFile:false,root,publicDir:false,logLevel:'silent',plugins:[{name:'inject-private',generateBundle(){this.emitFile({type:'asset',fileName:'dev-backup.json',source:'synthetic'})}},releaseFilesGuard()],build:{outDir:join(root,'out')}}),/禁止发布/);
 }finally{cleanup(root);}
});

// Minimal central-directory archive: no extraction or external ZIP tool needed.
function archive(names){
 const entries=names.map(name=>{const n=Buffer.from(name),header=Buffer.alloc(46);header.writeUInt32LE(0x02014b50);header.writeUInt16LE(n.length,28);return Buffer.concat([header,n]);});
 const directory=Buffer.concat(entries),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(names.length,8);end.writeUInt16LE(names.length,10);end.writeUInt32LE(directory.length,12);return Buffer.concat([directory,end]);
}
test('final website ZIP and APK assets reject debug backups, signing keys and malformed archives',()=>{
 const root=temporary();try{
  const zip=write(root,'site.zip',archive(['index.html','assets/app-A1.js']));assert.equal(assertReleaseArchive(zip).appFiles,2);
  const apk=write(root,'app.apk',archive(['AndroidManifest.xml','classes.dex','assets/public/index.html','assets/public/assets/app-A1.js']));assert.equal(assertReleaseArchive(apk).appFiles,2);
  for(const [name,files] of [['private.zip',['index.html','dev-backup.json']],['private.apk',['classes.dex','assets/public/index.html','assets/public/dev-backup.json']],['key.apk',['classes.dex','assets/public/index.html','secret.jks']],['traversal.zip',['../index.html']]])assert.throws(()=>assertReleaseArchive(write(root,name,archive(files))));
  assert.throws(()=>assertReleaseArchive(write(root,'bad.zip','not-a-zip')));
 }finally{cleanup(root);}
});
