import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync,mkdtempSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve,join} from 'node:path';

test('published metadata passes the real legacy Java validator while renamed and unsafe download paths are rejected',()=>{
 const root=resolve('..'),source=readFileSync(join(root,'android-app/app/src/main/java/app/netlify/franmotest/AppUpdater.java'),'utf8');
 const validation=source.match(/    static void validate\(JSONObject data\) throws Exception \{[\s\S]*?\n    \}/)?.[0];assert.ok(validation);
 const release=source.match(/private static final String RELEASE = "([^"]+)";/)?.[1];assert.ok(release);
 const config=JSON.parse(readFileSync(join(root,'.netlify/android-tools/config.json'),'utf8'));
 const dirRoot=join(root,'.netlify/legacy-update-contract');mkdirSync(dirRoot,{recursive:true});const dir=mkdtempSync(join(dirRoot,'check-'));
 const harness=`import java.util.HashMap;
 public class LegacyUpdateContract {
 static final long MAX_APK=64L*1024*1024;static final String RELEASE="${release}";
 static class BuildConfig {static final String APPLICATION_ID="app.netlify.franmotest";}
 static class JSONObject extends HashMap<String,String> {String getString(String key){return get(key);}long getLong(String key){return Long.parseLong(get(key));}}
 ${validation}
 public static void main(String[] args) throws Exception {JSONObject data=new JSONObject();String[] keys={"versionName","apkUrl","versionCode","size","packageId","sha256"};for(int i=0;i<keys.length;i++)data.put(keys[i],args[i]);validate(data);System.out.println("accepted");}
 }
 `;
 writeFileSync(join(dir,'LegacyUpdateContract.java'),harness);
 execFileSync(join(config.jdkPath,'bin/javac.exe'),['LegacyUpdateContract.java'],{cwd:dir,stdio:'pipe'});
 const metadata=JSON.parse(readFileSync('public/android-update.json','utf8'));
 const run=data=>execFileSync(join(config.jdkPath,'bin/java.exe'),['-cp',dir,'LegacyUpdateContract',...['versionName','apkUrl','versionCode','size','packageId','sha256'].map(key=>String(data[key]))],{encoding:'utf8',stdio:'pipe'});
 assert.equal(run(metadata).trim(),'accepted');
 assert.throws(()=>run({...metadata,apkUrl:metadata.apkUrl.replace('/Franmotest-','/FranLumi-')}));
 assert.throws(()=>run({...metadata,apkUrl:'https://evil.example/app.apk'}));
 assert.throws(()=>run({...metadata,packageId:'app.local.franlumi.preview'}));
 assert.throws(()=>run({...metadata,sha256:'invalid'}));
 assert.throws(()=>run({...metadata,versionCode:0}));
});
