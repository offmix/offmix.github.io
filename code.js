/* ── ユーティリティ ── */
function pad(n) { return String(n).padStart(2, '0'); }

/* ── 時計 ── */
function updateClock() {
  var now = new Date(), dow = ['日','月','火','水','木','金','土'][now.getDay()];
  document.getElementById('clock').innerHTML =
    now.getFullYear() + '/' + (now.getMonth()+1) + '/' + now.getDate() +
    ' (' + dow + ')<br>' + now.getHours() + '<span class="blink">:</span>' + pad(now.getMinutes());
  document.getElementById('ssClock').textContent = pad(now.getHours()) + ':' + pad(now.getMinutes());
  document.getElementById('ssDate').textContent =
    now.getFullYear() + ' / ' + pad(now.getMonth()+1) + ' / ' + pad(now.getDate()) + ' (' + dow + ')';
}
setInterval(updateClock, 1000);
updateClock();

/* ── アイドル・スクリーンセーバー ── */
var ssActive = false, idleTimer, idleCount = 30, IDLE_SEC = 30;

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
  idleTimer = setInterval(function () {
    if (dummyActive || ssActive) return;
    idleCount--;
    document.getElementById('privacyStatus').textContent = '💤 ' + idleCount + '秒後';
    if (idleCount <= 0) { clearInterval(idleTimer); showScreensaver(); }
  }, 1000);
}

/* ── 覗き見防止 ── */
var filterOn = false;
function toggleFilter() {
  filterOn = !filterOn;
  document.getElementById('darkVeil').classList.toggle('active', filterOn);
  document.body.classList.toggle('veil-on', filterOn);
  document.getElementById('filterBtn').classList.toggle('on', filterOn);
  if (!dummyActive && !ssActive)
    document.getElementById('privacyStatus').textContent = filterOn ? '覗き見防止有効' : '待機中';
}

/* ── 地理ノート偽装 ── */
var dummyActive = false;
function showDummy() {
  dummyActive = true;
  document.getElementById('disguiseOverlay').classList.add('active');
  document.getElementById('disguiseHint').classList.add('active');
  document.getElementById('privacyStatus').textContent = '地理ノート表示中';
}
function hideDummy() {
  dummyActive = false;
  document.getElementById('disguiseOverlay').classList.remove('active');
  document.getElementById('disguiseHint').classList.remove('active');
  document.getElementById('privacyStatus').textContent = '待機中';
  resetIdleTimer();
}

/* ── 地理ノートのページ・タブ切り替え ── */
function geoShowPage(id, linkEl) {
  document.querySelectorAll('.geo-page').forEach(function (p) { p.classList.remove('geo-active'); });
  document.getElementById('geo-page-' + id).classList.add('geo-active');
  document.querySelectorAll('#geo-nav a').forEach(function (a) { a.classList.remove('geo-active'); });
  if (linkEl) linkEl.classList.add('geo-active');
  document.getElementById('disguiseOverlay').scrollTo({ top: 0, behavior: 'smooth' });
}
function geoSwitchTab(btn, tabId) {
  var sec = btn.closest('.geo-content-section');
  sec.querySelectorAll('.geo-tab-btn').forEach(function (b) { b.classList.remove('geo-active'); });
  sec.querySelectorAll('.geo-tab-content').forEach(function (c) { c.classList.remove('geo-active'); });
  btn.classList.add('geo-active');
  document.getElementById(tabId).classList.add('geo-active');
}

/* ── 背景変更 ── */
function changeBg(url) {
  document.body.style.backgroundImage = "url('" + url + "')";
  localStorage.setItem('untraceable_bg', url);
  document.getElementById('bgMenu').classList.remove('open');
}
function restoreBg() {
  var saved = localStorage.getItem('untraceable_bg');
  if (saved) document.body.style.backgroundImage = "url('" + saved + "')";
}

/* ── タブ名・ファビコン偽装 ── */
var originalTitle = document.title;
var originalFavicon = document.querySelector('link[rel="icon"]')
  ? document.querySelector('link[rel="icon"]').href : '';

function applyDisguise(title, faviconUrl, reset) {
  var link = document.querySelector('link[rel="icon"]');
  if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
  if (reset) {
    document.title = originalTitle;
    link.href = originalFavicon;
    document.getElementById('disguiseTitleInput').value = '';
    document.getElementById('disguiseFaviconInput').value = '';
  } else {
    if (title) document.title = title;
    if (faviconUrl) link.href = faviconUrl;
    if (title) document.getElementById('disguiseTitleInput').value = title;
    if (faviconUrl) document.getElementById('disguiseFaviconInput').value = faviconUrl;
  }
  document.getElementById('toolPopup').classList.remove('open');
}

/* ── タブ管理 ── */
var tabs = [], activeTabId = null, tabCounter = 0;

function createTab(url) {
  var id = ++tabCounter;
  var iframe = document.createElement('iframe');
  iframe.className = 'tab-frame';
  iframe.id = 'frame-' + id;
  document.getElementById('mainContent').appendChild(iframe);

  iframe.addEventListener('load', function () {
    hideLoading(id);
    var tab = tabs.find(function (t) { return t.id === id; });
    if (tab && tab.url) {
      try {
        var fu = 'https://www.google.com/s2/favicons?sz=32&domain=' + new URL(tab.url).hostname;
        var fi = tab.tabEl.querySelector('.tab-favicon');
        if (!fi) {
          fi = document.createElement('img');
          fi.className = 'tab-favicon';
          tab.tabEl.insertBefore(fi, tab.tabEl.firstChild);
        }
        fi.src = fu;
        fi.onerror = function () { this.style.display = 'none'; };
      } catch (e) {}
    }
    try {
      var cw = iframe.contentWindow;
      ['mousemove','mousedown','keydown','scroll','wheel','touchstart'].forEach(function (ev) {
        cw.addEventListener(ev, function () {
          if (!dummyActive && !ssActive) resetIdleTimer();
        }, { passive: true });
      });
    } catch (e) {}
  });

  var tabEl = document.createElement('div');
  tabEl.className = 'tab';
  tabEl.dataset.id = id;
  tabEl.innerHTML = '<span class="tab-title">新しいタブ</span><button class="tab-close">×</button>';
  tabEl.querySelector('.tab-close').onclick = function (e) { e.stopPropagation(); closeTab(id); };
  tabEl.onclick = function () { switchTab(id); };

  document.getElementById('tabbar').insertBefore(tabEl, document.getElementById('addTabBtn'));
  tabs.push({ id: id, url: '', frameEl: iframe, tabEl: tabEl });
  switchTab(id);
  if (url) loadUrlToTab(id, url);
  return id;
}

function switchTab(id) {
  activeTabId = id;
  tabs.forEach(function (t) {
    var on = t.id === id;
    t.frameEl.classList.toggle('active', on);
    t.tabEl.classList.toggle('active', on);
  });
  var tab = tabs.find(function (t) { return t.id === id; });
  if (tab) {
    document.getElementById('urlInput').value = tab.url || '';
    document.getElementById('messageArea').style.display = tab.url ? 'none' : 'flex';
  }
  resetIdleTimer();
}

function closeTab(id) {
  var idx = tabs.findIndex(function (t) { return t.id === id; });
  if (idx === -1) return;
  tabs[idx].frameEl.remove();
  tabs[idx].tabEl.remove();
  tabs.splice(idx, 1);
  if (tabs.length === 0) createTab();
  else switchTab(tabs[Math.min(idx, tabs.length - 1)].id);
  saveTabSession();
}

var loadingTimers = {};
function hideLoading(id) {
  if (loadingTimers[id]) { clearTimeout(loadingTimers[id]); delete loadingTimers[id]; }
  if (activeTabId === id) document.getElementById('loadingOverlay').classList.remove('active');
}

var SITE_NAMES = {
  'youtube.com':'YouTube','google.com':'Google','google.co.jp':'Google','gmail.com':'Gmail',
  'drive.google.com':'Google Drive','docs.google.com':'Google Docs',
  'classroom.google.com':'Google Classroom','meet.google.com':'Google Meet',
  'twitter.com':'Twitter / X','x.com':'X (Twitter)','instagram.com':'Instagram',
  'github.com':'GitHub','wikipedia.org':'Wikipedia','ja.wikipedia.org':'Wikipedia (日本語)',
  'amazon.co.jp':'Amazon','netflix.com':'Netflix','nicovideo.jp':'ニコニコ動画',
  'pixiv.net':'pixiv','yahoo.co.jp':'Yahoo! Japan','chatgpt.com':'ChatGPT','claude.ai':'Claude'
};

function getSiteName(url) {
  try {
    var h = new URL(url).hostname.replace('www.', '');
    if (SITE_NAMES[h]) return SITE_NAMES[h];
    var p = h.split('.');
    if (p.length > 2) { var b = p.slice(-2).join('.'); if (SITE_NAMES[b]) return SITE_NAMES[b]; }
    return h;
  } catch (e) { return url; }
}

function resolveInput(input) {
  input = input.trim();
  if (/^https?:\/\//i.test(input)) return input;
  if (/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(input)) return 'https://' + input;
  return 'https://duckduckgo.com/?q=' + encodeURIComponent(input);
}

function loadUrlToTab(id, url) {
  var tab = tabs.find(function (t) { return t.id === id; });
  if (!tab) return;
  url = resolveInput(url);
  tab.url = url;
  tab.frameEl.src = url;
  tab.tabEl.querySelector('.tab-title').textContent = getSiteName(url);
  document.getElementById('messageArea').style.display = 'none';
  document.getElementById('urlInput').value = url;
  if (id === activeTabId) document.getElementById('loadingOverlay').classList.add('active');
  if (loadingTimers[id]) clearTimeout(loadingTimers[id]);
  loadingTimers[id] = setTimeout(function () { hideLoading(id); }, 10000);
  saveTabSession();
  resetIdleTimer();
}

function loadUrl(url) { loadUrlToTab(activeTabId, url); }

function saveTabSession() {
  localStorage.setItem('untraceable_tabs', JSON.stringify(tabs.map(function (t) { return { url: t.url }; })));
}

/* ── タブ復元確認ポップアップ ── */
function restoreTabSession() {
  try {
    var data = JSON.parse(localStorage.getItem('untraceable_tabs') || '[]');
    var valid = data.filter(function(d){ return d.url; });
    if (!valid.length) return false;

    /* 空タブを1枚用意してすぐ使える状態にする */
    createTab();

    var pop = document.createElement('div');
    pop.style.cssText = [
      'position:fixed','bottom:56px','right:16px','z-index:999998',
      'background:#1a1a1a','border:1px solid #484848',
      'border-radius:10px','padding:14px 16px',
      'font-family:Ubuntu,sans-serif','font-size:13px','color:#ddd',
      'box-shadow:0 4px 24px rgba(0,0,0,0.75)',
      'animation:bootIn 0.2s ease'
    ].join(';');
    pop.innerHTML =
      '<div style="color:#fff;font-size:13px;margin-bottom:12px;">タブを復元しますか？</div>' +
      '<div style="display:flex;gap:8px;">' +
        '<button id="restoreOK" style="flex:1;height:30px;border-radius:6px;border:none;background:#1a5c34;color:#fff;cursor:pointer;font-size:13px;font-family:Ubuntu,sans-serif;">OK</button>' +
        '<button id="restoreNO" style="flex:1;height:30px;border-radius:6px;border:1px solid #555;background:transparent;color:#aaa;cursor:pointer;font-size:13px;font-family:Ubuntu,sans-serif;">NO</button>' +
      '</div>';
    document.body.appendChild(pop);

    function dismiss(fn) {
      pop.style.transition = 'opacity 0.15s';
      pop.style.opacity = '0';
      setTimeout(function(){ pop.remove(); fn(); }, 150);
    }

    document.getElementById('restoreOK').onclick = function() {
      dismiss(function() {
        /* 空タブを閉じてから保存済みタブを開く */
        if (tabs.length === 1 && !tabs[0].url) closeTab(tabs[0].id);
        valid.forEach(function(d){ createTab(d.url); });
      });
    };
    document.getElementById('restoreNO').onclick = function() {
      dismiss(function() {
        localStorage.removeItem('untraceable_tabs');
      });
    };

    return true;
  } catch(e) { return false; }
}

/* ── 初回ウェルカム ── */
var WELCOME_VERSION = 'v1.6.0'; /* このバージョンで初回なら表示 */
function maybeShowWelcome() {
  var seen = localStorage.getItem('untraceable_welcome');
  if (seen === WELCOME_VERSION) return;
  localStorage.setItem('untraceable_welcome', WELCOME_VERSION);
  var pop = document.createElement('div');
  pop.id = 'welcomePopup';
  pop.style.cssText = [
    'position:fixed','top:50%','left:50%','transform:translate(-50%,-50%)',
    'z-index:999997','background:rgba(15,15,15,0.98)','border:1px solid #555',
    'border-radius:14px','padding:28px 32px','color:#ddd','max-width:400px','width:90%',
    'font-family:Ubuntu,sans-serif','box-shadow:0 8px 40px rgba(0,0,0,0.8)',
    'animation:bootIn 0.3s ease','text-align:center'
  ].join(';');
  pop.innerHTML =
    '<div style="font-size:28px;margin-bottom:10px;">🚀</div>' +
    '<div style="font-size:18px;font-weight:600;color:#fff;margin-bottom:8px;">アップデート ' + WELCOME_VERSION + '</div>' +
    '<div style="font-size:13px;color:#aaa;line-height:1.7;margin-bottom:18px;text-align:left;">' +
      '✅ 背景を自動保存・復元<br>' +
      '✅ タブ復元を確認ポップアップで選択式に変更（プライバシー向上）<br>' +
      '✅ 初回アクセス時にこの画面を表示' +
    '</div>' +
    '<button id="welcomeClose" style="padding:8px 28px;border-radius:8px;border:none;background:#1a5c34;color:#fff;cursor:pointer;font-size:13px;">OK、はじめる！</button>';
  document.body.appendChild(pop);
  document.getElementById('welcomeClose').onclick = function(){
    pop.style.transition = 'opacity 0.25s'; pop.style.opacity = '0';
    setTimeout(function(){ pop.remove(); }, 250);
  };
}

/* ── ブックマーク ── */
var favs = JSON.parse(localStorage.getItem('favs') || '[{"name":"Wiki","url":"https://ja.wikipedia.org","favicon":""}]');

function saveFavs() { localStorage.setItem('favs', JSON.stringify(favs)); }
function getFaviconUrl(u) {
  try { return 'https://www.google.com/s2/favicons?sz=32&domain=' + new URL(u).hostname; } catch (e) { return ''; }
}
function renderFavs() {
  var bar = document.getElementById('favBar');
  bar.innerHTML = '<div class="fav-header">ブックマーク</div>';
  favs.forEach(function (f, i) {
    var item = document.createElement('div');
    item.className = 'fav-item';
    item.draggable = true;
    item.dataset.index = i;
    var fs = f.favicon || getFaviconUrl(f.url);
    item.innerHTML = '<span class="remove-btn">×</span>' +
      (fs ? '<img class="fav-favicon" src="' + fs + '" onerror="this.style.display=\'none\'">' : '') +
      '<span class="fav-name">' + f.name + '</span>';
    item.addEventListener('click', function (e) { if (e.target.classList.contains('remove-btn')) return; loadUrl(f.url); });
    item.querySelector('.remove-btn').addEventListener('click', function (e) {
      e.stopPropagation(); favs.splice(i, 1); saveFavs(); renderFavs();
    });
    item.addEventListener('dragstart', function (e) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', i);
      setTimeout(function () { item.classList.add('dragging'); }, 0);
    });
    item.addEventListener('dragend', function () { item.classList.remove('dragging'); });
    item.addEventListener('dragover', function (e) { e.preventDefault(); item.classList.add('drag-over'); });
    item.addEventListener('dragleave', function () { item.classList.remove('drag-over'); });
    item.addEventListener('drop', function (e) {
      e.preventDefault();
      item.classList.remove('drag-over');
      var from = parseInt(e.dataTransfer.getData('text/plain'));
      if (from === i) return;
      var mv = favs.splice(from, 1)[0];
      favs.splice(i, 0, mv);
      saveFavs(); renderFavs();
    });
    bar.appendChild(item);
  });
  var ab = document.createElement('div');
  ab.className = 'fav-item';
  ab.innerHTML = '<span style="font-size:20px;line-height:1;">＋</span>';
  ab.addEventListener('click', function () {
    var n = prompt('名前'); if (!n) return;
    var u = prompt('URL'); if (!u) return;
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    favs.push({ name: n, url: u, favicon: getFaviconUrl(u) });
    saveFavs(); renderFavs();
  });
  bar.appendChild(ab);
}

/* ── メモ ── */
function saveMemo() {
  localStorage.setItem('untraceable_memo', document.getElementById('memoBody').innerHTML);
  var now = new Date();
  document.getElementById('memoSaveStatus').textContent =
    '保存 ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
}
function updateCharCount() {
  var t = document.getElementById('memoBody').innerText || '';
  document.getElementById('memoCharCount').textContent = t.replace(/\n/g, '').length + ' 文字';
}

/* ── 起動アニメーション ── */
function runBootAnimation() {
  var ov = document.getElementById('bootOverlay'), fill = document.getElementById('bootBarFill');
  ov.style.display = 'flex';
  [
    { line:'bl0', ok:null,    bar:15,  delay:0    },
    { line:'bl1', ok:'bl1ok', bar:40,  delay:550  },
    { line:'bl2', ok:'bl2ok', bar:65,  delay:1050 },
    { line:'bl3', ok:'bl3ok', bar:88,  delay:1550 },
    { line:'bl4', ok:'bl4ok', bar:100, delay:2050 }
  ].forEach(function (s) {
    setTimeout(function () {
      document.getElementById(s.line).classList.add('show');
      fill.style.width = s.bar + '%';
      if (s.ok) document.getElementById(s.ok).textContent = ' ✓ OK';
    }, s.delay);
  });
  setTimeout(function () {
    ov.style.transition = 'opacity 0.7s ease';
    ov.style.opacity = '0';
    setTimeout(function () { ov.style.display = 'none'; }, 750);
  }, 2600);
}

/* ── FPS + RAM ── */
function runFpsMonitor() {
  var times = [], fpsEl = document.getElementById('fpsDisplay');
  function getRam() {
    if (performance && performance.memory)
      return ' │ ' + (performance.memory.usedJSHeapSize / 1048576).toFixed(0) + ' MB';
    return '';
  }
  function loop(now) {
    times.push(now);
    times = times.filter(function (t) { return now - t < 1000; });
    var fps = times.length;
    fpsEl.style.color = fps <= 10 ? '#f44' : fps <= 30 ? '#fa0' : '#0f0';
    fpsEl.textContent = fps + ' FPS' + getRam();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

/* ── メモパネルのドラッグ移動 ── */
function initMemoDrag() {
  var panel = document.getElementById('memoPanel'),
      header = document.getElementById('memoHeader'),
      dragging = false, startX, startY, origLeft, origTop;
  header.addEventListener('mousedown', function (e) {
    if (e.target.id === 'memoCloseBtn') return;
    dragging = true; startX = e.clientX; startY = e.clientY;
    var r = panel.getBoundingClientRect(); origLeft = r.left; origTop = r.top;
    panel.style.bottom = 'auto'; panel.style.top = origTop + 'px'; panel.style.left = origLeft + 'px';
    e.preventDefault();
  });
  document.addEventListener('mousemove', function (e) {
    if (!dragging) return;
    panel.style.left = (origLeft + e.clientX - startX) + 'px';
    panel.style.top  = (origTop  + e.clientY - startY) + 'px';
  });
  document.addEventListener('mouseup', function () { dragging = false; });
}

/* ── DOMContentLoaded ── */
document.addEventListener('DOMContentLoaded', function () {

  runBootAnimation();
  restoreBg();
  maybeShowWelcome();

  /* タブ復元: 保存データがなければ即座に空タブを作成 */
  if (!restoreTabSession()) createTab();
  renderFavs();

  /* メモ復元 */
  var saved = localStorage.getItem('untraceable_memo');
  if (saved) {
    document.getElementById('memoBody').innerHTML = saved;
    document.getElementById('memoSaveStatus').textContent = '読み込み済み';
  }
  updateCharCount();
  setInterval(function () {
    if (document.getElementById('memoBody').innerHTML.trim()) saveMemo();
  }, 30000);

  /* iframe フォーカス監視 */
  setInterval(function () {
    if (dummyActive || ssActive) return;
    var focused = (function () {
      try { return document.getElementById('mainContent').matches(':focus-within'); } catch (e) { return false; }
    })();
    if (focused) resetIdleTimer();
  }, 300);

  /* ── イベントリスナー ── */

  document.getElementById('logoImg').onclick = function () {
    var tab = tabs.find(function (t) { return t.id === activeTabId; });
    if (tab) {
      tab.url = ''; tab.frameEl.src = 'about:blank';
      tab.tabEl.querySelector('.tab-title').textContent = '新しいタブ';
      document.getElementById('messageArea').style.display = 'flex';
      document.getElementById('urlInput').value = '';
    }
  };

  document.getElementById('goButton').onclick = function () {
    var url = document.getElementById('urlInput').value.trim();
    if (url) loadUrlToTab(activeTabId, url);
  };
  document.getElementById('urlInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') document.getElementById('goButton').click();
  });
  document.getElementById('refreshButton').onclick = function () {
    var tab = tabs.find(function (t) { return t.id === activeTabId; });
    if (tab && tab.url) tab.frameEl.src = tab.frameEl.src;
  };
  document.getElementById('bgButton').onclick = function () {
    document.getElementById('bgMenu').classList.toggle('open');
    document.getElementById('toolPopup').classList.remove('open');
  };
  document.getElementById('historyButton').onclick = function () {
    window.open('https://html.cafe/x9745a75d');
  };
  document.getElementById('resetButton').onclick = function () {
    if (confirm('セッションを終了しますか？')) location.reload();
  };
  document.getElementById('panicBtn').onclick = showDummy;
  document.getElementById('filterBtn').onclick = toggleFilter;
  document.getElementById('menuButton').onclick = function () {
    document.getElementById('toolPopup').classList.toggle('open');
    document.getElementById('bgMenu').classList.remove('open');
  };
  document.getElementById('addTabBtn').onclick = function () { createTab(); };
  document.getElementById('screensaver').addEventListener('click', hideScreensaver);

  /* キーボードショートカット */
  document.addEventListener('keydown', function (e) {
    if (dummyActive && e.key === 'Escape' && e.shiftKey)  { hideDummy(); e.preventDefault(); return; }
    if (!dummyActive && !ssActive && e.key === 'Escape' && !e.shiftKey) { showDummy(); e.preventDefault(); return; }
    if (!dummyActive && ssActive) { hideScreensaver(); return; }
    if (e.altKey && (e.key === 'p' || e.key === 'π')) { toggleFilter(); e.preventDefault(); }
    if (e.ctrlKey && e.key === 't') { e.preventDefault(); createTab(); }
  });

  ['mousemove','mousedown','keydown','touchstart','scroll','wheel'].forEach(function (ev) {
    document.addEventListener(ev, function () {
      if (ssActive) { if (ev === 'mousedown' || ev === 'touchstart') hideScreensaver(); return; }
      if (!dummyActive) resetIdleTimer();
    }, { passive: true });
  });

  /* メモパネル */
  document.getElementById('memoToggleBtn').onclick = function () {
    document.getElementById('memoPanel').classList.toggle('open');
  };
  initMemoDrag();
  document.getElementById('memoCloseBtn').onclick = function () {
    document.getElementById('memoPanel').classList.remove('open');
  };
  document.getElementById('memoSaveBtn').onclick = saveMemo;
  document.getElementById('memoClearBtn').onclick = function () {
    if (confirm('メモをクリアしますか？')) {
      document.getElementById('memoBody').innerHTML = '';
      localStorage.removeItem('untraceable_memo');
      document.getElementById('memoSaveStatus').textContent = 'クリア済み';
      updateCharCount();
    }
  };
  document.getElementById('memoBody').addEventListener('input', function () {
    updateCharCount();
    document.getElementById('memoSaveStatus').textContent = '未保存';
  });
  document.querySelectorAll('.color-swatch').forEach(function (s) {
    s.onclick = function () { document.getElementById('memoBody').focus(); document.execCommand('foreColor', false, s.dataset.color); };
  });
  document.getElementById('colorPicker').oninput = function () {
    document.getElementById('memoBody').focus(); document.execCommand('foreColor', false, this.value);
  };
  document.getElementById('fontSizeSelect').onchange = function () {
    var sz = this.value, sel = window.getSelection();
    if (sel && !sel.isCollapsed && document.getElementById('memoBody').contains(sel.anchorNode)) {
      document.execCommand('fontSize', false, '7');
      document.getElementById('memoBody').querySelectorAll('font[size="7"]').forEach(function (el) {
        el.removeAttribute('size'); el.style.fontSize = sz;
      });
    } else {
      document.getElementById('memoBody').style.fontSize = sz;
    }
  };

  /* ポップアップ外クリックで閉じる */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('#bgMenu')   && !e.target.closest('#bgButton'))   document.getElementById('bgMenu').classList.remove('open');
    if (!e.target.closest('#toolPopup') && !e.target.closest('#menuButton')) document.getElementById('toolPopup').classList.remove('open');
  });
  window.addEventListener('blur', function () {
    document.getElementById('bgMenu').classList.remove('open');
    document.getElementById('toolPopup').classList.remove('open');
  });

  runFpsMonitor();
  resetIdleTimer();
});
