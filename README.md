# boss-jd-toolkit

> BOSS直聘 / 智联招聘 岗位 JD 抓取助手（Chrome MV3 扩展）

## 这是什么

一个浏览器扩展，在 BOSS直聘 / 智联招聘 岗位页一键抓取 JD 全文到本地，自动展开折叠、自动去重，供后续 AI 分析使用。

> JD 分析部分（`jd-matcher` / `resume-builder` 两个 WorkBuddy Skill）已独立到 [resume-builder 仓库](https://github.com/SyaZHAN/resume-builder)。

## 支持的平台与页面

| 平台 | 详情页 | 列表页 | 说明 |
|---|---|---|---|
| BOSS直聘 | ✅ 完整 JD | ✅ 选中卡片预览 JD | 列表页有预览面板，直接出全文 |
| 智联招聘 | ✅ 完整 JD | ✅ 批量卡片元数据 | 列表页无完整 JD，全文需进详情页补齐 |

## 安装（Chrome / Edge）

1. 地址栏输入 `chrome://extensions`（Edge 用 `edge://extensions`）
2. 打开右上角「开发者模式」
3. 点「加载已解压的扩展程序」→ 选择 `boss-jd-extension/` 文件夹
4. 完成，访问支持页面右下角出现抓取按钮

## 使用

- **列表页**：点「抓取预览 / 批量抓取列表」，或按 `⌘⇧J`（Mac）/ `Ctrl⇧J`（Win）
- **详情页**：点「抓取JD / 抓取智联JD」
- 抓完点扩展图标 → 「导出JSON」或「复制全部」→ 粘贴到 WorkBuddy 做 JD 分析

## 目录

```
boss-jd-toolkit/
├── boss-jd-extension/    # MV3 Chrome 扩展
│   ├── manifest.json
│   ├── content.js        # 抓取逻辑（双平台）
│   ├── intercept.js      # 跳转拦截
│   ├── popup.html / .js  # 弹窗面板
│   └── icons/
└── README.md
```

## 技术栈

- 浏览器扩展：MV3 (Manifest V3) · 纯 JS
- 数据流：本地存储 (chrome.storage.local) → JSON → WorkBuddy 对话分析

## License

MIT
