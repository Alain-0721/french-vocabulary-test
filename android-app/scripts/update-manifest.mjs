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
 notes:'FranLumi 2.1：新增 A1–B1 时态专题、完整变位速查和练习；四本词库加入助记，课本过关与每日检测可点灯泡展开；统一头像设置并优化手机固定导航。保留账号和学习记录。'};
writeFileSync(new URL('../../website/public/android-update.json',import.meta.url),JSON.stringify(manifest,null,2)+'\n');
console.log(`Android update metadata ready: ${manifest.versionName}, build ${manifest.versionCode}`);
