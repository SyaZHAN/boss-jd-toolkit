// BOSS直聘 JD 抓取助手 — 内容脚本（v3：基于真实页面结构重写）
// 支持：详情页抓取 + 列表页预览抓取 + 薪资字体解码 + 公司/地址抓取 + jobId 去重

(() => {
  'use strict';

  const STORAGE_KEY = 'bossJdList';
  const FLOAT_BTN_ID = 'boss-jd-capture-btn';
  const TOAST_ID = 'boss-jd-toast';

  // ---------- 工具 ----------
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function simpleHash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    }
    return h.toString(36);
  }

  const pick = (selectors, root = document) => {
    for (const sel of selectors) {
      try {
        const el = root.querySelector(sel);
        if (el) return el;
      } catch (e) { /* 选择器无效则跳过 */ }
    }
    return null;
  };

  const pickText = (selectors, root = document) => {
    const el = pick(selectors, root);
    if (!el) return '';
    return (el.innerText || el.textContent || '').trim();
  };

  // ---------- 薪资字体解码（BOSS 用 iconfont 把数字映射到 \ue031-\ue03a） ----------
  // 已验证映射：e031=0, e032=1, ..., e03a=9（线性连续）
  function decodeSalary(text) {
    if (!text) return '';
    const map = {};
    for (let i = 0; i < 10; i++) {
      map[String.fromCharCode(0xe031 + i)] = String(i);
    }
    return [...text].map((ch) => (map[ch] !== undefined ? map[ch] : ch)).join('');
  }

  // ---------- 页面类型识别 ----------
  function getPageType() {
    const url = location.href;
    if (/\/job_detail\//.test(url)) return 'detail';
    if (/\/web\/geek\/(jobs|recommend|search)/.test(url)) return 'list';
    return 'other';
  }

  // ---------- 公司名抓取 ----------
  function extractCompany(root) {
    const candidates = [
      // 列表卡片（真实结构）
      'a.boss-info',
      '.boss-info',
      '.job-card-wrap.active .boss-info',
      '.job-card-box .boss-info',
      // 详情页
      '.job-banner .company-info .name a',
      '.job-banner .company-info .name',
      '.job-detail .company-info .name',
      // 通用
      '.company-info .name a',
      '.company-info .name',
      '.company-name a',
      '.company-name',
      '[class*="company-name"]'
    ];
    let name = pickText(candidates, root || document);
    if (!name) name = pickText(candidates, document);
    return name.replace(/\s*(HR|人事|招聘).*$/i, '').trim();
  }

  // ---------- 地址抓取 ----------
  function extractAddress(root) {
    const candidates = [
      'span.company-location',
      '.company-location',
      '.job-card-wrap.active .company-location',
      '.job-card-box .company-location',
      '.job-area',
      '.job-banner .info-primary .job-area',
      '[class*="job-area"]'
    ];
    let addr = pickText(candidates, root || document);
    if (!addr) addr = pickText(candidates, document);
    return addr;
  }

  // ---------- 从 JD 文本提取工作地点（兜底） ----------
  function parseWorkLocation(fullText) {
    if (!fullText) return '';
    const m = fullText.match(/工作地点[：:]\s*([^\n]+)/);
    return m ? m[1].trim() : '';
  }

  // ---------- 详情页抓取 ----------
  function extractFromDetail() {
    const jobName =
      pickText(['.job-banner .info-primary h1', '.name h1', '.job-name h1', 'h1']) ||
      pickText(['.job-banner .info-primary .name', '.job-primary .name']) ||
      document.title.replace(/_\d+.*$/, '').replace(/招聘信息/, '').trim();

    const salary = decodeSalary(pickText([
      '.job-banner .salary',
      '.job-banner .info-primary .salary',
      '.info-primary .salary',
      '.job-salary'
    ]));

    const limitText = pickText([
      '.job-banner .info-primary p',
      '.job-limit p',
      '.job-primary .info-primary p',
      '.job-info p'
    ]);

    const company = extractCompany(document);
    const address = extractAddress(document) || parseWorkLocation();

    const descEl = pick([
      '.job-sec-text',
      '.detail-content .job-sec-text',
      '.job-detail .job-sec-text',
      '.job-description .text',
      '.job-sec .text'
    ]);
    const fullText = descEl ? (descEl.innerText || descEl.textContent || '').trim() : '';

    const jobIdMatch = location.href.match(/\/job_detail\/([a-zA-Z0-9]+)/);
    const jobId = jobIdMatch ? jobIdMatch[1] : null;

    return {
      url: location.href.split('?')[0],
      jobId,
      jobName,
      salary,
      company,
      address,
      limitText,
      fullText
    };
  }

  // ---------- 列表页预览面板抓取（真实结构 v3） ----------
  function extractFromListPreview() {
    // 当前选中卡片：.job-card-wrap.active
    const activeCard = pick(['.job-card-wrap.active', '.job-card-wrap.is-seen.active']) ||
      pick(['.job-card-wrap', '[class*="job-card-wrap"]']);
    const cardRoot = activeCard || document;

    // jobId：从卡片内 job_detail 链接
    const detailLink = pick(['a.job-name', 'a[href*="/job_detail/"]'], cardRoot);
    const jobIdMatch = detailLink ? detailLink.href.match(/\/job_detail\/([a-zA-Z0-9]+)/) : null;
    const jobId = jobIdMatch ? jobIdMatch[1] : null;

    // 公司名 + 地址：来自卡片（预览面板里没有）
    const company = extractCompany(cardRoot);
    const address = extractAddress(cardRoot);

    // 岗位名/薪资/标签/JD：来自预览面板 .job-detail-box
    const previewBox = pick(['.job-detail-box', '.job-detail-container']) || document;

    const jobName = pickText([
      '.job-detail-box .job-name',
      '.job-detail-info .job-name',
      '.job-header-info .job-name',
      '.job-name'
    ], previewBox) || pickText(['.job-name'], cardRoot) || pickText(['h1']);

    const salary = decodeSalary(pickText([
      '.job-detail-box .job-salary',
      '.job-detail-info .job-salary',
      '.job-header-info .job-salary',
      '.job-salary'
    ], previewBox)) || pickText(['.job-card-wrap.active .job-salary'], cardRoot);

    // 标签：城市/经验/学历
    const limitText = pickText([
      '.job-detail-box .tag-list',
      '.job-detail-box .job-label-list',
      '.tag-list',
      '.job-limit'
    ], previewBox);

    // JD 描述：预览面板 .desc 或 .job-sec-text
    let fullText = pickText([
      '.job-detail-body .desc',
      '.job-detail-body .job-sec-text',
      '.job-detail-body .text',
      '.job-detail-box .desc',
      '.desc'
    ], previewBox);
    if (!fullText || fullText.length < 50) {
      // 兜底：扫描预览面板最长的文本块
      let longest = '';
      previewBox.querySelectorAll('div, section, article, p').forEach((el) => {
        const t = (el.innerText || '').trim();
        if (t.length > longest.length && t.length > 100) longest = t;
      });
      if (longest) fullText = longest;
    }

    return {
      url: location.href,
      jobId,
      jobName,
      salary,
      company,
      address,
      limitText,
      fullText
    };
  }

  // ---------- 自动展开折叠 ----------
  async function expandDescription(root = document) {
    const candidates = [
      '.job-sec-text .more',
      '.job-sec-text .job-sec-more',
      '.job-sec-text .text-more',
      'div[class*="more"]',
      'span[class*="more"]',
      'a[class*="more"]'
    ];
    let clicked = false;
    for (const sel of candidates) {
      try {
        const els = root.querySelectorAll(sel);
        for (const el of els) {
          const t = (el.innerText || '').trim();
          if (/查看更多|展开|查看全部|全文/.test(t) && el.offsetParent !== null) {
            el.click();
            clicked = true;
            await sleep(300);
            break;
          }
        }
        if (clicked) break;
      } catch (e) { /* ignore */ }
    }
    return clicked;
  }

  // ---------- 去重 + 存储 ----------
  async function loadList() {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    return Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
  }

  async function saveList(list) {
    await chrome.storage.local.set({ [STORAGE_KEY]: list });
  }

  // ---------- 主抓取流程 ----------
  async function capture() {
    const pageType = getPageType();
    if (pageType === 'other') {
      showToast('请在岗位详情页或列表页抓取', 'warn');
      return;
    }

    showToast('抓取中…');
    if (pageType === 'detail') {
      await expandDescription();
    } else {
      const previewRoot = pick(['.job-detail-box', '.job-detail-container']) || document;
      await expandDescription(previewRoot);
    }
    await sleep(200);

    const d = pageType === 'detail' ? extractFromDetail() : extractFromListPreview();
    if (!d.fullText && !d.jobName) {
      showToast('解析失败：未识别到岗位信息（页面结构可能已改）', 'error');
      return;
    }

    const complete = d.fullText.length > 80;
    const source = d.address || d.company || '';

    // 去重：jobId + 薪资 + 地址/公司（避免同名岗位误判）
    let fpSource;
    if (d.jobId) {
      fpSource = `${pageType}|${d.jobId}|${d.salary}|${source}`;
    } else {
      fpSource = `${pageType}|${d.company}|${d.jobName}|${d.salary}|${d.url.split('?')[0]}`;
    }
    const fingerprint = simpleHash(fpSource);

    const record = {
      id: fingerprint + '-' + Date.now().toString(36),
      fingerprint,
      source: pageType,
      url: d.url,
      jobId: d.jobId,
      company: d.company || '未知公司',
      jobName: d.jobName || '未知岗位',
      salary: d.salary || '未标注',
      address: d.address || '',
      workLocation: parseWorkLocation(d.fullText),
      limitText: d.limitText || '',
      fullText: d.fullText || '',
      complete,
      capturedAt: new Date().toISOString()
    };

    const list = await loadList();
    const dupIndex = list.findIndex((item) => item.fingerprint === fingerprint);
    if (dupIndex >= 0) {
      const old = list[dupIndex];
      if (old.fullText.length >= record.fullText.length && old.complete) {
        showToast(`已跳过重复：${record.jobName}`, 'warn');
        return;
      }
      list[dupIndex] = record;
      await saveList(list);
      showToast(`已更新：${record.jobName}`, 'ok');
    } else {
      list.push(record);
      await saveList(list);
      showToast(`已抓取 ${record.jobName}（共 ${list.length} 条）`, 'ok');
    }
  }

  // ---------- 抓取触发：键盘快捷键（100% 不跳转）+ 悬浮按钮（备选） ----------
  let captureGuard = false;

  function triggerCapture() {
    if (captureGuard) return;
    captureGuard = true;
    capture();
    setTimeout(() => (captureGuard = false), 800);
  }

  // 键盘快捷键：Cmd+Shift+J（Mac）/ Ctrl+Shift+J（Win）
  // 键盘事件不受 BOSS 页面 DOM 事件委托影响，绝对不会跳转
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === 'KeyJ') {
      e.preventDefault();
      e.stopPropagation();
      triggerCapture();
    }
  });

  // 悬浮按钮（备选方案，保留但简化）
  function ensureFloatingButton() {
    if (document.getElementById(FLOAT_BTN_ID)) return;

    const pageType = getPageType();
    if (pageType === 'other') return;

    const btn = document.createElement('div');
    btn.id = FLOAT_BTN_ID;
    btn.innerHTML = pageType === 'list' ? '抓取预览<br><span style="font-size:10px;font-weight:400;opacity:0.7">或 ⌘⇧J</span>' : '抓取JD<br><span style="font-size:10px;font-weight:400;opacity:0.7">或 ⌘⇧J</span>';
    Object.assign(btn.style, {
      position: 'fixed', right: '24px', bottom: '120px', zIndex: '2147483647',
      background: '#00C2B3', color: '#fff', border: 'none', borderRadius: '24px',
      padding: '10px 18px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
      fontFamily: '-apple-system, PingFang SC, sans-serif', userSelect: 'none',
      pointerEvents: 'auto', textAlign: 'center', lineHeight: '1.4'
    });
    btn.addEventListener('click', triggerCapture);
    document.documentElement.appendChild(btn);
  }

  // ---------- Toast ----------
  let toastTimer = null;
  function showToast(msg, type = 'ok') {
    let toast = document.getElementById(TOAST_ID);
    if (!toast) {
      toast = document.createElement('div');
      toast.id = TOAST_ID;
      Object.assign(toast.style, {
        position: 'fixed',
        right: '24px',
        bottom: '80px',
        zIndex: '2147483647',
        padding: '10px 16px',
        borderRadius: '8px',
        fontSize: '13px',
        color: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
        fontFamily: '-apple-system, PingFang SC, sans-serif',
        transition: 'opacity .3s',
        maxWidth: '320px'
      });
      document.documentElement.appendChild(toast);
    }
    toast.style.background = type === 'ok' ? '#00A870' : type === 'warn' ? '#ED7B2F' : '#E34D59';
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.style.opacity = '0'), 2600);
  }

  // ---------- 初始化 ----------
  function init() {
    ensureFloatingButton();
    setInterval(ensureFloatingButton, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();