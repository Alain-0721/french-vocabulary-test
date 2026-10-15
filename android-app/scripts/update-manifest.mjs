import {readFileSync,writeFileSync,statSync,copyFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const config=JSON.parse(readFileSync(new URL('../app-config.json',import.meta.url),'utf8'));
const apk=new URL(`../../.netlify/releases/android-${config.appVersion}/FranLumi-${config.appVersion}-Android.apk`,import.meta.url);
// Already installed updaters validate this exact historical filename.
// Publish both names with identical signed bytes; keep the on-device contract stable.
const compatibleApk=new URL(`../../.netlify/releases/android-${config.appVersion}/Franmotest-${config.appVersion}-Android.apk`,import.meta.url);
copyFileSync(apk,compatibleApk);
const manifest={schema:1,packageId:config.packageId,versionName:config.appVersion,versionCode:config.appVersionCode,
 apkUrl:`https://github.com/Alain-0721/french-vocabulary-test/releases/download/v${config.appVersion}/Franmotest-${config.appVersion}-Android.apk`,
 sha256:createHash('sha256').update(readFileSync(apk)).digest('hex'),size:statSync(apk).size,
 notes:'FranLumi 2.1.1：加快打开速度，先恢复本机学习界面，账号验证和云端同步改在后台进行。网络慢时也可继续学习，保留等待期间的新操作和原账号记录。'};
writeFileSync(new URL('../../website/public/android-update.json',import.meta.url),JSON.stringify(manifest,null,2)+'\n');
console.log(`Android update metadata ready: ${manifest.versionName}, build ${manifest.versionCode}`);
