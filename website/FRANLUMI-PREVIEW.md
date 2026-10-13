# FranLumi · 语法之光本地设计预览

设计预览仍可单独本地运行；用户已授权将完成内容整合为 FranLumi 2.0 正式版，入口为 src/site.jsx。

运行：`node node_modules/vite/bin/vite.js --mode franlumi-android --host 127.0.0.1 --port 5180 --strictPort`。

浏览器入口：http://127.0.0.1:5180/franlumi-preview.html 。使用 App 模式定义，不显示浏览器安装与线上更新入口；手机样式仍由窗口宽度决定。

第一次选择单词之光或语法之光；选择、语法阅读、自评、收藏与练习答案通过 `franlumi:local-design:v1` 保存在当前来源。该预览不登录或写入正式后台，不覆盖原词汇账号及游客存储。单词空间复用原本地设计预览，学习记录暂在内存中，后续正式整合时再接入统一账号和持久保存。

语法来源为用户指定的《Édito_B1_2023_全十二单元语法整理.docx》；源文件 SHA-256 保存在 `src/grammar-preview/bank.json`。36 个专题、12 个单元、24 个 Part、69 张知识表格保持文档顺序；未重新逐页核对课本 PDF。`../scripts/import-grammar-preview.py <DOCX路径>` 可重新转换。没有重新分发课本 PDF。

课本原文、知识总结、补充复习分开显示。练习覆盖全部 12 个单元、36 个语法专题，每专题 6 题，共 216 道自编选择练习，均含中文题意及答案解析。题意默认隐藏，点击题目展开或收起，切换题目恢复隐藏。左框选择单元、右框选择对应语法，也可练习单元或全书综合题。原 12 道题保留稳定 ID 与答案位置，已答记录兼容；修改选项按每题最后结果统计。阅读完成不自动记为掌握。题库是学习辅助自编内容，后续仍可继续扩充难度与题型。

检查：`node scripts/test-grammar-preview.mjs`。构建：`node node_modules/vite/bin/vite.js build --mode franlumi-android`，产物在忽略的 `dist-franlumi-preview/`。

本地 Android 预览包采用独立应用 ID 和调试签名，不覆盖正式 Franmotest，不修改正式版本号、下载入口或更新清单。手机与电脑的预览记录也不会自动同步。

题库组织在 `src/grammar-preview/exercises.js` 与四个分单元文件中。题目为原创学习练习，不复制课本原练习；答案按整理文档的规则及明确的题干语境设置，涉及条件式、语气和时间参照的题目须保留相应语境。规则补充核对参考：[OQLF 从句连接词后的语气](https://vitrinelinguistique.oqlf.gouv.qc.ca/24238/la-grammaire/le-verbe/modes/subjonctif/subjonctif-ou-indicatif-apres-les-subordonnants-composes)、[加拿大语言门户 après que](https://nos-langues.canada.ca/fr/juridictionnaire/apres-que)。这些参考不表示原题经过外部机构审核。

顶部栏右侧箭头可收起或展开；收起后保留 44px 紧凑栏与当前学习空间名称。此设备记住展开状态，切换空间、刷新后继续生效；收起时关闭课本和资料菜单。

语法设置与备份已补齐：本机保存状态、完整备份、本书进度导出、校验后导入恢复、浅色/深色/跟随系统、顶部栏控制及使用教程。原 v1 语法备份可继续导入；完整恢复替换语法记录和偏好，本书恢复保留偏好。统计与答案需一致，取消或校验失败不修改记录。单词设置及正式账号保持独立。

正式版使用原多课本账号存储中的 grammar 字段保存语法记录，沿用原账号和 ETag 冲突处理。预览仍使用独立本地键；原语法预览备份可以在正式语法设置中导入。
