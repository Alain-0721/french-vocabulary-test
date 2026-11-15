# FranLumi 2.1.7 · Android App

APK 自带 React 学习界面、四本完整词库、语法、时态与助记，通过原生 Activity 和系统 WebView 运行，首次启动可离线学习。源码版本名为 `2.1.7`、内部版本号 `19`，最低 Android 6.0（API 23）。[下载安装说明](INSTALL.md) · [GitHub Releases](https://github.com/Alain-0721/french-vocabulary-test/releases)。

## 本机资源与账号

`MainActivity` 使用 `WebViewAssetLoader` 读取 APK 内置页面。账号与会话由 Supabase 管理，云端进度和头像请求连接配置的 Cloudflare Pages。缺失静态资源返回 404，不回退旧站。确认邮件与恢复链接映射回内置页面。

原生文件选择器支持词库、备份和头像；导出通过系统保存窗口。返回键先关闭弹窗或菜单，再返回上一页。WebView 禁用文件 URL、明文、混合内容、第三方 Cookie、自动弹窗与发布版调试；不申请广泛存储、相机或定位权限。

包名与 namespace `app.netlify.franmotest`、本地虚拟来源 `https://franmotest.netlify.app`、原发布签名和学习存储键继续保留，用于覆盖升级和读取已有记录；虚拟来源由 APK 本地加载器处理，并非在线服务。原生桥接名称也保持与内置页面一致。

账号用户可联网同步；游客通过完整备份迁移。旧 TWA 浏览器存储与当前 App 数据分别保存，不能假定覆盖安装会读取 Chrome 的私有记录。更新时不要先卸载或清除 App 数据。

## 构建与检查

需要 Node.js 22+、JDK 17、Android SDK Platform 36、Build Tools 36.1.0。Gradle wrapper 为 8.11.1，Android Gradle Plugin 为 8.9.1。先安装 `website` 依赖，并提供 [Cloudflare 部署说明](../website/CLOUDFLARE.md) 中的三个公开 `VITE_` 变量。

`generate.mjs` 以 Vite `android` 模式构建并复制到 `app/src/main/assets/public/`，检查四本词库和原生文件桥接，并排除网站 Service Worker 与更新元数据。生成目录不提交到 Git。

```powershell
# 在 android-app 目录：只生成网页资源
node scripts/generate.mjs

# 构建独立调试包及静态检查，不签署正式发布包
.\gradlew.bat --offline assembleDebug lintDebug
```

本机工具配置位于仓库根 `.local/android-tools/config.json`，包含 `jdkPath` 和 `androidSdkPath`；设置 `JAVA_HOME`、`ANDROID_HOME` 或 Android Studio 的工具路径后再运行 Gradle。

正式发布时，`npm run build` 调用 `build.mjs`，构建 Release/Debug、运行 Lint，并对发布 APK 对齐、签名和校验。签名路径见 `app-config.json`，密码只从 `.local/android-signing/password.json` 读取。密钥、密码和工具不提交到 Git；请单独安全备份，未来升级必须使用同一签名并增加内部版本号。发布产物位于 `.local/releases/android-<版本>/`。

在 `website` 运行 `npm run test:android`，验证原生桥接和真实 Java 更新校验。发布白名单会检查复制的网页资源及最终 APK，不允许调试备份或私钥混入。

## 更新约定

App 从 GitHub main 的更新清单读取版本，从同仓库 Release 下载 APK，校验 SHA-256、大小、包名、版本和签名后进入系统安装窗口。网页版部署不会替换已安装 APK 的界面。

旧更新器要求 `Franmotest-<版本>-Android.apk` 下载名称，因此每次发布需同时提供该兼容文件与 `FranLumi-<版本>-Android.apk`；两者必须是同一签名 APK 字节。`android-update.json` 指向兼容文件名，不存在另一个旧版在线服务。

AndroidX 和保留的 Gradle/icon 模板采用 Apache-2.0；原创代码见根目录 LICENSE，教材数据范围见 DATA_NOTICE.md。
