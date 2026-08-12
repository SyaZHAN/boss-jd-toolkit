// BOSS直聘 JD 抓取助手 — 早期拦截脚本（document_start）
// 职责：在 BOSS 页面 JS 加载前，拦截 pushState 跳转、设置全局抓取标志
(() => {
  'use strict';

  const BTN_ID = 'boss-jd-capture-btn';

  const isOnButton = (e) => {
    const t = e.target;
    return !!(t && (t.id === BTN_ID || (t.closest && t.closest('#' + BTN_ID))));
  };

  // 点击按钮时设置抓取中标志（500ms 内任何 pushState 都被吞掉）
  let capturing = false;
  document.addEventListener(
    'mousedown',
    (e) => {
      if (isOnButton(e)) {
        capturing = true;
        e.stopPropagation();
        e.stopImmediatePropagation();
        e.preventDefault();
        setTimeout(() => (capturing = false), 600);
      }
    },
    true
  );

  // 拦截 pushState/replaceState：抓取期间 SPA 路由跳转被吞掉
  const _push = history.pushState.bind(history);
  history.pushState = function () {
    if (capturing) return;
    return _push.apply(history, arguments);
  };
  const _replace = history.replaceState.bind(history);
  history.replaceState = function () {
    if (capturing) return;
    return _replace.apply(history, arguments);
  };

  // 也拦截 location 直接跳转（Location 对象是只读，assign/replace 无法直接赋值）
  // 用 defineProperty 绕过（configurable:true 才能覆盖），失败时降级
  try {
    const _assign = window.location.assign.bind(window.location);
    Object.defineProperty(window.location, 'assign', {
      configurable: true,
      writable: true,
      value: function (url) { if (capturing) return; return _assign(url); }
    });
  } catch (e) { /* 严格模式下降级，不致命 */ }
})();
