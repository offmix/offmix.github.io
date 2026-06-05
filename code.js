/* ════════════════════════════════════
   Untraceable Browser - script.js
════════════════════════════════════ */

function pad(n){ return String(n).padStart(2,'0'); }

/* ─── 時計 ─── */
function updateClock() {
  var now = new Date();
  var dow = ['日','月','火','水','木','金','土'][now.getDay()];
  document.getElementById('clock').innerHTML =
    now.getFullYear() + '/' + (now.getMonth()+1) + '/' + now.getDate() + ' (' + dow + ')<br>' +
    now.getHours() + '<span class="blink">:</span>' + pad(now.getMinutes());
  document.getElementById('ssClock').textContent = pad(now.getHours()) + ':' + pad(now.getMinutes());
  document.getElementById('ssDate').textContent =
    now.getFullYear() + ' / ' + pad(now.getMonth()+1) + ' / ' + pad(now.getDate()) + ' (' + dow + ')';
}
setInterval(updateClock, 1000);
updateClock();

/* ─── スクリーンセーバー ─── */
var idleTimer, ssActive = false, idleCount = 30;
var IDLE_SEC = 30;

function showScreensaver() {
  if (dummyActive) return;
  ssActive = true;
  document.getElementById('screensaver').classList.add('active');
  document.getElementById('privacyStatus').textContent = 'スクリーンセーバー中';
}
function hideScreensaver() {
  ssActive = false;
  document.getElementById('screensaver').classList.remove('active');
  if (!dummyActive) document.getElementById('privacyStatus').textContent = '待機中';
  resetIdleTimer();
}
function resetIdleTimer() {
  clearInterval(idleTimer);
  idleCount = IDLE_SEC;
  if (!dummyActive && !ssActive) document.getElementById('privacyStatus').textContent = '待機中';
  idleTimer = setInterval(function() {
    if (dummyActive || ssActive) return;
    idleCount--;
    if (idleCount <= 10 && idleCount > 0)
      document.getElementById('privacyStatus').textContent = '💤 ' + idleCount + '秒後';
    if (idleCount <= 0) { clearInterval(idleTimer); showScreensaver(); }
  }, 1000);
}

/* ─── 覗き見防止 ─── */
var filterOn = false;
function toggleFilter() {
  filterOn = !filterOn;
  document.getElementById('darkVeil').classList.toggle('active', filterOn);
  document.body.classList.toggle('veil-on', filterOn);
  var btn = document.getElementById('filterBtn');
  btn.textContent = filterOn ? '覗き見OFF' : '覗き見防止';
  btn.classList.toggle('on', filterOn);
  if (!dummyActive && !ssActive)
    document.getElementById('privacyStatus').textContent = filterOn ? '覗き見防止有効' : '待機中';
}

/* ─── ダミー画面 ─── */
var dummyActive = false;
function showDummy() {
  dummyActive = true;
  document.getElementById('dummyOverlay').classList.add('active');
  hideScreensaver();
  setTimeout(function(){ document.getElementById('dummyInput').focus(); }, 100);
  document.getElementById('privacyStatus').textContent = 'ダミー画面中';
}
function hideDummy() {
  dummyActive = false;
  document.getElementById('dummyOverlay').classList.remove('active');
  document.getElementById('privacyStatus').textContent = '待機中';
  resetIdleTimer();
}

/* ─── 背景変更 ─── */
function changeBg(url) {
  document.body.style.backgroundImage = "url('" + url + "')";
  document.getElementById('bgMenu').classList.remove('open');
}

/* ─── 更新情報モーダル ─── */
function openHistory() {
  document.getElementById('historyOverlay').classList.add('open');
}
function closeHistory() {
  document.getElementById('historyOverlay').classList.remove('open');
}

/* ══════════════════════════════════
   タブ管理
══════════════════════════════════ */
var tabs = [], activeTabId = null, tabCounter = 0;

function createTab(url) {
  var id = ++tabCounter;
  var iframe = document.createElement('iframe');
  iframe.className = 'tab-frame';
  iframe.id = 'frame-' + id;
  document.getElementById('mainContent').appendChild(iframe);

  var tabEl = document.createElement('div');
  tabEl.className = 'tab';
  tabEl.dataset.id = id;
  tabEl.innerHTML = '<span class="tab-title">新しいタブ</span><button class="tab-close">×</button>';
  tabEl.querySelector('.tab-close').onclick = function(e) { e.stopPropagation(); closeTab(id); };
  tabEl.onclick = function() { switchTab(id); };
  document.getElementById('tabbar').insertBefore(tabEl, document.getElementById('addTabBtn'));

  tabs.push({ id:id, url:'', frameEl:iframe, tabEl:tabEl });
  switchTab(id);
  if (url) loadUrlToTab(id, url);
  return id;
}

function switchTab(id) {
  activeTabId = id;
  tabs.forEach(function(t) {
    var on = t.id === id;
    t.frameEl.classList.toggle('active', on);
    t.tabEl.classList.toggle('active', on);
  });
  var tab = tabs.find(function(t){ return t.id === id; });
  if (tab) {
    document.getElementById('urlInput').value = tab.url || '';
    document.getElementById('messageArea').style.display = tab.url ? 'none' : 'flex';
  }
  resetIdleTimer();
}

function closeTab(id) {
  var idx = tabs.findIndex(function(t){ return t.id === id; });
  if (idx === -1) return;
  tabs[idx].frameEl.remove();
  tabs[idx].tabEl.remove();
  tabs.splice(idx, 1);
  if (tabs.length === 0) { createTab(); }
  else { switchTab(tabs[Math.min(idx, tabs.length-1)].id); }
}

function loadUrlToTab(id, url) {
  var tab = tabs.find(function(t){ return t.id === id; });
  if (!tab) return;
  if (!url.startsWith('http')) url = 'https://' + url;
  tab.url = url;
  tab.frameEl.src = url;
  try { tab.tabEl.querySelector('.tab-title').textContent = new URL(url).hostname.replace('www.',''); }
  catch(e) { tab.tabEl.querySelector('.tab-title').textContent = url; }
  document.getElementById('messageArea').style.display = 'none';
  document.getElementById('urlInput').value = url;
  resetIdleTimer();
}

function loadUrl(url) { loadUrlToTab(activeTabId, url); }

/* ─── ブックマーク ─── */
var favs = JSON.parse(localStorage.getItem('favs') || '[{"name":"Wiki","url":"https://ja.wikipedia.org"}]');
function renderFavs() {
  var bar = document.getElementById('favBar');
  bar.innerHTML = '<div class="fav-header">ブックマーク</div>';
  favs.forEach(function(f, i) {
    bar.innerHTML += '<div class="fav-item" onclick="loadUrl(\'' + f.url + '\')">' + f.name +
      '<span class="remove-btn" onclick="event.stopPropagation();favs.splice(' + i + ',1);localStorage.setItem(\'favs\',JSON.stringify(favs));renderFavs();">×</span></div>';
  });
  bar.innerHTML += '<div class="fav-item" onclick="var n=prompt(\'名前\'),u=prompt(\'URL\');if(n&&u){favs.push({name:n,url:u});localStorage.setItem(\'favs\',JSON.stringify(favs));renderFavs();}">＋</div>';
}

/* ══════════════════════════════════
   メモ機能
══════════════════════════════════ */
function saveMemo() {
  localStorage.setItem('untraceable_memo', document.getElementById('memoBody').innerHTML);
  var now = new Date();
  document.getElementById('memoSaveStatus').textContent =
    '保存 ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
}
function updateCharCount() {
  var txt = document.getElementById('memoBody').innerText || '';
  document.getElementById('memoCharCount').textContent = txt.replace(/\n/g,'').length + ' 文字';
}

/* ════════════════════════════════════
   DOMContentLoaded でイベント登録
════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {

  /* 初期タブ */
  createTab();
  renderFavs();

  /* メモ復元 */
  var saved = localStorage.getItem('untraceable_memo');
  if (saved) {
    document.getElementById('memoBody').innerHTML = saved;
    document.getElementById('memoSaveStatus').textContent = '読み込み済み';
  }
  updateCharCount();
  setInterval(function(){ if(document.getElementById('memoBody').innerHTML.trim()) saveMemo(); }, 30000);

  /* ナビバー */
  document.getElementById('logoImg').onclick = function() {
    var tab = tabs.find(function(t){ return t.id === activeTabId; });
    if (tab) {
      tab.url=''; tab.frameEl.src='about:blank';
      tab.tabEl.querySelector('.tab-title').textContent='新しいタブ';
      document.getElementById('messageArea').style.display='flex';
      document.getElementById('urlInput').value='';
    }
  };
  document.getElementById('goButton').onclick = function() {
    var url = document.getElementById('urlInput').value.trim();
    if (url) loadUrlToTab(activeTabId, url);
  };
  document.getElementById('urlInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') document.getElementById('goButton').click();
  });
  document.getElementById('refreshButton').onclick = function() {
    var tab = tabs.find(function(t){ return t.id === activeTabId; });
    if (tab && tab.url) tab.frameEl.src = tab.frameEl.src;
  };
  document.getElementById('bgButton').onclick = function() {
    document.getElementById('bgMenu').classList.toggle('open');
    document.getElementById('toolPopup').classList.remove('open');
  };
  /* 更新情報：外部リンクではなくモーダルで表示 */
  document.getElementById('historyButton').onclick = openHistory;
  document.getElementById('historyModalClose').onclick = closeHistory;
  /* オーバーレイ背景クリックで閉じる */
  document.getElementById('historyOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeHistory();
  });

  document.getElementById('resetButton').onclick = function() {
    if (confirm('セッションを終了しますか？')) location.reload();
  };
  document.getElementById('panicBtn').onclick = showDummy;
  document.getElementById('filterBtn').onclick = toggleFilter;
  document.getElementById('menuButton').onclick = function() {
    document.getElementById('toolPopup').classList.toggle('open');
    document.getElementById('bgMenu').classList.remove('open');
  };
  document.getElementById('addTabBtn').onclick = function() { createTab(); };

  /* ダミー画面 */
  document.getElementById('dummyOverlay').addEventListener('click', hideDummy);

  /* スクリーンセーバー */
  document.getElementById('screensaver').addEventListener('click', hideScreensaver);

  /* キーボード */
  document.addEventListener('keydown', function(e) {
    if (document.activeElement === document.getElementById('dummyInput') && e.key !== 'Escape') return;
    if (!dummyActive && e.key === 'Escape') { showDummy(); e.preventDefault(); return; }
    if (dummyActive && e.key === 'Escape' && e.shiftKey) { hideDummy(); e.preventDefault(); return; }
    if (!dummyActive && ssActive) { hideScreensaver(); return; }
    if (e.altKey && (e.key === 'p' || e.key === 'π')) { toggleFilter(); e.preventDefault(); }
  });

  /* アイドル検知 */
  ['mousemove','mousedown','keydown','touchstart','scroll','wheel'].forEach(function(ev) {
    document.addEventListener(ev, function() {
      if (ssActive) { hideScreensaver(); return; }
      if (!dummyActive) resetIdleTimer();
    }, { passive: true });
  });

  /* メモ */
  document.getElementById('memoToggleBtn').onclick = function() {
    document.getElementById('memoPanel').classList.toggle('open');
  };

  /* メモパネルドラッグ移動 */
  (function() {
    var panel = document.getElementById('memoPanel');
    var header = document.getElementById('memoHeader');
    var dragging = false, startX, startY, origLeft, origTop;
    header.addEventListener('mousedown', function(e) {
      if (e.target.id === 'memoCloseBtn') return;
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      var rect = panel.getBoundingClientRect();
      origLeft = rect.left; origTop = rect.top;
      panel.style.bottom = 'auto';
      panel.style.top  = origTop + 'px';
      panel.style.left = origLeft + 'px';
      e.preventDefault();
    });
    document.addEventListener('mousemove', function(e) {
      if (!dragging) return;
      panel.style.left = (origLeft + e.clientX - startX) + 'px';
      panel.style.top  = (origTop  + e.clientY - startY) + 'px';
    });
    document.addEventListener('mouseup', function() { dragging = false; });
  })();

  document.getElementById('memoCloseBtn').onclick = function() {
    document.getElementById('memoPanel').classList.remove('open');
  };
  document.getElementById('memoSaveBtn').onclick = saveMemo;
  document.getElementById('memoClearBtn').onclick = function() {
    if (confirm('メモをクリアしますか？')) {
      document.getElementById('memoBody').innerHTML = '';
      localStorage.removeItem('untraceable_memo');
      document.getElementById('memoSaveStatus').textContent = 'クリア済み';
      updateCharCount();
    }
  };
  document.getElementById('memoBody').addEventListener('input', function() {
    updateCharCount();
    document.getElementById('memoSaveStatus').textContent = '未保存';
  });
  document.querySelectorAll('.color-swatch').forEach(function(s) {
    s.onclick = function() { document.getElementById('memoBody').focus(); document.execCommand('foreColor', false, s.dataset.color); };
  });
  document.getElementById('colorPicker').oninput = function() {
    document.getElementById('memoBody').focus();
    document.execCommand('foreColor', false, this.value);
  };
  document.getElementById('fontSizeSelect').onchange = function() {
    var size = this.value;
    var sel = window.getSelection();
    if (sel && !sel.isCollapsed && document.getElementById('memoBody').contains(sel.anchorNode)) {
      document.execCommand('fontSize', false, '7');
      document.getElementById('memoBody').querySelectorAll('font[size="7"]').forEach(function(el) {
        el.removeAttribute('size'); el.style.fontSize = size;
      });
    } else {
      document.getElementById('memoBody').style.fontSize = size;
    }
  };

  /* 外側クリックでポップアップを閉じる */
  document.addEventListener('click', function(e) {
    if (!e.target.closest('#bgMenu') && !e.target.closest('#bgButton'))
      document.getElementById('bgMenu').classList.remove('open');
    if (!e.target.closest('#toolPopup') && !e.target.closest('#menuButton'))
      document.getElementById('toolPopup').classList.remove('open');
  });

  resetIdleTimer();
});
