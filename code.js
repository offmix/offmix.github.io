/* ── タブ管理 ── */
var tabs = [];
var activeTabId = null;
var tabIdCounter = 0;

// 教育サイト・テンプレート拡充版
var EDUCATION_TEMPLATES = {
  'Google Classroom': 'https://ssl.gstatic.com/images/branding/product/1x/classroom_64dp.png',
  'Moodle': 'https://moodle.org/theme/moodle/pix/favicon.ico',
  'Canvas': 'https://du11hjcvx0uqb.cloudfront.net/dist/images/favicon-48x48-7c872ceb39.png',
  'Quizlet': 'https://quizlet.com/favicon.ico',
  'Khan Academy': 'https://www.khanacademy.org/apple-touch-icon.png',
  'Zoom': 'https://zoom.us/favicon.ico',
  'Schoology': 'https://app.schoology.com/favicon.ico',
  'Google Meet': 'https://www.gstatic.com/images/branding/product/1x/meet_64dp.png',
  'Microsoft Teams': 'https://www.microsoft.com/favicon.ico',
  'EdPuzzle': 'https://edpuzzle.com/favicon.ico',
  'Z会': 'https://www.zkai.co.jp/favicon.ico',
  'ベネッセ': 'https://www.benesse.co.jp/favicon.ico',
  'Google': 'https://www.google.com/favicon.ico',
  'YouTube': 'https://www.youtube.com/favicon.ico',
  'Wikipedia': 'https://www.wikipedia.org/favicon.ico',
  'Twitter': 'https://twitter.com/favicon.ico',
  'Amazon': 'https://www.amazon.co.jp/favicon.ico',
  'Microsoft': 'https://www.microsoft.com/favicon.ico'
};

// ★ URL自動判定（YouTube→「YouTube」など）
function autoDetectSiteName(url) {
  try {
    if (!url.includes('://')) {
      url = 'https://' + url;
    }
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    
    const siteMap = {
      'youtube.com': 'YouTube',
      'google.com': 'Google',
      'wikipedia.org': 'Wikipedia',
      'twitter.com': 'X (Twitter)',
      'x.com': 'X',
      'facebook.com': 'Facebook',
      'instagram.com': 'Instagram',
      'github.com': 'GitHub',
      'amazon.co.jp': 'Amazon',
      'amazon.com': 'Amazon',
      'microsoft.com': 'Microsoft',
      'linkedin.com': 'LinkedIn',
      'reddit.com': 'Reddit',
      'twitch.tv': 'Twitch',
      'discord.com': 'Discord',
      'gmail.com': 'Gmail',
      'outlook.com': 'Outlook',
      'classroom.google.com': 'Google Classroom',
      'moodle.com': 'Moodle',
      'schoology.com': 'Schoology',
      'zoom.us': 'Zoom',
      'meet.google.com': 'Google Meet',
      'teams.microsoft.com': 'Microsoft Teams',
      'canvas.instructure.com': 'Canvas',
      'edpuzzle.com': 'EdPuzzle',
      'quizlet.com': 'Quizlet',
      'khan.co.jp': 'Khan Academy',
      'khanacademy.org': 'Khan Academy',
      'udemy.com': 'Udemy',
      'coursera.org': 'Coursera',
      'edx.org': 'edX'
    };
    
    if (siteMap[domain]) {
      return siteMap[domain];
    }
    
    for (const [key, value] of Object.entries(siteMap)) {
      if (domain.includes(key.split('.')[0])) {
        return value;
      }
    }
    
    return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
  } catch (e) {
    return 'ページ';
  }
}

// ★ 自動ファビコン取得
function autoDetectFavicon(url) {
  try {
    if (!url.includes('://')) {
      url = 'https://' + url;
    }
    const urlObj = new URL(url);
    return 'https://www.google.com/s2/favicons?sz=32&domain=' + urlObj.hostname;
  } catch (e) {
    return 'https://www.google.com/favicon.ico';
  }
}

// ★ ダークモード強制適用（全サイトに対応）
function applyDarkModeForced(frame) {
  try {
    if (!frame || !frame.contentDocument) return;
    
    const doc = frame.contentDocument;
    
    // スタイルを挿入（既存を削除してから）
    let style = doc.getElementById('dark-mode-forced-override');
    if (style) style.remove();
    
    style = doc.createElement('style');
    style.id = 'dark-mode-forced-override';
    style.textContent = `
      * { color-scheme: dark !important; }
      :root, html, body { 
        background-color: #1a1a1a !important; 
        color: #ffffff !important;
        color-scheme: dark !important;
      }
      body, div, p, span, a, button, input, select, textarea {
        background-color: #1a1a1a !important;
        color: #ffffff !important;
      }
      a { color: #64b5f6 !important; }
      button { background-color: #333333 !important; color: #ffffff !important; border-color: #555555 !important; }
      input, textarea, select { background-color: #222222 !important; color: #ffffff !important; border-color: #444444 !important; }
      img { opacity: 0.9; }
    `;
    
    doc.head.appendChild(style);
    
    // メタタグも設定
    let colorSchemeMeta = doc.querySelector('meta[name="color-scheme"]');
    if (colorSchemeMeta) {
      colorSchemeMeta.setAttribute('content', 'dark');
    } else {
      colorSchemeMeta = doc.createElement('meta');
      colorSchemeMeta.name = 'color-scheme';
      colorSchemeMeta.content = 'dark';
      doc.head.appendChild(colorSchemeMeta);
    }
  } catch (e) {
    // クロスオリジン制限は無視
  }
}

function getSiteName(url) {
  try { return new URL(url).hostname || '新しいタブ'; } catch(e) { return '新しいタブ'; }
}

function saveTabSession() {
  var data = tabs.map(function(t){ return { id:t.id, url:t.url }; });
  try { localStorage.setItem('untraceable_tabs', JSON.stringify(data)); } catch(e){}
}

function restoreTabSession() {
  try {
    var data = JSON.parse(localStorage.getItem('untraceable_tabs') || 'null');
    if (!data || !data.length) return false;
    data.forEach(function(d){ createTab(d.url); });
    return true;
  } catch(e){ return false; }
}

function createTab(url) {
  var id = ++tabIdCounter;
  var tabbar = document.getElementById('tabbar');
  var addBtn = document.getElementById('addTabBtn');

  var tabEl = document.createElement('div');
  tabEl.className = 'tab';
  tabEl.dataset.id = id;
  tabEl.innerHTML = '<span class="tab-title">新しいタブ</span><button class="tab-close">×</button>';
  tabbar.insertBefore(tabEl, addBtn);

  var frame = document.createElement('iframe');
  frame.className = 'tab-frame';
  frame.id = 'frame-' + id;
  frame.sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation';
  document.getElementById('mainContent').appendChild(frame);

  var tab = { id:id, url: url||'', frameEl: frame, tabEl: tabEl, displayTitle: '', isDisguised: false };
  tabs.push(tab);

  tabEl.addEventListener('click', function(e){
    if (e.target.classList.contains('tab-close')) {
      closeTab(id); return;
    }
    switchTab(id);
  });

  switchTab(id);
  if (url) loadUrlToTab(id, url);
  return tab;
}

function switchTab(id) {
  activeTabId = id;
  tabs.forEach(function(t){
    t.tabEl.classList.toggle('active', t.id === id);
    t.frameEl.classList.toggle('active', t.id === id);
  });
  var tab = tabs.find(function(t){ return t.id===id; });
  if (tab) {
    // ★ アドレスバーに即座反映
    document.getElementById('urlInput').value = tab.url || '';
  }
  var msg = document.getElementById('messageArea');
  if (tab && !tab.url) msg.style.display='flex'; else msg.style.display='none';
}

function closeTab(id) {
  var idx = tabs.findIndex(function(t){ return t.id===id; });
  if (idx < 0) return;
  var tab = tabs[idx];
  tab.tabEl.remove();
  tab.frameEl.remove();
  tabs.splice(idx, 1);
  if (!tabs.length) { createTab(); return; }
  var next = tabs[Math.min(idx, tabs.length-1)];
  switchTab(next.id);
}

function loadUrlToTab(id, raw) {
  var tab = tabs.find(function(t){ return t.id===id; });
  if (!tab) return;
  var url = raw.trim();
  if (!/^https?:\/\//i.test(url)) {
    if (url.includes('.') && !url.includes(' ')) url = 'https://' + url;
    else url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
  }
  tab.url = url;
  
  // ★ 自動タブ名検出（仮想ブラウザタブのみ変更）
  if (!tab.isDisguised) {
    var detectedName = autoDetectSiteName(url);
    tab.displayTitle = detectedName;
    tab.tabEl.querySelector('.tab-title').textContent = detectedName;
  }
  
  // ★ URLをアドレスバーに即座反映
  document.getElementById('urlInput').value = url;
  document.getElementById('messageArea').style.display = 'none';
  
  var lo = document.getElementById('loadingOverlay');
  lo.classList.add('active');
  tab.frameEl.onload = function(){ 
    lo.classList.remove('active'); 
    // ★ ページロード後にダークモード強制適用
    applyDarkModeForced(tab.frameEl);
  };
  tab.frameEl.src = url;
  
  /* ★ 自動ファビコン取得 */
  try {
    var detectedFavicon = autoDetectFavicon(url);
    var favImg = document.createElement('img');
    favImg.src = detectedFavicon;
    favImg.className = 'tab-favicon';
    var titleEl = tab.tabEl.querySelector('.tab-title');
    var existing = tab.tabEl.querySelector('.tab-favicon');
    if (existing) existing.remove();
    tab.tabEl.insertBefore(favImg, titleEl);
  } catch(e){}
  saveTabSession();
}

function loadUrl(url) { loadUrlToTab(activeTabId, url); }

/* ── 時計 ── */
function updateClock() {
  var now = new Date();
  var y   = now.getFullYear();
  var mo  = pad(now.getMonth()+1);
  var d   = pad(now.getDate());
  var h   = pad(now.getHours());
  var mi  = pad(now.getMinutes());
  var el  = document.getElementById('clock');
  if (el) el.innerHTML = y + '/' + mo + '/' + d + '<br>' + h + ':' + mi;
}

/* ── スクリーンセーバー ── */
var ssActive = false;
var idleTimer = null;
var IDLE_MS = 30000;

function resetIdleTimer() {
  clearTimeout(idleTimer);
  if (ssActive) return;
  idleTimer = setTimeout(showScreensaver, IDLE_MS);
}

function showScreensaver() {
  ssActive = true;
  var ss = document.getElementById('screensaver');
  ss.classList.add('active');
  updateSsClock();
}

function hideScreensaver() {
  ssActive = false;
  document.getElementById('screensaver').classList.remove('active');
  resetIdleTimer();
}

function updateSsClock() {
  if (!ssActive) return;
  var now = new Date();
  document.getElementById('ssClock').textContent = pad(now.getHours()) + ':' + pad(now.getMinutes());
  var days = ['日','月','火','水','木','金','土'];
  document.getElementById('ssDate').textContent =
    now.getFullYear() + '年' + (now.getMonth()+1) + '月' + now.getDate() + '日（' + days[now.getDay()] + '）';
  setTimeout(updateSsClock, 1000);
}

/* ── 偽装（ダミー）ページ ── */
var dummyActive = false;

function showDummy() {
  dummyActive = true;
  document.getElementById('disguiseOverlay').classList.add('active');
  document.getElementById('disguiseHint').classList.add('active');
}

function hideDummy() {
  dummyActive = false;
  document.getElementById('disguiseOverlay').classList.remove('active');
  document.getElementById('disguiseHint').classList.remove('active');
}

/* 地理ノート ナビ */
function geoShowPage(name, linkEl) {
  document.querySelectorAll('.geo-page').forEach(function(p){ p.classList.remove('geo-active'); });
  var pg = document.getElementById('geo-page-' + name);
  if (pg) pg.classList.add('geo-active');
  document.querySelectorAll('#geo-nav a').forEach(function(a){ a.classList.remove('geo-active'); });
  if (linkEl) linkEl.classList.add('geo-active');
}
function geoSwitchTab(btn, tabId) {
  var nav = btn.closest('.geo-tab-nav') || btn.parentElement;
  nav.querySelectorAll('.geo-tab-btn').forEach(function(b){ b.classList.remove('geo-active'); });
  btn.classList.add('geo-active');
  var parent = nav.parentElement;
  parent.querySelectorAll('.geo-tab-content').forEach(function(c){ c.classList.remove('geo-active'); });
  var tc = document.getElementById(tabId);
  if (tc) tc.classList.add('geo-active');
}

/* ── 覗き見防止 ── */
var filterOn = false;
function toggleFilter() {
  filterOn = !filterOn;
  document.getElementById('darkVeil').classList.toggle('active', filterOn);
  document.body.classList.toggle('veil-on', filterOn);
  var btn = document.getElementById('filterBtn');
  if (btn) btn.classList.toggle('on', filterOn);
  document.getElementById('privacyStatus').textContent = filterOn ? '覗き見防止 ON' : '待機中';
}

/* ── 背景 ── */
var BG_LIST = [
  { label:'デフォルト', url:'https://custom-images.strikinglycdn.com/res/hrscywv4p/image/upload/c_limit,fl_lossy,h_9000,w_1200,f_auto,q_auto/8103728/282569_954041.jpeg' },
  { label:'秋の富士山', url:'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Above_Clouds.jpg/1280px-Above_Clouds.jpg' },
  { label:'ノイシュヴァンシュタイン城', url:'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Schloss_Neuschwanstein_2013.jpg/1280px-Schloss_Neuschwanstein_2013.jpg' },
  { label:'札幌 大通公園の夜景', url:'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Odori_Park_illumination.jpg/1280px-Odori_Park_illumination.jpg' },
  { label:'日本アルプスの山々', url:'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Hotaka.jpg/1280px-Hotaka.jpg' },
  { label:'サイバーグリーン', url:'' }
];

function restoreBg() {
  var saved = localStorage.getItem('untraceable_bg');
  if (saved !== null) applyBg(saved);
  /* 背景メニュー生成 */
  var menu = document.getElementById('bgMenu');
  if (!menu) return;
  menu.innerHTML = '';
  BG_LIST.forEach(function(bg){
    var opt = document.createElement('div');
    opt.className = 'bg-option';
    opt.textContent = bg.label;
    opt.onclick = function(){ applyBg(bg.url); localStorage.setItem('untraceable_bg', bg.url); menu.classList.remove('open'); };
    menu.appendChild(opt);
  });
}

function applyBg(url) {
  if (url) {
    document.body.style.backgroundImage = 'url("' + url + '")';
    document.body.style.backgroundColor = '';
  } else {
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = '#0a1a0a';
  }
}

/* ── オーバーレイ系ユーティリティ ── */
function makeOverlay(z) {
  var ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:'+z+';background:rgba(0,0,0,0.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;';
  return ov;
}
function makeCard() {
  var c = document.createElement('div');
  c.style.cssText = 'background:#1a1a1a;border:1px solid #444;border-radius:14px;padding:28px 24px;width:320px;max-width:90vw;transition:transform 0.08s;';
  return c;
}
function makePassRow(label) {
  var wrap = document.createElement('div');
  wrap.style.cssText = 'margin-bottom:10px;';
  var lbl = document.createElement('div');
  lbl.style.cssText = 'font-size:11px;color:#888;margin-bottom:4px;';
  lbl.textContent = label;
  var inp = document.createElement('input');
  inp.type = 'password';
  inp.style.cssText = 'width:100%;height:34px;border-radius:7px;border:1px solid #555;background:#111;color:#fff;padding:0 10px;font-size:13px;outline:none;font-family:Ubuntu,sans-serif;box-sizing:border-box;';
  wrap.appendChild(lbl); wrap.appendChild(inp);
  return { wrap:wrap, inp:inp };
}

/* ── ウェルカム／ロック確認 ── */
function maybeShowLock(cb) {
  cb();
}
function maybeShowWelcome(cb) { cb(); }

/* ── フルスクリーン ── */
function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
}

/* ── ★ タブ名・ファビコン偽装適用（仮想ブラウザのタブのみ変更） ── */
function applyDisguise() {
  var title   = (document.getElementById('disguiseTitleInput').value  || '').trim();
  var favicon = (document.getElementById('disguiseFaviconInput').value || '').trim();
  var tab = tabs.find(function(t){ return t.id === activeTabId; });
  
  if (title && tab) {
    tab.displayTitle = title;
    tab.isDisguised = true;
    tab.tabEl.querySelector('.tab-title').textContent = title;
    // ★ 重要：実タブ名は変更しない
  }
  if (favicon) setFavicon(favicon);
  document.getElementById('toolPopup').classList.remove('open');
}

function applyDisguiseTemplate(title, faviconUrl) {
  document.getElementById('disguiseTitleInput').value  = title;
  document.getElementById('disguiseFaviconInput').value = faviconUrl;
}

function setFavicon(url) {
  var link = document.querySelector("link[rel*='icon']");
  if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
  link.href = url;
}

/* ── アイコン定数 ── */
var ICON_LOCKED   = 'https://cdn.phototourl.com/free/2026-06-01-939348a6-aaed-44d3-badd-70adb8ba5717.png';
var ICON_UNLOCKED = 'https://cdn.phototourl.com/free/2026-06-01-d18bd43b-5f1c-4a80-97b8-e444f4c85852.png';

/* ── ユーティリティ ── */
function pad(n) { return String(n).padStart(2, '0'); }

/* ── ロック設定トグル ── */
function refreshLockToggleUI() {
  var enabled = localStorage.getItem('untraceable_pass_enabled') === '1';
  var wrap  = document.getElementById('lockToggleWrap');
  var thumb = document.getElementById('lockToggleThumb');
  var label = document.getElementById('lockToggleLabel');
  if (!wrap) return;
  if (enabled) {
    wrap.style.background  = '#1a5c34';
    wrap.style.borderColor = '#2d9e55';
    thumb.style.left       = '18px';
    thumb.style.background = '#fff';
    label.textContent      = '有効';
    label.style.color      = '#5f5';
  } else {
    wrap.style.background  = '#333';
    wrap.style.borderColor = '#555';
    thumb.style.left       = '2px';
    thumb.style.background = '#888';
    label.textContent      = '無効';
    label.style.color      = '#888';
  }
}

function toggleLockSetting() {
  var enabled = localStorage.getItem('untraceable_pass_enabled') === '1';
  if (!enabled) {
    if (!localStorage.getItem('untraceable_pass')) {
      showPassSetupPopup(function(set) {
        if (set) {
          localStorage.setItem('untraceable_pass_enabled', '1');
          initVisibilityLock();
          refreshLockToggleUI();
        }
        refreshLockToggleUI();
      });
    } else {
      localStorage.setItem('untraceable_pass_enabled', '1');
      initVisibilityLock();
      refreshLockToggleUI();
    }
  } else {
    localStorage.removeItem('untraceable_pass_enabled');
    refreshLockToggleUI();
  }
}

function showPassSetupPopup(callback) {
  var ov   = makeOverlay(999991);
  var card = makeCard();
  card.innerHTML =
    '<div style="font-size:16px;font-weight:600;color:#fff;margin-bottom:14px;">🔐 パスフレーズを設定</div>' +
    '<div id="sp-fields"></div>' +
    '<div style="display:flex;gap:8px;margin-top:4px;">' +
      '<button id="sp-yes" style="flex:1;height:34px;border-radius:7px;border:none;background:#1a5c34;color:#fff;cursor:pointer;font-size:13px;font-family:Ubuntu,sans-serif;">設定する</button>' +
      '<button id="sp-no"  style="flex:1;height:34px;border-radius:7px;border:1px solid #555;background:transparent;color:#aaa;cursor:pointer;font-size:13px;font-family:Ubuntu,sans-serif;">キャンセル</button>' +
    '</div>' +
    '<div id="sp-err" style="margin-top:8px;font-size:12px;color:#f66;min-height:14px;text-align:center;"></div>';
  ov.appendChild(card);
  document.body.appendChild(ov);
  var r1 = makePassRow('パスフレーズ');
  var r2 = makePassRow('もう一度入力');
  card.querySelector('#sp-fields').appendChild(r1.wrap);
  card.querySelector('#sp-fields').appendChild(r2.wrap);
  r1.inp.focus();
  var err = card.querySelector('#sp-err');
  function close(set) {
    ov.style.transition='opacity 0.15s'; ov.style.opacity='0';
    setTimeout(function(){ ov.remove(); callback(set); }, 150);
  }
  card.querySelector('#sp-yes').onclick = function() {
    var v1=r1.inp.value, v2=r2.inp.value;
    if (!v1) { err.textContent='入力してください'; return; }
    if (v1!==v2) { err.textContent='一致しません'; r2.inp.value=''; r2.inp.focus(); return; }
    localStorage.setItem('untraceable_pass', v1);
    close(true);
  };
  card.querySelector('#sp-no').onclick = function() { close(false); };
  [r1.inp,r2.inp].forEach(function(i){ i.addEventListener('keydown',function(e){ if(e.key==='Enter') card.querySelector('#sp-yes').click(); }); });
}

/* ── タブ離脱時の再ロック ── */
function initVisibilityLock() {
  if (localStorage.getItem('untraceable_pass_enabled') !== '1') return;
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) return;
    if (document.getElementById('visLockOv')) return;
    var ov = makeOverlay(999992);
    ov.id  = 'visLockOv';
    var card = makeCard();
    card.innerHTML =
      '<div class="vlk-icon-wrap" style="text-align:center;margin-bottom:12px;">' +
        '<img src="' + ICON_LOCKED + '" style="width:56px;height:56px;object-fit:contain;">' +
      '</div>' +
      '<div style="font-size:20px;font-weight:600;color:#fff;margin-bottom:6px;text-align:center;">ロック中</div>' +
      '<div class="vlk-sub" style="font-size:12px;color:#888;margin-bottom:18px;text-align:center;">パスフレーズを入力してください</div>' +
      '<div id="vlk-field"></div>' +
      '<button id="vlk-ok" style="width:100%;height:36px;border-radius:7px;border:none;background:#1a5c34;color:#fff;cursor:pointer;font-size:13px;font-family:Ubuntu,sans-serif;margin-top:4px;">解除</button>' +
      '<div id="vlk-err" style="margin-top:10px;font-size:12px;color:#f66;min-height:16px;text-align:center;"></div>';
    ov.appendChild(card);
    document.body.appendChild(ov);
    var r = makePassRow('パスフレーズ');
    card.querySelector('#vlk-field').appendChild(r.wrap);
    r.inp.focus();
    var tries = 0;
    function tryUnlock() {
      if (r.inp.value === (localStorage.getItem('untraceable_pass') || '')) {
        var vIconEl = document.createElement('img');
        vIconEl.id  = 'lockIconImg';
        vIconEl.src = ICON_UNLOCKED;
        vIconEl.style.cssText = 'width:72px;height:72px;object-fit:contain;display:block;margin:0 auto;';
        card.querySelector('.vlk-icon-wrap').innerHTML = '';
        card.querySelector('.vlk-icon-wrap').appendChild(vIconEl);
        setTimeout(function(){ vIconEl.classList.add('unlock-anim'); }, 10);
        card.querySelector('#vlk-ok').style.display = 'none';
        card.querySelector('#vlk-field').style.display = 'none';
        card.querySelector('.vlk-sub').textContent = 'ロック解除！';
        setTimeout(function(){
          ov.style.transition = 'opacity 0.35s'; ov.style.opacity = '0';
          setTimeout(function(){ ov.remove(); }, 350);
        }, 700);
      } else {
        tries++;
        r.inp.value = '';
        card.querySelector('#vlk-err').textContent =
          '❌ パスフレーズが違います。' + (tries >= 3 ? '（' + tries + '回目）' : '');
        r.inp.focus();
        card.style.transform = 'translateX(8px)';
        setTimeout(function(){ card.style.transform = ''; }, 80);
      }
    }
    card.querySelector('#vlk-ok').onclick = tryUnlock;
    r.inp.addEventListener('keydown', function(e){ if(e.key==='Enter') tryUnlock(); });
  });
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

/* ── ★ URL監視ポーリング（アドレスバー＆ダークモード常時反映） ── */
function startUrlPolling() {
  setInterval(function() {
    var tab = tabs.find(function(t){ return t.id === activeTabId; });
    if (!tab || !tab.frameEl) return;
    try {
      var cw  = tab.frameEl.contentWindow;
      var loc = cw.location.href;

      /* ★ URL変化を検知 → アドレスバーに即座反映 */
      if (loc && loc !== 'about:blank' && loc !== tab.url) {
        tab.url = loc;
        document.getElementById('urlInput').value = loc;
        
        // 仮想タブ名を自動更新（偽装されていない場合）
        if (!tab.isDisguised) {
          var autoName = autoDetectSiteName(loc);
          tab.displayTitle = autoName;
          tab.tabEl.querySelector('.tab-title').textContent = autoName;
        }
        
        // ダークモード再適用
        applyDarkModeForced(tab.frameEl);
        
        saveTabSession();

        /* ファビコン更新 */
        try {
          var favImg = tab.tabEl.querySelector('.tab-favicon');
          if (!favImg) {
            favImg = document.createElement('img');
            favImg.className = 'tab-favicon';
            tab.tabEl.insertBefore(favImg, tab.tabEl.querySelector('.tab-title'));
          }
          favImg.src = autoDetectFavicon(loc);
        } catch(e2){}
      }
    } catch(e) {}
  }, 300);
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

/* ── アップデート履歴オーバーレイ表示／非表示 ── */
function showHistoryOverlay() {
  var ov = document.getElementById('historyOverlay');
  ov.style.display = 'block';
  ov.classList.add('active');
  ov.scrollTop = 0;
}
function hideHistoryOverlay() {
  var ov = document.getElementById('historyOverlay');
  ov.classList.remove('active');
  ov.style.display = 'none';
}

/* ── DOMContentLoaded ── */
document.addEventListener('DOMContentLoaded', function () {

  runBootAnimation();
  restoreBg();
  initVisibilityLock();

  maybeShowLock(function() {
    maybeShowWelcome(function() {
      if (!restoreTabSession()) createTab();
      renderFavs();
    });
  });

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
      tab.isDisguised = false;
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
    showHistoryOverlay();
  };
  document.getElementById('historyCloseBtn').onclick = function () {
    hideHistoryOverlay();
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

  var fsBtn = document.getElementById('fullscreenBtn');
  if (fsBtn) fsBtn.addEventListener('click', toggleFullscreen);

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

  startUrlPolling();
  runFpsMonitor();
  resetIdleTimer();

  /* 時計を起動 */
  updateClock();
  setInterval(updateClock, 1000);

  /* ブックマークを確実に描画 */
  renderFavs();
  
  /* ★ 教育テンプレートボタン生成 */
  setupEducationTemplates();
});

/* ★ 教育テンプレート初期化 */
function setupEducationTemplates() {
  var container = document.querySelector('div[style*="flex-wrap"]');
  if (!container) return;
  
  // 既存ボタンをクリア
  container.innerHTML = '';
  
  // テンプレートボタンを追加
  Object.keys(EDUCATION_TEMPLATES).forEach(function(site) {
    var btn = document.createElement('button');
    btn.textContent = site;
    btn.style.cssText = 'font-size:11px;padding:3px 8px;border-radius:4px;border:1px solid #555;background:#2a2a2a;color:#aaa;cursor:pointer;transition:all 0.2s;';
    btn.onclick = function() {
      applyDisguiseTemplate(site, EDUCATION_TEMPLATES[site]);
    };
    btn.addEventListener('mouseover', function() {
      btn.style.background = '#333';
      btn.style.color = '#fff';
    });
    btn.addEventListener('mouseout', function() {
      btn.style.background = '#2a2a2a';
      btn.style.color = '#aaa';
    });
    container.appendChild(btn);
  });
}
