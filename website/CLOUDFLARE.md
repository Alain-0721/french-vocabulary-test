# FranLumi · Cloudflare 与 Supabase 部署

当前网站为 [franlumi.pages.dev](https://franlumi.pages.dev/)。Cloudflare Pages 提供页面、PWA 和 `/api/*` Worker；Supabase 提供认证、PostgreSQL 与头像存储。

## 数据库与认证

在自己的 Supabase 项目执行 `supabase/migrations/` 中的 SQL。`learning_records` 按认证账号 ID 和 RLS 隔离，保存通过原子 ETag 比较避免覆盖其他设备的新记录。头像使用 `avatars` bucket；上传检查登录、类型、大小和来源。

设置 Supabase Auth 的 Site URL 和邮件回调允许列表为实际网站地址。配置自定义 SMTP，保持注册邮箱确认开启。找回密码使用 `supabase/templates/recovery.html`，验证码长度 6、有效期 600 秒；上线前用测试账号验证确认邮件、恢复邮件、登录与同步。

## 网页构建

在环境或未提交的 `.env.local` 中提供：

```text
VITE_SITE_URL=https://franlumi.pages.dev/
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<公开 anon 或 publishable key>
```

Vite 会把 `VITE_` 变量写入浏览器包，只允许使用公开 key。管理员密钥、签名密钥、账号备份和本机工具放在 Git 忽略的 `.local/`，不能进入 `public/`、环境公开变量或 Worker。

```bash
cd website
npm ci
npm run typecheck
npm run build
npm run test:cloudflare
npm run test:pwa
npm run check:release -- dist-cloudflare
```

默认构建与 `npm run build:cloudflare` 均生成 `dist-cloudflare`，包括 `_worker.js`、`_headers`、`_routes.json` 和离线缓存。`/api/*` 不进入离线缓存，dot 路径也不缓存。构建发布白名单会拒绝私有备份、密钥和未声明文件。

仅本机未配置演示可使用 `FRANMOTEST_ALLOW_UNCONFIGURED=true`，不能用于正式部署。独立设计预览使用 `franlumi-android` 模式。

## Pages Worker 与发布

`wrangler.jsonc` 定义 Pages 配置。部署到自己的项目时，更新项目名与这些 Worker 变量：

- `SUPABASE_URL`、`SUPABASE_ANON_KEY`：与前端一致的项目和公开 key。
- `ALLOWED_ORIGINS`：允许的网站来源，以逗号分隔。现有 App 还需要 `https://franmotest.netlify.app`，它是 APK 的本地虚拟来源，不是远程服务。

在构建与检查通过后，按授权部署：

```bash
npx wrangler pages deploy dist-cloudflare --project-name franlumi --branch preview
npx wrangler pages deploy dist-cloudflare --project-name franlumi --branch main
```

先检查预览，再发布 FranLumi 主站。发布后检查页面、PWA、登录、跨设备同步、ETag 冲突、CORS 和头像。

## Android 兼容约定

Android 与网站复用上述公开配置，API 和认证请求只允许配置的 HTTPS 主机。APK 使用内置静态资源，缺失资源返回 404，不回退请求旧网站。

以下标识必须继续保留，防止覆盖升级失败或已有本机记录不可见：

- 包名与 namespace：`app.netlify.franmotest`。
- 本地 WebView 虚拟来源：`https://franmotest.netlify.app`。页面由 `WebViewAssetLoader` 从 APK 读取，该来源不代表在线托管。
- 原发布签名，以及原有学习存储键、已迁移账号 ID。
- 旧更新器要求的 Release 文件名：`Franmotest-<版本>-Android.apk`；与品牌文件 `FranLumi-<版本>-Android.apk` 必须是同一签名 APK 字节。

工具与签名配置见 [Android README](../android-app/README.md)，本机目录为仓库根 `.local/android-tools/` 和 `.local/android-signing/`。App 从 GitHub 更新清单和 Release 下载更新，校验哈希、包名、版本及签名；覆盖安装，不先卸载。

## 学习数据保留

游客记录按浏览器来源保存，跨网址需导出并导入完整备份。已有账号继续使用原 ID；只有通过本人邮箱验证的会话能读取云端记录。账号和游客缓存分开保存，云端写入使用 ETag 保护已有记录。

旧备份和历史学习缓存继续可读，原文件不被修改。私有历史备份留在 `.local/`，不作为部署资源。数据库定期备份与实际账号验证应在所属服务内完成。
