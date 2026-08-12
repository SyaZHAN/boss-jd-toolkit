// BOSS直聘 JD 抓取助手 — 弹窗逻辑
'use strict';

const STORAGE_KEY = 'bossJdList';

const $ = (sel) => document.querySelector(sel);

function render() {
  chrome.storage.local.get(STORAGE_KEY, (data) => {
    const list = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
    const countText = $('#countText');
    const listEl = $('#list');
    const emptyTip = $('#emptyTip');

    countText.textContent = `${list.length} 条`;

    listEl.innerHTML = '';
    if (list.length === 0) {
      emptyTip.classList.remove('hidden');
      $('#copyAll').disabled = true;
      $('#exportFile').disabled = true;
      $('#clearAll').disabled = true;
      return;
    }
    emptyTip.classList.add('hidden');
    $('#copyAll').disabled = false;
    $('#exportFile').disabled = false;
    $('#clearAll').disabled = false;

    // 倒序展示（最新的在最上）
    [...list].reverse().forEach((item) => {
      const row = document.createElement('div');
      row.className = 'item';

      const info = document.createElement('div');
      info.className = 'item-info';
      const name = document.createElement('div');
      name.className = 'item-name';
      name.textContent = item.jobName || '未知岗位';
      if (item.complete === false) {
        const badge = document.createElement('span');
        badge.className = 'badge badge-incomplete';
        badge.textContent = '可能不完整';
        name.appendChild(badge);
      }
      const meta = document.createElement('div');
      meta.className = 'item-meta';
      meta.textContent = [item.company, item.salary, item.limitText].filter(Boolean).join(' · ');

      const del = document.createElement('button');
      del.className = 'item-del';
      del.textContent = '✕';
      del.title = '删除';
      del.addEventListener('click', () => {
        const newList = list.filter((x) => x.id !== item.id);
        chrome.storage.local.set({ [STORAGE_KEY]: newList }, render);
      });

      info.appendChild(name);
      info.appendChild(meta);
      row.appendChild(info);
      row.appendChild(del);
      listEl.appendChild(row);
    });
  });
}

// 复制全部为 JSON（供粘贴到 WorkBuddy 对话分析）
function copyAll() {
  chrome.storage.local.get(STORAGE_KEY, async (data) => {
    const list = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
    if (list.length === 0) return showToast('没有可复制的记录');
    try {
      await navigator.clipboard.writeText(JSON.stringify(list, null, 2));
      showToast(`已复制 ${list.length} 条 JD（JSON）`);
    } catch (e) {
      // clipboard 失败时降级：textarea 复制
      const ta = document.createElement('textarea');
      ta.value = JSON.stringify(list, null, 2);
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      showToast(`已复制 ${list.length} 条 JD（JSON）`);
    }
  });
}

// 导出为 JSON 文件（本地中转）
function exportFile() {
  chrome.storage.local.get(STORAGE_KEY, (data) => {
    const list = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
    if (list.length === 0) return showToast('没有可导出的记录');
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    chrome.downloads.download(
      { url, filename: `boss-jd-${date}.json`, saveAs: true },
      () => URL.revokeObjectURL(url)
    );
  });
}

function clearAll() {
  chrome.storage.local.get(STORAGE_KEY, (data) => {
    const count = (Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : []).length;
    if (count === 0) return showToast('没有可清空的记录');
    if (!confirm(`确定清空全部 ${count} 条抓取记录？此操作不可撤销。`)) return;
    chrome.storage.local.set({ [STORAGE_KEY]: [] }, () => {
      showToast('已清空');
      render();
    });
  });
}

let toastTimer = null;
function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), 1800);
}

document.addEventListener('DOMContentLoaded', () => {
  render();
  $('#copyAll').addEventListener('click', copyAll);
  $('#exportFile').addEventListener('click', exportFile);
  $('#clearAll').addEventListener('click', clearAll);
});
