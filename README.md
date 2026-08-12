# boss-jd-toolkit

> BOSS直聘 岗位 JD 抓取 + AI 分析 + 履历匹配 · 一站式求职工具包

## 这是什么

一套「抓取 → 分析 → 匹配 → 话术」的求职辅助工具，帮助求职者：

1. **自动抓取** BOSS直聘 的岗位 JD（浏览器扩展）
2. **批量分析** JD 要求并**对接个人履历**做加权匹配（WorkBuddy Skill）
3. **产出对比表** 筛选值得投递的岗位
4. **生成定制话术** 让简历精准匹配目标 JD

## 包含什么

### 1. BOSS直聘 JD 抓取助手（Chrome 扩展）

在 BOSS直聘 页面一键抓取岗位 JD，自动补全公司名/地址/薪资/经验要求。

**安装**：
1. Chrome 地址栏输入 `chrome://extensions`
2. 打开右上角「开发者模式」
3. 点「加载已解压的扩展程序」→ 选择 `boss-jd-extension/` 文件夹

**使用**：
- 列表页（推荐/搜索结果）：点右下角「抓取预览」或按 `⌘⇧J`
- 详情页（岗位详情）：点「抓取JD」
- 抓完点扩展图标 → 「导出JSON」或「复制全部」

### 2. JD Matcher 求职分析 Skill（WorkBuddy 技能）

将导出的 JD JSON 批量分析，按四维框架（硬技能/软素质/领域经验/项目成果）做加权评分，产出汇总对比表和定制简历话术。

**安装**：
1. 打开 WorkBuddy → 左侧「技能」
2. 导入 `jd-matcher-skill/` 文件夹（或安装 `jd-matcher.zip`）
3. 对话中说「开始 JD 分析」或直接粘贴 JD JSON

**使用流程**：
1. 提供简历 → 自动建立四维「匹配基准库」
2. 粘贴 JD JSON → 批量拆解并加权评分
3. 产出汇总对比表（排名+建议）
4. 可选：生成目标岗位的定制简历话术

## 快速开始

```bash
# 1. 安装扩展 → Chrome 加载 boss-jd-extension/

# 2. 在 BOSS直聘 浏览岗位，点「抓取预览」抓取 JD

# 3. 导出 JSON → 粘贴到 WorkBuddy 对话

# 4. 在 WorkBuddy 中说：「帮我一键分析这些 JD」
```

## 目录

```
boss-jd-toolkit/
├── boss-jd-extension/    # MV3 Chrome 扩展
│   ├── manifest.json
│   ├── content.js        # 抓取逻辑
│   ├── intercept.js      # 跳转拦截
│   ├── popup.html / .js  # 弹窗面板
│   └── icons/
├── jd-matcher-skill/     # WorkBuddy 技能
│   └── SKILL.md          # 四维框架+加权评分工作流
└── README.md
```

## 技术栈

- 浏览器扩展：MV3 (Manifest V3) · 纯 JS · Shadow DOM
- JD 分析：WorkBuddy Skill · 四维框架 · 加权评分
- 数据流：本地存储 (chrome.storage) → JSON → WorkBuddy 对话分析

## 更新 skill

WorkBuddy 目前不会自动更新已安装的 skill。如果 GitHub 仓库有更新：

1. 拉取最新代码：`git pull`（或重新下载 SKILL.md）
2. 用新的 `jd-matcher-skill/SKILL.md` 替换 WorkBuddy 技能目录中的同名文件
3. 技能目录位置：`~/.workbuddy/skills/jd-matcher/SKILL.md`（Mac）/ `%USERPROFILE%\.workbuddy\skills\jd-matcher\SKILL.md`（Windows）

## License

MIT
