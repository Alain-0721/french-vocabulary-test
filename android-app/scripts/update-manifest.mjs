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
 notes:`FranLumi ${config.appVersion}：课本过关新增 Part 快捷下拉，显示中法主题名与课本页数；易错复习刷新按钮固定在标题行右侧，优化窄屏标题布局。`};
writeFileSync(new URL('../../website/public/android-update.json',import.meta.url),JSON.stringify(manifest,null,2)+'\n');
console.log(`Android update metadata ready: ${manifest.versionName}, build ${manifest.versionCode}`);
