(function () {
  'use strict';
  // === Изоляция localStorage по Google-аккаунту ===
  (function installUserNamespace() {
    const GLOBAL_KEYS = {
      'pgt_v25_current_user': 1,
      'pgt_v25_had_login': 1,
      'pgt_v25_google_token': 1,
      'pgt_v25_user_email': 1,
      'pgt_v25_known_users': 1,
      'pgt_v25_pin_hash': 1,
      'pgt_v25_pin_salt': 1,
      'pgt_v25_pin_len': 1,
      'pgt_v25_pin_attempts': 1,
      'pgt_v25_pin_lock_until': 1,
      'pgt_v25_pin_lock_level': 1,
      'pgt_v25_unlocked': 1
    };
    const origGet    = Storage.prototype.getItem;
    const origSet    = Storage.prototype.setItem;
    const origRemove = Storage.prototype.removeItem;

    function scopeKey(key) {
      if (typeof key !== 'string') return key;
      if (key.indexOf('pgt_v25_') !== 0) return key;
      if (GLOBAL_KEYS[key]) return key;
      let uid;
      try { uid = origGet.call(localStorage, 'pgt_v25_current_user'); } catch (e) {}
      if (!uid) return key;
      if (key.length > uid.length + 1 &&
          key.slice(-uid.length - 1) === '_' + uid) return key;
      return key + '_' + uid;
    }

    Storage.prototype.getItem = function (key) { return origGet.call(this, scopeKey(key)); };
    Storage.prototype.setItem = function (key, value) { return origSet.call(this, scopeKey(key), value); };
    Storage.prototype.removeItem = function (key) { return origRemove.call(this, scopeKey(key)); };

    window.__pgtRawStorage = {
      get: function (k) { return origGet.call(localStorage, k); },
      set: function (k, v) { return origSet.call(localStorage, k, v); },
      remove: function (k) { return origRemove.call(localStorage, k); },
      keys: function () { return Object.keys(localStorage); }
    };
  })();
  const DATA_KEY = 'pgt_v25_data';
  const PREFS_KEY = 'pgt_v25_prefs';
  const SNIPPETS_KEY = 'pgt_v25_snippets';
  const NOTES_KEY = 'pgt_v25_notes';
  const TEMPLATES_KEY = 'pgt_v25_templates';
  const THEME_KEY = 'pgt_v25_theme';
const TRASH_KEY = 'pgt_v25_trash';
const TRASH_TTL_DAYS = 30;
  const IDB_NAME = 'pgt_handles_v25';
  const IDB_HANDLES = 'handles';
  const IDB_INDEX = 'file_index';
  const IDB_BACKUPS = 'backups';
  const IDB_FILES = 'file_blobs';
const OPFS_ROOT = 'pgt_files';
const DATA_FOLDER_KEY = 'pgt_v25_data_folder_handle';
const DATA_FOLDER_FILENAME = 'pgt_v25_local.json';
  const BC_NAME = 'pgt_sync_v25';
  const MAX_CACHE_SIZE = 300 * 1024 * 1024;

  const DEFAULT_TOTAL_COLOR = '#3fb950';
  const DEFAULT_DONE_COLOR = '#58a6ff';
  const ARCHIVE_ANIM_MS = 900;
  const SUPPORTED_EXTS = ['pdf', 'docx', 'txt', 'md', 'markdown'];
  const SECTIONS = ['articles', 'books'];
  const SECTION_LABEL = { articles: 'Статья', books: 'Книга' };
  const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
  const PRIORITY_LABEL = { high: 'Высокий', medium: 'Средний', low: 'Низкий' };
  const VALID_PRIORITIES = ['high', 'medium', 'low'];
  const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const MAX_BACKUPS = 7;

  // === Набор эмодзи для пикера ===
  const EMOJI_SET = (
    '😀😃😄😁😆😅😂🤣😊😇🙂🙃😉😌😍🥰😘😗😙😚😋😛😝😜🤪🤨🧐🤓😎🤩🥳😏😒😞😔😟😕🙁☹️😣😖😫😩🥺😢😭😤😠😡🤬🤯😳🥵🥶😱😨😰😥😓🤗🤔🤭🤫🤥😶😐😑😬🙄😯😦😧😮😲🥱😴🤤😪😵🤐🥴🤢🤮🤧😷🤒🤕🤑🤠😈👿👹👺🤡💩👻💀☠️👽👾🤖🎃😺😸😹😻😼😽🙀😿😾' +
    '👋🤚🖐✋🖖👌🤌🤏✌️🤞🤟🤘🤙👈👉👆🖕👇☝️👍👎👊✊🤛🤜👏🙌👐🤲🤝🙏💪🦾🦿🦵🦶👂🦻👃🧠🦷🦴👀👁👅👄' +
    '❤️🧡💛💚💙💜🖤🤍🤎💔❣️💕💞💓💗💖💘💝💟' +
    '⭐🌟✨⚡🔥💥💫💦💨💬💭💤' +
    '🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐵🐒🐔🐧🐦🐤🦆🦅🦉🦇🐺🐗🐴🦄🐝🐛🦋🐌🐞🐜🦟🦗🕷🕸🦂🐢🐍🦎🦖🦕🐙🦑🦐🦞🦀🐡🐠🐟🐬🐳🐋🦈🐊🐅🐆🦓🦍🐘🦛🦏🐪🐫🦒🦘🐃🐂🐄🐎🐖🐏🐑🦙🐐🦌🐕🐈🐓🦃🦚🦜🦢🦩🕊🐇🦝🦨🦡🦦🦥🐁🐀🐿🦔' +
    '🌸💮🏵🌹🥀🌺🌻🌼🌷🌱🌲🌳🌴🌵🌾🌿☘️🍀🍃🍂🍁🍄🌰🌍🌎🌏🌕🌖🌗🌘🌑🌒🌓🌔🌙🌚🌝🌞☄️🪐🌠🌌⛅⛈🌤🌥🌦🌧🌨🌩🌪🌫🌈☀️' +
    '🍏🍎🍐🍊🍋🍌🍉🍇🍓🍈🍒🍑🥭🍍🥥🥝🍅🍆🥑🥦🥬🥒🌶🌽🥕🧄🧅🥔🍠🥐🥯🍞🥖🥨🧀🥚🍳🧈🥞🧇🥓🥩🍗🍖🦴🌭🍔🍟🍕🥪🥙🧆🌮🌯🥗🥘🍝🍜🍲🍛🍣🍱🥟🍤🍙🍚🍘🍢🍡🍧🍨🍦🥧🧁🍰🎂🍮🍭🍬🍫🍿🍩🍪🥜🍯🥛🍼☕🍵🧃🥤🍶🍺🍻🥂🍷🥃🍸🍹🍾🧊' +
    '🚗🚕🚙🚌🚎🏎🚓🚑🚒🚐🚚🚛🚜🛴🚲🛵🏍🚨🚔🚍🚘🚖🚡🚠🚟🚃🚋🚞🚝🚄🚅🚈🚂🚆🚇🚊🚉✈️🛫🛬💺🛰🚀🛸🚁🛶⛵🚤🛥🛳⛴🚢⚓⛽🚧🚦🚥🚏' +
    '🏠🏡🏘🏚🏗🏭🏢🏬🏣🏤🏥🏦🏨🏪🏫🏩💒🏛⛪🕌🕍🛕🕋⛩🗾🎑🏞🌅🌄🌇🌆🏙🌃🌉🌁🗿🗽🗼🏰🏯🏟🎡🎢🎠⛲⛱🏖🏝🏜🌋⛰🏔🗻🏕⛺' +
    '⌚📱📲💻⌨️🖥🖨🖱🖲🕹🗜💽💾💿📀📼📷📸📹🎥📽🎞📞☎️📟📠📺📻🎙🎚🎛🧭⏱⏲⏰🕰⌛⏳📡🔋🔌💡🔦🕯🧯🛢💸💵💴💶💷💰💳💎⚖️🧰🔧🔨🛠⛏🔩⚙️🧱⛓🧲🔫💣🧨🪓🔪🗡⚔️🛡🚬⚰️🪦⚱️🏺🔮📿🧿💈⚗️🔭🔬🩹🩺💊💉🩸🧬🦠🧫🧪🌡🧹🧺🧻🚽🚰🚿🛁🛀🧼🧽🧴🛎🔑🗝🚪🪑🛋🛏🛌🧸🖼🛍🛒' +
    '🎁🎈🎏🎀🎊🎉🎎🏮🎐🧧✉️📩📨📧💌📥📤📦🏷📪📫📬📭📮📯📜📃📄📑📊📈📉🗒🗓📆📅📇🗃🗳🗄📋📁📂🗂🗞📰📓📔📒📕📗📘📙📚📖🔖🧷🔗📎🖇📐📏🧮📌📍✂️🖊🖋✒️🖌🖍📝✏️🔍🔎🔏🔐🔒🔓' +
    '✅❌⭕🛑⛔🚫💯❗❓⚠️♻️🔰⚜️🔱'
  ).match(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu) || [];

  // Оставляет только эмодзи. Буквы, цифры, пробелы, пунктуация отбрасываются.
  function keepOnlyEmoji(s) {
    const arr = Array.from(String(s || ''));
    const out = [];
    for (let i = 0; i < arr.length && out.length < 2; i++) {
      const ch = arr[i];
      const cp = ch.codePointAt(0);
      let ok = false;
      if (cp >= 0x1F000 && cp <= 0x1FAFF) ok = true;
      else if (cp >= 0x2600 && cp <= 0x27BF) ok = true;
      else if (cp >= 0x1F1E6 && cp <= 0x1F1FF) ok = true;
      else if (cp >= 0x1F900 && cp <= 0x1F9FF) ok = true;
      else if (cp === 0x2764 || cp === 0x2B50 || cp === 0x2705 || cp === 0x274C || cp === 0x2714 || cp === 0x2716 || cp === 0x2049 || cp === 0x203C) ok = true;
      else if (cp === 0xFE0F || cp === 0x200D) ok = true;
      if (ok) out.push(ch);
    }
    return out.join('');
  }

// === ОПИСАНИЕ ВКЛАДОК ===
// Каждый раз, когда ты (разработчик) добавляешь новую вкладку — впиши её сюда.
// У пользователей она появится автоматически ВИДИМОЙ.
// Они смогут её спрятать / переименовать / переставить.
const DEFAULT_TABS = [
  { id: 'today',      icon: '📌', label: 'Сегодня',   visible: true, hasCounter: false },
  { id: 'active',     icon: '📋', label: 'Активные',  visible: true, hasCounter: false },
  { id: 'literature', icon: '☁️', label: 'Хранилище', visible: true, hasCounter: true, counterId: 'literatureCount' },
  { id: 'notes',      icon: '📝', label: 'Заметки',   visible: true, hasCounter: true, counterId: 'notesCount' },
  { id: 'habits',     icon: '📆', label: 'Привычки',  visible: true, hasCounter: false },
  { id: 'analytics',  icon: '📊', label: 'Аналитика', visible: true, hasCounter: false },
  { id: 'archive',    icon: '📦', label: 'Архив',     visible: true, hasCounter: true, counterId: 'archiveCount' }
];

  const state = {
    goals: [], folders: { articles: emptySection('Статьи'), books: emptySection('Книги') },
    snippets: [], notes: [], templates: [], habits: [], trash: [],
    collapsed: {}, colorTotal: DEFAULT_TOTAL_COLOR, colorDone: DEFAULT_DONE_COLOR,
    favorites: { articles: {}, books: {} },
    readingPos: { articles: {}, books: {} }, pdfPage: { articles: {}, books: {} },
    pdfZoom: { articles: 100, books: 100 }, pdfInvert: { articles: false, books: false },
    litSort: { articles: 'name', books: 'name' }, litFavFilter: { articles: false, books: false },
    listHidden: { articles: false, books: false }, readerOnly: { articles: false, books: false },
    editingSnippetId: null, editingNoteId: null, editingTaskId: null, editingTaskGoalId: null,
    editingGoalId: null, massModeGoals: false, massSelectedGoals: {},
    allCollapsedSnapshot: false,
    calYear: new Date().getFullYear(), calMonth: new Date().getMonth(),
    calSelectedDate: null, calendarVisible: true,
    theme: 'dark', notificationsEnabled: false, lastNotifCheck: 0, lastBackupCheck: 0,
        massMode: false, massSelected: {}, tasksGrouping: 'kanban', tagFilter: '',
notesFilter: 'all',
    density: 'normal',
       tabOrder: null, tabs: null, customTabs: [], customArchiveOpen: {}, quickInputVisible: true, advancedToolsVisible: false,
    sidePanel: 'calendar',
     ui: { search: '', filter: 'all', sort: 'deadline', tab: 'active', activeTab: 'goals', litTab: 'articles', litSearch: { articles: '', books: '' }, snippetsSearch: '', snippetsSort: 'new', snippetsTagFilter: '', snippetsGroup: 'flat', notesSearch: '' }
  };

  const runtime = {
    articles: { handle: null, fileCache: new Map(), selected: null, pdfDoc: null, pdfPages: [], pdfObserver: null },
    books: { handle: null, fileCache: new Map(), selected: null, pdfDoc: null, pdfPages: [], pdfObserver: null }
  };

    let archivingGoalId = null;
  let refocusInlineTaskFor = null;
  const undoStack = [];
let _searchIndexDirty = true;
  let searchIndex = [];
  const fsSupported = typeof window.showDirectoryPicker === 'function';

  // === BROADCAST CHANNEL ===
  const bc = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel(BC_NAME) : null;
  let bcSuppress = false;
  let bcDebounce = null;
  function bcBroadcast(type, payload) {
    if (!bc || bcSuppress) return;
    clearTimeout(bcDebounce);
    bcDebounce = setTimeout(function () {
      try { bc.postMessage({ type: type, payload: payload || {}, ts: Date.now() }); } catch (e) {}
    }, 200);
  }
  if (bc) {
    bc.onmessage = function (e) {
      const msg = e.data;
      if (!msg || !msg.type) return;
      bcSuppress = true;
      try {
               if (msg.type === 'data-changed' || msg.type === 'prefs-changed') {
          loadState();
          _searchIndexDirty = true;
          applyTheme();
          applyColors();
          syncToolbarInputs();
          applyCalendarVisibility();
          render();
        } else if (msg.type === 'file-added' || msg.type === 'file-removed') {
          if (runtime[msg.payload.section]) runtime[msg.payload.section].fileCache.delete(msg.payload.name);
          if (state.ui.tab === 'literature' && state.ui.litTab === msg.payload.section) {
            renderList(msg.payload.section);
          }
          if (typeof renderCacheStats === 'function') renderCacheStats();
        }
      } catch (err) { console.warn('[bc]', err); }
      finally { setTimeout(function () { bcSuppress = false; }, 50); }
    };
  }

    // pdf.js может быть ещё не загружен — ждём и настраиваем воркер
  // === ЛЕНИВАЯ ЗАГРУЗКА БИБЛИОТЕК ===
const _lazyLibs = {};
function lazyLoadScript(url, globalName) {
  if (globalName && window[globalName]) return Promise.resolve(window[globalName]);
  if (_lazyLibs[url]) return _lazyLibs[url];
  _lazyLibs[url] = new Promise(function (resolve, reject) {
    const s = document.createElement('script');
    s.src = url;
    s.async = true;
    s.onload = function () {
      if (globalName && !window[globalName]) {
        // Глобал ещё не появился — подождём немного
        const t0 = Date.now();
        const iv = setInterval(function () {
          if (window[globalName]) { clearInterval(iv); resolve(window[globalName]); }
          else if (Date.now() - t0 > 3000) { clearInterval(iv); reject(new Error(globalName + ' не появился')); }
        }, 50);
        return;
      }
      resolve(window[globalName] || true);
    };
    s.onerror = function () { delete _lazyLibs[url]; reject(new Error('Не удалось загрузить: ' + url)); };
    document.head.appendChild(s);
  });
  return _lazyLibs[url];
}

function ensurePdfJs() {
  if (window.pdfjsLib) {
    if (window.pdfjsLib.GlobalWorkerOptions && !window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    return Promise.resolve(window.pdfjsLib);
  }
  return lazyLoadScript(
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    'pdfjsLib'
  ).then(function (lib) {
    if (lib && lib.GlobalWorkerOptions) {
      lib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    return lib;
  });
}

function ensureVisNetwork() {
  if (window.vis && window.vis.Network) return Promise.resolve(window.vis);
  return lazyLoadScript('https://unpkg.com/vis-network/standalone/umd/vis-network.min.js', 'vis');
}

// Собираем итоговый список вкладок:
// - что пользователь настроил — оставляем
// - что ты добавил в код — добавляем видимым
// - чего больше нет в коде — удаляем
function mergeTabs(userTabs) {
  const map = {};
  if (Array.isArray(userTabs)) {
    userTabs.forEach(function (t) {
      if (t && typeof t.id === 'string') map[t.id] = t;
    });
  }
  return DEFAULT_TABS.map(function (def) {
    const u = map[def.id];
    if (!u) return Object.assign({}, def);
    return {
      id: def.id,
      icon: (typeof u.icon === 'string' && u.icon) ? u.icon : def.icon,
      label: (typeof u.label === 'string' && u.label) ? u.label : def.label,
      visible: (typeof u.visible === 'boolean') ? u.visible : def.visible,
      hasCounter: def.hasCounter,
      counterId: def.counterId
    };
  });
}
  function emptySection(defaultName) { return { name: '', files: [], updatedAt: null, needsPermission: false, defaultName: defaultName }; }

  // Утилиты
  function uid() { return (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36); }
  function escapeHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]; }); }
  function escapeHtmlWithLinks(text) { return escapeHtml(text).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'); }
  function formatDate(iso) { if (!iso) return ''; const d = new Date(iso + 'T00:00:00'); if (isNaN(d)) return iso; return String(d.getDate()).padStart(2,'0') + '.' + String(d.getMonth()+1).padStart(2,'0') + '.' + d.getFullYear(); }
  function formatDateTime(ts) { if (!ts) return ''; const d = new Date(ts); if (isNaN(d)) return ''; return String(d.getDate()).padStart(2,'0') + '.' + String(d.getMonth()+1).padStart(2,'0') + '.' + d.getFullYear() + ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0'); }
  function formatBytes(n) { if (!n) return '0 Б'; const u = ['Б','КБ','МБ','ГБ']; let i = 0, v = n; while (v >= 1024 && i < u.length-1) { v /= 1024; i++; } return (v < 10 ? v.toFixed(1) : Math.round(v)) + ' ' + u[i]; }
  function getExt(name) { const i = name.lastIndexOf('.'); return i > 0 ? name.slice(i+1).toLowerCase() : ''; }
  function iconForExt(ext) { if (ext === 'pdf') return '📕'; if (ext === 'docx') return '📘'; if (ext === 'txt') return '📄'; if (ext === 'md' || ext === 'markdown') return '📖'; return '📎'; }
  function isSupportedFile(name) { return SUPPORTED_EXTS.indexOf(getExt(name)) !== -1; }
  function todayStart() { const t = new Date(); t.setHours(0,0,0,0); return t; }
  function dateToISO(d) { return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
  function isOverdue(task) { if (!task.deadline || task.done) return false; const d = new Date(task.deadline + 'T00:00:00'); return !isNaN(d) && d < todayStart(); }
  function findGoal(id) { for (let i = 0; i < state.goals.length; i++) if (state.goals[i].id === id) return state.goals[i]; return null; }
  function findSnippet(id) { for (let i = 0; i < state.snippets.length; i++) if (state.snippets[i].id === id) return state.snippets[i]; return null; }
  function findNote(id) { for (let i = 0; i < state.notes.length; i++) if (state.notes[i].id === id) return state.notes[i]; return null; }
    // === КОРЗИНА ===
    function saveTrash() {
    try { localStorage.setItem(TRASH_KEY, JSON.stringify(state.trash)); } catch (e) {}
    const n = state.trash.length;
    // Счётчик в шапке (ПК)
    const hdr = document.getElementById('trashHeaderCount');
    if (hdr) {
      hdr.textContent = String(n);
      hdr.style.display = n ? '' : 'none';
    }
    // Счётчик на кнопке в нижней навигации (телефон)
    const tcnt = document.getElementById('trashTabCount');
    if (tcnt) {
      tcnt.textContent = String(n);
      tcnt.style.display = n ? '' : 'none';
    }
  }

  function moveToTrash(type, data, meta) {
    meta = meta || {};
    if (!Array.isArray(state.trash)) state.trash = [];
    const entry = {
      id: 'trash-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      type: type,
      data: data,
      deletedAt: Date.now(),
      goalId: meta.goalId || null,
      goalTitle: meta.goalTitle || ''
    };
    state.trash.push(entry);
    saveTrash();
    return entry;
  }

  function restoreFromTrash(trashId) {
    if (!Array.isArray(state.trash)) return;
    const idx = state.trash.findIndex(function(t) { return t.id === trashId; });
    if (idx === -1) return;
    const entry = state.trash[idx];
    try {
      if (entry.type === 'goal') {
        if (!Array.isArray(state.goals)) state.goals = [];
        // если такой id уже есть — обновим id, чтобы не было конфликта
        if (state.goals.some(function(g) { return g.id === entry.data.id; })) entry.data.id = uid();
        state.goals.push(entry.data);
        showToast('Цель восстановлена: ' + entry.data.title, 'ok');
      } else if (entry.type === 'task') {
        const g = entry.goalId ? findGoal(entry.goalId) : ensureInboxGoal();
        if (!g) { showToast('Цель не найдена — задача потеряна', 'error'); return; }
        if (!Array.isArray(g.tasks)) g.tasks = [];
        if (g.tasks.some(function(t) { return t.id === entry.data.id; })) entry.data.id = uid();
        g.tasks.push(entry.data);
        showToast('Задача восстановлена в «' + g.title + '»', 'ok');
      } else if (entry.type === 'note') {
        if (!Array.isArray(state.notes)) state.notes = [];
        if (state.notes.some(function(n) { return n.id === entry.data.id; })) entry.data.id = uid();
        state.notes.push(entry.data);
        showToast('Заметка восстановлена', 'ok');
      } else if (entry.type === 'snippet') {
        if (!Array.isArray(state.snippets)) state.snippets = [];
        if (state.snippets.some(function(s) { return s.id === entry.data.id; })) entry.data.id = uid();
        state.snippets.push(entry.data);
        showToast('Цитата восстановлена', 'ok');
      }
      state.trash.splice(idx, 1);
      saveTrash();
      saveData();
      if (typeof saveNotes === 'function') saveNotes();
      if (typeof saveSnippets === 'function') saveSnippets();
      render();
      if (state.ui.tab === 'notes') { renderNotesList(); renderNoteEditor(); }
      if (typeof updateSnippetsBadges === 'function') updateSnippetsBadges();
      if (typeof renderTrashList === 'function') renderTrashList();
    } catch (e) {
      showToast('Ошибка восстановления: ' + e.message, 'error');
    }
  }

  function permanentlyDeleteFromTrash(trashId) {
    const before = state.trash.length;
    state.trash = state.trash.filter(function(t) { return t.id !== trashId; });
    if (state.trash.length !== before) saveTrash();
    renderTrashList();
  }

  function emptyTrash() {
    if (!state.trash.length) return;
    pgtConfirm({
      title: 'Очистить корзину?',
      message: 'Все ' + state.trash.length + ' записей будут удалены безвозвратно. Это действие нельзя отменить.',
      yesLabel: 'Очистить',
      onYes: function () {
        state.trash = [];
        saveTrash();
        renderTrashList();
        showToast('Корзина очищена', 'ok');
      }
    });
  }

  function openTrashModal() {
    const m = document.getElementById('trashModal');
    if (!m) return;
    m.hidden = false;
    renderTrashList();
  }

  function closeTrashModal() {
    const m = document.getElementById('trashModal');
    if (m) m.hidden = true;
  }

  function renderTrashList() {
    const box = document.getElementById('trashList');
    if (!box) return;
    const items = (state.trash || []).slice().sort(function(a, b) { return b.deletedAt - a.deletedAt; });
    const countEl = document.getElementById('trashCount');
    if (countEl) countEl.textContent = items.length;
    if (!items.length) {
      box.innerHTML = '<div class="modal-empty">Корзина пуста. Удалённые элементы будут появляться здесь.</div>';
      return;
    }
    const TYPE_LABEL = { goal: '🎯 Цель', task: '✓ Задача', note: '📝 Заметка', snippet: '📄 Цитата' };
    box.innerHTML = items.map(function(t) {
      let title = '';
      if (t.type === 'goal') title = (t.data && t.data.title) || '';
      else if (t.type === 'task') title = (t.data && t.data.text) || '';
      else if (t.type === 'note') title = (t.data && t.data.title) || '';
      else if (t.type === 'snippet') title = ((t.data && t.data.text) || '').slice(0, 100);
      const sub = [];
      if (t.type === 'task' && t.goalTitle) sub.push('в «' + t.goalTitle + '»');
      sub.push('удалено ' + formatDateTime(t.deletedAt));
      const days = Math.floor((Date.now() - t.deletedAt) / (24 * 60 * 60 * 1000));
      const ttl = TRASH_TTL_DAYS - days;
      if (ttl > 0) sub.push('останется ' + ttl + ' дн.');
      return '<div class="trash-item">' +
        '<div class="trash-body">' +
          '<div class="trash-type">' + (TYPE_LABEL[t.type] || t.type) + '</div>' +
          '<div class="trash-title">' + escapeHtml(title || '—') + '</div>' +
          '<div class="trash-sub">' + escapeHtml(sub.join(' · ')) + '</div>' +
        '</div>' +
        '<div class="trash-actions">' +
          '<button type="button" class="icon-btn success" data-action="trash-restore" data-id="' + escapeHtml(t.id) + '" title="Восстановить">↺</button>' +
          '<button type="button" class="icon-btn" data-action="trash-delete" data-id="' + escapeHtml(t.id) + '" title="Удалить навсегда">✕</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function autoCleanTrash() {
    if (!Array.isArray(state.trash) || !state.trash.length) return;
    const cutoff = Date.now() - TRASH_TTL_DAYS * 24 * 60 * 60 * 1000;
    const before = state.trash.length;
    state.trash = state.trash.filter(function(t) { return t.deletedAt > cutoff; });
    const removed = before - state.trash.length;
    if (removed > 0) {
      saveTrash();
      showToast('Из корзины удалено ' + removed + ' старых записей', 'warn');
    }
  }
function findTemplate(id) { for (let i = 0; i < state.templates.length; i++) if (state.templates[i].id === id) return state.templates[i]; return null; }
  function clampZoom(z) { if (isNaN(z)) z = 100; if (z < 50) z = 50; if (z > 300) z = 300; return Math.round(z); }
  function parseTags(str) { return (str || '').split(/[\s,]+/).map(function (t) { return t.replace(/^#+/, '').trim(); }).filter(Boolean); }
  function normalizeTags(arr) { if (!Array.isArray(arr)) return []; const out = []; const seen = {}; arr.forEach(function (t) { const v = String(t || '').replace(/^#+/, '').trim().toLowerCase(); if (v && !seen[v]) { seen[v] = true; out.push(v); } }); return out; }

  function relativeDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return iso;
    const today = todayStart();
    const diff = Math.round((d - today) / (24 * 60 * 60 * 1000));
    if (diff === 0) return 'сегодня';
    if (diff === 1) return 'завтра';
    if (diff === 2) return 'послезавтра';
    if (diff === -1) return 'вчера';
    if (diff > 2 && diff <= 7) return 'через ' + diff + ' дн.';
    if (diff < -1 && diff >= -30) {
      const n = Math.abs(diff);
      let word = 'дней';
      const last2 = n % 100;
      const last1 = n % 10;
      if (last2 < 11 || last2 > 14) {
        if (last1 === 1) word = 'день';
        else if (last1 >= 2 && last1 <= 4) word = 'дня';
      }
      return 'просрочено на ' + n + ' ' + word;
    }
    return formatDate(iso);
  }

  function isUpcomingSoon(task) {
    if (!task.deadline || task.done) return false;
    const d = new Date(task.deadline + 'T00:00:00');
    const diff = Math.round((d - todayStart()) / (24 * 60 * 60 * 1000));
    return diff >= 0 && diff <= 2;
  }

  function debounce(fn, ms) {
    let t = null;
    return function () {
      const args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }

// Ждём, пока defer-скрипт догрузится. Если уже есть — вернём сразу.
function waitForLib(name, ms) {
  ms = ms || 8000;
  return new Promise(function (res, rej) {
    if (window[name]) return res(window[name]);
    var t0 = Date.now();
    var iv = setInterval(function () {
      if (window[name]) { clearInterval(iv); res(window[name]); }
      else if (Date.now() - t0 > ms) { clearInterval(iv); rej(new Error(name + ' not loaded')); }
    }, 50);
  });
}
  let saveIndicatorTimer = null;
  function flashSaved() {
    const el = document.getElementById('saveIndicator');
    if (!el) return;
    el.classList.add('show');
    clearTimeout(saveIndicatorTimer);
    saveIndicatorTimer = setTimeout(function () { el.classList.remove('show'); }, 1500);
  }

  function applyTheme() {
    let theme = state.theme;
    if (theme === 'auto') theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');
    document.querySelectorAll('[data-theme-opt]').forEach(function (b) { b.classList.toggle('active', b.dataset.themeOpt === state.theme); });
  }
  if (window.matchMedia) { try { window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () { if (state.theme === 'auto') applyTheme(); }); } catch (e) {} }
   function setTheme(t) {
    state.theme = t;
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    try { saveBundle(); } catch (e) {}
    applyTheme();
  }

    let _idbPromise = null;
  function idbOpen() {
    if (_idbPromise) return _idbPromise;
    _idbPromise = new Promise(function (res, rej) {
      const req = indexedDB.open(IDB_NAME, 4);
      req.onupgradeneeded = function () {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_HANDLES)) db.createObjectStore(IDB_HANDLES);
        if (!db.objectStoreNames.contains(IDB_INDEX)) db.createObjectStore(IDB_INDEX, { keyPath: 'key' });
        if (!db.objectStoreNames.contains(IDB_BACKUPS)) db.createObjectStore(IDB_BACKUPS, { keyPath: 'date' });
        if (!db.objectStoreNames.contains(IDB_FILES)) db.createObjectStore(IDB_FILES, { keyPath: 'key' });
      };
      req.onsuccess = function () { res(req.result); };
      req.onerror = function () { _idbPromise = null; rej(req.error); };
    });
    return _idbPromise;
  }
    async function idbPut(store, key, val) { try { const db = await idbOpen(); await new Promise(function (res, rej) { const tx = db.transaction(store, 'readwrite'); if (key === null) tx.objectStore(store).put(val); else tx.objectStore(store).put(val, key); tx.oncomplete = res; tx.onerror = function () { rej(tx.error); }; }); } catch (e) {} }
    async function idbGet(store, key) { try { const db = await idbOpen(); const v = await new Promise(function (res, rej) { const tx = db.transaction(store, 'readonly'); const r = tx.objectStore(store).get(key); r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; }); return v; } catch (e) { return null; } }
    async function idbGetAll(store) { try { const db = await idbOpen(); const v = await new Promise(function (res, rej) { const tx = db.transaction(store, 'readonly'); const r = tx.objectStore(store).getAll(); r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); }; }); return v || []; } catch (e) { return []; } }
    async function idbDelete(store, key) { try { const db = await idbOpen(); await new Promise(function (res, rej) { const tx = db.transaction(store, 'readwrite'); tx.objectStore(store).delete(key); tx.oncomplete = res; tx.onerror = function () { rej(tx.error); }; }); } catch (e) {} }
  async function idbClear(store) { try { const db = await idbOpen(); await new Promise(function (res, rej) { const tx = db.transaction(store, 'readwrite'); tx.objectStore(store).clear(); tx.oncomplete = res; tx.onerror = function () { rej(tx.error); }; }); } catch (e) {} }

  // Попытаться загрузить всё из единого bundle.
  // Если bundle есть — он источник правды, старые ключи игнорируются.
  // Если bundle нет — работаем со старыми ключами (см. loadState ниже).
  function tryLoadBundle() {
  try {
    const raw = localStorage.getItem(BUNDLE_KEY);
    if (!raw) return false;
    const b = JSON.parse(raw);
    if (!b || typeof b !== 'object') return false;

    // Запоминаем rev, чтобы знать, какая версия у нас в памяти
    if (typeof b.rev === 'number') state._rev = b.rev;
      if (Array.isArray(b.goals)) state.goals = b.goals.map(normalizeGoal).filter(Boolean);
      if (b.folders && typeof b.folders === 'object') {
        SECTIONS.forEach(function (s) {
          if (b.folders[s] && typeof b.folders[s] === 'object') {
            state.folders[s] = {
              name: String(b.folders[s].name || ''),
              files: Array.isArray(b.folders[s].files) ? b.folders[s].files.filter(function (f) { return f && typeof f.name === 'string'; }) : [],
              updatedAt: typeof b.folders[s].updatedAt === 'number' ? b.folders[s].updatedAt : null,
              needsPermission: !!b.folders[s].needsPermission,
              defaultName: state.folders[s].defaultName
            };
          }
        });
      }

      const p = b.prefs || {};
      if (p.collapsed && typeof p.collapsed === 'object') state.collapsed = p.collapsed;
      if (typeof p.colorTotal === 'string') state.colorTotal = p.colorTotal;
      if (typeof p.colorDone === 'string') state.colorDone = p.colorDone;
      if (typeof p.calendarVisible === 'boolean') state.calendarVisible = p.calendarVisible;
      if (typeof p.notificationsEnabled === 'boolean') state.notificationsEnabled = p.notificationsEnabled;
      if (typeof p.tasksGrouping === 'string') state.tasksGrouping = (p.tasksGrouping === 'eisenhower') ? 'kanban' : p.tasksGrouping;
      if (typeof p.tagFilter === 'string') state.tagFilter = p.tagFilter;
      if (typeof p.allCollapsedSnapshot === 'boolean') state.allCollapsedSnapshot = p.allCollapsedSnapshot;
      if (typeof p.notesFilter === 'string') state.notesFilter = p.notesFilter;
      if (typeof p.density === 'string') state.density = p.density;
      if (Array.isArray(p.tabs)) state.tabs = p.tabs;
      if (Array.isArray(p.tabOrder)) state.tabOrder = p.tabOrder;
      if (Array.isArray(p.customTabs)) state.customTabs = p.customTabs.filter(function (t) { return t && typeof t.id === 'string'; });
      if (p.customArchiveOpen && typeof p.customArchiveOpen === 'object') state.customArchiveOpen = p.customArchiveOpen;
      if (typeof p.quickInputVisible === 'boolean') state.quickInputVisible = p.quickInputVisible;
      if (typeof p.advancedToolsVisible === 'boolean') state.advancedToolsVisible = p.advancedToolsVisible;
      if (typeof p.sidePanel === 'string' && ['calendar','today','notes'].indexOf(p.sidePanel) !== -1) state.sidePanel = p.sidePanel;
      if (p.ui && typeof p.ui === 'object') state.ui = Object.assign({}, state.ui, p.ui);
      if (!state.ui.litSearch || typeof state.ui.litSearch !== 'object') state.ui.litSearch = { articles: '', books: '' };
      if (!state.ui.litTab) state.ui.litTab = 'articles';
      if (p.favorites && typeof p.favorites === 'object') SECTIONS.forEach(function (s) { state.favorites[s] = p.favorites[s] || {}; });
      if (p.readingPos && typeof p.readingPos === 'object') SECTIONS.forEach(function (s) { state.readingPos[s] = p.readingPos[s] || {}; });
      if (p.pdfPage && typeof p.pdfPage === 'object') SECTIONS.forEach(function (s) { state.pdfPage[s] = p.pdfPage[s] || {}; });
      if (p.pdfZoom && typeof p.pdfZoom === 'object') SECTIONS.forEach(function (s) { if (typeof p.pdfZoom[s] === 'number') state.pdfZoom[s] = clampZoom(p.pdfZoom[s]); });
      if (p.pdfInvert && typeof p.pdfInvert === 'object') SECTIONS.forEach(function (s) { state.pdfInvert[s] = !!p.pdfInvert[s]; });
      if (p.litSort && typeof p.litSort === 'object') SECTIONS.forEach(function (s) { if (typeof p.litSort[s] === 'string') state.litSort[s] = p.litSort[s]; });
      if (p.litFavFilter && typeof p.litFavFilter === 'object') SECTIONS.forEach(function (s) { state.litFavFilter[s] = !!p.litFavFilter[s]; });
      if (p.listHidden && typeof p.listHidden === 'object') SECTIONS.forEach(function (s) { state.listHidden[s] = !!p.listHidden[s]; });

      if (Array.isArray(b.snippets)) state.snippets = b.snippets.map(normalizeSnippet).filter(Boolean);
      if (Array.isArray(b.notes)) state.notes = b.notes.map(normalizeNote).filter(Boolean);
      if (Array.isArray(b.templates)) state.templates = b.templates;
      if (Array.isArray(b.habits)) {
        state.habits = b.habits.filter(function (h) { return h && typeof h === 'object' && typeof h.title === 'string'; }).map(function (h) {
          return {
            id: h.id || ('h-' + Math.random().toString(36).slice(2)),
            title: String(h.title).slice(0, 200),
            icon: String(h.icon || '🎯').slice(0, 4),
            marks: Array.isArray(h.marks) ? h.marks.filter(function (m) { return typeof m === 'string'; }) : [],
            createdAt: h.createdAt || Date.now()
          };
        });
      }

            if (typeof b.theme === 'string' && (b.theme === 'light' || b.theme === 'dark' || b.theme === 'auto')) {
        state.theme = b.theme;
      }
      state.tabs = mergeTabs(state.tabs);
      return true;
    } catch (e) {
      console.warn('[bundle] load failed, fallback to old keys:', e);
      return false;
    }
  }
  function loadState() {
    try { const raw = localStorage.getItem(THEME_KEY); if (raw === 'light' || raw === 'dark' || raw === 'auto') state.theme = raw; } catch (e) {}
    try {
      const raw = localStorage.getItem(DATA_KEY) || localStorage.getItem('pgt_v24_data');
      if (raw) {
        const d = JSON.parse(raw);
        if (d && Array.isArray(d.goals)) state.goals = d.goals.map(normalizeGoal).filter(Boolean);
        if (d && d.folders && typeof d.folders === 'object') { SECTIONS.forEach(function (s) { if (d.folders[s] && typeof d.folders[s] === 'object') { state.folders[s] = { name: String(d.folders[s].name || ''), files: Array.isArray(d.folders[s].files) ? d.folders[s].files.filter(function (f) { return f && typeof f.name === 'string'; }) : [], updatedAt: typeof d.folders[s].updatedAt === 'number' ? d.folders[s].updatedAt : null, needsPermission: !!d.folders[s].needsPermission, defaultName: state.folders[s].defaultName }; } }); }
      }
    } catch (e) {}
    try {
      const raw = localStorage.getItem(PREFS_KEY) || localStorage.getItem('pgt_v24_prefs');
      if (raw) {
        const p = JSON.parse(raw);
        if (p && typeof p === 'object') {
          if (p.collapsed && typeof p.collapsed === 'object') state.collapsed = p.collapsed;
          if (typeof p.colorTotal === 'string') state.colorTotal = p.colorTotal;
          if (typeof p.colorDone === 'string') state.colorDone = p.colorDone;
          if (typeof p.calendarVisible === 'boolean') state.calendarVisible = p.calendarVisible;
          if (typeof p.notificationsEnabled === 'boolean') state.notificationsEnabled = p.notificationsEnabled;
                    if (typeof p.tasksGrouping === 'string') {
            state.tasksGrouping = (p.tasksGrouping === 'eisenhower') ? 'kanban' : p.tasksGrouping;
          }
          if (typeof p.tagFilter === 'string') state.tagFilter = p.tagFilter;
          if (typeof p.allCollapsedSnapshot === 'boolean') state.allCollapsedSnapshot = p.allCollapsedSnapshot;
          if (typeof p.notesFilter === 'string') state.notesFilter = p.notesFilter;
          if (typeof p.density === 'string') state.density = p.density;
 	  if (Array.isArray(p.tabs)) state.tabs = p.tabs;
          if (Array.isArray(p.tabOrder)) state.tabOrder = p.tabOrder;
      if (Array.isArray(p.customTabs)) state.customTabs = p.customTabs.filter(function(t){ return t && typeof t.id === 'string'; });
          if (p.customArchiveOpen && typeof p.customArchiveOpen === 'object') state.customArchiveOpen = p.customArchiveOpen;
                    if (typeof p.quickInputVisible === 'boolean') state.quickInputVisible = p.quickInputVisible;
 if (typeof p.advancedToolsVisible === 'boolean') state.advancedToolsVisible = p.advancedToolsVisible;
          if (typeof p.sidePanel === 'string' && ['calendar','today','notes'].indexOf(p.sidePanel) !== -1) state.sidePanel = p.sidePanel;
          if (p.ui && typeof p.ui === 'object') state.ui = Object.assign({}, state.ui, p.ui);
          if (!state.ui.litSearch || typeof state.ui.litSearch !== 'object') state.ui.litSearch = { articles: '', books: '' };
          if (!state.ui.litTab) state.ui.litTab = 'articles';
          if (p.favorites && typeof p.favorites === 'object') SECTIONS.forEach(function (s) { state.favorites[s] = p.favorites[s] || {}; });
          if (p.readingPos && typeof p.readingPos === 'object') SECTIONS.forEach(function (s) { state.readingPos[s] = p.readingPos[s] || {}; });
          if (p.pdfPage && typeof p.pdfPage === 'object') SECTIONS.forEach(function (s) { state.pdfPage[s] = p.pdfPage[s] || {}; });
          if (p.pdfZoom && typeof p.pdfZoom === 'object') SECTIONS.forEach(function (s) { if (typeof p.pdfZoom[s] === 'number') state.pdfZoom[s] = clampZoom(p.pdfZoom[s]); });
          if (p.pdfInvert && typeof p.pdfInvert === 'object') SECTIONS.forEach(function (s) { state.pdfInvert[s] = !!p.pdfInvert[s]; });
          if (p.litSort && typeof p.litSort === 'object') SECTIONS.forEach(function (s) { if (typeof p.litSort[s] === 'string') state.litSort[s] = p.litSort[s]; });
          if (p.litFavFilter && typeof p.litFavFilter === 'object') SECTIONS.forEach(function (s) { state.litFavFilter[s] = !!p.litFavFilter[s]; });
          if (p.listHidden && typeof p.listHidden === 'object') SECTIONS.forEach(function (s) { state.listHidden[s] = !!p.listHidden[s]; });
        }
      }
    } catch (e) {}
    try { const raw = localStorage.getItem(SNIPPETS_KEY) || localStorage.getItem('pgt_v24_snippets'); if (raw) { const arr = JSON.parse(raw); if (Array.isArray(arr)) state.snippets = arr.map(normalizeSnippet).filter(Boolean); } } catch (e) {}
    try { const raw = localStorage.getItem(NOTES_KEY) || localStorage.getItem('pgt_v24_notes'); if (raw) { const arr = JSON.parse(raw); if (Array.isArray(arr)) state.notes = arr.map(normalizeNote).filter(Boolean); } } catch (e) {}
    try { const raw = localStorage.getItem(TEMPLATES_KEY) || localStorage.getItem('pgt_v24_templates'); if (raw) { const arr = JSON.parse(raw); if (Array.isArray(arr)) state.templates = arr.filter(function (t) { return t && typeof t === 'object' && typeof t.text === 'string'; }); } } catch (e) {}
    try {
  const rawTrash = localStorage.getItem(TRASH_KEY);
  if (rawTrash) {
    const arr = JSON.parse(rawTrash);
    if (Array.isArray(arr)) {
      const cutoff = Date.now() - TRASH_TTL_DAYS * 24 * 60 * 60 * 1000;
      state.trash = arr.filter(function(t) { return t && t.deletedAt > cutoff; });
    }
  }
} catch (e) {}
try { const raw = localStorage.getItem('pgt_v25_habits'); if (raw) { const arr = JSON.parse(raw); if (Array.isArray(arr)) state.habits = arr.filter(function (h) { return h && typeof h === 'object' && typeof h.title === 'string'; }).map(function (h) { return { id: h.id || ('h-' + Math.random().toString(36).slice(2)), title: String(h.title).slice(0, 200), icon: String(h.icon || '🎯').slice(0, 4), marks: Array.isArray(h.marks) ? h.marks.filter(function (m) { return typeof m === 'string'; }) : [], createdAt: h.createdAt || Date.now() }; }); } } catch (e) {}
      state.tabs = mergeTabs(state.tabs);
}

            // Debounced сохранения — пишут в localStorage не чаще 250 мс
        let _saveDataTimer = null, _savePrefsTimer = null, _saveSnippetsTimer = null, _saveNotesTimer = null;
    let _saveBundleTimer = null;
  let _lastDataHash = '';

  // === ЕДИНЫЙ ПАКЕТ ДАННЫХ ===
  // Все данные (цели, задачи, настройки, цитаты, заметки, привычки)
  // хранятся в ОДНОМ ключе pgt_v25_bundle. Это:
  //   • быстрее (одна запись вместо пяти)
  //   • целостнее (не бывает, что часть данных новая, часть старая)
  //   • готово к шифрованию (одно поле для AES-GCM)
  const BUNDLE_KEY = 'pgt_v25_bundle';

  function collectBundle() {
  // Увеличиваем rev при каждом сохранении.
  // Другая вкладка сравнивает свой rev с этим — если чужой больше,
  // значит данные новее, и надо перечитать.
  state._rev = (state._rev || 0) + 1;
  return {
    version: 1,
    rev: state._rev,
    savedAt: Date.now(),
    theme: state.theme,
      goals: state.goals,
      folders: state.folders,
      prefs: {
        collapsed: state.collapsed,
        colorTotal: state.colorTotal,
        colorDone: state.colorDone,
        calendarVisible: state.calendarVisible,
        notificationsEnabled: state.notificationsEnabled,
        tasksGrouping: state.tasksGrouping,
        tagFilter: state.tagFilter,
        allCollapsedSnapshot: state.allCollapsedSnapshot,
        notesFilter: state.notesFilter,
        density: state.density,
        tabOrder: state.tabOrder,
        tabs: state.tabs,
        customTabs: state.customTabs,
        customArchiveOpen: state.customArchiveOpen || {},
        quickInputVisible: state.quickInputVisible,
        advancedToolsVisible: state.advancedToolsVisible,
        sidePanel: state.sidePanel,
        ui: state.ui,
        favorites: state.favorites,
        readingPos: state.readingPos,
        pdfPage: state.pdfPage,
        pdfZoom: state.pdfZoom,
        pdfInvert: state.pdfInvert,
        litSort: state.litSort,
        litFavFilter: state.litFavFilter,
        listHidden: state.listHidden
      },
      snippets: state.snippets,
      notes: state.notes,
      templates: state.templates,
      habits: state.habits
    };
  }

  function saveBundle() {
    clearTimeout(_saveBundleTimer);
    _saveBundleTimer = setTimeout(function () {
      try {
        const json = JSON.stringify(collectBundle());
        if (json === _lastBundleHash) return;
        localStorage.setItem(BUNDLE_KEY, json);
        _lastBundleHash = json;
        try { localStorage.setItem('pgt_v25_local_saved_at', String(Date.now())); } catch (e) {}
        flashSaved();
      } catch (e) {
        _lastBundleHash = '';
        if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
          showToast('Хранилище переполнено. Сделайте экспорт JSON.', 'error', null, null, 10000);
        } else {
          showToast('Ошибка сохранения: ' + (e.message || e), 'error');
        }
      }
      if (typeof bcBroadcast === 'function') bcBroadcast('data-changed', {});
      _searchIndexDirty = true;
      if (typeof scheduleAutoSync === 'function') scheduleAutoSync();
      if (typeof scheduleDiskWrite === 'function') scheduleDiskWrite();
    }, 250);
  }

  let _lastBundleHash = '';

  function saveData() {
    // Теперь все сохранения проходят через один bundle.
    saveBundle();
  }
  function savePrefs() {
    saveBundle();
  }
  function saveSnippets() {
    saveBundle();
  }
  function saveNotes() {
    saveBundle();
  }
  function saveHabits() {
    saveBundle();
  }
  

  function normalizeGoal(g) {
    if (!g || typeof g !== 'object') return null;
    const goal = {
      id: typeof g.id === 'string' && g.id ? g.id : uid(),
      title: String(g.title || '').slice(0, 500) || 'Без названия',
      description: String(g.description || ''),
      priority: VALID_PRIORITIES.indexOf(g.priority) !== -1 ? g.priority : 'medium',
       deadline: typeof g.deadline === 'string' ? g.deadline : '',
      parentId: typeof g.parentId === 'string' && g.parentId ? g.parentId : null,
      isInbox: !!g.isInbox,
      archivedAt: typeof g.archivedAt === 'number' ? g.archivedAt : null,
      createdAt: typeof g.createdAt === 'number' ? g.createdAt : Date.now(),
      pinned: !!g.pinned,
      journal: Array.isArray(g.journal) ? g.journal.map(function(e){ return { ts: typeof e.ts === 'number' ? e.ts : Date.now(), text: String(e.text || '').slice(0, 2000) }; }).filter(function(e){ return e.text; }) : [],
            milestones: Array.isArray(g.milestones) ? g.milestones.map(function(m){ return { id: m.id || uid(), text: String(m.text || '').slice(0, 200), done: !!m.done, createdAt: m.createdAt || Date.now() }; }).filter(function(m){ return m.text; }) : [],
tags: normalizeTags(g.tags),
      tasks: []
    };
    if (Array.isArray(g.tasks)) goal.tasks = g.tasks.map(normalizeTask).filter(Boolean);
    return goal;
  }
   function normalizeTask(t) {
    if (!t || typeof t !== 'object') return null;
    const task = {
      id: typeof t.id === 'string' && t.id ? t.id : uid(),
      text: String(t.text || '').slice(0, 1000),
      done: !!t.done,
      priority: VALID_PRIORITIES.indexOf(t.priority) !== -1 ? t.priority : 'medium',
      deadline: typeof t.deadline === 'string' ? t.deadline : '',
      time: (typeof t.time === 'string' && /^\d{2}:\d{2}$/.test(t.time)) ? t.time : '',
      status: ['todo','doing','blocked','done'].indexOf(t.status) !== -1 ? t.status : (t.done ? 'done' : 'todo'),
      repeat: (t.repeat && typeof t.repeat === 'object' && ['daily','weekdays','weekly','monthly'].indexOf(t.repeat.type) !== -1) ? { type: t.repeat.type } : null,
      tags: normalizeTags(t.tags),
      pinned: !!t.pinned,
            archivedAt: typeof t.archivedAt === 'number' ? t.archivedAt : null,
      createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now(),
      doneAt: typeof t.doneAt === 'number' ? t.doneAt : null,
      subtasks: Array.isArray(t.subtasks) ? t.subtasks.map(function (s) {
        if (!s || typeof s !== 'object') return null;
        return { id: typeof s.id === 'string' && s.id ? s.id : uid(), text: String(s.text || '').slice(0, 500), done: !!s.done, createdAt: typeof s.createdAt === 'number' ? s.createdAt : Date.now() };
      }).filter(Boolean) : []
    };
    return task;
  }
  function normalizeSnippet(s) {
    if (!s || typeof s !== 'object') return null;
    return { id: typeof s.id === 'string' ? s.id : uid(), section: s.section === 'books' ? 'books' : 'articles', fileName: String(s.fileName || ''), page: typeof s.page === 'number' ? s.page : null, text: String(s.text || ''), note: String(s.note || ''), tags: normalizeTags(s.tags), goalId: typeof s.goalId === 'string' ? s.goalId : null, savedAt: typeof s.savedAt === 'number' ? s.savedAt : Date.now(), updatedAt: typeof s.updatedAt === 'number' ? s.updatedAt : (s.savedAt || Date.now()) };
  }
  function normalizeNote(n) {
    if (!n || typeof n !== 'object') return null;
    return { id: typeof n.id === 'string' ? n.id : uid(), title: String(n.title || '').slice(0, 500) || 'Без названия', body: String(n.body || ''), tags: normalizeTags(n.tags), goalId: typeof n.goalId === 'string' ? n.goalId : null, createdAt: typeof n.createdAt === 'number' ? n.createdAt : Date.now(), updatedAt: typeof n.updatedAt === 'number' ? n.updatedAt : Date.now() };
  }
  function ensureInboxGoal() {
    let inbox = null;
    for (let i = 0; i < state.goals.length; i++) { if (state.goals[i].isInbox && !state.goals[i].archivedAt) { inbox = state.goals[i]; break; } }
    if (!inbox) { inbox = { id: uid(), title: 'Быстрые задачи', description: 'Задачи без привязки к цели.', priority: 'medium', deadline: '', isInbox: true, archivedAt: null, createdAt: Date.now(), pinned: false, journal: [], tasks: [] }; state.goals.push(inbox); saveData(); }
    return inbox;
  }

  // === ДОСТУПНОСТЬ: ИМЕНА ДЛЯ КНОПОК-ИКОНОК ===
  // В интерфейсе много кнопок вида «✎», «✕», «📌»: визуально понятно, а
  // скринридер озвучивает только сам символ. Берём подпись из title (он уже
  // заполнен у большинства кнопок), иначе — из видимого текста, и выставляем
  // aria-label. Функция идемпотентна: повторный вызов ничего не портит.
  function applyA11yLabels(root) {
    const scope = root || document;
    const silent = { '✕': 'Удалить', '✎': 'Редактировать', '📌': 'Закрепить', '✓': 'Выполнено', '⋯': 'Дополнительно', '⋯ Дополнительно': 'Дополнительно', '☑ Выбрать': 'Выбрать несколько', '★': 'В избранном', '☆': 'В избранное', '🗑': 'Удалить', '📋': 'Копировать', '▾': 'Развернуть', '▸': 'Свернуть' };
    let nodes;
    try { nodes = scope.querySelectorAll('button, [role="button"]'); } catch (e) { return; }
    // Дешёвая проверка «уже размечали и кнопок не прибавилось» — чтобы не
    // перебирать сотни элементов на каждую перерисовку списка.
    if (scope === document && nodes.length === applyA11yLabels._lastCount && !applyA11yLabels._dirty) return;
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      if (el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby')) continue;
      const title = (el.getAttribute('title') || '').trim();
      const visible = (el.textContent || '').replace(/\s+/g, ' ').trim();
      // Кнопка из одного символа или эмодзи считается «немой» и требует подписи.
      const isIconOnly = visible.length <= 2 || /^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D\s]+$/u.test(visible);
      if (!isIconOnly) continue;
      const label = title || silent[visible] || visible;
      if (label) el.setAttribute('aria-label', label);
    }
    if (scope === document) { applyA11yLabels._lastCount = nodes.length; applyA11yLabels._dirty = false; }
  }

  // Активный элемент — поле ввода или contenteditable: пользователь печатает.
  // Нужно, чтобы фоновые перерисовки не выдёргивали каретку и не стирали набранное.
  function isTypingNow() {
    const ae = document.activeElement;
    if (!ae) return false;
    const tag = (ae.tagName || '').toUpperCase();
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || ae.isContentEditable === true;
  }

  function pushUndo(fn, label) { undoStack.push({ fn: fn, label: label, ts: Date.now() }); if (undoStack.length > 20) undoStack.shift(); }
  function performUndo() { const item = undoStack.pop(); if (!item) return; try { item.fn(); showToast('Отменено: ' + item.label, 'ok'); } catch (e) { showToast('Не удалось отменить', 'error'); } }
  function showToast(msg, kind, actionLabel, actionFn, timeoutMs) {
    const cont = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = 'toast' + (kind ? ' ' + kind : '');
    const icon = kind === 'ok' ? '✓' : kind === 'error' ? '⚠' : kind === 'warn' ? 'ⓘ' : '📌';
    let html = '<span class="toast-icon">' + icon + '</span><span class="toast-text">' + escapeHtml(msg) + '</span>';
    if (actionLabel) html += '<button type="button" class="toast-action">' + escapeHtml(actionLabel) + '</button>';
    t.innerHTML = html;
    cont.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    if (actionFn) t.querySelector('.toast-action').addEventListener('click', function () { t.remove(); actionFn(); });
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, timeoutMs || (actionLabel ? 5000 : 2400));
  }

  function addGoal(f) {
    const goal = {
      id: uid(),
      title: f.title,
      description: f.description || '',
      priority: f.priority,
      deadline: f.deadline,
      parentId: (typeof f.parentId === 'string' && f.parentId) ? f.parentId : null,
      isInbox: false,
      archivedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false,
      journal: [],
      tasks: []
    };
    state.goals.push(goal);
    saveData(); render();
    pushUndo(function () { state.goals = state.goals.filter(function (x) { return x.id !== goal.id; }); saveData(); render(); }, 'создание цели');
  }
  function updateGoal(id, f) { const g = findGoal(id); if (!g) return; const prev = { title: g.title, description: g.description, priority: g.priority, deadline: g.deadline }; Object.assign(g, f); saveData(); render(); pushUndo(function () { Object.assign(g, prev); saveData(); render(); }, 'изменение'); }
       function deleteGoal(id) {
    const g = findGoal(id); if (!g) return;
    const snapshot = JSON.parse(JSON.stringify(g));
    const idx = state.goals.indexOf(g);
    state.goals.splice(idx, 1);
    delete state.collapsed[id];
    const entry = moveToTrash('goal', snapshot);
    saveData(); savePrefs(); render();
    showToast('Цель удалена', 'warn', 'Восстановить', function() { restoreFromTrash(entry.id); }, 6000);
  }
        function addTask(goalId, f) {
    const goal = goalId ? (findGoal(goalId) || ensureInboxGoal()) : ensureInboxGoal();
    const isDone = !!f.done;
    var explicitTags = normalizeTags(f.tags || []);
    var finalTags = explicitTags.length ? explicitTags : autoCategorize(f.text);
    goal.tasks.push({
      id: uid(),
      text: f.text,
      done: isDone,
      priority: f.priority || 'medium',
      deadline: f.deadline || '',
      time: f.time || '',
      status: f.status || (isDone ? 'done' : 'todo'),
      repeat: f.repeat || null,
        tags: finalTags,
      pinned: false,
      archivedAt: null,
      createdAt: Date.now(),
      subtasks: []
    });
    saveData(); render();
  }
    function toggleTask(goalId, taskId) {
    const g = findGoal(goalId); if (!g) return;
    const t = g.tasks.find(function (x) { return x.id === taskId; }); if (!t) return;
        const wasDone = t.done;
    t.done = !t.done;
    t.doneAt = t.done ? Date.now() : null;
    t.status = t.done ? 'done' : (t.status === 'done' ? 'todo' : t.status);
    if (t.done && !wasDone && t.repeat) { const next = cloneRepeatedTask(t); if (next) { g.tasks.push(next); showToast('Создана следующая', 'ok'); } }
    saveData();
    const active = document.activeElement;
    const restore = (active && active.matches && active.matches('input[data-action="toggle-task"]')) ? { taskId: active.dataset.taskId, source: active.closest('#goalsList') ? 'goals' : 'tasks' } : null;
    render();
    if (restore) { const c = restore.source === 'goals' ? document.getElementById('goalsList') : document.getElementById('tasksList'); const cb = c ? c.querySelector('input[data-action="toggle-task"][data-task-id="' + CSS.escape(restore.taskId) + '"]') : null; if (cb) cb.focus(); }
  }
    function cloneRepeatedTask(t) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let nextDate = t.deadline ? new Date(t.deadline + 'T00:00:00') : new Date(today);
    if (t.repeat.type === 'daily') {
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (t.repeat.type === 'weekdays') {
      do { nextDate.setDate(nextDate.getDate() + 1); } while (nextDate.getDay() === 0 || nextDate.getDay() === 6);
    } else if (t.repeat.type === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (t.repeat.type === 'monthly') {
      // Клампинг дня месяца: 31 янв → 28/29 фев, а не 3 марта
      const srcDay = nextDate.getDate();
      const srcMonth = nextDate.getMonth();
      const srcYear = nextDate.getFullYear();
      nextDate.setDate(1);
      nextDate.setMonth(srcMonth + 1);
      const lastDayInTargetMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
      nextDate.setDate(Math.min(srcDay, lastDayInTargetMonth));
      // На случай странных переходов через год
      if (nextDate < new Date(srcYear, srcMonth, srcDay)) {
        nextDate = new Date(srcYear, srcMonth + 1, Math.min(srcDay, lastDayInTargetMonth));
      }
    }
    const copy = JSON.parse(JSON.stringify(t));
    copy.id = uid();
    copy.done = false;
    copy.doneAt = null;
    copy.status = 'todo';
    copy.archivedAt = null;
    copy.deadline = dateToISO(nextDate);
    copy.createdAt = Date.now();
    return copy;
  }
    function deleteTask(goalId, taskId) {
    const g = findGoal(goalId); if (!g) return;
    const t = g.tasks.find(function (x) { return x.id === taskId; }); if (!t) return;
    const snapshot = JSON.parse(JSON.stringify(t));
    const idx = g.tasks.indexOf(t);
    g.tasks.splice(idx, 1);
    const entry = moveToTrash('task', snapshot, { goalId: g.id, goalTitle: g.title });
    saveData(); render();
    showToast('Задача удалена', 'warn', 'Восстановить', function() { restoreFromTrash(entry.id); }, 6000);
  }
    function archiveGoal(id) {
    if (archivingGoalId) return;
    const g = findGoal(id); if (!g) return;
    const activeTasks = g.tasks.filter(function (t) { return !t.archivedAt; });
    const pending = activeTasks.filter(function (t) { return !t.done; });
    if (pending.length > 0) {
      pgtConfirm({
        title: 'Завершить цель?',
        message: 'В цели «' + g.title + '» ' + pending.length + ' невыполненных задач. Они будут отмечены выполненными.',
        yesLabel: 'Завершить',
        danger: false,
        onYes: function () { archiveGoalNow(id, pending); }
      });
      return;
    }
    archiveGoalNow(id, pending);
  }
  function archiveGoalNow(id, pending) {
    const g = findGoal(id); if (!g) return;
    const activeTasks = g.tasks.filter(function (t) { return !t.archivedAt; });
    pending.forEach(function (t) { t.done = true; });
    saveData();
    const goalEl = document.querySelector('.goal[data-goal-id="' + CSS.escape(id) + '"]');
    archivingGoalId = id;
    if (goalEl) { goalEl.classList.add('all-done', 'archiving'); const fill = goalEl.querySelector('.goal-progress .bar'); if (fill) { const total = activeTasks.length; const cur = total ? Math.round((total - pending.length) / total * 100) : 0; fill.style.width = cur + '%'; void fill.offsetWidth; requestAnimationFrame(function () { fill.style.width = '100%'; }); } pending.forEach(function (t) { const cb = goalEl.querySelector('.task input[data-task-id="' + CSS.escape(t.id) + '"]'); if (cb) { cb.checked = true; const r = cb.closest('.task'); if (r) r.classList.add('done'); } }); setTimeout(function () { goalEl.classList.add('fading'); }, ARCHIVE_ANIM_MS - 300); }
    setTimeout(function () { archivingGoalId = null; const gg = findGoal(id); if (!gg) { render(); return; } gg.archivedAt = Date.now(); delete state.collapsed[id]; saveData(); savePrefs(); render(); }, ARCHIVE_ANIM_MS);
  }
  function restoreGoal(id) { const g = findGoal(id); if (!g) return; g.archivedAt = null; saveData(); render(); }
    function archiveTask(goalId, taskId) {
    const g = findGoal(goalId); if (!g) return;
    const t = g.tasks.find(function (x) { return x.id === taskId; }); if (!t) return;
    if (!t.done) {
      pgtConfirm({ title: 'Задача не выполнена', message: 'Пометить её выполненной и убрать в архив?', yesLabel: 'В архив', danger: false, onYes: function(){ t.done = true; t.archivedAt = Date.now(); saveData(); render(); } });
      return;
    }
    t.archivedAt = Date.now(); saveData(); render();
  }
  function restoreTask(goalId, taskId) { const g = findGoal(goalId); if (!g) return; const t = g.tasks.find(function (x) { return x.id === taskId; }); if (!t) return; t.archivedAt = null; saveData(); render(); }
  function toggleGoalCollapse(id) {
    state.collapsed[id] = !state.collapsed[id];
    const goals = visibleGoals();
    state.allCollapsedSnapshot = goals.length > 0 && goals.every(function (g) { return state.collapsed[g.id]; });
    savePrefs(); renderGoals(); renderToggleAllButton();
  }
  function collapseAll() { state.goals.forEach(function (g) { state.collapsed[g.id] = true; }); state.allCollapsedSnapshot = true; savePrefs(); renderGoals(); renderToggleAllButton(); }
  function expandAll() { state.goals.forEach(function (g) { state.collapsed[g.id] = false; }); state.allCollapsedSnapshot = false; savePrefs(); renderGoals(); renderToggleAllButton(); }

  // === МОДАЛ РЕДАКТИРОВАНИЯ ЗАДАЧИ ===
  function openEditTask(goalId, taskId) {
    const g = findGoal(goalId); if (!g) return;
    const t = g.tasks.find(function (x) { return x.id === taskId; }); if (!t) return;
    state.editingTaskId = taskId;
    state.editingTaskGoalId = goalId;
    document.getElementById('editTaskText').value = t.text || '';
    document.getElementById('editTaskPriority').value = t.priority || 'medium';
    document.getElementById('editTaskDeadline').value = t.deadline || '';
    document.getElementById('editTaskStatus').value = t.status || (t.done ? 'done' : 'todo');
    renderEditSubtasks();
    document.getElementById('editTaskTags').value = (t.tags || []).map(function (x) { return '#' + x; }).join(' ');
          const sel = document.getElementById('editTaskGoal');
    const opts = ['<option value=""' + (g.isInbox ? ' selected' : '') + '>— Без цели —</option>'];
    state.goals.forEach(function (gg) {
      if (gg.archivedAt || gg.isInbox) return;
      opts.push('<option value="' + escapeHtml(gg.id) + '"' + (gg.id === goalId ? ' selected' : '') + '>' + escapeHtml(gg.title) + '</option>');
    });
    sel.innerHTML = opts.join('');
    document.getElementById('editTaskModal').hidden = false;
    setTimeout(function () { document.getElementById('editTaskText').focus(); }, 50);
  }
  function closeEditTask() {
    document.getElementById('editTaskModal').hidden = true;
    state.editingTaskId = null;
    state.editingTaskGoalId = null;
  }
  function saveEditTask() {
    const taskId = state.editingTaskId;
    const oldGoalId = state.editingTaskGoalId;
    if (!taskId || !oldGoalId) return;
    const g = findGoal(oldGoalId); if (!g) { closeEditTask(); return; }
    const t = g.tasks.find(function (x) { return x.id === taskId; }); if (!t) { closeEditTask(); return; }
    const textEl = document.getElementById('editTaskText');
    const newText = textEl.value.trim();
    if (!newText) { markInvalid(textEl); showToast('Текст не может быть пустым', 'warn'); return; }
    const newGoalId = document.getElementById('editTaskGoal').value || '';
    const newPriority = document.getElementById('editTaskPriority').value;
    const newDeadline = document.getElementById('editTaskDeadline').value || '';
    const newTags = normalizeTags(parseTags(document.getElementById('editTaskTags').value));

    t.text = newText;
    t.priority = newPriority;
    t.deadline = newDeadline;
    t.tags = newTags;
    const newStatus = document.getElementById('editTaskStatus').value || 'todo';
    t.status = newStatus;
    t.done = (newStatus === 'done');

          if (newGoalId !== oldGoalId) {
      let targetGoal;
      if (!newGoalId) targetGoal = ensureInboxGoal();
      else targetGoal = findGoal(newGoalId);
      if (targetGoal && targetGoal.id !== g.id) {
        g.tasks = g.tasks.filter(function (x) { return x.id !== taskId; });
        targetGoal.tasks.push(t);
        showToast('Задача перемещена в «' + targetGoal.title + '»', 'ok');
      }
    } else {
      showToast('Задача обновлена', 'ok');
    }
    saveData(); render();
    closeEditTask();
  }
    function deleteTaskFromEdit() {
    const taskId = state.editingTaskId;
    const goalId = state.editingTaskGoalId;
    if (!taskId || !goalId) return;
    closeEditTask();
    pgtConfirm({
      title: 'Удалить задачу?',
      message: 'Задача будет удалена безвозвратно.',
      yesLabel: 'Да, удалить',
      onYes: function () { deleteTask(goalId, taskId); }
    });
  }

  // === МОДАЛ РЕДАКТИРОВАНИЯ ЦЕЛИ ===
    function openEditGoal(id) {
    const g = findGoal(id); if (!g) return;
    state.editingGoalId = id;
    document.getElementById('editGoalTitle').value = g.title || '';
    document.getElementById('editGoalDesc').value = g.description || '';
    document.getElementById('editGoalPriority').value = g.priority || 'medium';
    document.getElementById('editGoalDeadline').value = g.deadline || '';

    // Заполняем селект «Родительская цель» — исключая саму цель и её потомков
    try {
      const selParent = document.getElementById('editGoalParent');
      if (selParent) {
        const parents = state.goals.filter(function (x) { return !x.isInbox && !x.archivedAt && x.id !== id; });
        const excluded = collectDescendantIds(id);
        const available = parents.filter(function (x) { return !excluded[x.id]; });
        selParent.innerHTML = '<option value="">— Верхний уровень —</option>' + available.map(function (x) {
          return '<option value="' + escapeHtml(x.id) + '">' + escapeHtml(x.title) + '</option>';
        }).join('');
        selParent.value = g.parentId || '';
        if (selParent.value !== (g.parentId || '')) selParent.value = '';
      }
    } catch (e) {}

    renderEditGoalJournal(g);
    document.getElementById('editGoalModal').hidden = false;
    setTimeout(function () { document.getElementById('editGoalTitle').focus(); }, 50);
  }
  function closeEditGoal() {
    document.getElementById('editGoalModal').hidden = true;
    state.editingGoalId = null;
  }
  function renderEditGoalJournal(g) {
    const box = document.getElementById('editGoalJournalList');
    if (!g.journal || !g.journal.length) { box.innerHTML = '<div class="empty" style="font-size:11px;">Пока нет записей</div>'; return; }
    const sorted = g.journal.slice().sort(function (a, b) { return b.ts - a.ts; });
    box.innerHTML = sorted.map(function (e, i) {
      return '<div class="goal-journal-item"><span>' + escapeHtml(e.text) + '</span><span style="display:flex;gap:6px;align-items:center;"><span class="ts">' + formatDateTime(e.ts) + '</span><button type="button" class="del" data-action="delete-goal-journal" data-idx="' + i + '">✕</button></span></div>';
    }).join('');
  }
  function addGoalJournalEntry() {
    const g = findGoal(state.editingGoalId); if (!g) return;
    const inp = document.getElementById('editGoalJournalNew');
    const text = inp.value.trim(); if (!text) return;
    if (!g.journal) g.journal = [];
    g.journal.push({ ts: Date.now(), text: text });
    inp.value = '';
    saveData(); renderEditGoalJournal(g); renderGoals();
  }
  function deleteGoalJournalEntry(idx) {
    const g = findGoal(state.editingGoalId); if (!g || !g.journal) return;
    const sorted = g.journal.slice().sort(function (a, b) { return b.ts - a.ts; });
    const item = sorted[idx]; if (!item) return;
    const realIdx = g.journal.indexOf(item);
    if (realIdx !== -1) g.journal.splice(realIdx, 1);
    saveData(); renderEditGoalJournal(g); renderGoals();
  }
    function saveEditGoal() {
    const id = state.editingGoalId; if (!id) return;
    const g = findGoal(id); if (!g) { closeEditGoal(); return; }
    const titleEl = document.getElementById('editGoalTitle');
    const title = titleEl.value.trim();
    if (!title) { markInvalid(titleEl); showToast('Название не может быть пустым', 'warn'); return; }
    g.title = title;
    g.description = document.getElementById('editGoalDesc').value.trim();
    g.priority = document.getElementById('editGoalPriority').value;
    g.deadline = document.getElementById('editGoalDeadline').value || '';

    // Сохраняем родителя (с защитой от цикла)
    const selParent = document.getElementById('editGoalParent');
    if (selParent) {
      const newParent = selParent.value || '';
      if (newParent) {
        // Проверяем: не является ли новая родительская цель потомком текущей
        const excluded = collectDescendantIds(id);
        if (newParent === id || excluded[newParent]) {
          showToast('Нельзя: цель окажется внутри себя', 'warn');
          // откатываем селект
          selParent.value = g.parentId || '';
          return;
        }
      }
      g.parentId = newParent || null;
    }

    g.updatedAt = Date.now();
    saveData(); render(); closeEditGoal();
    showToast('Цель обновлена', 'ok');
  }
  function deleteGoalFromEdit() {
    const id = state.editingGoalId; if (!id) return;
    closeEditGoal();
    deleteGoal(id);
  }

  // === ТЕГИ ===
  function getAllTags() {
    const set = {};
    state.goals.forEach(function (g) { g.tasks.forEach(function (t) { (t.tags || []).forEach(function (tag) { set[tag] = (set[tag] || 0) + 1; }); }); });
    state.snippets.forEach(function (s) { (s.tags || []).forEach(function (tag) { set[tag] = (set[tag] || 0) + 1; }); });
    state.notes.forEach(function (n) { (n.tags || []).forEach(function (tag) { set[tag] = (set[tag] || 0) + 1; }); });
    return Object.keys(set).sort(function (a, b) { return a.localeCompare(b, 'ru'); });
  }
  function renderTagsDatalist() {
    const tags = getAllTags();
    document.getElementById('allTagsList').innerHTML = tags.map(function (t) { return '<option value="' + escapeHtml(t) + '"></option>'; }).join('');
  }
  function renderTagFilterSelect() {
    const sel = document.getElementById('tagFilterSelect');
    const tags = getAllTags();
    const prev = state.tagFilter || '';
    sel.innerHTML = '<option value="">Все теги</option>' + tags.map(function (t) { return '<option value="' + escapeHtml(t) + '">#' + escapeHtml(t) + '</option>'; }).join('');
    if (prev && tags.indexOf(prev) !== -1) sel.value = prev;
    else { sel.value = ''; state.tagFilter = ''; }
  }

  const DOW_MAP = { 'пн':1, 'вт':2, 'ср':3, 'чт':4, 'пт':5, 'сб':6, 'вс':0, 'воскресенье':0, 'понедельник':1, 'вторник':2, 'среда':3, 'четверг':4, 'пятница':5, 'суббота':6 };
   function parseQuickInput(str) {
    const result = { text: str, deadline: '', priority: 'medium', tags: [] };
    let s = ' ' + str + ' ';
    const today = new Date(); today.setHours(0,0,0,0);
    s = s.replace(/\s+(?:на\s+|в\s+)?(сегодня)\s+/i, function () { result.deadline = dateToISO(today); return ' '; });
    s = s.replace(/\s+(?:на\s+|в\s+)?(завтра)\s+/i, function () { const d = new Date(today); d.setDate(d.getDate() + 1); result.deadline = dateToISO(d); return ' '; });
    s = s.replace(/\s+(?:на\s+|в\s+)?(послезавтра)\s+/i, function () { const d = new Date(today); d.setDate(d.getDate() + 2); result.deadline = dateToISO(d); return ' '; });
    s = s.replace(/\s+через\s+(\d{1,3})\s+(?:день|дня|дней)\s+/i, function (m, n) { const d = new Date(today); d.setDate(d.getDate() + parseInt(n, 10)); result.deadline = dateToISO(d); return ' '; });
    s = s.replace(/\s+через\s+(?:неделю|недели)\s+/i, function () { const d = new Date(today); d.setDate(d.getDate() + 7); result.deadline = dateToISO(d); return ' '; });
    s = s.replace(/\s+через\s+(?:месяц|месяца)\s+/i, function () { const d = new Date(today); d.setDate(d.getDate() + 30); result.deadline = dateToISO(d); return ' '; });
    s = s.replace(/\s+\+(\d{1,3})\s+/, function (m, n) { const d = new Date(today); d.setDate(d.getDate() + parseInt(n, 10)); result.deadline = dateToISO(d); return ' '; });
    s = s.replace(/\s+(?:в\s+|на\s+)?(пн|вт|ср|чт|пт|сб|вс|понедельник|вторник|среда|четверг|пятница|суббота|воскресенье)\s+/i, function (m, w) { const target = DOW_MAP[w.toLowerCase()]; if (target === undefined) return m; const d = new Date(today); let diff = (target - d.getDay() + 7) % 7; if (diff === 0) diff = 7; d.setDate(d.getDate() + diff); result.deadline = dateToISO(d); return ' '; });
    s = s.replace(/\s+(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?\s+/, function (m, dd, mm, yyyy) { const d = new Date(today); d.setDate(parseInt(dd, 10)); d.setMonth(parseInt(mm, 10) - 1); if (yyyy) { let y = parseInt(yyyy, 10); if (y < 100) y += 2000; d.setFullYear(y); } result.deadline = dateToISO(d); return ' '; });
    s = s.replace(/\s+!(важно|высокий|high|1)\s+/i, function () { result.priority = 'high'; return ' '; });
    s = s.replace(/\s+!(низкий|low|3)\s+/i, function () { result.priority = 'low'; return ' '; });
    s = s.replace(/\s+!(средний|medium|2)\s+/i, function () { result.priority = 'medium'; return ' '; });
    const tags = s.match(/#[^\s#!]+/g) || [];
    tags.forEach(function (m) { result.tags.push(m.replace(/^#/, '')); });
    s = s.replace(/#[^\s#!]+/g, ' ');
    result.text = s.replace(/\s+/g, ' ').trim();
    return result;
  }
let _dataFolderHandle = null;
let _dataFolderWriteTimer = null;
const dataFolderSupported = (typeof window.showDirectoryPicker === 'function');
    let _editingHabitId = null;
  let _confirmDeleteHabitId = null;
let _voiceRecognition = null;
  let _voiceRecognitionActive = false;

    let _voiceRestartTimer = null;
  let _voiceShouldBeActive = false;

    function startVoiceInput() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      showToast('Голосовой ввод не поддерживается. Попробуйте Chrome / Safari.', 'warn', null, null, 6000);
      return;
    }
    const input = document.getElementById('quickInput');
    const btn = document.getElementById('quickVoiceBtn');

    // Прибиваем возможный «зависший» таймер от предыдущей сессии
    clearTimeout(_voiceRestartTimer);
    _voiceRestartTimer = null;

    // Если уже идёт — остановим
    if (_voiceShouldBeActive) {
      _voiceShouldBeActive = false;
      if (_voiceRecognition) {
        try { _voiceRecognition.stop(); } catch (e) {}
      }
      return;
    }

           const beforeText = (input.value || '').trim();
    // finalText и lastRestartAt — ВНЕ createAndStart: переживают перезапуски.
    let finalText = '';
    let lastRestartAt = 0;
    _voiceShouldBeActive = true;

    function createAndStart() {
      if (!_voiceShouldBeActive) return;

      // Если остался «живой» старый экземпляр — прибиваем его перед созданием
      // нового, иначе Safari откажется запускать запись второй раз.
      if (_voiceRecognition) {
        try { _voiceRecognition.abort(); } catch (e) {
          try { _voiceRecognition.stop(); } catch (e2) {}
        }
        _voiceRecognition = null;
      }

      const rec = new SpeechRec();
      rec.lang = 'ru-RU';
      rec.interimResults = true;
      rec.continuous = true;
      rec.maxAlternatives = 1;
      _voiceRecognition = rec;

      rec.onstart = function () {
        if (_voiceRecognition !== rec) return; // чужой экземпляр
        _voiceRecognitionActive = true;
        if (btn) btn.classList.add('recording');
      };

      rec.onresult = function (event) {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) finalText += res[0].transcript;
          else interim += res[0].transcript;
        }
        const combined = (beforeText ? beforeText + ' ' : '') + (finalText || interim);
        input.value = combined.trim();
      };

      rec.onerror = function (e) {
        const err = e && e.error ? e.error : 'unknown';

        // Безобидные ошибки — не пугаем пользователя
        if (err === 'aborted' || err === 'no-speech' || err === 'network') {
          return; // просто попробуем перезапустить в onend
        }
        if (err === 'not-allowed' || err === 'service-not-allowed') {
          _voiceShouldBeActive = false;
          if (btn) btn.classList.remove('recording');
          showToast('Доступ к микрофону запрещён. Разрешите его в настройках браузера.', 'warn', null, null, 6000);
          return;
        }
        if (err === 'audio-capture') {
          _voiceShouldBeActive = false;
          if (btn) btn.classList.remove('recording');
          showToast('Микрофон не найден. Проверьте, что он подключён.', 'warn', null, null, 6000);
          return;
        }
        console.warn('[voice]', err);
      };

              rec.onend = function () {
        // Если уже создан новый экземпляр — не трогаем общее состояние.
        if (_voiceRecognition !== rec) return;
        _voiceRecognition = null;
        _voiceRecognitionActive = false;

        // Если пользователь не остановил — попробуем перезапустить,
        // но не чаще 1 раза в секунду (защита от бесконечного цикла).
        if (_voiceShouldBeActive) {
          const now = Date.now();
          if (now - lastRestartAt < 1000) {
            // Слишком часто — значит что-то не так. Остановимся.
            _voiceShouldBeActive = false;
            if (btn) btn.classList.remove('recording');
            input.focus();
            return;
          }
          lastRestartAt = now;
          clearTimeout(_voiceRestartTimer);
          _voiceRestartTimer = setTimeout(function () {
            if (_voiceShouldBeActive) {
              try { createAndStart(); } catch (e) { _voiceShouldBeActive = false; }
            }
          }, 250);
          return;
        }

        // Пользователь сам остановил запись.
        // Если в поле что-то распознано — автоматически добавляем задачу,
        // чтобы не нужно было тыкать «Добавить». Если поле пустое (просто
        // случайный тап по 🎤) — оставляем как было: возвращаем фокус.
        if (btn) btn.classList.remove('recording');
        const recognized = (input.value || '').trim();
        if (recognized) {
          handleQuickAdd();
        } else {
          input.focus();
        }
      };

            try { rec.start(); }
      catch (e) {
        if (_voiceRecognition === rec) _voiceRecognition = null;
        try { rec.stop(); } catch (e2) {}
        _voiceShouldBeActive = false;
        if (btn) btn.classList.remove('recording');
        showToast('Не удалось запустить микрофон', 'error');
      }
    }

    createAndStart();
  }

  function handleQuickAdd() {
    const input = document.getElementById('quickInput');
    const raw = input.value.trim(); if (!raw) return;
    const parsed = parseQuickInput(raw);
    if (!parsed.text) { showToast('Пустая задача', 'warn'); return; }
    const goals = state.goals.filter(function (g) { return !g.isInbox && !g.archivedAt; });
    let deadline = parsed.deadline;
    let usedCalDate = false;
    if (!deadline && state.calSelectedDate) { deadline = state.calSelectedDate; usedCalDate = true; }
    addTask(null, { text: parsed.text, priority: parsed.priority, deadline: deadline, tags: parsed.tags });

    // Очищаем поле ввода
    input.value = '';

    // Если сейчас идёт голосовой ввод — остановим его, чтобы старый текст
    // не «прилип» к новому
    if (typeof _voiceShouldBeActive !== 'undefined' && _voiceShouldBeActive) {
      _voiceShouldBeActive = false;
      try { if (_voiceRecognition) _voiceRecognition.stop(); } catch (e) {}
      const vbtn = document.getElementById('quickVoiceBtn');
      if (vbtn) vbtn.classList.remove('recording');
    }

       // Возвращаем фокус в поле — удобно добавлять задачи одну за другой
    input.focus();

    // Принудительно перерисовываем списки, минуя защиту isTypingNow():
    // пользователь нажал Enter — он уже точно закончил ввод этой задачи
    // и ждёт, что она появится в списке. Без этого render() видит, что
    // фокус в поле, и откладывает перерисовку.
    renderGoals();
    renderTasks();

    if (usedCalDate) showToast('Задача добавлена на ' + formatDate(deadline), 'ok');
    else showToast('Добавлено: ' + parsed.text, 'ok');
  }

  function readAsText(file) { return new Promise(function (res, rej) { const r = new FileReader(); r.onload = function () { res(String(r.result || '')); }; r.onerror = function () { rej(r.error || new Error('FileReader')); }; r.readAsText(file); }); }
async function extractDocxText(file) {
  try { await waitForLib('mammoth'); } catch (e) { return ''; }
  try { const buf = await file.arrayBuffer(); const r = await window.mammoth.extractRawText({ arrayBuffer: buf }); return r.value || ''; } catch (e) { return ''; }
}
async function extractMarkdownHtml(file) {
  const text = await readAsText(file);
  try { await waitForLib('marked'); } catch (e) {}
  if (window.marked && typeof window.marked.parse === 'function') {
    try { return window.marked.parse(text); } catch (e) {}
  }
  return '<pre style="white-space:pre-wrap">' + escapeHtml(text) + '</pre>';
}
  async function extractTextFromFile(file) {
    const ext = getExt(file.name);
    if (ext === 'txt' || ext === 'md' || ext === 'markdown') return await readAsText(file);
    if (ext === 'docx') return await extractDocxText(file);
     if (ext === 'pdf') {
    try { await ensurePdfJs(); } catch (e) { return ''; }
    if (!window.pdfjsLib) return ''; try { const buf = await file.arrayBuffer(); const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise; const parts = []; for (let i = 1; i <= Math.min(pdf.numPages, 200); i++) { const page = await pdf.getPage(i); const tc = await page.getTextContent(); parts.push(tc.items.map(function (it) { return it.str; }).join(' ')); } return parts.join('\n\n'); } catch (e) { return ''; } }
    return '';
  }

  async function indexFolder(section) {
    const files = state.folders[section].files;
    if (!files.length) { showToast('Нет файлов', 'warn'); return; }
    const btn = document.querySelector('[data-action="index-folder"][data-section="' + section + '"]');
    if (btn) { btn.classList.add('busy'); btn.textContent = '🔎 Индексирую…'; }
    let done = 0, errors = 0;
    for (const meta of files) {
      try { const file = await resolveFile(section, meta.name); if (!file) { errors++; continue; } const text = await extractTextFromFile(file); if (!text || !text.trim()) { errors++; continue; } await idbPut(IDB_INDEX, null, { key: section + '::' + meta.name, section: section, fileName: meta.name, text: text.slice(0, 500000), indexedAt: Date.now() }); done++; if (btn) btn.textContent = '🔎 ' + done + '/' + files.length + '…'; }
      catch (e) { errors++; }
    }
    if (btn) { btn.classList.remove('busy'); btn.textContent = '🔎 Индексировать'; }
    showToast('Проиндексировано: ' + done + (errors ? ', ошибок: ' + errors : ''), done ? 'ok' : 'warn');
  }
  async function openContentSearch(section) {
    document.getElementById('contentSearchModal').hidden = false;
    const info = document.getElementById('contentSearchInfo');
    const idx = await idbGetAll(IDB_INDEX);
    const own = idx.filter(function (x) { return x.section === section; });
    info.innerHTML = 'Индекс: <b>' + own.length + '</b> из <b>' + state.folders[section].files.length + '</b>';
    const inp = document.getElementById('contentSearchInput');
    inp.value = ''; inp.dataset.section = section;
    document.getElementById('contentSearchBody').innerHTML = '<div class="modal-empty">Введите запрос</div>';
    inp.focus();
  }
  async function performContentSearch(query, section) {
    const body = document.getElementById('contentSearchBody');
    const q = query.trim().toLowerCase();
    if (!q) { body.innerHTML = '<div class="modal-empty">Введите запрос</div>'; return; }
    const idx = await idbGetAll(IDB_INDEX);
    const own = idx.filter(function (x) { return x.section === section; });
    const results = [];
    own.forEach(function (item) {
      const text = item.text || ''; const lower = text.toLowerCase();
      let pos = 0; const hits = [];
      while (hits.length < 5) { const i = lower.indexOf(q, pos); if (i === -1) break; const start = Math.max(0, i - 60); const end = Math.min(text.length, i + q.length + 60); let snip = text.slice(start, end).replace(/\s+/g, ' '); if (start > 0) snip = '…' + snip; if (end < text.length) snip = snip + '…'; hits.push({ pos: i, snippet: snip }); pos = i + q.length; }
      if (hits.length) results.push({ fileName: item.fileName, hits: hits });
    });
    if (!results.length) { body.innerHTML = '<div class="modal-empty">Ничего не найдено</div>'; return; }
    const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    body.innerHTML = '<div class="modal-hint">Найдено в <b>' + results.length + '</b> файл(ах)</div>' + results.map(function (r) { return '<div class="snippet"><div class="snippet-head"><div class="snippet-source"><span class="kind">' + escapeHtml(getExt(r.fileName).toUpperCase()) + '</span><span class="name">' + escapeHtml(r.fileName) + '</span></div><button type="button" class="icon-btn" data-action="open-indexed" data-section="' + section + '" data-file="' + escapeHtml(r.fileName) + '">📂</button></div>' + r.hits.map(function (h) { return '<div class="snippet-text">' + escapeHtml(h.snippet).replace(re, '<mark style="background:rgba(88,166,255,.4);padding:0 2px;border-radius:2px;color:inherit">$1</mark>') + '</div>'; }).join('') + '</div>'; }).join('');
  }

    function openGlobalSearch() {
    if (_searchIndexDirty) { rebuildSearchIndex(); _searchIndexDirty = false; }
    document.getElementById('globalSearchModal').hidden = false;
    const inp = document.getElementById('globalSearchInput');
    inp.value = '';
    document.getElementById('globalSearchResults').innerHTML = '<div class="modal-empty">Введите минимум 2 символа</div>';
    setTimeout(function () { inp.focus(); }, 50);
  }
  function closeGlobalSearch() { document.getElementById('globalSearchModal').hidden = true; }
  async function performGlobalSearch(q) {
    q = (q || '').trim().toLowerCase();
    const box = document.getElementById('globalSearchResults');
    if (q.length < 2) { box.innerHTML = '<div class="modal-empty">Введите минимум 2 символа</div>'; return; }
    const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    const hl = function (s) { return escapeHtml(String(s == null ? '' : s)).replace(re, '<mark>$1</mark>'); };
    const TYPE_TITLE = { goal: '🎯 Цели', task: '✓ Задачи', snippet: '📄 Цитаты', note: '📝 Заметки', file: '📁 Файлы' };
    const groups = {};
    for (let i = 0; i < searchIndex.length; i++) {
      if (searchIndex[i].haystack.indexOf(q) !== -1) {
        const t = searchIndex[i].type;
        (groups[t] = groups[t] || []).push(searchIndex[i]);
      }
    }
    let html = '';
    ['goal', 'task', 'snippet', 'note', 'file'].forEach(function (type) {
      const arr = groups[type]; if (!arr || !arr.length) return;
      html += '<div class="search-section"><h4>' + TYPE_TITLE[type] + ' (' + arr.length + ')</h4>';
      arr.slice(0, 25).forEach(function (h) {
        if (type === 'goal') html += '<div class="search-result" data-action="goto-goal" data-id="' + escapeHtml(h.id) + '"><div class="search-result-title">' + hl(h.title) + '</div><div class="search-result-sub">' + (h.desc ? hl(h.desc.slice(0, 120)) : '') + '</div></div>';
        else if (type === 'task') html += '<div class="search-result" data-action="goto-task" data-goal-id="' + escapeHtml(h.goalId) + '" data-task-id="' + escapeHtml(h.id) + '"><div class="search-result-title">' + hl(h.title) + '</div><div class="search-result-sub">' + hl(h.desc) + '</div></div>';
        else if (type === 'snippet') html += '<div class="search-result" data-action="goto-snippet" data-id="' + escapeHtml(h.id) + '"><div class="search-result-title">' + hl(h.title) + '</div><div class="search-result-sub">' + escapeHtml(h.desc) + '</div></div>';
        else if (type === 'note') html += '<div class="search-result" data-action="goto-note" data-id="' + escapeHtml(h.id) + '"><div class="search-result-title">' + hl(h.title) + '</div><div class="search-result-sub">' + hl(h.desc) + '</div></div>';
        else if (type === 'file') html += '<div class="search-result" data-action="goto-file" data-section="' + h.section + '" data-name="' + escapeHtml(h.name) + '"><div class="search-result-title">' + hl(h.title) + '</div><div class="search-result-sub">' + h.desc + '</div></div>';
      });
      html += '</div>';
    });
    box.innerHTML = html || '<div class="modal-empty">Ничего не найдено</div>';
    try {
      const idx = await idbGetAll(IDB_INDEX);
      const found = [];
      idx.forEach(function (item) {
        const i = (item.text || '').toLowerCase().indexOf(q); if (i === -1) return;
        const text = item.text;
        const start = Math.max(0, i - 60), end = Math.min(text.length, i + q.length + 60);
        let snip = text.slice(start, end).replace(/\s+/g, ' ');
        if (start > 0) snip = '…' + snip;
        if (end < text.length) snip = snip + '…';
        found.push({ section: item.section, fileName: item.fileName, snippet: snip });
      });
      if (found.length) {
        let extra = '<div class="search-section"><h4>📖 В содержимом файлов (' + found.length + ')</h4>';
        found.slice(0, 15).forEach(function (f) { extra += '<div class="search-result" data-action="goto-file" data-section="' + f.section + '" data-name="' + escapeHtml(f.fileName) + '"><div class="search-result-title">' + escapeHtml(f.fileName) + '</div><div class="search-result-sub">' + hl(f.snippet) + '</div></div>'; });
        extra += '</div>';
        box.insertAdjacentHTML('beforeend', extra);
      }
    } catch (e) {}
  }

   function requestNotifications() { if (!('Notification' in window)) { showToast('Уведомления не поддерживаются', 'error'); return; } Notification.requestPermission().then(function (perm) { if (perm === 'granted') { state.notificationsEnabled = true; savePrefs(); showToast('Уведомления включены', 'ok'); updateNotifBtn(); } else showToast('Разрешение не предоставлено', 'warn'); }); }
  function updateNotifBtn() { const btn = document.getElementById('notifToggle'); if (!btn) return; btn.textContent = state.notificationsEnabled ? 'Выключить' : 'Включить'; }
    // === PIN-ЗАЩИТА ===
  const PIN_HASH_KEY = 'pgt_v25_pin_hash';
  const PIN_SALT_KEY = 'pgt_v25_pin_salt';
  const PIN_UNLOCK_FLAG = 'pgt_v25_unlocked';
  const PIN_LEN_KEY = 'pgt_v25_pin_len';
  const PIN_ATTEMPTS_KEY = 'pgt_v25_pin_attempts';
  const PIN_LOCK_UNTIL_KEY = 'pgt_v25_pin_lock_until';
  const PIN_LOCK_LEVEL_KEY = 'pgt_v25_pin_lock_level';
  const MIN_PIN_LEN = 4;
  const MAX_PIN_LEN = 8;
  const SIMPLE_PINS = ['1234','12345','123456','1234567','12345678','4321','54321','0123','0000','1111','2222','3333','4444','5555','6666','7777','8888','9999'];

  function randomSalt() {
    const arr = new Uint8Array(16);
    try { crypto.getRandomValues(arr); } catch (e) { for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256); }
    return Array.from(arr).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }
  async function hashPin(pin, salt) {
    const data = salt + '::' + pin;
    if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
      try {
        const buf = new TextEncoder().encode(data);
        const hash = await crypto.subtle.digest('SHA-256', buf);
        return Array.from(new Uint8Array(hash)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
      } catch (e) {}
    }
    let h = 5381;
    for (let i = 0; i < data.length; i++) { h = ((h << 5) + h + data.charCodeAt(i)) | 0; }
    return 'fb_' + (h >>> 0).toString(16) + '_' + data.length;
  }
  function getPinHash() { try { return localStorage.getItem(PIN_HASH_KEY); } catch (e) { return null; } }
  function getPinSalt() { try { return localStorage.getItem(PIN_SALT_KEY); } catch (e) { return null; } }
  function hasPin() { return !!(getPinHash() && getPinSalt()); }
    function getPinLength() { try { return parseInt(localStorage.getItem(PIN_LEN_KEY), 10) || 0; } catch (e) { return 0; } }
  function setPinLength(n) { try { localStorage.setItem(PIN_LEN_KEY, String(n)); } catch (e) {} }
  function getPinAttempts() { try { return parseInt(localStorage.getItem(PIN_ATTEMPTS_KEY), 10) || 0; } catch (e) { return 0; } }
  function setPinAttempts(n) { try { localStorage.setItem(PIN_ATTEMPTS_KEY, String(n)); } catch (e) {} }
  function getLockUntil() { try { return parseInt(localStorage.getItem(PIN_LOCK_UNTIL_KEY), 10) || 0; } catch (e) { return 0; } }
  function setLockUntil(ts) { try { localStorage.setItem(PIN_LOCK_UNTIL_KEY, String(ts)); } catch (e) {} }
  function getLockLevel() { try { return parseInt(localStorage.getItem(PIN_LOCK_LEVEL_KEY), 10) || 0; } catch (e) { return 0; } }
  function setLockLevel(n) { try { localStorage.setItem(PIN_LOCK_LEVEL_KEY, String(n)); } catch (e) {} }
  function resetLockCounters() {
    try {
      localStorage.removeItem(PIN_ATTEMPTS_KEY);
      localStorage.removeItem(PIN_LOCK_UNTIL_KEY);
      localStorage.removeItem(PIN_LOCK_LEVEL_KEY);
    } catch (e) {}
  }
  function isCurrentlyLocked() { return getLockUntil() > Date.now(); }
  function isSessionUnlocked() { try { return sessionStorage.getItem(PIN_UNLOCK_FLAG) === '1'; } catch (e) { return false; } }
  function markSessionUnlocked() { try { sessionStorage.setItem(PIN_UNLOCK_FLAG, '1'); } catch (e) {} }
    async function setPin(pin) {
    const salt = randomSalt();
    const hash = await hashPin(pin, salt);
    try {
      localStorage.setItem(PIN_HASH_KEY, hash);
      localStorage.setItem(PIN_SALT_KEY, salt);
      localStorage.setItem(PIN_LEN_KEY, String(pin.length));
      sessionStorage.setItem(PIN_UNLOCK_FLAG, '1');
      resetLockCounters();
    } catch (e) {}
  }
    function removePin() {
    try {
      localStorage.removeItem(PIN_HASH_KEY);
      localStorage.removeItem(PIN_SALT_KEY);
      localStorage.removeItem(PIN_LEN_KEY);
      localStorage.removeItem(PIN_ATTEMPTS_KEY);
      localStorage.removeItem(PIN_LOCK_UNTIL_KEY);
      localStorage.removeItem(PIN_LOCK_LEVEL_KEY);
      sessionStorage.removeItem(PIN_UNLOCK_FLAG);
    } catch (e) {}
  }
  function isPinValid(pin) { return typeof pin === 'string' && /^\d+$/.test(pin) && pin.length >= MIN_PIN_LEN && pin.length <= MAX_PIN_LEN; }
  async function verifyPin(pin) {
    if (!hasPin()) return false;
    const hash = await hashPin(pin, getPinSalt());
    return hash === getPinHash();
  }
  function renderPinStatus() {
    const statusEl = document.getElementById('pinStatusRow');
    if (!statusEl) return;
    const setupBtn = document.getElementById('pinSetupBtn');
    const changeBtn = document.getElementById('pinChangeBtn');
    const removeBtn = document.getElementById('pinRemoveBtn');
    const lockNowBtn = document.getElementById('pinLockNowBtn');
    const quickLock = document.getElementById('quickLockBtn');
    if (hasPin()) {
      statusEl.innerHTML = '<b>PIN установлен.</b> Спрашивается при каждом новом открытии приложения.';
      if (setupBtn) setupBtn.hidden = true;
      if (changeBtn) changeBtn.hidden = false;
      if (removeBtn) removeBtn.hidden = false;
      if (lockNowBtn) lockNowBtn.hidden = false;
    } else {
      statusEl.textContent = 'PIN не установлен. Нажмите «Установить PIN», чтобы защитить доступ.';
      if (setupBtn) setupBtn.hidden = false;
      if (changeBtn) changeBtn.hidden = true;
      if (removeBtn) removeBtn.hidden = true;
      if (lockNowBtn) lockNowBtn.hidden = true;
      if (quickLock) quickLock.hidden = true;
   }
  if (quickLock) quickLock.hidden = false;
}
  function openPinSetup(mode) {
    const modal = document.getElementById('pinSetupModal');
    if (!modal) return;
    document.getElementById('pinSetupTitle').textContent = mode === 'change' ? '🔒 Сменить PIN' : '🔒 Установить PIN';
    document.getElementById('pinInput1').value = '';
    document.getElementById('pinInput2').value = '';
    const oldWrap = document.getElementById('pinChangeOldWrap');
    if (oldWrap) oldWrap.hidden = mode !== 'change';
    const oldInput = document.getElementById('pinInput0');
    if (oldInput) oldInput.value = '';
    document.getElementById('pinSetupError').textContent = '';
    modal.dataset.mode = mode || 'setup';
    modal.hidden = false;
    setTimeout(function () { document.getElementById(mode === 'change' ? 'pinInput0' : 'pinInput1').focus(); }, 50);
  }
  function closePinSetup() {
    const modal = document.getElementById('pinSetupModal');
    if (modal) modal.hidden = true;
  }
  async function savePin() {
    const modal = document.getElementById('pinSetupModal');
    const mode = modal.dataset.mode || 'setup';
    const errEl = document.getElementById('pinSetupError');
    errEl.textContent = '';
    if (mode === 'change') {
      const oldPin = document.getElementById('pinInput0').value;
      if (!await verifyPin(oldPin)) { errEl.textContent = 'Неверный текущий PIN'; return; }
    }
    const p1 = document.getElementById('pinInput1').value;
    const p2 = document.getElementById('pinInput2').value;
    if (!isPinValid(p1)) { errEl.textContent = 'PIN должен быть от ' + MIN_PIN_LEN + ' до ' + MAX_PIN_LEN + ' цифр'; return; }
    if (p1 !== p2) { errEl.textContent = 'PIN-коды не совпадают'; return; }
    if (/^(\d)\1+$/.test(p1) || SIMPLE_PINS.indexOf(p1) !== -1) { errEl.textContent = 'Слишком простой PIN. Используйте другой.'; return; }
    await setPin(p1);
    closePinSetup();
    renderPinStatus();
    showToast('PIN установлен', 'ok');
  }
    let _lockCountdownTimer = null;
  function lockApp() {
    const lock = document.getElementById('lockScreen');
    if (!lock) return;
    document.getElementById('lockPinInput').value = '';
    document.getElementById('lockError').textContent = '';
    lock.hidden = false;
    updateLockUI();
    setTimeout(function () { if (!isCurrentlyLocked()) { const inp = document.getElementById('lockPinInput'); if (inp) inp.focus(); } }, 50);
  }
  function unlockApp() {
    const lock = document.getElementById('lockScreen');
    if (lock) lock.hidden = true;
  }
  function updateLockUI() {
    const lockInput = document.getElementById('lockPinInput');
    const lockBtn = document.getElementById('lockSubmitBtn');
    const lockErr = document.getElementById('lockError');
    const lockAtt = document.getElementById('lockAttempts');
    const lockTitle = document.getElementById('lockTitle');
    const lockSub = document.getElementById('lockSub');
    const lockIcon = document.getElementById('lockIcon');
    if (!lockAtt || !lockInput) return;
    const until = getLockUntil();
    const now = Date.now();
    const level = getLockLevel();
    if (_lockCountdownTimer) { clearInterval(_lockCountdownTimer); _lockCountdownTimer = null; }
    if (until > now) {
      lockInput.disabled = true;
      lockBtn.disabled = true;
      lockBtn.textContent = 'Заблокировано';
      if (lockTitle) lockTitle.textContent = 'Доступ ограничен';
      if (lockIcon) lockIcon.textContent = '⏳';
      lockErr.textContent = '';
      if (lockSub) lockSub.textContent = level === 2 ? 'Последняя серия попыток' : 'Повторите ввод позже';
      const updateCountdown = function () {
        const left = Math.ceil((getLockUntil() - Date.now()) / 1000);
        if (left <= 0) {
          clearInterval(_lockCountdownTimer);
          _lockCountdownTimer = null;
          lockInput.disabled = false;
          lockBtn.disabled = false;
          lockBtn.textContent = 'Разблокировать';
          if (lockTitle) lockTitle.textContent = 'Введите PIN-код';
          if (lockIcon) lockIcon.textContent = '🔒';
          lockInput.value = '';
          lockInput.focus();
          if (getLockLevel() === 2) {
            lockAtt.textContent = '⚠️ Последняя серия попыток. После 3 неверных вводов ВСЕ данные будут удалены.';
            lockAtt.className = 'lock-attempts danger';
          } else {
            lockAtt.textContent = '';
            lockAtt.className = 'lock-attempts';
          }
          return;
        }
        const m = Math.floor(left / 60);
        const s = left % 60;
        lockAtt.textContent = '🔒 Повторите через ' + (m > 0 ? m + ' мин ' : '') + s + ' сек';
        lockAtt.className = 'lock-attempts countdown';
      };
      updateCountdown();
      _lockCountdownTimer = setInterval(updateCountdown, 500);
    } else {
      lockInput.disabled = false;
      lockBtn.disabled = false;
      lockBtn.textContent = 'Разблокировать';
      if (lockTitle) lockTitle.textContent = 'Введите PIN-код';
      if (lockIcon) lockIcon.textContent = '🔒';
      if (level === 2) {
        if (lockSub) lockSub.textContent = 'Последняя серия попыток';
        lockAtt.textContent = '⚠️ После 3 неверных вводов ВСЕ данные будут удалены безвозвратно.';
        lockAtt.className = 'lock-attempts danger';
      } else {
        if (lockSub) lockSub.textContent = 'Доступ к приложению защищён';
        lockAtt.textContent = '';
        lockAtt.className = 'lock-attempts';
      }
    }
  }
  async function tryUnlock() {
    if (isCurrentlyLocked()) return;
    const input = document.getElementById('lockPinInput');
    const errEl = document.getElementById('lockError');
    const attEl = document.getElementById('lockAttempts');
    const pin = (input.value || '').trim();
    if (!pin) { errEl.textContent = 'Введите PIN'; return; }
    if (!isPinValid(pin)) { errEl.textContent = 'PIN должен содержать от 4 до 8 цифр'; return; }
    if (await verifyPin(pin)) {
      if (!getPinLength()) setPinLength(pin.length);
      markSessionUnlocked();
      resetLockCounters();
      unlockApp();
      setTimeout(function () { bootApp(); }, 300);
      errEl.textContent = '';
      if (attEl) { attEl.textContent = ''; attEl.className = 'lock-attempts'; }
      return;
    }
    const attempts = getPinAttempts() + 1;
    setPinAttempts(attempts);
    input.value = '';
    if (attempts < 3) {
      errEl.textContent = 'Неверный PIN';
      if (attEl) {
        attEl.textContent = 'Осталось попыток: ' + (3 - attempts);
        attEl.className = 'lock-attempts warn';
      }
      input.focus();
      return;
    }
    const level = getLockLevel();
    if (level === 0) {
      setLockUntil(Date.now() + 60 * 1000);
      setLockLevel(1);
      setPinAttempts(0);
      errEl.textContent = '';
      updateLockUI();
    } else if (level === 1) {
      setLockUntil(Date.now() + 10 * 60 * 1000);
      setLockLevel(2);
      setPinAttempts(0);
      errEl.textContent = '';
      updateLockUI();
    } else {
      errEl.textContent = '';
      if (attEl) {
        attEl.textContent = '⛔ Все данные удалены. Обновите страницу.';
        attEl.className = 'lock-attempts danger';
      }
      wipeAllData();
    }
  }
  function wipeAllData() {
  try {
    const keys = window.__pgtRawStorage.keys();
    keys.forEach(function (k) {
      if (k.indexOf('pgt_v25_') === 0) window.__pgtRawStorage.remove(k);
    });
    sessionStorage.clear();
    try { indexedDB.deleteDatabase(IDB_NAME); } catch (e) {}
  } catch (e) {}
  setTimeout(function () { location.reload(); }, 3000);
}
  function lockNow() {
    if (!hasPin()) return;
    try { sessionStorage.removeItem(PIN_UNLOCK_FLAG); } catch (e) {}
    lockApp();
  }
  // === ЭЛЕМЕНТЫ ИНТЕРФЕЙСА ===
function applyQuickInputVisibility() {
  const wrap = document.querySelector('.quick-input-wrap');
  if (wrap) wrap.hidden = !state.quickInputVisible;
  const btn = document.getElementById('toggleQuickInputBtn');
  if (btn) btn.textContent = state.quickInputVisible ? 'Скрыть' : 'Показать';
}
function applyAdvancedToolsVisibility() {
  const block = document.getElementById('advancedToolsBlock');
  if (block) block.hidden = !state.advancedToolsVisible;
  const btn = document.getElementById('toggleAdvancedBtn');
  if (btn) btn.textContent = state.advancedToolsVisible ? 'Скрыть' : 'Показать';
}
 // === УНИВЕРСАЛЬНОЕ ПОДТВЕРЖДЕНИЕ ===
function pgtConfirm(opts) {
  // opts = { message, onYes, yesLabel, danger, title }
  const modal = document.getElementById('pgtConfirmModal');
  if (!modal) return;
  document.getElementById('pgtConfirmTitle').textContent = opts.title || 'Подтверждение';
  document.getElementById('pgtConfirmMessage').textContent = opts.message || '';
  const yesBtn = document.getElementById('pgtConfirmYesBtn');
  yesBtn.textContent = opts.yesLabel || 'Да';
  yesBtn.className = (opts.danger === false) ? 'secondary' : 'danger';
  modal.hidden = false;

  function close() {
    modal.hidden = true;
    modal.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKey);
  }
  function onClick(e) {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    if (action === 'pgt-confirm-yes') {
      close();
      if (typeof opts.onYes === 'function') opts.onYes();
    } else if (action === 'pgt-confirm-no') {
      close();
      if (typeof opts.onNo === 'function') opts.onNo();
    }
  }
  function onKey(e) {
    if (e.key === 'Escape') close();
  }
  modal.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);
  setTimeout(function () { yesBtn.focus(); }, 50);
}
function initPin() {
    renderPinStatus();
  }

    // === Логин-гейт ===
  function showLoginGate() {
    const gate = document.getElementById('loginGate');
    if (gate) gate.hidden = false;
    document.body.classList.add('login-gate-open');
    renderLoginGateUsers();
  }

  function hideLoginGate() {
    const gate = document.getElementById('loginGate');
    if (gate) gate.hidden = true;
    document.body.classList.remove('login-gate-open');
  }

    function updateUserBadge() {
    const el = document.getElementById('userBadge');
    if (!el) return;
    let email = (window.__pgtDrive && window.__pgtDrive.getUserEmail && window.__pgtDrive.getUserEmail()) || '';
    if (!email) {
      try { email = localStorage.getItem('pgt_v25_user_email') || ''; } catch (e) {}
    }
    if (email) {
      el.textContent = '👤 ' + email;
      el.hidden = false;
    } else {
      el.hidden = true;
    }
  }

  // Ключ списка известных аккаунтов (пишет sync.js) — нужен, чтобы вычистить
  // испорченный адрес аватара из уже сохранённых данных.
  const KNOWN_USERS_STORAGE_KEY = 'pgt_v25_known_users';

  /**
   * Вернуть безопасный адрес аватара или '' — если значение не похоже на адрес.
   * Отсекаем мусор, попавший в данные (куски кода, кавычки, пробелы), из-за
   * которого браузер уходит в 404 за несуществующей картинкой.
   * @param {*} value — сохранённое значение picture.
   * @returns {string} адрес http(s) или пустая строка.
   */
  function safeAvatarUrl(value) {
    if (typeof value !== 'string') return '';
    const url = value.trim();
    if (!url || url.length > 2048) return '';
    // Никаких пробелов, кавычек и угловых скобок в адресе быть не должно.
    if (/[\s"'<>`]/.test(url)) return '';
    if (!/^https?:\/\//i.test(url)) return '';
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
      return parsed.href;
    } catch (e) {
      return '';
    }
  }

  /** Убрать испорченный picture у одного аккаунта, чтобы он не всплывал снова. */
  function forgetUserPicture(sub) {
    if (!sub) return;
    try {
      const raw = localStorage.getItem(KNOWN_USERS_STORAGE_KEY);
      if (!raw) return;
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) return;
      let changed = false;
      list.forEach(function (user) {
        if (user && user.sub === sub && user.picture && !safeAvatarUrl(user.picture)) {
          user.picture = '';
          changed = true;
        }
      });
      if (changed) localStorage.setItem(KNOWN_USERS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) { /* хранилище недоступно — просто не рисуем картинку */ }
  }

  function renderLoginGateUsers() {
    const box = document.getElementById('loginGateUsers');
    const addBtn = document.getElementById('loginGateAddBtn');
    if (!box) return;

    const users = (window.__pgtDrive && window.__pgtDrive.getKnownUsers)
      ? window.__pgtDrive.getKnownUsers()
      : [];

    if (!users.length) {
      box.innerHTML = '';
      if (addBtn) {
        addBtn.textContent = '🔐 Войти через Google';
        addBtn.classList.remove('login-gate-btn-new');
      }
      return;
    }

    if (addBtn) {
      addBtn.textContent = '＋ Добавить аккаунт';
      addBtn.classList.add('login-gate-btn-new');
    }

    box.innerHTML = users.map(function (u) {
      const initial = (u.name || u.email || '?').charAt(0).toUpperCase();
      // Аватар берём только если это настоящий http(s)-адрес. В сохранённых
      // аккаунтах иногда оказывается испорченное значение (например, попавший
      // в данные кусок кода вида "' + escapeHtml(u.picture) + '") — тогда
      // браузер уходит в 404 за таким «адресом». В этом случае показываем
      // букву и заодно вычищаем мусор из хранилища.
      const avatarUrl = safeAvatarUrl(u.picture);
      if (u.picture && !avatarUrl) forgetUserPicture(u.sub);
      const avatar = avatarUrl
        ? '<img src="' + escapeHtml(avatarUrl) + '" alt="" class="login-user-avatar" referrerpolicy="no-referrer" />'
        : '<div class="login-user-avatar login-user-avatar-letter">' + escapeHtml(initial) + '</div>';
      return '<div class="login-user-row" data-sub="' + escapeHtml(u.sub) + '">' +
        '<button type="button" class="login-user-btn" data-action="login-user" data-email="' + escapeHtml(u.email) + '">' +
          avatar +
          '<div class="login-user-info">' +
            '<div class="login-user-name">' + escapeHtml(u.name || u.email) + '</div>' +
            '<div class="login-user-email">' + escapeHtml(u.email) + '</div>' +
          '</div>' +
        '</button>' +
        '<button type="button" class="login-user-remove" data-action="remove-user" data-sub="' + escapeHtml(u.sub) + '" title="Забыть этот аккаунт на этом устройстве">✕</button>' +
      '</div>';
    }).join('');
  }

  function setGateStatus(text) {
    const el = document.getElementById('loginGateStatus');
    if (el) el.textContent = text || '';
  }

  function initLoginGate() {
    const box = document.getElementById('loginGateUsers');
    const addBtn = document.getElementById('loginGateAddBtn');
    if (!box || !addBtn) return;

    box.addEventListener('click', async function (e) {
      const row = e.target.closest('[data-action]');
      if (!row) return;
      const action = row.dataset.action;

           if (action === 'remove-user') {
        e.stopPropagation();
        const _sub = row.dataset.sub;
        pgtConfirm({ title: 'Забыть аккаунт?', message: 'Аккаунт исчезнет из списка на этом устройстве. Данные в Google Drive останутся.', yesLabel: 'Забыть', onYes: function(){
          if (window.__pgtDrive && window.__pgtDrive.removeKnownUser) {
            window.__pgtDrive.removeKnownUser(_sub);
          }
          renderLoginGateUsers();
        } });
        return;
      }

      if (action === 'login-user') {
        const email = row.dataset.email || '';
        setGateStatus('Проверяю…');
        try {
          await window.__pgtDrive.signInSilentForKnownUser(email);
          setGateStatus('');
        } catch (silentErr) {
          setGateStatus('Открываю окно Google…');
          try { window.__pgtDrive.signInAs(email); }
          catch (err) { setGateStatus('Ошибка: ' + (err.message || err)); }
        }
      }
    });

    addBtn.addEventListener('click', function () {
      if (!window.__pgtDrive) {
        setGateStatus('Google ещё загружается… попробуйте через секунду.');
        return;
      }
      setGateStatus('Открываю окно Google…');
      try { window.__pgtDrive.signIn(); }
      catch (e) { setGateStatus('Ошибка: ' + (e.message || e)); }
    });
  }

  async function bootApp() {
    renderPinStatus();
    if (hasPin() && !isSessionUnlocked()) {
      lockApp();
      return;
    }
   const hasUser  = !!window.__pgtRawStorage.get('pgt_v25_current_user');
let hasToken = false;
try {
  const rawT = window.__pgtRawStorage.get('pgt_v25_google_token');
  if (rawT) {
    const t = JSON.parse(rawT);
    if (t && t.expiresAt && Date.now() < t.expiresAt) hasToken = true;
  }
} catch (e) {}
if (hasUser && hasToken) {
      hideLoginGate();
      updateUserBadge();
    } else {
      showLoginGate();
    }
  }

    function migrateLegacyData() {
    const uid = window.__pgtRawStorage.get('pgt_v25_current_user');
    if (!uid) return;
    const BASES = [
  'pgt_v25_data', 'pgt_v25_prefs', 'pgt_v25_snippets',
  'pgt_v25_notes', 'pgt_v25_templates', 'pgt_v25_theme',
  'pgt_v25_habits'
];
    BASES.forEach(function (key) {
      const legacy = window.__pgtRawStorage.get(key);
      if (legacy == null) return;
      const scopedKey = key + '_' + uid;
      const existing = window.__pgtRawStorage.get(scopedKey);
      if (existing == null) {
        try { window.__pgtRawStorage.set(scopedKey, legacy); } catch (e) {}
      }
    });
  }

  window.__pgtOnUserReady = function () {
    migrateLegacyData();
    loadState();
    _searchIndexDirty = true;
    applyTheme();
    applyColors();
    syncToolbarInputs();
    applyCalendarVisibility();
    render();
    SECTIONS.forEach(renderReaderEmpty);
    hideLoginGate();
    updateUserBadge();
  };

  window.__pgtOnUserSignedOut = function () {
    state.goals = [];
    state.snippets = [];
    state.notes = [];
    state.templates = [];
    state.habits = [];
    state.folders = { articles: emptySection('Статьи'), books: emptySection('Книги') };
    state.collapsed = {};
    state.favorites = { articles: {}, books: {} };
    state.readingPos = { articles: {}, books: {} };
    state.pdfPage = { articles: {}, books: {} };
    state.calSelectedDate = null;
    state.massMode = false; state.massSelected = {};
    state.massModeGoals = false; state.massSelectedGoals = {};
    state.ui = {
      search: '', filter: 'all', sort: 'deadline', tab: 'active', activeTab: 'goals',
      litTab: 'articles', litSearch: { articles: '', books: '' },
      snippetsSearch: '', snippetsSort: 'new', snippetsTagFilter: '', snippetsGroup: 'flat',
      notesSearch: ''
    };
    try { render(); } catch (e) {}
    showLoginGate();
    updateUserBadge();
  };
    function checkNotifications() {
    if (!state.notificationsEnabled) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const now = Date.now();
    if (now - state.lastNotifCheck < 15 * 60 * 1000) return;
    state.lastNotifCheck = now;
    const todayISO = dateToISO(new Date());

    // === 1. Задачи на сегодня ===
    const tasksToday = [];
    state.goals.forEach(function (g) {
      if (g.archivedAt) return;
      g.tasks.forEach(function (t) {
        if (t.archivedAt || t.done) return;
        if (t.deadline === todayISO) tasksToday.push(t);
      });
    });
    if (tasksToday.length) {
      try {
        new Notification('⏰ Задачи на сегодня: ' + tasksToday.length, {
          body: tasksToday.slice(0, 3).map(function (t) { return '• ' + t.text; }).join('\n') +
                (tasksToday.length > 3 ? '\n…и ещё ' + (tasksToday.length - 3) : ''),
          tag: 'pgt-tasks-today'   // одно уведомление на тему, не плодим дубли
        });
      } catch (e) {}
    }

    // === 2. Карточки на сегодня (из своих вкладок) ===
    const cardsToday = [];
    if (Array.isArray(state.customTabs)) {
      state.customTabs.forEach(function (tab) {
        (tab.cards || []).forEach(function (c) {
          if (c.done) return;
          if (c.dueDate === todayISO) {
            cardsToday.push({ card: c, tab: tab });
          }
        });
      });
    }
    if (cardsToday.length) {
      try {
        const bodyLines = cardsToday.slice(0, 3).map(function (it) {
          const icon = it.tab.icon || '⭐';
          return icon + ' ' + it.card.text;
        }).join('\n');
        const tail = cardsToday.length > 3 ? '\n…и ещё ' + (cardsToday.length - 3) : '';
        new Notification('🗂 Карточки на сегодня: ' + cardsToday.length, {
          body: bodyLines + tail,
          tag: 'pgt-cards-today'
        });
      } catch (e) {}
    }
  }

  // === БЭКАПЫ ===
  async function makeBackup(reason) {
    const todayISO = dateToISO(new Date());
const isBeforeRestore = (reason === 'before-restore' || reason === 'before-json-import' || reason === 'before-zip-import');
    const backupKey = isBeforeRestore ? (todayISO + '_' + reason + '_' + Date.now()) : todayISO;
    const snapshot = {
      date: todayISO,
      ts: Date.now(),
      reason: reason || 'auto',
      data: {
        goals: state.goals,
        snippets: state.snippets,
        notes: state.notes,
        templates: state.templates,
        folders: {
          articles: { name: state.folders.articles.name, files: state.folders.articles.files, updatedAt: state.folders.articles.updatedAt },
          books: { name: state.folders.books.name, files: state.folders.books.files, updatedAt: state.folders.books.updatedAt }
        }
      }
    };
     snapshot.date = backupKey;
    await idbPut(IDB_BACKUPS, backupKey, snapshot);
    const all = await idbGetAll(IDB_BACKUPS);
    if (all.length > MAX_BACKUPS) {
      all.sort(function (a, b) { return a.ts - b.ts; });
      const toRemove = all.slice(0, all.length - MAX_BACKUPS);
      for (const b of toRemove) await idbDelete(IDB_BACKUPS, b.date);
    }
    return snapshot;
  }
  async function checkBackup() {
    const now = Date.now();
    if (now - state.lastBackupCheck < 6 * 60 * 60 * 1000) return;
    state.lastBackupCheck = now;
    const todayISO = dateToISO(new Date());
    const existing = await idbGet(IDB_BACKUPS, todayISO);
    if (!existing && (state.goals.length || state.snippets.length || state.notes.length)) {
      await makeBackup('auto');
    }
  }
  function initTaskSwipe() {
    const container = document.getElementById('tasksList');
    if (!container) return;
    let touchStartX = 0;
    let touchStartY = 0;
    let currentTask = null;
    let swiped = false;
    let _swipeResetTimer = null;
    let moveX = 0;
    const THRESHOLD = 80;
    const LOCK = 15;

    container.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      const t = e.target.closest('.task');
      if (!t) return;
      if (e.target.closest('input, button, .subtask-add, .inline-task-form, .subtasks')) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      currentTask = t;
      swiped = false;
      moveX = 0;
      t.classList.remove('swipe-animating');
    }, { passive: true });

    container.addEventListener('touchmove', function (e) {
      if (!currentTask || e.touches.length !== 1) return;
 if (window.__pgtTaskDragActive) return;
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;
      if (!swiped) {
        if (Math.abs(dx) < LOCK) return;
        if (Math.abs(dy) > Math.abs(dx)) { currentTask = null; return; }
        swiped = true;
        currentTask.classList.add('swiping');
      }
      e.preventDefault();
      moveX = Math.max(-150, Math.min(150, dx));
      currentTask.style.transform = 'translateX(' + moveX + 'px)';
      currentTask.classList.toggle('swipe-right-bg', moveX > THRESHOLD);
      currentTask.classList.toggle('swipe-left-bg', moveX < -THRESHOLD);
    }, { passive: false });

    function endSwipe() {
      if (!currentTask) return;
      const t = currentTask;
      const dx = moveX;
      t.classList.remove('swiping', 'swipe-right-bg', 'swipe-left-bg');
      t.classList.add('swipe-animating');
      t.style.transform = '';
      const goalId = t.dataset.goalId;
      const taskId = t.dataset.taskId;
      currentTask = null;
      moveX = 0;

      if (dx > THRESHOLD && goalId && taskId) {
        setTimeout(function () { toggleTask(goalId, taskId); }, 200);
           } else if (dx < -THRESHOLD && goalId && taskId) {
        setTimeout(function () {
          var g = findGoal(goalId);
          var task = g ? g.tasks.find(function (x) { return x.id === taskId; }) : null;
                    if (task && task.repeat) {
            pgtConfirm({ title: 'Удалить повторяющуюся задачу?', message: '«' + task.text + '». Все будущие повторы будут потеряны.', yesLabel: 'Да, удалить', onYes: function(){ deleteTask(goalId, taskId); } });
            return;
          }
          deleteTask(goalId, taskId);
          showToast('Задача удалена', 'warn', 'Отменить', function () {
            var item = undoStack.pop();
            if (item) { try { item.fn(); showToast('Отменено: ' + item.label, 'ok'); } catch (e) {} }
          }, 6000);
        }, 200);
      }
 clearTimeout(_swipeResetTimer);
      _swipeResetTimer = setTimeout(function () { swiped = false; }, 350);
      setTimeout(function () { t.classList.remove('swipe-animating'); }, 250);
    }

    container.addEventListener('touchend', endSwipe, { passive: true });
    container.addEventListener('touchcancel', endSwipe, { passive: true });

    container.addEventListener('click', function (e) {
      if (swiped) {
        e.preventDefault();
        e.stopPropagation();
        swiped = false;
      }
    }, true);
  }

    // === ПАПКА ДАННЫХ НА ФЛЕШКЕ ===
  async function initDataFolder() {
    const statusEl = document.getElementById('dataFolderStatus');
    const pickBtn = document.getElementById('pickDataFolderBtn');
    const discBtn = document.getElementById('disconnectDataFolderBtn');
    if (!statusEl) return;

    if (!dataFolderSupported) {
      statusEl.innerHTML = '<b style="color:var(--gold)">Не поддерживается этим браузером.</b> Данные сохраняются только в браузере. Откройте в Chrome, Edge или Opera.';
      if (pickBtn) pickBtn.disabled = true;
      if (discBtn) discBtn.hidden = true;
      return;
    }

    const saved = await idbGet(IDB_HANDLES, DATA_FOLDER_KEY);
    if (!saved) {
      statusEl.innerHTML = '<b>Не подключена.</b> Данные хранятся в браузере.';
      if (discBtn) discBtn.hidden = true;
      return;
    }

    _dataFolderHandle = saved;
    try {
      const perm = await saved.queryPermission({ mode: 'readwrite' });
      if (perm === 'granted') {
        statusEl.innerHTML = 'Подключена: <b>' + escapeHtml(saved.name) + '</b> ✅';
        if (discBtn) discBtn.hidden = false;
        await readAllFromDisk();
      } else if (perm === 'prompt') {
        statusEl.innerHTML = 'Папка <b>' + escapeHtml(saved.name) + '</b> сохранена, но нужно <b>подтвердить доступ</b>. Нажмите «📁 Выбрать папку» и укажите её же заново.';
        if (discBtn) discBtn.hidden = false;
      } else {
        statusEl.innerHTML = 'Папка <b>' + escapeHtml(saved.name) + '</b> — доступ закрыт.';
        if (discBtn) discBtn.hidden = false;
      }
    } catch (e) {
      statusEl.textContent = 'Ошибка доступа к папке.';
    }
  }

  async function pickDataFolder() {
    if (!dataFolderSupported) {
      showToast('Этот браузер не поддерживает выбор папки. Используйте Chrome / Edge / Opera.', 'warn', null, null, 6000);
      return;
    }
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite', id: 'pgt-data-folder' });
      const perm = await handle.requestPermission({ mode: 'readwrite' });
      if (perm !== 'granted') {
        showToast('Доступ к папке не выдан', 'warn');
        return;
      }
      _dataFolderHandle = handle;
      await idbPut(IDB_HANDLES, DATA_FOLDER_KEY, handle);
      await readAllFromDisk();
      await writeAllToDisk();
      await initDataFolder();
      showToast('Папка подключена: ' + handle.name, 'ok');
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      showToast('Не удалось подключить папку: ' + (e.message || e), 'error');
    }
  }

   async function disconnectDataFolder() {
    pgtConfirm({ title: 'Отключить папку данных?', message: 'Файлы в ней останутся, но приложение перестанет туда писать.', yesLabel: 'Отключить', onYes: async function(){
      _dataFolderHandle = null;
      await idbDelete(IDB_HANDLES, DATA_FOLDER_KEY);
      await initDataFolder();
      showToast('Папка данных отключена', 'ok');
    } });
  }

  async function readAllFromDisk() {
    if (!_dataFolderHandle) return false;
    try {
      const fh = await _dataFolderHandle.getFileHandle(DATA_FOLDER_FILENAME);
      const file = await fh.getFile();
      const text = await file.text();
      if (!text.trim()) return false;
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object') return false;

      if (parsed.data) localStorage.setItem(DATA_KEY, JSON.stringify(parsed.data));
      if (Array.isArray(parsed.snippets)) localStorage.setItem(SNIPPETS_KEY, JSON.stringify(parsed.snippets));
      if (Array.isArray(parsed.notes)) localStorage.setItem(NOTES_KEY, JSON.stringify(parsed.notes));
      if (Array.isArray(parsed.templates)) localStorage.setItem(TEMPLATES_KEY, JSON.stringify(parsed.templates));
      if (Array.isArray(parsed.habits)) localStorage.setItem('pgt_v25_habits', JSON.stringify(parsed.habits));
      if (parsed.prefs) localStorage.setItem(PREFS_KEY, JSON.stringify(parsed.prefs));

  // === ARIA и фокус для модалок ===
  (function setupModalsA11y() {
    function decorate() {
      document.querySelectorAll('.modal-backdrop').forEach(function (bd) {
        var modal = bd.querySelector('.modal');
        if (!modal) return;
        if (!modal.hasAttribute('role')) modal.setAttribute('role', 'dialog');
        if (!modal.hasAttribute('aria-modal')) modal.setAttribute('aria-modal', 'true');
      });
    }
    decorate();
    var _lastFocus = null;
    document.addEventListener('click', function (e) {
      var openBtn = e.target.closest('button, [role="button"]');
      if (!openBtn) return;
      _lastFocus = openBtn;
    }, true);
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName !== 'hidden') return;
        var bd = m.target;
        if (!bd.classList || !bd.classList.contains('modal-backdrop')) return;
        if (bd.hidden === false) {
          decorate();
          var modal = bd.querySelector('.modal');
          if (!modal) return;
          setTimeout(function () {
            var first = modal.querySelector('input:not([type="hidden"]), textarea, select, button:not([disabled]), [tabindex]:not([tabindex="-1"])');
            if (first) { try { first.focus(); } catch (e) {} }
          }, 50);
        } else {
          setTimeout(function () {
            if (_lastFocus && document.body.contains(_lastFocus)) {
              try { _lastFocus.focus(); } catch (e) {}
            }
          }, 50);
        }
      });
    });
    document.querySelectorAll('.modal-backdrop').forEach(function (bd) {
      observer.observe(bd, { attributes: true, attributeFilter: ['hidden'] });
    });
  })();

      loadState();
      applyTheme();
      applyColors();
      syncToolbarInputs();
      applyCalendarVisibility();
      render();
      return true;
    } catch (e) {
      if (e && e.name === 'NotFoundError') return false;
      console.warn('[readAllFromDisk]', e);
      return false;
    }
  }

  async function writeAllToDisk() {
    if (!_dataFolderHandle) return false;
    try {
      const perm = await _dataFolderHandle.queryPermission({ mode: 'readwrite' });
      if (perm !== 'granted') return false;
      const payload = {
        version: 1,
        savedAt: Date.now(),
        data: JSON.parse(localStorage.getItem(DATA_KEY) || '{"goals":[],"folders":{}}'),
        snippets: JSON.parse(localStorage.getItem(SNIPPETS_KEY) || '[]'),
        notes: JSON.parse(localStorage.getItem(NOTES_KEY) || '[]'),
        templates: JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]'),
        habits: JSON.parse(localStorage.getItem('pgt_v25_habits') || '[]'),
        prefs: JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')
      };
      const fh = await _dataFolderHandle.getFileHandle(DATA_FOLDER_FILENAME, { create: true });
      const writable = await fh.createWritable();
      await writable.write(JSON.stringify(payload, null, 2));
      await writable.close();
      return true;
    } catch (e) {
      console.warn('[writeAllToDisk]', e);
      return false;
    }
  }

  function scheduleDiskWrite() {
    if (!_dataFolderHandle) return;
    clearTimeout(_dataFolderWriteTimer);
    _dataFolderWriteTimer = setTimeout(function () { writeAllToDisk().catch(function () {}); }, 700);
  }

function autoArchiveOldCompletedTasks() {
    const todayStartTs = todayStart().getTime();
    const toArchive = [];
    state.goals.forEach(function (g) {
      if (g.archivedAt) return;
      g.tasks.forEach(function (t) {
        if (t.archivedAt) return;
        if (!t.done) return;
        const doneTs = t.doneAt || t.createdAt || 0;
        if (doneTs > 0 && doneTs < todayStartTs) toArchive.push({ goal: g, task: t });
      });
    });
    if (!toArchive.length) return;
    const snapshot = toArchive.map(function (it) {
      return { goalId: it.goal.id, taskId: it.task.id, prevArchivedAt: it.task.archivedAt };
    });
    const now = Date.now();
    toArchive.forEach(function (it) { it.task.archivedAt = now; });
    saveData();
    render();
    showToast('Заархивировано задач: ' + toArchive.length, 'ok', 'Отменить', function () {
      snapshot.forEach(function (s) {
        const g = findGoal(s.goalId);
        if (!g) return;
        const t = g.tasks.find(function (x) { return x.id === s.taskId; });
        if (t) t.archivedAt = s.prevArchivedAt;
      });
      saveData();
      render();
      showToast('Архивация отменена', 'ok');
    }, 8000);
  }
  async function renderBackupList() {
    const el = document.getElementById('backupList');
    if (!el) return;
    const all = await idbGetAll(IDB_BACKUPS);
    all.sort(function (a, b) { return b.ts - a.ts; });
    if (!all.length) { el.innerHTML = '<div class="muted" style="font-size:11px;">Пока нет бэкапов</div>'; return; }
    el.innerHTML = all.map(function (b) {
      const stats = [
        (b.data.goals || []).length + ' целей',
        (b.data.snippets || []).length + ' цитат',
        (b.data.notes || []).length + ' заметок'
      ].join(' · ');
           return '<div class="backup-item"><div class="info"><div class="date">' + formatDateTime(b.ts) + ' <span class="muted">(' + b.reason + ')</span></div><div class="meta">' + stats + '</div></div><button type="button" class="secondary" data-action="restore-backup" data-date="' + escapeHtml(b.date) + '" style="font-size:11px;padding:4px 10px;">↺ Восстановить</button></div>';
    }).join('');
  }

  async function renderCacheStats() {
    const el = document.getElementById('cacheStats');
    const backendEl = document.getElementById('cacheBackendLabel');
    if (!el) return;
    const s = await storageStats();
    if (backendEl) backendEl.textContent = s.backend === 'opfs' ? 'OPFS (быстро, надёжно)' : 'IndexedDB (fallback)';
    let html = 'Файлов в кэше: <b>' + s.count + '</b> · <b>' + formatBytes(s.total) + '</b>';
    if (s.bySection.articles.count) html += '<br>📁 Статьи: ' + s.bySection.articles.count + ' (' + formatBytes(s.bySection.articles.size) + ')';
    if (s.bySection.books.count) html += '<br>📚 Книги: ' + s.bySection.books.count + ' (' + formatBytes(s.bySection.books.size) + ')';
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        html += '<br><span class="muted">Браузер использует: ' + formatBytes(est.usage || 0) + ' из ' + formatBytes(est.quota || 0) + '</span>';
      }
    } catch (e) {}
    el.innerHTML = html;
  }
        async function restoreBackup(date) {
    pgtConfirm({
      title: 'Восстановить бэкап?',
      message: 'Данные от ' + formatDate(date) + ' заменят текущие. Перед заменой автоматически создастся новая копия.',
      yesLabel: 'Восстановить',
      danger: false,
      onYes: async function () {
        await makeBackup('before-restore');
        const b = await idbGet(IDB_BACKUPS, date);
        if (!b || !b.data) { showToast('Бэкап не найден', 'error'); return; }
        if (Array.isArray(b.data.goals)) state.goals = b.data.goals.map(normalizeGoal).filter(Boolean);
        if (Array.isArray(b.data.snippets)) state.snippets = b.data.snippets.map(normalizeSnippet).filter(Boolean);
        if (Array.isArray(b.data.notes)) state.notes = b.data.notes.map(normalizeNote).filter(Boolean);
        if (Array.isArray(b.data.templates)) state.templates = b.data.templates;
        if (b.data.folders && typeof b.data.folders === 'object') {
          SECTIONS.forEach(function (s) {
            const fd = b.data.folders[s];
            if (fd && typeof fd === 'object') {
              state.folders[s].name = String(fd.name || '');
              state.folders[s].files = Array.isArray(fd.files) ? fd.files.filter(function (f) { return f && typeof f.name === 'string'; }) : [];
              state.folders[s].updatedAt = typeof fd.updatedAt === 'number' ? fd.updatedAt : null;
              state.folders[s].needsPermission = !!state.folders[s].name;
            }
          });
        }
                saveData(); saveSnippets(); saveNotes();
        render();
        renderBackupList();
        showToast('Данные восстановлены из бэкапа', 'ok');
      }
    });
  }
    async function clearAllBackups() {
    pgtConfirm({ title: 'Удалить все резервные копии?', message: 'Действие необратимо. Локальные данные не пострадают.', yesLabel: 'Удалить', onYes: async function(){
      await idbClear(IDB_BACKUPS);
      renderBackupList();
      showToast('Все бэкапы удалены', 'ok');
    } });
  }
  // === ЭКСПОРТ ЗАДАЧ В CSV ===
  function exportTasksCsv() {
    const rows = [[
      'Цель', 'Задача', 'Приоритет', 'Статус', 'Дедлайн',
      'Теги', 'Создано', 'Выполнено', 'Подзадачи'
    ]];
    function esc(v) {
      const s = String(v == null ? '' : v);
      if (/[",\n;]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    }
    const STATUS_LABEL = { todo: 'К выполнению', doing: 'В работе', blocked: 'Блок', done: 'Готово' };
    let total = 0;
    state.goals.forEach(function (g) {
      g.tasks.forEach(function (t) {
        const subs = (t.subtasks || []).map(function (s) { return (s.done ? '✓' : '○') + ' ' + s.text; }).join(' | ');
        rows.push([
          g.isInbox ? '—' : (g.title || ''),
          t.text || '',
          PRIORITY_LABEL[t.priority] || '',
          STATUS_LABEL[t.status] || (t.done ? 'Готово' : 'К выполнению'),
          t.deadline || '',
          (t.tags || []).map(function (x) { return '#' + x; }).join(' '),
          t.createdAt ? formatDateTime(t.createdAt) : '',
          t.doneAt ? formatDateTime(t.doneAt) : '',
          subs
        ]);
        total++;
      });
    });
    // BOM для корректной кириллицы в Excel
    const csv = '\ufeff' + rows.map(function (r) { return r.map(esc).join(';'); }).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'задачи_' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    showToast('CSV сохранён: ' + total + ' задач', 'ok');
  }

  function exportMarkdownReport() {
    const stamp = new Date().toISOString().slice(0, 10);
    let md = '# Отчёт ' + formatDateTime(Date.now()) + '\n\n';
    const activeGoals = state.goals.filter(function (g) { return !g.archivedAt && !g.isInbox; });
    const archivedGoals = state.goals.filter(function (g) { return g.archivedAt && !g.isInbox; });
    md += '## 🎯 Активные цели (' + activeGoals.length + ')\n\n';
    activeGoals.forEach(function (g) { md += '### ' + g.title + '\n\n- Приоритет: ' + (PRIORITY_LABEL[g.priority] || '—') + '\n'; if (g.deadline) md += '- Дедлайн: ' + formatDate(g.deadline) + '\n'; if (g.description) md += '- Описание: ' + g.description + '\n'; const activeTasks = g.tasks.filter(function (t) { return !t.archivedAt; }); const done = activeTasks.filter(function (t) { return t.done; }).length; md += '- Прогресс: ' + done + '/' + activeTasks.length + '\n\n'; if (activeTasks.length) { activeTasks.forEach(function (t) { md += '- [' + (t.done ? 'x' : ' ') + '] ' + t.text; if (t.deadline) md += ' _(до ' + formatDate(t.deadline) + ')_'; if (t.repeat) md += ' _(🔁 ' + t.repeat.type + ')_'; if ((t.tags || []).length) md += ' ' + t.tags.map(function (tag) { return '`#' + tag + '`'; }).join(' '); md += '\n'; }); md += '\n'; } });
    if (archivedGoals.length) { md += '## 📦 Завершённые цели (' + archivedGoals.length + ')\n\n'; archivedGoals.forEach(function (g) { md += '- **' + g.title + '** — завершено ' + formatDateTime(g.archivedAt) + ' (' + g.tasks.length + ' задач)\n'; }); md += '\n'; }
    if (state.notes.length) { md += '## 📝 Заметки (' + state.notes.length + ')\n\n'; state.notes.forEach(function (n) { md += '### ' + n.title + '\n\n' + n.body + '\n\n'; }); }
    if (state.snippets.length) { md += '## 📄 Цитаты (' + state.snippets.length + ')\n\n'; state.snippets.slice().sort(function (a, b) { return a.savedAt - b.savedAt; }).forEach(function (s, i) { const kind = SECTION_LABEL[s.section] || 'Файл'; md += '### Цитата №' + (i + 1) + '\n\n**Источник:** ' + kind + ' — `' + (s.fileName || '') + '`' + (s.page ? ', стр. ' + s.page : '') + '\n\n'; if (s.note) md += '**Заметка:** ' + s.note + '\n\n'; md += s.text.split('\n').map(function (l) { return '> ' + l; }).join('\n') + '\n\n---\n\n'; }); }
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'report_' + stamp + '.md';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    showToast('Отчёт сохранён', 'ok');
  }

  function updateSnippetsBadges() { const n = state.snippets.length; document.querySelectorAll('[data-snippets-badge]').forEach(function (el) { el.textContent = n || ''; }); document.getElementById('snippetsCount').textContent = n; }
  function saveSelectionAsSnippet() {
    let text = '';
    try { const sel = window.getSelection(); if (sel && sel.toString) text = sel.toString(); } catch (e) {}
    text = (text || '').trim();
    if (!text) { showToast('Выделите текст', 'warn'); return; }
    const section = state.ui.tab === 'literature' ? state.ui.litTab : 'articles';
    const fileName = runtime[section].selected || '';
    if (!fileName) { showToast('Откройте файл', 'error'); return; }
    if (text.length > 20000) text = text.slice(0, 20000) + '…';
    let page = null;
    if (getExt(fileName) === 'pdf' && state.pdfPage[section] && state.pdfPage[section][fileName]) page = state.pdfPage[section][fileName];
    state.snippets.push({ id: uid(), section: section, fileName: fileName, page: page, text: text, note: '', tags: [], goalId: null, savedAt: Date.now(), updatedAt: Date.now() });
    saveSnippets(); updateSnippetsBadges();
    showToast('Цитата сохранена', 'ok');
    try { window.getSelection().removeAllRanges(); } catch (e) {}
  }
    function deleteSnippet(id) {
    const s = findSnippet(id); if (!s) return;
    const snapshot = JSON.parse(JSON.stringify(s));
    const idx = state.snippets.indexOf(s);
    state.snippets.splice(idx, 1);
    const entry = moveToTrash('snippet', snapshot);
    saveSnippets(); updateSnippetsBadges(); renderSnippetsList();
    showToast('Цитата удалена', 'warn', 'Восстановить', function() { restoreFromTrash(entry.id); }, 6000);
  }
    function clearAllSnippets() {
    if (!state.snippets.length) return;
    pgtConfirm({
      title: 'Удалить все цитаты?',
      message: 'Будет удалено ' + state.snippets.length + ' цитат. Действие можно отменить через Ctrl+Z.',
      yesLabel: 'Да, удалить',
      onYes: function () {
        const snapshot = JSON.parse(JSON.stringify(state.snippets));
        state.snippets = []; saveSnippets(); updateSnippetsBadges(); renderSnippetsList();
        pushUndo(function () { state.snippets = snapshot; saveSnippets(); updateSnippetsBadges(); renderSnippetsList(); }, 'удаление всех цитат');
      }
    });
  }
  function openSnippetsModal() { document.getElementById('snippetsModal').hidden = false; renderSnippetsList(); renderSnippetsTagFilter(); }
  function closeSnippetsModal() { document.getElementById('snippetsModal').hidden = true; state.editingSnippetId = null; }
  function renderSnippetsTagFilter() { const set = {}; state.snippets.forEach(function (s) { (s.tags || []).forEach(function (t) { set[t] = true; }); }); const tags = Object.keys(set).sort(function (a, b) { return a.localeCompare(b, 'ru'); }); const sel = document.getElementById('snippetsTagFilter'); const prev = state.ui.snippetsTagFilter || ''; sel.innerHTML = '<option value="">Все теги</option>' + tags.map(function (t) { return '<option value="' + escapeHtml(t) + '">#' + escapeHtml(t) + '</option>'; }).join(''); if (prev && tags.indexOf(prev) !== -1) sel.value = prev; else { sel.value = ''; state.ui.snippetsTagFilter = ''; } }
  function getVisibleSnippets() { let items = state.snippets.slice(); const q = (state.ui.snippetsSearch || '').trim().toLowerCase(); const tag = state.ui.snippetsTagFilter || ''; if (tag) items = items.filter(function (s) { return (s.tags || []).indexOf(tag) !== -1; }); if (q) items = items.filter(function (s) { return (s.text + ' ' + s.note + ' ' + s.fileName + ' ' + (s.tags || []).join(' ')).toLowerCase().indexOf(q) !== -1; }); const sortBy = state.ui.snippetsSort || 'new'; items.sort(function (a, b) { if (sortBy === 'old') return a.savedAt - b.savedAt; if (sortBy === 'source') { const c = a.fileName.localeCompare(b.fileName, 'ru'); if (c !== 0) return c; return (a.page || 0) - (b.page || 0); } return b.savedAt - a.savedAt; }); return items; }
  function renderSnippetsList() {
    const body = document.getElementById('snippetsBody');
    updateSnippetsBadges();
    const items = getVisibleSnippets();
    if (!state.snippets.length) { body.innerHTML = '<div class="modal-empty">Пока нет цитат</div>'; return; }
    if (!items.length) { body.innerHTML = '<div class="modal-empty">Ничего не найдено</div>'; return; }
    const group = state.ui.snippetsGroup || 'flat';
    if (group === 'source') { const groups = {}; items.forEach(function (s) { const key = SECTION_LABEL[s.section] + ' — ' + s.fileName; if (!groups[key]) groups[key] = []; groups[key].push(s); }); const keys = Object.keys(groups).sort(function (a, b) { return a.localeCompare(b, 'ru'); }); body.innerHTML = keys.map(function (k) { return '<div style="margin-bottom:14px;"><div style="font-size:12px;font-weight:700;padding:6px 4px;border-bottom:1px solid var(--border);margin-bottom:8px;">' + escapeHtml(k) + ' <span class="muted">(' + groups[k].length + ')</span></div><div class="snippets-list">' + groups[k].map(renderSnippetCard).join('') + '</div></div>'; }).join(''); }
    else body.innerHTML = '<div class="snippets-list">' + items.map(renderSnippetCard).join('') + '</div>';
  }
  function renderSnippetCard(s) {
    const isEditing = state.editingSnippetId === s.id;
    const kind = SECTION_LABEL[s.section] || 'Файл';
    const pageInfo = s.page ? '<span class="page">стр. ' + s.page + '</span>' : '';
    const goalsOptions = '<option value="">— Без привязки —</option>' + state.goals.filter(function (g) { return !g.archivedAt && !g.isInbox; }).map(function (g) { return '<option value="' + escapeHtml(g.id) + '"' + (s.goalId === g.id ? ' selected' : '') + '>' + escapeHtml(g.title) + '</option>'; }).join('');
    if (isEditing) return '<article class="snippet editing" data-id="' + escapeHtml(s.id) + '"><div class="snippet-head"><div class="snippet-source"><span class="kind">' + escapeHtml(kind) + '</span><span class="name">' + escapeHtml(s.fileName || '') + '</span>' + pageInfo + '</div></div><div class="snippet-edit-area"><label>Текст</label><textarea data-field="text" rows="5">' + escapeHtml(s.text) + '</textarea><label>Заметка</label><textarea data-field="note" rows="2">' + escapeHtml(s.note || '') + '</textarea><label>Теги</label><input type="text" data-field="tags" value="' + escapeHtml((s.tags || []).map(function (t) { return '#' + t; }).join(' ')) + '" /><label>Связать с целью</label><select data-field="goalId">' + goalsOptions + '</select><div style="display:flex;gap:6px;"><button type="button" data-action="save-snippet-edit" data-id="' + escapeHtml(s.id) + '">💾 Сохранить</button><button type="button" class="secondary" data-action="cancel-snippet-edit" data-id="' + escapeHtml(s.id) + '">Отмена</button></div></div></article>';
    const tagsHtml = (s.tags || []).length ? '<div class="snippet-tags">' + s.tags.map(function (t) { return '<span class="tag-chip' + (state.ui.snippetsTagFilter === t ? ' active' : '') + '" data-action="filter-tag" data-tag="' + escapeHtml(t) + '">#' + escapeHtml(t) + '</span>'; }).join('') + '</div>' : '';
    const noteHtml = s.note ? '<div class="snippet-note">💭 ' + escapeHtml(s.note) + '</div>' : '';
    const goalLink = s.goalId && findGoal(s.goalId) ? '<span class="muted" style="font-size:10px;">🎯 ' + escapeHtml(findGoal(s.goalId).title) + '</span>' : '';
    return '<article class="snippet" data-id="' + escapeHtml(s.id) + '"><div class="snippet-head"><div class="snippet-source"><span class="kind">' + escapeHtml(kind) + '</span><span class="name">' + escapeHtml(s.fileName || '') + '</span>' + pageInfo + '</div><div class="snippet-meta"><span>' + formatDateTime(s.savedAt) + '</span><span>' + s.text.length.toLocaleString('ru-RU') + ' симв.</span>' + goalLink + '</div><div class="snippet-actions"><button type="button" class="icon-btn" data-action="copy-snippet" data-id="' + escapeHtml(s.id) + '">📋</button><button type="button" class="icon-btn" data-action="edit-snippet" data-id="' + escapeHtml(s.id) + '">✎</button><button type="button" class="icon-btn" data-action="delete-snippet" data-id="' + escapeHtml(s.id) + '">✕</button></div></div>' + tagsHtml + noteHtml + '<div class="snippet-text">' + renderMdText(s.text) + '</div></article>';
  }
  function editSnippet(id) { state.editingSnippetId = id; renderSnippetsList(); }
  function cancelSnippetEdit() { state.editingSnippetId = null; renderSnippetsList(); }
  function saveSnippetEdit(id) { const s = findSnippet(id); if (!s) return; const card = document.querySelector('.snippet[data-id="' + CSS.escape(id) + '"]'); if (!card) return; s.text = card.querySelector('[data-field="text"]').value; s.note = card.querySelector('[data-field="note"]').value; s.tags = normalizeTags(parseTags(card.querySelector('[data-field="tags"]').value)); const gid = card.querySelector('[data-field="goalId"]').value; s.goalId = gid || null; s.updatedAt = Date.now(); state.editingSnippetId = null; saveSnippets(); updateSnippetsBadges(); renderSnippetsList(); renderSnippetsTagFilter(); renderGoals(); showToast('Цитата обновлена', 'ok'); }
  function copySnippetToClipboard(id) { const s = findSnippet(id); if (!s) return; const kind = SECTION_LABEL[s.section] || 'Файл'; const header = kind + ' — ' + (s.fileName || '') + (s.page ? ', стр. ' + s.page : '') + '\n\n'; if (navigator.clipboard) navigator.clipboard.writeText(header + s.text).then(function () { showToast('Скопировано', 'ok'); }); }
  function exportSnippets(format) {
    if (!state.snippets.length) { showToast('Нет цитат', 'warn'); return; }
    const items = state.snippets.slice().sort(function (a, b) { return a.savedAt - b.savedAt; });
    const stamp = new Date().toISOString().slice(0, 10);
    let content = ''; let mime = 'text/plain'; let ext = 'txt';
    if (format === 'doc') { const itemsHtml = items.map(function (s, i) { const kind = SECTION_LABEL[s.section] || 'Файл'; const escaped = escapeHtml(s.text).replace(/\n/g, '<br>'); const tags = (s.tags || []).length ? ' · теги: ' + s.tags.map(function (t) { return '#' + t; }).join(' ') : ''; const note = s.note ? '<p style="margin:4pt 0 0 0; color:#845400;"><i>Заметка: ' + escapeHtml(s.note) + '</i></p>' : ''; const page = s.page ? ', стр. ' + s.page : ''; return '<div style="margin:0 0 22pt 0;"><p style="margin:0 0 4pt 0; font-size:10pt; color:#666;">Цитата №' + (i + 1) + ' · ' + escapeHtml(kind) + ' · ' + formatDateTime(s.savedAt) + tags + '</p><p style="margin:0 0 6pt 0; font-size:12pt; font-weight:bold;">Источник: ' + escapeHtml(kind) + ' — ' + escapeHtml(s.fileName || '') + page + '</p><p style="margin:0; font-size:11pt; line-height:1.5;">&nbsp;&nbsp;&nbsp;&nbsp;' + escaped + '</p>' + note + '</div><hr style="border:none;border-top:1px solid #ccc;margin:0 0 22pt 0;">'; }).join(''); content = '\ufeff<html xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>@page { size: A4; margin: 2cm 2.5cm; }</style></head><body><h1>Мои цитаты</h1><p style="font-size:10pt;color:#666;">Всего: ' + items.length + ' · ' + formatDateTime(Date.now()) + '</p><hr>' + itemsHtml + '</body></html>'; mime = 'application/msword'; ext = 'doc'; }
    else if (format === 'md') { content = '# Мои цитаты\n\n_Всего: ' + items.length + '_\n\n---\n\n'; content += items.map(function (s, i) { const kind = SECTION_LABEL[s.section] || 'Файл'; const page = s.page ? ', стр. ' + s.page : ''; const tags = (s.tags || []).length ? '\n**Теги:** ' + s.tags.map(function (t) { return '`#' + t + '`'; }).join(' ') : ''; const note = s.note ? '\n\n> 💭 **Заметка:** ' + s.note : ''; const quoted = s.text.split('\n').map(function (l) { return '> ' + l; }).join('\n'); return '## Цитата №' + (i + 1) + '\n\n**Источник:** ' + kind + ' — `' + (s.fileName || '') + '`' + page + '\n**Дата:** ' + formatDateTime(s.savedAt) + tags + '\n\n' + quoted + note + '\n\n---\n'; }).join('\n'); mime = 'text/markdown'; ext = 'md'; }
    else if (format === 'csv') { function csvEsc(v) { const s = String(v == null ? '' : v); if (/[",\n;]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'; return s; } const rows = ['№;Источник;Тип;Файл;Страница;Дата;Теги;Заметка;Текст']; items.forEach(function (s, i) { rows.push([i + 1, s.fileName, SECTION_LABEL[s.section] || '', s.fileName, s.page || '', formatDateTime(s.savedAt), (s.tags || []).join(' '), s.note || '', s.text].map(csvEsc).join(';')); }); content = '\ufeff' + rows.join('\r\n'); mime = 'text/csv'; ext = 'csv'; }
    else if (format === 'bib') { content = '% Цитаты — ' + formatDateTime(Date.now()) + '\n\n'; content += items.map(function (s, i) { const title = s.fileName.replace(/\.[^.]+$/, ''); return '@misc{snippet' + (i + 1) + ',\n  title = {' + title + '},\n  note = {' + (s.note || '').replace(/[{}]/g, '') + '},\n  keywords = {' + (s.tags || []).join(', ') + '},\n  abstract = {' + s.text.slice(0, 500).replace(/[{}]/g, '') + '},\n  year = {' + new Date(s.savedAt).getFullYear() + '}\n}\n'; }).join('\n'); mime = 'application/x-bibtex'; ext = 'bib'; }
    else { content = 'МОИ ЦИТАТЫ\nВсего: ' + items.length + '\n\n' + '='.repeat(60) + '\n\n'; content += items.map(function (s, i) { const kind = SECTION_LABEL[s.section] || 'Файл'; const page = s.page ? ', стр. ' + s.page : ''; const tags = (s.tags || []).length ? ' [#' + s.tags.join(' #') + ']' : ''; const note = s.note ? '\nЗаметка: ' + s.note : ''; return '#' + (i + 1) + ' · ' + kind + ' — ' + (s.fileName || '') + page + tags + '\nДата: ' + formatDateTime(s.savedAt) + note + '\n\n' + s.text + '\n\n' + '-'.repeat(60) + '\n\n'; }).join(''); }
    const blob = new Blob([content], { type: mime + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'цитаты_' + stamp + '.' + ext;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    showToast('Экспортировано: ' + items.length + ' → .' + ext, 'ok');
  }

  function addNote(f) { const note = { id: uid(), title: f.title || 'Новая заметка', body: f.body || '', tags: [], goalId: null, createdAt: Date.now(), updatedAt: Date.now() }; state.notes.push(note); saveNotes(); renderNotesList(); state.editingNoteId = note.id; renderNoteEditor(); }
  function updateNote(id, f) { const n = findNote(id); if (!n) return; Object.assign(n, f); n.updatedAt = Date.now(); saveNotes(); }
   function deleteNote(id) {
    const n = findNote(id); if (!n) return;
    const snapshot = JSON.parse(JSON.stringify(n));
    const idx = state.notes.indexOf(n);
    state.notes.splice(idx, 1);
    if (state.editingNoteId === id) state.editingNoteId = null;
    const entry = moveToTrash('note', snapshot);
    saveNotes(); renderNotesList(); renderNoteEditor();
    showToast('Заметка удалена', 'warn', 'Восстановить', function() { restoreFromTrash(entry.id); }, 6000);
  }
  function getVisibleNotes() { let items = state.notes.slice(); const q = (state.ui.notesSearch || '').trim().toLowerCase(); if (q) items = items.filter(function (n) { return (n.title + ' ' + n.body + ' ' + (n.tags || []).join(' ')).toLowerCase().indexOf(q) !== -1; }); items.sort(function (a, b) { return b.updatedAt - a.updatedAt; }); return items; }
    function renderNotesList() {
    const list = document.getElementById('notesList');
    let items = getVisibleNotes();
    if (state.notesFilter === 'fav') items = items.filter(function (n) { return !!n.fav; });
        const _nc = document.getElementById('notesCount'); if (_nc) _nc.textContent = state.notes.length;
    if (!items.length) { list.innerHTML = '<div class="empty">' + (state.notes.length ? (state.notesFilter === 'fav' ? 'Нет избранных' : 'Ничего не найдено') : 'Пока нет заметок') + '</div>'; return; }
    list.innerHTML = items.map(function (n) {
      const isActive = state.editingNoteId === n.id;
      const preview = n.body.replace(/[#*`>]/g, '').replace(/\s+/g, ' ').slice(0, 100);
      const tags = (n.tags || []).length ? '<span style="color:var(--accent)">#' + n.tags.join(' #') + '</span>' : '';
      const goalLink = n.goalId && findGoal(n.goalId) ? '<span class="note-goal-badge" data-action="goto-goal-from-note" data-goal-id="' + escapeHtml(n.goalId) + '">🎯 ' + escapeHtml(findGoal(n.goalId).title) + '</span>' : '';
      return '<div class="note-item' + (isActive ? ' active' : '') + '" data-id="' + escapeHtml(n.id) + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;">' +
          '<div class="note-title" style="flex:1;min-width:0;">' + escapeHtml(n.title) + '</div>' +
          '<button type="button" class="note-fav' + (n.fav ? ' active' : '') + '" data-action="toggle-note-fav" data-id="' + escapeHtml(n.id) + '" title="В избранное">' + (n.fav ? '★' : '☆') + '</button>' +
        '</div>' +
        '<div class="note-sub"><span>' + formatDateTime(n.updatedAt) + '</span>' + tags + '</div>' + goalLink + '<div class="note-preview">' + escapeHtml(preview) + '</div></div>';
    }).join('');
  }
  function renderNoteEditor() {
    const pane = document.getElementById('noteEditor');
    if (!state.editingNoteId) { pane.innerHTML = '<div class="note-editor-empty"><div style="font-size:40px;opacity:.6;margin-bottom:12px;">📝</div>Выберите заметку слева.</div>'; return; }
    const n = findNote(state.editingNoteId); if (!n) { state.editingNoteId = null; renderNoteEditor(); return; }
        pane.innerHTML = '<div style="display:flex;gap:6px;align-items:center;flex:1;min-width:0;"><input type="text" id="noteTitleInput" value="' + escapeHtml(n.title) + '" placeholder="Заголовок" style="font-weight:700;font-size:15px;" /><button type="button" class="icon-btn" data-action="note-to-task" data-id="' + escapeHtml(n.id) + '" title="Создать задачу из заметки">✅</button><button type="button" class="icon-btn" data-action="note-export-md" data-id="' + escapeHtml(n.id) + '">⬇ .md</button><button type="button" class="icon-btn" data-action="note-copy" data-id="' + escapeHtml(n.id) + '">📋</button><button type="button" class="icon-btn" data-action="note-delete" data-id="' + escapeHtml(n.id) + '">🗑</button></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
        '<input type="text" id="noteTagsInput" value="' + escapeHtml((n.tags || []).map(function (t) { return '#' + t; }).join(' ')) + '" placeholder="#теги" style="font-size:12px;" />' +
        '<div class="note-goal-picker"><select id="noteGoalSelect"><option value="">— Без привязки к цели —</option>' + state.goals.filter(function (g) { return !g.archivedAt && !g.isInbox; }).map(function (g) { return '<option value="' + escapeHtml(g.id) + '"' + (n.goalId === g.id ? ' selected' : '') + '>🎯 ' + escapeHtml(g.title) + '</option>'; }).join('') + '</select></div>' +
      '</div>' +
      '<div class="note-split"><textarea id="noteBodyInput" class="mono" style="width:100%;height:100%;min-height:400px;resize:none;" placeholder="Markdown + LaTeX ($E=mc^2$)…"></textarea><div class="note-preview-pane" id="notePreview"></div></div>' +
      '<div style="font-size:10px;color:var(--muted);text-align:right;">Создано: ' + formatDateTime(n.createdAt) + ' · Обновлено: ' + formatDateTime(n.updatedAt) + '</div>';
    const body = document.getElementById('noteBodyInput'); body.value = n.body || '';
    const title = document.getElementById('noteTitleInput'); const tags = document.getElementById('noteTagsInput'); const preview = document.getElementById('notePreview'); const goalSel = document.getElementById('noteGoalSelect');
        function renderPreview() {
      const html = window.marked ? window.marked.parse(body.value || '') : escapeHtml(body.value);
      preview.innerHTML = sanitizeHtml(html);
      renderKatex(preview);
    }
    renderPreview();
    // Если marked ещё не догрузился — дождёмся и перерисуем превью один раз
    if (!window.marked) {
      waitForLib('marked').then(function () { renderPreview(); }).catch(function () {});
    }
    let saveTimer = null;
    function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(function () { updateNote(n.id, { title: title.value.trim() || 'Без названия', body: body.value, tags: parseTags(tags.value), goalId: goalSel.value || null }); renderNotesList(); renderGoals(); }, 500); }
    title.addEventListener('input', scheduleSave);
    tags.addEventListener('input', scheduleSave);
    goalSel.addEventListener('change', function () { updateNote(n.id, { goalId: goalSel.value || null }); renderNotesList(); renderGoals(); });
    body.addEventListener('input', function () { renderPreview(); scheduleSave(); });
    body.focus();
  }
  function exportNoteAsMd(id) { const n = findNote(id); if (!n) return; const tags = (n.tags || []).length ? '\n\n---\n\n**Теги:** ' + n.tags.map(function (t) { return '`#' + t + '`'; }).join(' ') : ''; const content = '# ' + n.title + '\n\n' + n.body + tags; const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = (n.title.replace(/[^\wа-яё\s-]/gi, '') || 'заметка') + '.md'; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(url); }, 5000); }
  function copyNote(id) { const n = findNote(id); if (!n) return; if (navigator.clipboard) navigator.clipboard.writeText(n.title + '\n\n' + n.body).then(function () { showToast('Скопировано', 'ok'); }); }

  function getVisibleFiles(section) {
    const files = state.folders[section].files;
    const q = (state.ui.litSearch[section] || '').trim().toLowerCase();
    const favOnly = state.litFavFilter[section];
    const favs = state.favorites[section] || {};
    const sortBy = state.litSort[section] || 'name';
    let filtered = files.slice();
    if (favOnly) filtered = filtered.filter(function (f) { return !!favs[f.name]; });
    if (q) filtered = filtered.filter(function (f) { return f.name.toLowerCase().indexOf(q) !== -1; });
    filtered.sort(function (a, b) { if (sortBy === 'date') { const da = a.lastModified || 0, db = b.lastModified || 0; if (da !== db) return db - da; } else if (sortBy === 'size') { const sa = a.size || 0, sb = b.size || 0; if (sa !== sb) return sb - sa; } else if (sortBy === 'ext') { const c = (a.ext || '').localeCompare(b.ext || ''); if (c !== 0) return c; } return a.name.localeCompare(b.name, 'ru', { numeric: true }); });
    return filtered;
  }
    function renderMeta(section) {
    const el = document.getElementById(section + 'Meta'); if (!el) return;
    const files = state.folders[section].files || [];
    const cloudCount = files.filter(f => f.remoteOnly).length;
    const localCount = files.length - cloudCount;
    const favs = state.favorites[section] || {};
    const favCount = Object.keys(favs).filter(k => favs[k]).length;
    const isAuthed = window.__pgtDrive && window.__pgtDrive.isSignedIn && window.__pgtDrive.isSignedIn();
    const parts = [];
    parts.push(isAuthed ? '☁️ <b>Google Drive</b>' : '⚠ <b>не подключено</b>');
    if (files.length) {
      parts.push('в облаке: <b>' + cloudCount + '</b>');
      if (localCount) parts.push('локально: <b>' + localCount + '</b>');
    }
    if (favCount) parts.push('⭐ <b>' + favCount + '</b>');
    el.innerHTML = parts.join(' · ');
  }
  function renderList(section) {
    const listEl = document.getElementById(section + 'List');
    const allFiles = state.folders[section].files;
    const filtered = getVisibleFiles(section);
    const selected = runtime[section].selected;
    const favs = state.favorites[section] || {};
    if (!filtered.length) { const hasFilter = state.litFavFilter[section] || (state.ui.litSearch[section] || '').trim(); listEl.innerHTML = '<div class="empty">' + (allFiles.length ? (hasFilter ? 'Ничего не найдено' : 'Нет файлов') : (state.folders[section].name ? 'В папке нет поддерживаемых файлов' : 'Папка не подключена')) + '</div>'; return; }
    listEl.innerHTML = filtered.map(function (f) { const ext = f.ext || getExt(f.name); const active = selected === f.name ? ' active' : ''; const isFav = !!favs[f.name]; return '<div class="lit-item' + active + '" data-section="' + section + '" data-name="' + escapeHtml(f.name) + '" tabindex="0"><div class="lit-item-icon">' + iconForExt(ext) + '</div><div class="lit-item-body"><div class="lit-item-name">' + escapeHtml(f.name) + '</div><div class="lit-item-sub"><span class="ext">' + escapeHtml(ext) + '</span>' + (f.size ? '<span>' + formatBytes(f.size) + '</span>' : '') + '</div></div><button type="button" class="lit-item-fav' + (isFav ? ' active' : '') + '" data-action="toggle-fav" data-section="' + section + '" data-name="' + escapeHtml(f.name) + '">' + (isFav ? '★' : '☆') + '</button></div>'; }).join('');
  }
    function renderReaderEmpty(section) {
    const pane = document.getElementById(section + 'Reader'); if (!pane) return;
    const icon = section === 'books' ? '📚' : '📖';
    const word = section === 'books' ? 'книгу' : 'статью';
    pane.innerHTML = '<div class="reader-empty"><span class="reader-empty-icon">' + icon + '</span>Выберите ' + word + ' слева или загрузите файл в облако кнопкой «➕».<br><br><b>☁️ в облаке</b> — скачается при открытии · <b>💾 + ☁️</b> — есть локально.<br><br>📌 — цитата · 📖 — режим чтения · <kbd>←</kbd> <kbd>→</kbd> — навигация.</div>';
   }  
  function saveCurrentPosition(section) { const name = runtime[section].selected; if (!name) return; const bodyEl = document.getElementById('readerBody_' + section); if (!bodyEl) return; const meta = state.folders[section].files.find(function (f) { return f.name === name; }) || {}; const ext = meta.ext || getExt(name); if (ext === 'pdf') return; state.readingPos[section][name] = bodyEl.scrollTop || 0; savePrefs(); }
  function restorePosition(section, name) { const bodyEl = document.getElementById('readerBody_' + section); if (!bodyEl) return; const pos = (state.readingPos[section] || {})[name]; if (typeof pos === 'number' && pos > 0) requestAnimationFrame(function () { bodyEl.scrollTop = pos; }); }
  function cleanupPdf(section) { const rt = runtime[section]; if (rt.pdfObserver) { try { rt.pdfObserver.disconnect(); } catch (e) {} rt.pdfObserver = null; } rt.pdfPages = []; rt.pdfDoc = null; }
  async function renderPdfViewer(section, file, name) {
    try { await ensurePdfJs(); } catch (e) {
    document.getElementById('readerBody_' + section).innerHTML = '<div class="reader-msg error">Не удалось загрузить PDF.js. Проверьте интернет.</div>';
    return;
  }
    const bodyEl = document.getElementById('readerBody_' + section);
    bodyEl.classList.add('reader-pdf');
    bodyEl.innerHTML = '<div class="pdf-status">Загрузка PDF…</div>';
    cleanupPdf(section);
    if (!window.pdfjsLib) { bodyEl.innerHTML = '<div class="reader-msg error">pdf.js не загружен</div>'; return; }
    let pdf;
    try { const buf = await file.arrayBuffer(); pdf = await window.pdfjsLib.getDocument({ data: buf }).promise; } catch (e) { bodyEl.innerHTML = '<div class="reader-msg error">Ошибка: ' + escapeHtml(e.message) + '</div>'; return; }
    runtime[section].pdfDoc = pdf;
    const zoom = clampZoom(state.pdfZoom[section] || 100) / 100;
    const scale = 1.5 * zoom;
    const container = document.createElement('div');
    container.className = 'pdf-pages';
    if (state.pdfInvert[section]) container.classList.add('inverted');
    bodyEl.innerHTML = ''; bodyEl.appendChild(container);
    const initialPages = 3;
    const pageInfos = [];
    for (let i = 1; i <= pdf.numPages; i++) { const page = await pdf.getPage(i); const viewport = page.getViewport({ scale: scale }); const div = document.createElement('div'); div.className = 'pdf-page pdf-placeholder'; div.dataset.page = i; div.style.width = viewport.width + 'px'; div.style.height = viewport.height + 'px'; div.textContent = 'Стр. ' + i; container.appendChild(div); pageInfos.push({ i: i, page: page, viewport: viewport, pageDiv: div, rendered: false }); if (i > initialPages && i % 20 === 1 && i < pdf.numPages - 20) await new Promise(function (r) { setTimeout(r, 0); }); }
    runtime[section].pdfPages = pageInfos;
    for (let i = 0; i < Math.min(initialPages, pageInfos.length); i++) { pageInfos[i].rendered = true; renderSinglePdfPage(pageInfos[i]).catch(function () {}); }
    const observer = new IntersectionObserver(function (entries) { entries.forEach(function (entry) { if (!entry.isIntersecting) return; const info = pageInfos.find(function (p) { return p.pageDiv === entry.target; }); if (info && !info.rendered) { info.rendered = true; renderSinglePdfPage(info).catch(function () {}); } }); }, { root: bodyEl, rootMargin: '400px 0px' });
    pageInfos.forEach(function (info) { if (!info.rendered) observer.observe(info.pageDiv); });
    runtime[section].pdfObserver = observer;
    const savedPage = (state.pdfPage[section] && state.pdfPage[section][name]) || 1;
    if (savedPage > 1) setTimeout(function () { scrollToPdfPage(section, savedPage); }, 200);
    bodyEl.addEventListener('scroll', function () { clearTimeout(runtime[section]._scrollTimer); runtime[section]._scrollTimer = setTimeout(function () { updateCurrentPdfPage(section, name); }, 150); }, { passive: true });
  }
  async function renderSinglePdfPage(info) {
    const pageDiv = info.pageDiv;
    const viewport = info.viewport;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * dpr); canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = viewport.width + 'px'; canvas.style.height = viewport.height + 'px';
    const renderContext = { canvasContext: ctx, viewport: viewport, transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null };
    const textLayerDiv = document.createElement('div'); textLayerDiv.className = 'pdf-text-layer';
    pageDiv.textContent = ''; pageDiv.classList.remove('pdf-placeholder');
    pageDiv.appendChild(canvas); pageDiv.appendChild(textLayerDiv);
    const numBadge = document.createElement('div'); numBadge.className = 'pdf-page-number'; numBadge.textContent = info.i;
    pageDiv.appendChild(numBadge);
    await info.page.render(renderContext).promise;
    try { const tc = await info.page.getTextContent(); if (window.pdfjsLib.renderTextLayer) await window.pdfjsLib.renderTextLayer({ textContentSource: tc, container: textLayerDiv, viewport: viewport, textDivs: [] }).promise; } catch (e) {}
  }
  function scrollToPdfPage(section, pageNumber) { const bodyEl = document.getElementById('readerBody_' + section); if (!bodyEl) return; const target = bodyEl.querySelector('.pdf-page[data-page="' + pageNumber + '"]'); if (target) bodyEl.scrollTop = target.offsetTop - 12; }
  function updateCurrentPdfPage(section, name) { const bodyEl = document.getElementById('readerBody_' + section); if (!bodyEl) return; const pages = bodyEl.querySelectorAll('.pdf-page'); if (!pages.length) return; const bodyTop = bodyEl.scrollTop; let current = 1; for (let i = 0; i < pages.length; i++) { const p = pages[i]; if (p.offsetTop <= bodyTop + 100) current = parseInt(p.dataset.page, 10) || 1; else break; } const inp = document.querySelector('[data-action="pdf-page"][data-section="' + section + '"]'); if (inp && document.activeElement !== inp) inp.value = current; if (!state.pdfPage[section]) state.pdfPage[section] = {}; state.pdfPage[section][name] = current; savePrefs(); }
  async function rerenderPdfViewer(section) { const name = runtime[section].selected; if (!name) return; const file = await resolveFile(section, name); if (!file) return; await renderPdfViewer(section, file, name); }
  function togglePdfInvert(section) { const c = document.querySelector('#readerBody_' + section + ' .pdf-pages'); if (c) c.classList.toggle('inverted', !!state.pdfInvert[section]); }
  async function renderReader(section, name) {
    const pane = document.getElementById(section + 'Reader');
    const meta = state.folders[section].files.find(function (f) { return f.name === name; }) || {};
    const ext = meta.ext || getExt(name);
    const favs = state.favorites[section] || {}; const isFav = !!favs[name];
    cleanupPdf(section);
    const readerOnly = state.readerOnly[section];
    pane.classList.toggle('reader-only', readerOnly);
    const headHtml = readerOnly ? '' : '<header class="reader-head"><div class="reader-head-main"><button type="button" class="icon-btn" data-action="close-reader" data-section="' + section + '">←</button><div><div class="reader-title">' + escapeHtml(name) + '</div><div class="reader-sub"><span class="ext">' + escapeHtml(ext) + '</span>' + (meta.size ? '<span>' + formatBytes(meta.size) + '</span>' : '') + '</div></div></div><div class="reader-actions"><button type="button" class="icon-btn pin-btn" data-action="save-snippet" data-section="' + section + '" title="Цитата">📌</button><button type="button" class="icon-btn' + (readerOnly ? ' active' : '') + '" data-action="toggle-reader-only" data-section="' + section + '">📖</button><button type="button" class="icon-btn" data-action="speak-text" data-section="' + section + '">🔊</button><button type="button" class="icon-btn' + (isFav ? ' active' : '') + '" data-action="toggle-fav-current" data-section="' + section + '">' + (isFav ? '★' : '☆') + '</button><button type="button" class="icon-btn" data-action="nav-prev" data-section="' + section + '">‹</button><button type="button" class="icon-btn" data-action="nav-next" data-section="' + section + '">›</button><button type="button" class="icon-btn" data-action="download-file" data-section="' + section + '">⬇</button><button type="button" class="icon-btn" data-action="toggle-fullscreen" data-section="' + section + '">⛶</button></div></header>';
    let pdfToolbarHtml = '';
    if (ext === 'pdf' && !readerOnly) { const page = (state.pdfPage[section] && state.pdfPage[section][name]) || 1; const zoom = clampZoom(state.pdfZoom[section] || 100); const invert = !!state.pdfInvert[section]; pdfToolbarHtml = '<div class="reader-pdf-toolbar"><span>Стр.</span><input type="number" min="1" step="1" value="' + page + '" data-action="pdf-page" data-section="' + section + '" /><button type="button" class="row-btn" data-action="pdf-zoom-out" data-section="' + section + '">−</button><span style="min-width:42px;text-align:center;color:var(--text);font-weight:600">' + zoom + '%</span><button type="button" class="row-btn" data-action="pdf-zoom-in" data-section="' + section + '">+</button><button type="button" class="row-btn" data-action="pdf-zoom-reset" data-section="' + section + '">↺</button><button type="button" class="row-btn' + (invert ? ' active' : '') + '" data-action="pdf-invert" data-section="' + section + '">🌗</button><span class="sep"></span><span>📌 — цитата</span></div>'; }
    pane.innerHTML = headHtml + pdfToolbarHtml + '<div class="reader-progress"><div class="reader-progress-bar" id="readerProgress_' + section + '" style="width:0%"></div></div><div class="reader-body" id="readerBody_' + section + '"><div class="reader-msg">Загрузка…</div></div>';
    const bodyEl = document.getElementById('readerBody_' + section);
    const file = await resolveFile(section, name);
    if (!file) { bodyEl.innerHTML = '<div class="reader-msg error">Файл недоступен</div>'; return; }
    const progress = document.getElementById('readerProgress_' + section);
    if (progress) bodyEl.addEventListener('scroll', function () { const total = bodyEl.scrollHeight - bodyEl.clientHeight; if (total <= 0) { progress.style.width = '100%'; return; } progress.style.width = Math.min(100, Math.max(0, (bodyEl.scrollTop / total) * 100)) + '%'; }, { passive: true });
        try {
      if (ext === 'pdf') await renderPdfViewer(section, file, name);
      else if (ext === 'docx') {
        bodyEl.classList.add('reader-docx');
        bodyEl.innerHTML = '<div class="reader-msg">Загрузка…</div>';
        try {
          if (!window.docx || !window.docx.renderAsync) throw new Error('no docx-preview');
          bodyEl.innerHTML = '';
          await window.docx.renderAsync(file, bodyEl, null, { className: 'docx', inWrapper: true, breakPages: true, experimental: true, useBase64URL: true, renderHeaders: true });
          restorePosition(section, name);
        } catch (e) {
          bodyEl.classList.remove('reader-docx');
          bodyEl.classList.add('reader-html');
          try { await waitForLib('mammoth'); } catch (e2) { bodyEl.innerHTML = '<div class="reader-msg error">Mammoth не загрузился</div>'; return; }
          const buf = await file.arrayBuffer();
          const opts = { convertImage: window.mammoth.images.imgElement(function (image) { return image.read('base64').then(function (b64) { return { src: 'data:' + (image.contentType || 'image/png') + ';base64,' + b64 }; }); }) };
          const result = await window.mammoth.convertToHtml({ arrayBuffer: buf }, opts);
          bodyEl.innerHTML = result.value || '';
          restorePosition(section, name);
        }
      }
      else if (ext === 'md' || ext === 'markdown') { bodyEl.classList.add('reader-html'); bodyEl.innerHTML = await extractMarkdownHtml(file); restorePosition(section, name); }
      else if (ext === 'txt') { bodyEl.classList.add('reader-text'); bodyEl.innerHTML = escapeHtmlWithLinks(await readAsText(file)); restorePosition(section, name); }
        } catch (e) { bodyEl.innerHTML = '<div class="reader-msg error">Ошибка: ' + escapeHtml(e.message || e) + '</div>'; }
  }
   async function cacheFileBlob(section, name, file) {
    return await storageWrite(section, name, file);
  }

  async function smartRefreshSection(section, opts) {
    opts = opts || {};
    const rt = runtime[section];
    const files = state.folders[section].files;
    if (!files.length) return { done: 0, added: 0, updated: 0, removed: 0, failed: 0 };
    let done = 0, failed = 0, added = 0, updated = 0;

    for (let i = 0; i < files.length; i++) {
      const meta = files[i];
      try {
        const existing = await storageGetMeta(section, meta.name);
        let file = rt.fileCache.get(meta.name);
        if (!file && rt.handle) {
          try {
            const perm = (rt.handle.queryPermission ? await rt.handle.queryPermission({ mode: 'read' }) : 'granted');
            if (perm === 'granted') {
              const fh = await rt.handle.getFileHandle(meta.name);
              file = await fh.getFile();
              rt.fileCache.set(meta.name, file);
            }
          } catch (e) {}
        }
        if (!file) { failed++; continue; }
        if (file.size > MAX_CACHE_SIZE) { done++; continue; }

        if (existing && existing.size === file.size && existing.lastModified === file.lastModified && existing.backend) {
          done++;
          continue;
        }
        const ok = await storageWrite(section, meta.name, file);
        if (ok) {
          done++;
          if (existing) updated++; else added++;
          if (!opts.silent && typeof bcBroadcast === 'function') bcBroadcast('file-added', { section: section, name: meta.name });
        } else failed++;
      } catch (e) { failed++; }
    }

    let removed = 0;
    const existingAll = await storageGetAll(section);
    const present = new Set(files.map(function (f) { return f.name; }));
    for (const rec of existingAll) {
      if (!present.has(rec.name)) {
        await storageDelete(section, rec.name);
        removed++;
        if (!opts.silent && typeof bcBroadcast === 'function') bcBroadcast('file-removed', { section: section, name: rec.name });
      }
    }

    return { done: done, failed: failed, added: added, updated: updated, removed: removed };
  }

  async function cacheSectionFiles(section, onProgress) {
    const files = state.folders[section].files;
    if (!files.length) return { done: 0, failed: 0, skipped: 0 };
    const total = files.length;
    let processed = 0;
    const rt = runtime[section];
    let failed = 0;
    for (let i = 0; i < files.length; i++) {
      const meta = files[i];
      try {
        let file = rt.fileCache.get(meta.name);
        if (!file && rt.handle) {
          try {
            const perm = (rt.handle.queryPermission ? await rt.handle.queryPermission({ mode: 'read' }) : 'granted');
            if (perm === 'granted') {
              const fh = await rt.handle.getFileHandle(meta.name);
              file = await fh.getFile();
              rt.fileCache.set(meta.name, file);
            }
          } catch (e) {}
        }
        if (!file) { failed++; }
        else if (file.size > MAX_CACHE_SIZE) {}
        else {
          const existing = await storageGetMeta(section, meta.name);
          if (existing && existing.size === file.size && existing.lastModified === file.lastModified) {}
          else {
            const ok = await storageWrite(section, meta.name, file);
            if (!ok) failed++;
          }
        }
      } catch (e) { failed++; }
      processed++;
      if (onProgress) onProgress(processed, total);
    }
    return { done: processed - failed, failed: failed, skipped: 0 };
  }

  async function clearCachedFiles(section) {
    if (section) await storageDeleteSection(section);
    else await storageClearAll();
    if (section) runtime[section].fileCache.clear();
    else SECTIONS.forEach(function (s) { runtime[s].fileCache.clear(); });
  }

  async function getCacheStats() {
    const s = await storageStats();
    return { count: s.count, total: s.total, bySection: { articles: s.bySection.articles.count, books: s.bySection.books.count }, backend: s.backend };
  }
  // === ЭКСПОРТ/ИМПОРТ ZIP ===
  async function exportAllToZip() {
    if (!window.JSZip) { showToast('JSZip не загружен (нет интернета?)', 'error'); return; }
    showToast('Собираю архив…', 'ok', null, null, 8000);
    const zip = new JSZip();
    zip.file('pgt-data.json', JSON.stringify({
      version: 25,
      exportedAt: Date.now(),
      goals: state.goals,
      folders: state.folders,
      snippets: state.snippets,
      notes: state.notes,
      templates: state.templates
    }, null, 2));

    const all = await storageGetAll();
    const progressBox = document.getElementById('zipProgress');
    if (progressBox) { progressBox.hidden = false; progressBox.textContent = 'Файлы: 0/' + all.length; }
    let i = 0;
    for (const rec of all) {
      try {
        const f = await storageRead(rec.section, rec.name);
        if (f) zip.file('files/' + rec.section + '/' + rec.name, f);
      } catch (e) {}
      i++;
      if (progressBox && i % 10 === 0) progressBox.textContent = 'Файлы: ' + i + '/' + all.length;
    }
    if (progressBox) progressBox.textContent = 'Сжимаю…';

    let blob;
    try {
      blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
        function (meta) { if (progressBox) progressBox.textContent = 'Сжатие: ' + Math.round(meta.percent) + '%'; });
    } catch (e) {
      showToast('Ошибка упаковки: ' + (e.message || e), 'error');
      if (progressBox) progressBox.hidden = true;
      return;
    }
    if (progressBox) progressBox.hidden = true;

    const stamp = new Date().toISOString().slice(0, 10);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'pgt_backup_' + stamp + '.zip';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
    showToast('Архив готов: ' + formatBytes(blob.size), 'ok');
  }

  async function importFromZip(file) {
    if (!window.JSZip) { showToast('JSZip не загружен', 'error'); return; }
    if (!file) return;
    if (!confirm('Загрузить ZIP? Текущие данные будут заменены (перед этим создастся резервная копия).')) return;
    await makeBackup('before-zip-import');
    showToast('Распаковываю…', 'ok', null, null, 8000);

    let zip;
    try { zip = await JSZip.loadAsync(file); }
    catch (e) { showToast('Не удалось открыть архив', 'error'); return; }

    const jsonEntry = zip.file('pgt-data.json');
    if (!jsonEntry) { showToast('В архиве нет pgt-data.json', 'error'); return; }
    let parsed;
    try { parsed = JSON.parse(await jsonEntry.async('string')); }
    catch (e) { showToast('Повреждён pgt-data.json', 'error'); return; }

    // Восстанавливаем данные
    if (Array.isArray(parsed.goals)) state.goals = parsed.goals.map(normalizeGoal).filter(Boolean);
    if (Array.isArray(parsed.snippets)) state.snippets = parsed.snippets.map(normalizeSnippet).filter(Boolean);
    if (Array.isArray(parsed.notes)) state.notes = parsed.notes.map(normalizeNote).filter(Boolean);
    if (Array.isArray(parsed.templates)) state.templates = parsed.templates;
    if (parsed.folders && typeof parsed.folders === 'object') {
      SECTIONS.forEach(function (s) {
        const fd = parsed.folders[s];
        if (fd && typeof fd === 'object') {
          state.folders[s].name = String(fd.name || '');
          state.folders[s].files = Array.isArray(fd.files) ? fd.files.filter(function (f) { return f && typeof f.name === 'string'; }) : [];
          state.folders[s].updatedAt = typeof fd.updatedAt === 'number' ? fd.updatedAt : null;
          state.folders[s].needsPermission = false;
        }
      });
    }
    saveData(); saveSnippets(); saveNotes();

    // Восстанавливаем файлы
    const fileEntries = Object.keys(zip.files).filter(function (p) { return p.startsWith('files/') && !zip.files[p].dir; });
    let restored = 0, failed = 0;
    const progressBox = document.getElementById('zipProgress');
    if (progressBox) { progressBox.hidden = false; progressBox.textContent = 'Файлы: 0/' + fileEntries.length; }

    // (Очистка убрана: файлы перезаписываются по имени, лишние не трогаются)

    for (let i = 0; i < fileEntries.length; i++) {
      const path = fileEntries[i];
      const parts = path.split('/');
      if (parts.length < 3) continue;
      const sec = parts[1];
      const fname = parts.slice(2).join('/');
      if (sec !== 'articles' && sec !== 'books') continue;
      try {
        const blob = await zip.files[path].async('blob');
        const fakeFile = new File([blob], fname, { type: blob.type || '', lastModified: Date.now() });
        const ok = await storageWrite(sec, fname, fakeFile);
        if (ok) restored++; else failed++;
      } catch (e) { failed++; }
      if (progressBox && i % 10 === 0) progressBox.textContent = 'Файлы: ' + i + '/' + fileEntries.length;
    }
    if (progressBox) progressBox.hidden = true;

    // Сброс кэшей в памяти
    SECTIONS.forEach(function (s) { runtime[s].fileCache.clear(); runtime[s].selected = null; });

    render();
    SECTIONS.forEach(function (s) { renderReaderEmpty(s); });
    renderCacheStats();
        if (failed > 0) {
      showToast('Восстановлено: ' + restored + ', ошибок: ' + failed + '. Проверьте данные!', 'warn', null, null, 8000);
    } else if (restored > 0) {
      showToast('Восстановлено: ' + restored, 'ok');
    } else {
      showToast('В архиве не нашлось файлов для восстановления', 'warn');
    }
  }
  // ============================================================
  // МОДУЛЬ STORAGE: OPFS с fallback на IndexedDB
  // ============================================================
  const HAS_OPFS = (typeof navigator !== 'undefined' && navigator.storage && typeof navigator.storage.getDirectory === 'function');
  let _opfsRootPromise = null;
  async function opfsRoot() {
    if (!HAS_OPFS) return null;
    if (!_opfsRootPromise) {
      _opfsRootPromise = navigator.storage.getDirectory().then(async function (root) {
        return await root.getDirectoryHandle(OPFS_ROOT, { create: true });
      }).catch(function () { return null; });
    }
    return _opfsRootPromise;
  }
  async function opfsSectionDir(section) {
    const root = await opfsRoot();
    if (!root) return null;
    return await root.getDirectoryHandle(section, { create: true });
  }
  function safeName(name) {
    // OPFS не любит пустые строки и слеши. Остальное переносит.
    return String(name).replace(/[/\\]/g, '_').replace(/\0/g, '').trim() || 'unnamed';
  }

  function opfsSafeName(name) {
    // Как safeName, но с коротким хешем от исходного имени —
    // чтобы "a/b.pdf" и "a_b.pdf" не превращались в один и тот же файл.
    const base = safeName(name);
    const s = String(name);
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    const hash = (h >>> 0).toString(36);
    const extMatch = base.match(/(\.[a-z0-9]{1,10})$/i);
    const ext = extMatch ? extMatch[1] : '';
    const stem = ext ? base.slice(0, -ext.length) : base;
    const maxStem = Math.max(20, 180 - hash.length - 1 - ext.length);
    return stem.slice(0, maxStem) + '_' + hash + ext;
  }

  function storageBackend() {
    return HAS_OPFS ? 'opfs' : 'idb';
  }

  async function storageWrite(section, name, file) {
    if (!file) return false;
    if (file.size > MAX_CACHE_SIZE) return false;
    try {
      if (HAS_OPFS) {
        const dir = await opfsSectionDir(section);
        if (dir) {
          const safe = opfsSafeName(name);
          const fh = await dir.getFileHandle(safe, { create: true });
          const w = await fh.createWritable();
          await w.write(file);
          await w.close();
          // Метаданные в IDB (легко и быстро)
          await idbPut(IDB_FILES, null, {
            key: section + '::' + name,
            section: section,
            name: name,
            opfsName: safe,
            backend: 'opfs',
            type: file.type || '',
            size: file.size || 0,
            lastModified: file.lastModified || Date.now(),
            cachedAt: Date.now()
          });
          return true;
        }
      }
      // Fallback — IDB
      await idbPut(IDB_FILES, null, {
        key: section + '::' + name,
        section: section,
        name: name,
        backend: 'idb',
        blob: new Blob([file], { type: file.type || '' }),
        type: file.type || '',
        size: file.size || 0,
        lastModified: file.lastModified || Date.now(),
        cachedAt: Date.now()
      });
      return true;
    } catch (e) {
      console.warn('[storageWrite]', e);
      return false;
    }
  }

  async function storageRead(section, name) {
    try {
      const rec = await idbGet(IDB_FILES, section + '::' + name);
      if (rec) {
        if (rec.backend === 'opfs') {
          const dir = await opfsSectionDir(section);
          if (dir) {
            try {
              const fh = await dir.getFileHandle(rec.opfsName || safeName(name));
              const f = await fh.getFile();
              return f;
            } catch (e) {
              // файла в OPFS нет — подчистим метаданные
              await idbDelete(IDB_FILES, section + '::' + name);
              return null;
            }
          }
        } else if (rec.blob) {
          return new File([rec.blob], name, { type: rec.type || '', lastModified: rec.lastModified || Date.now() });
        }
      }
      return null;
    } catch (e) { return null; }
  }

  async function storageHas(section, name) {
    const rec = await idbGet(IDB_FILES, section + '::' + name);
    return !!rec;
  }

  async function storageGetMeta(section, name) {
    return await idbGet(IDB_FILES, section + '::' + name);
  }

  async function storageDelete(section, name) {
    try {
      const rec = await idbGet(IDB_FILES, section + '::' + name);
      if (rec && rec.backend === 'opfs') {
        const dir = await opfsSectionDir(section);
        if (dir) { try { await dir.removeEntry(rec.opfsName || safeName(name)); } catch (e) {} }
      }
      await idbDelete(IDB_FILES, section + '::' + name);
    } catch (e) {}
  }

  async function storageDeleteSection(section) {
    const all = await idbGetAll(IDB_FILES);
    for (const rec of all) {
      if (rec.section !== section) continue;
      if (rec.backend === 'opfs') {
        try {
          const dir = await opfsSectionDir(section);
          if (dir) { try { await dir.removeEntry(rec.opfsName || safeName(rec.name)); } catch (e) {} }
        } catch (e) {}
      }
      await idbDelete(IDB_FILES, rec.key);
    }
    // Заодно пробуем снести всю папку секции в OPFS
    if (HAS_OPFS) {
      try {
        const root = await opfsRoot();
        if (root) { try { await root.removeEntry(section, { recursive: true }); } catch (e) {} }
      } catch (e) {}
    }
  }

  async function storageClearAll() {
    for (const s of SECTIONS) await storageDeleteSection(s);
    // Остатки в IDB
    const all = await idbGetAll(IDB_FILES);
    for (const rec of all) await idbDelete(IDB_FILES, rec.key);
    // Чистим OPFS-корень
    if (HAS_OPFS) {
      try {
        const root = await navigator.storage.getDirectory();
        try { await root.removeEntry(OPFS_ROOT, { recursive: true }); } catch (e) {}
        _opfsRootPromise = null;
      } catch (e) {}
    }
  }

  async function storageGetAll(section) {
    const all = await idbGetAll(IDB_FILES);
    return section ? all.filter(function (r) { return r.section === section; }) : all;
  }

  async function storageStats() {
    const all = await idbGetAll(IDB_FILES);
    let total = 0;
    const bySection = { articles: { count: 0, size: 0 }, books: { count: 0, size: 0 } };
    for (const rec of all) {
      total += rec.size || 0;
      if (rec.section in bySection) {
        bySection[rec.section].count++;
        bySection[rec.section].size += rec.size || 0;
      }
    }
    return { count: all.length, total: total, bySection: bySection, backend: storageBackend() };
  }

  // Миграция старых IDB-блобов в OPFS (однократная, при первом запуске с OPFS)
  async function migrateIdbBlobsToOpfs() {
    if (!HAS_OPFS) return;
    const all = await idbGetAll(IDB_FILES);
    const toMigrate = all.filter(function (r) { return r.backend !== 'opfs' && r.blob; });
    if (!toMigrate.length) return;
    let done = 0;
        for (const rec of toMigrate) {
      try {
        const dir = await opfsSectionDir(rec.section);
        if (!dir) break;
        const safe = opfsSafeName(rec.name);
        const fh = await dir.getFileHandle(safe, { create: true });
        const w = await fh.createWritable();
        await w.write(rec.blob);
        await w.close();
        await idbPut(IDB_FILES, null, {
          key: rec.key, section: rec.section, name: rec.name, opfsName: safe,
          backend: 'opfs', type: rec.type || '', size: rec.size || 0,
          lastModified: rec.lastModified || Date.now(), cachedAt: rec.cachedAt || Date.now()
        });
        done++;
      } catch (e) {}
    }
    if (done) console.log('[migrate] Перенесено в OPFS: ' + done);
  }

  async function resolveFile(section, name) {
    const rt = runtime[section];
    if (rt.fileCache.has(name)) return rt.fileCache.get(name);
    const cached = await storageRead(section, name);
    if (cached) { rt.fileCache.set(name, cached); return cached; }
    if (rt.handle) {
      try {
        const perm = (rt.handle.queryPermission ? await rt.handle.queryPermission({ mode: 'read' }) : 'granted');
        if (perm === 'granted') {
          const fh = await rt.handle.getFileHandle(name);
          const f = await fh.getFile();
          rt.fileCache.set(name, f);
          storageWrite(section, name, f).catch(function () {});
          return f;
        }
      } catch (e) {}
    }
    return null;
  }
  function selectFile(section, name) { if (runtime[section].selected && runtime[section].selected !== name) saveCurrentPosition(section); runtime[section].selected = name; renderList(section); const split = document.getElementById(section + 'Split'); if (split) split.classList.add('reader-open'); renderReader(section, name); }
  function closeReader(section) { saveCurrentPosition(section); const split = document.getElementById(section + 'Split'); if (split) split.classList.remove('reader-open'); cleanupPdf(section); runtime[section].selected = null; renderList(section); renderReaderEmpty(section); const pane = document.getElementById(section + 'Reader'); if (pane) pane.classList.remove('fullscreen', 'reader-only'); state.readerOnly[section] = false; }
  function toggleFullscreen(section) { const pane = document.getElementById(section + 'Reader'); if (pane) pane.classList.toggle('fullscreen'); }
  function toggleReaderOnly(section) { state.readerOnly[section] = !state.readerOnly[section]; const pane = document.getElementById(section + 'Reader'); if (pane) pane.classList.toggle('reader-only', state.readerOnly[section]); if (runtime[section].selected) renderReader(section, runtime[section].selected); }
  function navigateFile(section, direction) { const list = getVisibleFiles(section); if (!list.length) return; const current = runtime[section].selected; if (!current) { selectFile(section, list[0].name); return; } let idx = list.findIndex(function (f) { return f.name === current; }); if (idx === -1) idx = 0; const next = (idx + direction + list.length) % list.length; selectFile(section, list[next].name); }
  async function downloadFile(section) { const name = runtime[section].selected; if (!name) return; const file = await resolveFile(section, name); if (!file) return; const url = URL.createObjectURL(file); const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(url); }, 30000); }
  function speakText(section) {
    if (!window.speechSynthesis) { showToast('Не поддерживается', 'error'); return; }
    window.speechSynthesis.cancel();
    let text = ''; try { const sel = window.getSelection(); if (sel) text = sel.toString(); } catch (e) {}
    if (!text) { const bodyEl = document.getElementById('readerBody_' + section); if (bodyEl) text = bodyEl.innerText || ''; }
    text = (text || '').trim();
    if (!text) { showToast('Нет текста', 'warn'); return; }
    if (text.length > 50000) text = text.slice(0, 50000);
    const utt = new SpeechSynthesisUtterance(text); utt.lang = 'ru-RU'; utt.rate = 1;
    window.speechSynthesis.speak(utt);
    showToast('Чтение вслух. Повторный клик — стоп.', 'ok');
    const btn = document.querySelector('[data-action="speak-text"][data-section="' + section + '"]');
    if (btn) btn.addEventListener('click', function stop() { window.speechSynthesis.cancel(); btn.removeEventListener('click', stop); }, { once: true });
  }
  function toggleFavorite(section, name, isCurrent) { const favs = state.favorites[section] || (state.favorites[section] = {}); if (favs[name]) delete favs[name]; else favs[name] = true; savePrefs(); renderList(section); renderMeta(section); if (isCurrent && runtime[section].selected === name) { const btn = document.querySelector('[data-action="toggle-fav-current"][data-section="' + section + '"]'); if (btn) { const isFav = !!favs[name]; btn.classList.toggle('active', isFav); btn.textContent = isFav ? '★' : '☆'; } } }
  function toggleListVisibility(section) { state.listHidden[section] = !state.listHidden[section]; savePrefs(); applyListVisibility(section); }
  function applyListVisibility(section) { const split = document.getElementById(section + 'Split'); if (!split) return; split.classList.toggle('list-hidden', !!state.listHidden[section]); const btn = document.querySelector('[data-action="toggle-list"][data-section="' + section + '"]'); if (btn) btn.classList.toggle('active', !!state.listHidden[section]); }

  async function pickFolderFSA(section) { try { const handle = await window.showDirectoryPicker({ mode: 'read' }); runtime[section].handle = handle; await idbPut(IDB_HANDLES, 'folder_' + section, handle); await scanFolder(section, handle); } catch (e) { if (e && e.name === 'AbortError') return; alert('Не удалось: ' + (e.message || e)); } }
    async function scanFolder(section, handle) {
    const rt = runtime[section];
    const prevMeta = new Map();
    state.folders[section].files.forEach(function (f) { prevMeta.set(f.name, f); });

    const files = [];
    try {
      for await (const entry of handle.values()) {
        if (entry.kind !== 'file') continue;
        if (!isSupportedFile(entry.name)) continue;
        let f = null;
        try { f = await entry.getFile(); } catch (e) {}
        files.push({
          name: entry.name,
          ext: getExt(entry.name),
          size: f ? f.size : 0,
          lastModified: f ? f.lastModified : 0
        });
        // Обновляем fileCache только если файл изменился
        if (f) {
          const prev = prevMeta.get(entry.name);
          const changed = !prev || prev.size !== f.size || prev.lastModified !== f.lastModified;
          if (changed || !rt.fileCache.has(entry.name)) {
            rt.fileCache.set(entry.name, f);
          }
        }
      }
    } catch (e) { alert('Ошибка чтения папки'); return; }

    state.folders[section].name = handle.name;
    state.folders[section].files = files;
    state.folders[section].updatedAt = Date.now();
    state.folders[section].needsPermission = false;
    saveData();
    renderMeta(section); renderList(section); renderSectionCount();

    // Умный фоновый рефреш storage
      setTimeout(async function () {
      const r = await smartRefreshSection(section);
      showToast('Кэш: +' + r.added + ' ~' + r.updated + ' −' + r.removed + ' (ошибок: ' + r.failed + ')', r.failed ? 'warn' : 'ok');
      if (typeof renderCacheStats === 'function') renderCacheStats();
      if (typeof bcBroadcast === 'function') bcBroadcast('data-changed', {});
    }, 200);
  }
  function pickFolderFallback(section) { const input = document.getElementById(section + 'DirPicker'); input.value = ''; input.onchange = function () { if (input.files && input.files.length) loadFromFileList(section, input.files, false); }; input.click(); }
  function pickFiles(section) { const input = document.getElementById(section + 'FilesPicker'); input.value = ''; input.onchange = function () { if (input.files && input.files.length) loadFromFileList(section, input.files, true); }; input.click(); }
  function loadFromFileList(section, fileList, append) {
    const rt = runtime[section]; if (!append) { rt.fileCache.clear(); state.folders[section].files = []; }
    const seen = new Set(state.folders[section].files.map(function (f) { return f.name; }));
    for (let i = 0; i < fileList.length; i++) { const f = fileList[i]; if (!isSupportedFile(f.name)) continue; if (seen.has(f.name)) state.folders[section].files = state.folders[section].files.filter(function (x) { return x.name !== f.name; }); seen.add(f.name); state.folders[section].files.push({ name: f.name, ext: getExt(f.name), size: f.size, lastModified: f.lastModified }); rt.fileCache.set(f.name, f); }
    state.folders[section].updatedAt = Date.now(); if (!state.folders[section].name) state.folders[section].name = '(выбранные файлы)'; state.folders[section].needsPermission = false;
        saveData(); renderMeta(section); renderList(section); renderSectionCount();
     setTimeout(async function () {
      const r = await smartRefreshSection(section);
      showToast('Кэш: +' + r.added + ' ~' + r.updated + ' −' + r.removed + ' (ошибок: ' + r.failed + ')', r.failed ? 'warn' : 'ok');
      if (typeof renderCacheStats === 'function') renderCacheStats();
      if (typeof bcBroadcast === 'function') bcBroadcast('data-changed', {});
    }, 200);
  }
     async function refreshFolder(section) {
    const rt = runtime[section];
    if (rt.handle) { try { const perm = await rt.handle.queryPermission({ mode: 'read' }); if (perm !== 'granted') { const req = await rt.handle.requestPermission({ mode: 'read' }); if (req !== 'granted') return; } await scanFolder(section, rt.handle); return; } catch (e) {} }
    if (fsSupported) { const saved = await idbGet(IDB_HANDLES, 'folder_' + section); if (saved) { rt.handle = saved; try { const perm = await saved.queryPermission({ mode: 'read' }); if (perm === 'granted') { await scanFolder(section, saved); return; } } catch (e) {} } }
    alert('Выберите папку заново');
  }
  async function disconnectFolder(section) { if (!confirm('Отсоединить папку?')) return; const rt = runtime[section]; cleanupPdf(section); rt.handle = null; rt.fileCache.clear(); rt.selected = null; state.folders[section] = emptySection(state.folders[section].defaultName); await idbDelete(IDB_HANDLES, 'folder_' + section); saveData(); renderMeta(section); renderList(section); renderReaderEmpty(section); renderSectionCount(); }
  async function requestPermission(section) { if (!fsSupported) return; const rt = runtime[section]; const handle = rt.handle || await idbGet(IDB_HANDLES, 'folder_' + section); if (!handle) return; try { const perm = await handle.requestPermission({ mode: 'read' }); if (perm === 'granted') { rt.handle = handle; await scanFolder(section, handle); } } catch (e) {} }
  async function tryRestoreHandles() { if (!fsSupported) return; for (const section of SECTIONS) { const handle = await idbGet(IDB_HANDLES, 'folder_' + section); if (!handle) continue; try { const perm = await handle.queryPermission({ mode: 'read' }); if (perm === 'granted') { runtime[section].handle = handle; await scanFolder(section, handle); } else { state.folders[section].name = state.folders[section].name || handle.name; state.folders[section].needsPermission = true; saveData(); renderMeta(section); renderList(section); } } catch (e) {} } }
    function renderSectionCount() {
    let total = 0;
    SECTIONS.forEach(function (s) { total += state.folders[s].files.length; });
    const el = document.getElementById('literatureCount');
    if (el) el.textContent = total;
  }

  function resetGoalForm() { document.getElementById('goalTitle').value = ''; document.getElementById('goalDesc').value = ''; document.getElementById('goalPriority').value = 'medium'; document.getElementById('goalDeadline').value = ''; document.getElementById('goalMoreBody').hidden = true; }
  function resetTaskForm() { document.getElementById('taskText').value = ''; document.getElementById('taskPriority').value = 'medium'; document.getElementById('taskTags').value = ''; document.getElementById('taskDeadline').value = ''; }
  function applyColors() { document.documentElement.style.setProperty('--color-total', state.colorTotal); document.documentElement.style.setProperty('--color-done', state.colorDone); const t = document.getElementById('colorTotal'); const d = document.getElementById('colorDone'); if (t) t.value = state.colorTotal; if (d) d.value = state.colorDone; }

  function syncQuickHint() {
    const hint = document.getElementById('calDayHint');
    if (!hint) return;
    if (state.calSelectedDate) { hint.hidden = false; hint.innerHTML = '📅 Задача попадёт на <b>' + formatDate(state.calSelectedDate) + '</b>'; }
    else hint.hidden = true;
  }

  function syncToolbarInputs() {
    document.getElementById('searchInput').value = state.ui.search || '';
    document.getElementById('filterSelect').value = state.ui.filter || 'all';
    document.getElementById('sortSelect').value = state.ui.sort || 'deadline';
    document.getElementById('groupSelect').value = state.tasksGrouping || 'none';
    document.getElementById('articlesSearchInput').value = state.ui.litSearch.articles || '';
    document.getElementById('booksSearchInput').value = state.ui.litSearch.books || '';
    document.getElementById('snippetsSearch').value = state.ui.snippetsSearch || '';
    document.getElementById('snippetsSort').value = state.ui.snippetsSort || 'new';
    document.getElementById('snippetsGroup').value = state.ui.snippetsGroup || 'flat';
    document.getElementById('notesSearchInput').value = state.ui.notesSearch || '';
    SECTIONS.forEach(function (s) { const view = document.getElementById(s === 'articles' ? 'articlesPanel' : 'booksPanel'); if (!view) return; const sel = view.querySelector('[data-action="set-sort"][data-section="' + s + '"]'); if (sel) sel.value = state.litSort[s] || 'name'; const favBtn = view.querySelector('[data-action="toggle-fav-filter"][data-section="' + s + '"]'); if (favBtn) favBtn.classList.toggle('active', !!state.litFavFilter[s]); applyListVisibility(s); });
   updateNotifBtn();
    syncQuickHint();
  }  

  // === ПЕРЕТАСКИВАНИЕ ВКЛАДОК МЫШЬЮ / ПАЛЬЦЕМ ===
    function initTabsDragAndDrop() {
    const nav = document.getElementById('tabsNav');
    if (!nav || nav.dataset.dndBound === '1') return;
    nav.dataset.dndBound = '1';

    let dragging = null;       // оригинал (placeholder)
    let ghost = null;          // летающий клон
    let dragType = null;       // 'std' | 'custom'
    let dragId = null;
    let activePointerId = null;
    let startX = 0, startY = 0;
    let grabDX = 0, grabDY = 0;
    let started = false;
    let blockNextClick = false;
    const THRESHOLD = 8;

    function findArr(type) {
      return type === 'std' ? state.tabs : state.customTabs;
    }

    function captureRects() {
      const rects = new Map();
      nav.querySelectorAll('.tab[data-tab]').forEach(function (el) {
        rects.set(el.dataset.tab, el.getBoundingClientRect());
      });
      return rects;
    }

    function playFlip(oldRects) {
      nav.querySelectorAll('.tab[data-tab]').forEach(function (el) {
        const id = el.dataset.tab;
        const oldR = oldRects.get(id);
        if (!oldR) return;
        const newR = el.getBoundingClientRect();
        const dx = oldR.left - newR.left;
        const dy = oldR.top - newR.top;
        if (dx === 0 && dy === 0) return;
        el.style.transition = 'none';
        el.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
        requestAnimationFrame(function () {
          el.style.transition = 'transform 220ms cubic-bezier(0.22, 0.61, 0.36, 1)';
          el.style.transform = '';
          setTimeout(function () {
            if (el) { el.style.transition = ''; el.style.transform = ''; }
          }, 260);
        });
      });
    }

    nav.addEventListener('pointerdown', function (e) {
      if (e.button && e.button !== 0) return;
      const tab = e.target.closest('.tab[data-tab]');
      if (!tab) return;
      if (e.target.closest('.tab-manage')) return;
      const id = tab.dataset.tab;
      const isStd = Array.isArray(state.tabs) && state.tabs.some(function (t) { return t.id === id; });
      const isCustom = Array.isArray(state.customTabs) && state.customTabs.some(function (t) { return t.id === id; });
      if (!isStd && !isCustom) return;
      dragging = tab;
      dragId = id;
      dragType = isStd ? 'std' : 'custom';
      activePointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      const r = tab.getBoundingClientRect();
      grabDX = e.clientX - r.left;
      grabDY = e.clientY - r.top;
      started = false;
    });

    document.addEventListener('pointermove', function (e) {
      if (!dragging || e.pointerId !== activePointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!started) {
        if (dist < THRESHOLD) return;
        started = true;
        // создаём ghost
        const r = dragging.getBoundingClientRect();
        ghost = dragging.cloneNode(true);
        ghost.style.position = 'fixed';
        ghost.style.left = r.left + 'px';
        ghost.style.top = r.top + 'px';
        ghost.style.width = r.width + 'px';
        ghost.style.height = r.height + 'px';
        ghost.style.zIndex = '9999';
        ghost.style.margin = '0';
        ghost.style.boxShadow = '0 12px 32px rgba(0,0,0,.5), 0 0 0 2px rgba(88,166,255,.4)';
        ghost.style.transform = 'scale(1.05)';
        ghost.style.transition = 'transform .15s ease, box-shadow .15s ease';
        ghost.style.opacity = '0.95';
        ghost.classList.add('dragging-ghost');
        document.body.appendChild(ghost);

        dragging.classList.add('dragging-tab');
        document.body.classList.add('tabs-dragging');
        if (navigator.vibrate) { try { navigator.vibrate(15); } catch (err) {} }
      }

      if (ghost) {
        ghost.style.left = (e.clientX - grabDX) + 'px';
        ghost.style.top = (e.clientY - grabDY) + 'px';
      }

      const el = document.elementFromPoint(e.clientX, e.clientY);
      const over = el ? el.closest('.tab[data-tab]') : null;
      if (!over || over === dragging) return;

            if (!Array.isArray(state.tabOrder)) state.tabOrder = [];
      const ia = state.tabOrder.indexOf(dragId);
      const ib = state.tabOrder.indexOf(over.dataset.tab);
      if (ia === -1 || ib === -1 || ia === ib) return;

            const oldRects = captureRects();
      const tmp = state.tabOrder[ia]; state.tabOrder[ia] = state.tabOrder[ib]; state.tabOrder[ib] = tmp;

      // НЕ пересоздаём DOM через renderTabs() — Safari рисует ghost-копии.
      // Вместо этого физически переставляем существующие кнопки в nav.
      // Так браузер не перерисовывает весь контейнер и ghost-иконки не появляются.
      const dragBtn = nav.querySelector('.tab[data-tab="' + CSS.escape(dragId) + '"]');
      const overBtn = nav.querySelector('.tab[data-tab="' + CSS.escape(over.dataset.tab) + '"]');
      if (dragBtn && overBtn && dragBtn !== overBtn) {
        const dragRect = dragBtn.getBoundingClientRect();
        const overRect = overBtn.getBoundingClientRect();
        // Если drag сейчас левее — вставляем после over. Иначе — перед.
        if (dragRect.left < overRect.left) {
          overBtn.parentNode.insertBefore(dragBtn, overBtn.nextSibling);
        } else {
          overBtn.parentNode.insertBefore(dragBtn, overBtn);
        }
      }
      playFlip(oldRects);
    });

    function endDrag(e) {
      if (!dragging || (e && e.pointerId !== activePointerId)) return;

      if (ghost) {
        // плавно уронить ghost в место placeholder'а
        const target = dragging.getBoundingClientRect();
        ghost.style.transition = 'left .2s cubic-bezier(0.22,0.61,0.36,1), top .2s cubic-bezier(0.22,0.61,0.36,1), width .2s, height .2s, transform .2s, opacity .2s';
        ghost.style.left = target.left + 'px';
        ghost.style.top = target.top + 'px';
        ghost.style.width = target.width + 'px';
        ghost.style.height = target.height + 'px';
        ghost.style.transform = 'scale(1)';
        ghost.style.opacity = '0';
        const g = ghost;
        setTimeout(function () { if (g && g.parentNode) g.parentNode.removeChild(g); }, 230);
        ghost = null;
      }

      if (started) {
        blockNextClick = true;
        setTimeout(function () { blockNextClick = false; }, 60);
        savePrefs();
      }

      if (dragging) dragging.classList.remove('dragging-tab');
      document.body.classList.remove('tabs-dragging');
      dragging = null;
      dragType = null;
      dragId = null;
      started = false;
      activePointerId = null;
    }

    document.addEventListener('pointerup', endDrag);
    document.addEventListener('pointercancel', endDrag);

            // === КЛИК + ДВОЙНОЙ КЛИК ===
    // switchTab() пересоздаёт DOM вкладок через renderTabs(), поэтому нативный
    // 'dblclick' не срабатывает (браузер требует два клика по ОДНОМУ узлу).
    // Ловим двойной клик вручную — по времени, на стабильном родителе nav.
    let _lastTabClickId = null;
    let _lastTabClickTs = 0;

    nav.addEventListener('click', function (e) {
      if (blockNextClick) {
        e.stopPropagation();
        e.preventDefault();
        blockNextClick = false;
        _lastTabClickId = null;
        _lastTabClickTs = 0;
        return;
      }
      const tabBtn = e.target.closest('.tab[data-tab]');
      if (!tabBtn) return;
      // уже в режиме переименования — не мешаем полям ввода
      if (tabBtn.querySelector('.tab-rename-icon')) return;

      const id = tabBtn.dataset.tab;
      const now = Date.now();

      if (_lastTabClickId === id && now - _lastTabClickTs < 400) {
        // ── ДВОЙНОЙ КЛИК ──
        _lastTabClickId = null;
        _lastTabClickTs = 0;
        e.stopPropagation();
        e.preventDefault();
        const stdTab = state.tabs.find(function (x) { return x.id === id; });
        const ct = !stdTab ? findCustomTab(id) : null;
        if (stdTab || ct) startInlineTabRename(tabBtn, stdTab, ct);
        return;
      }
      _lastTabClickId = id;
      _lastTabClickTs = now;
      // обычный клик — пусть долетит до обработчика switchTab
    }, true);

    // === ДВОЙНОЙ КЛИК — ПЕРЕИМЕНОВАНИЕ ===
          function startInlineTabRename(tabEl, stdTab, ct) {
      const isCustom = !!ct;
      const currentIcon = isCustom ? (ct.icon || '⭐') : (stdTab ? stdTab.icon : '⭐');
      const currentLabel = isCustom ? (ct.label || '') : (stdTab ? stdTab.label : '');
      const iconId = 'tab-rename-icon-' + Date.now().toString(36);

      tabEl.classList.add('renaming');
      tabEl.innerHTML =
        '<input type="text" id="' + iconId + '" class="tab-rename-icon" value="' + escapeHtml(currentIcon) + '" maxlength="4" readonly title="Клик — выбрать эмодзи" />' +
        '<input type="text" class="tab-rename-label" value="' + escapeHtml(currentLabel) + '" maxlength="30" />' +
        '<span class="tab-rename-actions">' +
          '<button type="button" class="ok" title="Сохранить">✓</button>' +
          '<button type="button" class="cancel" title="Отмена">✕</button>' +
        '</span>';
      // Прокручиваем нижнюю навигацию к этой вкладке, чтобы редактор
      // целиком поместился в видимую область экрана телефона.
      setTimeout(function () {
        try {
          tabEl.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
        } catch (e) {
          try { tabEl.scrollIntoView(false); } catch (e2) {}
        }
      }, 30);

      const iconInput = tabEl.querySelector('.tab-rename-icon');
      const labelInput = tabEl.querySelector('.tab-rename-label');
      const okBtn = tabEl.querySelector('.tab-rename-actions .ok');
      const cancelBtn = tabEl.querySelector('.tab-rename-actions .cancel');

      let finished = false;
      let pickerOpen = false;

      // сразу фокус на название, текст выделен — можно печатать
      setTimeout(function () { labelInput.focus(); labelInput.select(); }, 30);

      function finish(save) {
        if (finished) return;
        finished = true;
        if (save) {
          const newIcon = keepOnlyEmoji(iconInput.value) || currentIcon || '⭐';
          const newLabel = labelInput.value.trim();
          if (newLabel) {
            if (isCustom && ct) {
              ct.icon = newIcon;
              ct.label = newLabel.slice(0, 30);
            } else if (stdTab) {
              stdTab.icon = newIcon;
              stdTab.label = newLabel.slice(0, 30);
            }
            savePrefs();
          }
        }
        renderTabs();
      }

      // ── кнопки ✓ и ✕ ──
      // preventDefault на pointerdown — чтобы кнопка НЕ забирала фокус у поля
      // (иначе сработает blur поля и редактор закроется раньше времени)
      okBtn.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); });
      okBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        finish(true);
      });

      cancelBtn.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); });
      cancelBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        finish(false);
      });

      // ── клик по иконке → пикер эмодзи ──
      iconInput.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); });
      iconInput.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        pickerOpen = true;
        openEmojiPicker(iconId);
      });

      // ждём закрытия пикера и возвращаем фокус в название
      const watchId = setInterval(function () {
        if (!pickerOpen) { clearInterval(watchId); return; }
        const modal = document.getElementById('emojiPickerModal');
        if (modal && modal.hidden) {
          pickerOpen = false;
          clearInterval(watchId);
          if (!finished) {
            setTimeout(function () { if (!finished) labelInput.focus(); }, 30);
          }
        }
      }, 100);

      // ── клавиши для десктопа ──
      function handleKey(ev) {
        if (ev.key === 'Enter') { ev.preventDefault(); finish(true); }
        else if (ev.key === 'Escape') { ev.preventDefault(); finish(false); }
      }
      labelInput.addEventListener('keydown', handleKey);
      iconInput.addEventListener('keydown', handleKey);

      // ── клик мимо вкладки → сохранить (аккуратно, чтобы не мешало кнопкам) ──
      labelInput.addEventListener('blur', function () {
        setTimeout(function () {
          if (finished || pickerOpen) return;
          const ae = document.activeElement;
          // если фокус всё ещё внутри нашей вкладки (кнопка/иконка) — не сохраняем
          if (ae && tabEl.contains(ae)) return;
          finish(true);
        }, 180);
      });
    }

}


  function renderTabs() {
    if (!Array.isArray(state.tabs)) state.tabs = mergeTabs(null);

    // Собираем все ID (стандартные + свои)
    const stdIds = state.tabs.map(function (t) { return t.id; });
    const customIds = (state.customTabs || []).map(function (t) { return t.id; });
    const allIds = stdIds.concat(customIds);

    // Инициализируем tabOrder при первом запуске
    if (!Array.isArray(state.tabOrder) || !state.tabOrder.length) {
      state.tabOrder = DEFAULT_TABS.map(function (t) { return t.id; });
    }
    // Добавляем недостающие
    allIds.forEach(function (id) {
      if (state.tabOrder.indexOf(id) === -1) state.tabOrder.push(id);
    });
    // Убираем удалённые
    const validSet = {};
    allIds.forEach(function (id) { validSet[id] = true; });
    state.tabOrder = state.tabOrder.filter(function (id) { return validSet[id]; });

    // Видимые для переключения
    const visibleIds = state.tabOrder.filter(function (id) {
      const std = state.tabs.find(function (t) { return t.id === id; });
      if (std) return std.visible;
      const ct = (state.customTabs || []).find(function (t) { return t.id === id; });
      return !!ct;
    });
    if (visibleIds.length && visibleIds.indexOf(state.ui.tab) === -1) {
      state.ui.tab = visibleIds[0];
    }

    const nav = document.getElementById('tabsNav');
    if (nav) {
      let html = '';
      state.tabOrder.forEach(function (id) {
        const t = state.tabs.find(function (x) { return x.id === id; });
        if (t) {
          if (!t.visible) return;
          const sel = state.ui.tab === t.id ? 'true' : 'false';
          const counter = (t.hasCounter && t.counterId)
            ? '<span class="tab-count" id="' + t.counterId + '">0</span>'
            : '';
          html += '<button class="tab" role="tab" data-tab="' + escapeHtml(t.id) + '" aria-selected="' + sel + '">' +
            '<span class="tab-icon">' + escapeHtml(t.icon) + '</span>' +
            '<span class="tab-label">' + escapeHtml(t.label) + '</span>' +
            counter +
          '</button>';
          return;
        }
        const ct = (state.customTabs || []).find(function (x) { return x.id === id; });
        if (ct) {
          const sel = state.ui.tab === ct.id ? 'true' : 'false';
          const n = (ct.cards || []).filter(function (c) { return !c.done; }).length;
          const counter = n > 0 ? '<span class="tab-count">' + n + '</span>' : '';
          html += '<button class="tab" role="tab" data-tab="' + escapeHtml(ct.id) + '" aria-selected="' + sel + '">' +
            '<span class="tab-icon">' + escapeHtml(ct.icon || '⭐') + '</span>' +
            '<span class="tab-label">' + escapeHtml(ct.label) + '</span>' +
            counter +
          '</button>';
        }
      });
      html += '<button type="button" class="tab tab-manage" id="customTabAddBtn" title="Создать свою вкладку">' +
        '<span class="tab-icon">＋</span><span class="tab-label">Своя вкладка</span>' +
      '</button>';
            html += '<button type="button" class="tab tab-manage" id="tabsManageBtn" title="Управление вкладками">' +
        '<span class="tab-icon">⚙</span><span class="tab-label">Вкладки</span>' +
      '</button>';
      html += '<button type="button" class="tab tab-manage" id="trashTabBtn" title="Корзина">' +
        '<span class="tab-icon">🗑</span><span class="tab-label">Корзина</span>' +
        '<span class="tab-count" id="trashTabCount" style="display:none;">0</span>' +
      '</button>';
           nav.innerHTML = html;
      // Сброс горизонтального скролла — устраняет ghost иконок в Safari
      try { nav.scrollLeft = nav.scrollLeft; } catch (e) {}

      // Автоматически подтягиваем активную вкладку в зону видимости,
      // чтобы при нажатии на крайнюю иконку рядом появлялись соседние
      var activeTab = nav.querySelector('.tab[data-tab][aria-selected="true"]');
      if (activeTab) {
        try {
          activeTab.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
        } catch (e) {}
      }

            nav.querySelectorAll('.tab[data-tab]').forEach(function (b) {
        b.addEventListener('click', function (ev) {
          // если в этой вкладке активен режим переименования — не переключаемся
          if (b.querySelector('.tab-rename-icon')) {
            ev.stopPropagation();
            return;
          }
          switchTab(b.dataset.tab);
        });
      });
      const mb = document.getElementById('tabsManageBtn');
      if (mb) mb.addEventListener('click', openTabsManageModal);
      const ctab = document.getElementById('customTabAddBtn');
      if (ctab) ctab.addEventListener('click', function () { openCustomTabModal(null); });
    }

    document.getElementById('viewActive').hidden = state.ui.tab !== 'active';
    document.getElementById('viewArchive').hidden = state.ui.tab !== 'archive';
    document.getElementById('viewLiterature').hidden = state.ui.tab !== 'literature';
    document.getElementById('viewToday').hidden = state.ui.tab !== 'today';
    document.getElementById('viewNotes').hidden = state.ui.tab !== 'notes';
    document.getElementById('viewHabits').hidden = state.ui.tab !== 'habits';
    document.getElementById('viewAnalytics').hidden = state.ui.tab !== 'analytics';
    const customActive = Array.isArray(state.customTabs) && state.customTabs.some(function (t) { return t.id === state.ui.tab; });
    document.getElementById('viewCustom').hidden = !customActive;
    if (customActive) renderCustomView(state.ui.tab);

    document.querySelectorAll('[data-lit-tab]').forEach(function (b) { b.classList.toggle('active', b.dataset.litTab === state.ui.litTab); });
    document.getElementById('articlesPanel').hidden = state.ui.litTab !== 'articles';
    document.getElementById('booksPanel').hidden = state.ui.litTab !== 'books';
    applyActiveTab();
  }
          function switchTab(tab) {
    if (!state.scrollPositions) state.scrollPositions = {};
    state.scrollPositions[state.ui.tab] = window.scrollY || window.pageYOffset || 0;
    if (state.ui.tab === 'literature') saveCurrentPosition(state.ui.litTab);
    state.ui.tab = tab;
    savePrefs();
    // renderTabs() обязателен: он обновляет aria-selected, показывает/скрывает
    // нужные viewXxx, перерисовывает счётчики. Ghost-иконки в Safari теперь
    // предотвращаются CSS-свойствами contain:layout paint и isolation:isolate
    // на .tabs — двойная перестройка DOM их не провоцирует.
    renderTabs();
    if (tab === 'today') renderDashboard();
    if (tab === 'habits') renderHabits();
    if (tab === 'notes') { renderNotesList(); renderNoteEditor(); }
    if (tab === 'archive') renderArchive();
    if (tab === 'analytics') renderAnalytics();
    if (tab === 'literature') { SECTIONS.forEach(function (s) { renderMeta(s); renderList(s); applyListVisibility(s); }); }

    var saved = state.scrollPositions[tab] || 0;
    var isMobile = window.matchMedia('(max-width: 700px)').matches;

    // Небольшая пауза, чтобы DOM вкладки успел перерисоваться
    setTimeout(function () {
      if (saved > 0) {
        // Пользователь уже был на этой вкладке и куда-то прокрутил — вернём туда
        window.scrollTo(0, saved);
      } else if (isMobile) {
        // Первый переход на вкладку на телефоне — сразу к её контенту,
        // минуя шапку и быстрый ввод. Пользователь сразу видит то, ради чего
        // нажал на иконку внизу.
        var main = document.querySelector('.app-main');
        if (main) {
          var top = main.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: Math.max(0, top - 6), behavior: 'auto' });
        }
      } else {
        // На ПК — как было: наверх
        window.scrollTo(0, 0);
      }
    }, 30);
  }
  function switchActiveTab(t) {
    state.ui.activeTab = t;
    savePrefs();
    applyActiveTab();
  }
  function applyActiveTab() {
    const view = document.getElementById('viewActive');
    if (!view) return;
    const tab = state.ui.activeTab || 'goals';
    view.dataset.activeTab = tab;
    document.querySelectorAll('[data-active-tab-btn]').forEach(function (b) {
      b.classList.toggle('active', b.dataset.activeTabBtn === tab);
    });
  }
  function switchLitTab(t) { if (state.ui.litTab === t) return; saveCurrentPosition(state.ui.litTab); state.ui.litTab = t; savePrefs(); renderTabs(); }

  function computeStats() { let goalsTotal = 0, goalsDone = 0, tasksTotal = 0, tasksDone = 0; state.goals.forEach(function (g) { if (!g.isInbox) { goalsTotal++; if (g.archivedAt) goalsDone++; } g.tasks.forEach(function (t) { tasksTotal++; if (t.archivedAt || t.done) tasksDone++; }); }); return { goalsTotal: goalsTotal, goalsDone: goalsDone, tasksTotal: tasksTotal, tasksDone: tasksDone, goalsPct: goalsTotal ? Math.round(goalsDone / goalsTotal * 100) : 0, tasksPct: tasksTotal ? Math.round(tasksDone / tasksTotal * 100) : 0 }; }
  function setStatNumbers(gd, gt, td, tt) { document.getElementById('statGoalsCount').innerHTML = gd + '<span class="of">/' + gt + '</span>'; document.getElementById('statTasksCount').innerHTML = td + '<span class="of">/' + tt + '</span>'; }
  function setStatBar(fill, pct, p) { const c = Math.max(0, Math.min(100, p)); fill.style.width = c + '%'; pct.style.left = Math.max(6, Math.min(94, c)) + '%'; pct.textContent = c + '%'; }
    function renderStats() {
    const el = document.getElementById('statGoalsCount');
    if (!el) return; // блок статистики удалён
    const s = computeStats();
    setStatNumbers(s.goalsDone, s.goalsTotal, s.tasksDone, s.tasksTotal);
    setStatBar(document.getElementById('statGoalsFill'), document.getElementById('statGoalsPct'), s.goalsPct);
    setStatBar(document.getElementById('statTasksFill'), document.getElementById('statTasksPct'), s.tasksPct);
  }

  function visibleGoals() { return state.goals.filter(function (g) { return !g.archivedAt && !g.isInbox; }); }
  function renderGoals() {
    const list = document.getElementById('goalsList');
    const col = document.getElementById('goalsColumn');
    const st = col ? col.scrollTop : 0;
    let goals = visibleGoals();
    goals.sort(function (a, b) { if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1; return (b.createdAt || 0) - (a.createdAt || 0); });
	
    // === ДЕРЕВО ЦЕЛЕЙ ===
    // Пересобираем плоский список в иерархию: сначала корневые цели, потом их дети.
    // Цели сортируются по pinned и createdAt — сохраняем этот порядок на каждом уровне.
    // Циклы (parentId ссылается на себя или потомка) обрезаются автоматически.
    const goalsMap = {};
    goals.forEach(function (g) { goalsMap[g.id] = g; });

    // Найти корень: если у цели parentId ссылается на цель, которой нет в списке (удалена или архивирована),
    // такая цель становится корневой. Так мы не теряем сирот.
    goals.forEach(function (g) {
      if (g.parentId && !goalsMap[g.parentId]) g._effectiveParentId = null;
      else g._effectiveParentId = g.parentId || null;
    });

    // Защита от циклов: если у цели родитель — она сама или её потомок, обнуляем.
    // Также вычисляем уровень вложенности (depth).
    function computeDepth(g, seen) {
      if (!g._effectiveParentId) return 0;
      if (seen[g.id]) { g._effectiveParentId = null; return 0; } // цикл
      seen[g.id] = true;
      const parent = goalsMap[g._effectiveParentId];
      if (!parent) { g._effectiveParentId = null; return 0; }
      return 1 + computeDepth(parent, seen);
    }
    goals.forEach(function (g) { g._depth = computeDepth(g, {}); });

    // Группируем детей по родителю (с учётом исправленного parentId)
    const childrenByParent = {};
    const roots = [];
    goals.forEach(function (g) {
      const pid = g._effectiveParentId;
      if (!pid) { roots.push(g); return; }
      if (!childrenByParent[pid]) childrenByParent[pid] = [];
      childrenByParent[pid].push(g);
    });

    // Рекурсивный обход: строим плоский массив в порядке «родитель → его дети → следующий родитель»
    const ordered = [];
    function walkNode(g) {
      ordered.push(g);
      const children = childrenByParent[g.id];
      if (children && children.length) {
        // сортируем детей так же: pinned вперёд, потом по createdAt убыванию
        children.sort(function (a, b) { if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1; return (b.createdAt || 0) - (a.createdAt || 0); });
        children.forEach(walkNode);
      }
    }
    roots.forEach(walkNode);
    goals = ordered;

    // Считаем, у какой цели есть дети — чтобы показать стрелку/плюс
    const hasChildren = {};
    goals.forEach(function (g) {
      if (g._effectiveParentId) hasChildren[g._effectiveParentId] = true;
    });
    if (!goals.length) { list.innerHTML = '<div class="empty">Пока нет активных целей.</div>'; return; }
    let html = goals.map(function (g) {
      const isCollapsed = !!state.collapsed[g.id];
      const activeTasks = g.tasks.filter(function (t) { return !t.archivedAt; });
      const total = activeTasks.length;
      const done = activeTasks.filter(function (t) { return t.done; }).length;
      const overdueCount = activeTasks.filter(function (t) { return isOverdue(t); }).length;
      const prog = total ? Math.round(done / total * 100) : 0;
      const allDone = total > 0 && done === total;
      const hasOverdue = overdueCount > 0;
      const selected = !!state.massSelectedGoals[g.id];
      const metaParts = [];
      if (g.deadline) metaParts.push('до ' + relativeDate(g.deadline));
      metaParts.push(PRIORITY_LABEL[g.priority] || '—');
      if (total) metaParts.push(done + '/' + total + ' (' + prog + '%)');
      if (hasOverdue) metaParts.push('<span class="badge-overdue">⚠ ' + overdueCount + '</span>');
      const sortedTasks = activeTasks.slice().sort(function (a, b) { if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1; return 0; });
      const tasksHtml = sortedTasks.map(function (t) {
        const od = isOverdue(t);
        const soon = isUpcomingSoon(t);
        const meta = [PRIORITY_LABEL[t.priority] || '—'];
        if (t.deadline) meta.push(od ? '<span class="overdue">' + relativeDate(t.deadline) + '</span>' : (soon ? '<span class="soon">' + relativeDate(t.deadline) + '</span>' : relativeDate(t.deadline)));
        else meta.push('<span class="no-deadline">без срока</span>');
        if (t.repeat) { const rmap = { daily: 'ежедн', weekdays: 'будни', weekly: 'нед', monthly: 'мес' }; meta.push('<span class="repeat-badge">🔁 ' + rmap[t.repeat.type] + '</span>'); }
        if (t.tags && t.tags.length) t.tags.forEach(function (tag) { meta.push('<span class="tag">#' + escapeHtml(tag) + '</span>'); });
              return '<div class="task ' + (t.done ? 'done' : '') + (t.pinned ? ' pinned' : '') + '" data-goal-id="' + escapeHtml(g.id) + '" data-task-id="' + escapeHtml(t.id) + '"><input type="checkbox" ' + (t.done ? 'checked' : '') + ' data-action="toggle-task" data-goal-id="' + escapeHtml(g.id) + '" data-task-id="' + escapeHtml(t.id) + '" /><div class="task-content"><div class="task-text">' + escapeHtml(t.text) + '</div><div class="task-meta">' + meta.join(' • ') + '</div></div><div class="task-actions"><button type="button" class="icon-btn' + (t.pinned ? ' pinned' : '') + '" data-action="pin-task" data-goal-id="' + escapeHtml(g.id) + '" data-task-id="' + escapeHtml(t.id) + '" title="Закрепить">📌</button><button type="button" class="icon-btn" data-action="duplicate-task" data-goal-id="' + escapeHtml(g.id) + '" data-task-id="' + escapeHtml(t.id) + '" title="Дублировать">📋</button><button type="button" class="icon-btn" data-action="edit-task" data-goal-id="' + escapeHtml(g.id) + '" data-task-id="' + escapeHtml(t.id) + '" title="Редактировать">✎</button>' + (t.done ? '<button type="button" class="icon-btn" data-action="archive-task" data-goal-id="' + escapeHtml(g.id) + '" data-task-id="' + escapeHtml(t.id) + '" title="В архив">📦</button>' : '') + '<button type="button" class="icon-btn" data-action="delete-task" data-goal-id="' + escapeHtml(g.id) + '" data-task-id="' + escapeHtml(t.id) + '" title="Удалить">✕</button></div></div>';
      }).join('');
      const relatedSnippets = state.snippets.filter(function (s) { return s.goalId === g.id; });
      const relatedNotes = state.notes.filter(function (n) { return n.goalId === g.id; });
      const quotesHtml = relatedSnippets.length ? '<div class="goal-quotes"><b>📄 Цитаты (' + relatedSnippets.length + '):</b>' + relatedSnippets.slice(0, 3).map(function (s) { return '<div class="goal-quote-item" data-action="open-snippet-from-goal" data-id="' + escapeHtml(s.id) + '">' + escapeHtml(s.text.slice(0, 80)) + (s.text.length > 80 ? '…' : '') + '</div>'; }).join('') + '</div>' : '';
      const notesHtml = relatedNotes.length ? '<div class="goal-quotes"><b>📝 Заметки (' + relatedNotes.length + '):</b>' + relatedNotes.slice(0, 3).map(function (n) { return '<div class="goal-quote-item" data-action="open-note-from-goal" data-id="' + escapeHtml(n.id) + '">' + escapeHtml(n.title) + '</div>'; }).join('') + '</div>' : '';
      const journalSorted = (g.journal || []).slice().sort(function (a, b) { return b.ts - a.ts; });
      const journalHtml = '<div class="goal-journal">' +
        '<div style="font-weight:700; color:var(--muted); margin-bottom:4px;">📔 Журнал' + (journalSorted.length ? ' (' + journalSorted.length + ')' : '') + '</div>' +
        (journalSorted.length ? journalSorted.slice(0, 3).map(function (e) { return '<div class="goal-journal-item"><span>' + escapeHtml(e.text) + '</span><span class="ts">' + formatDateTime(e.ts) + '</span></div>'; }).join('') : '<div style="color:var(--muted);font-style:italic;font-size:10px;">Пока пусто. Откройте ✎, чтобы добавить.</div>') +
        '</div>';
            const goalTagsHtml = (g.tags && g.tags.length) ? '<div class="goal-tags">' + g.tags.map(function (tg) { return '<span class="goal-tag" data-action="filter-goal-tag" data-tag="' + escapeHtml(tg) + '">#' + escapeHtml(tg) + '</span>'; }).join('') + '</div>' : '';
      const bodyHtml = isCollapsed ? '' : '<div class="goal-body">' + (g.description ? '<div class="goal-desc">' + escapeHtml(g.description) + '</div>' : '') + goalTagsHtml + (allDone ? '<div class="goal-hint">Все задачи выполнены — можно завершить ✓</div>' : (total === 0 ? '<div class="goal-hint">Нет задач — можно завершить сразу</div>' : '')) + '<div class="goal-progress"><div class="bar-container"><div class="bar" style="width:' + prog + '%"></div></div><span>' + done + '/' + total + '</span></div>' + quotesHtml + notesHtml + journalHtml + '<div class="goal-tasks">' + (tasksHtml || '<div class="goal-empty">Нет задач.</div>') + '</div><form class="inline-task-form" data-goal-id="' + escapeHtml(g.id) + '"><input type="text" placeholder="Новая задача..." /><input type="date" /><button type="submit" class="secondary">+</button></form></div>';
            const depth = g._depth || 0;
      const hasKids = !!hasChildren[g.id];
      const goalCls = 'goal'
        + (allDone ? ' all-done' : '')
        + (hasOverdue && !allDone ? ' has-overdue' : '')
        + (g.pinned ? ' pinned' : '')
        + (selected ? ' selected' : '')
        + (depth > 0 ? ' goal-child' : '')
        + (hasKids ? ' goal-has-children' : '');
      const indentStyle = depth > 0 ? ' style="margin-left:' + (depth * 22) + 'px;"' : '';
      const massCheckbox = state.massModeGoals ? '<label class="goal-mass-check-wrap"><input type="checkbox" class="goal-mass-check" data-action="mass-check-goal" data-goal-id="' + escapeHtml(g.id) + '" ' + (selected ? 'checked' : '') + ' /></label>' : '';
           return '<article class="' + goalCls + '" data-goal-id="' + escapeHtml(g.id) + '"' + indentStyle + '><div class="goal-head">' + massCheckbox + '<button type="button" class="goal-toggle" data-action="toggle-goal" data-goal-id="' + escapeHtml(g.id) + '" aria-expanded="' + (!isCollapsed) + '"><span class="chev">' + (hasKids ? '⤵' : '▶') + '</span><span class="goal-toggle-text"><span class="goal-name">' + escapeHtml(g.title) + '</span><span class="goal-meta">' + metaParts.join(' • ') + '</span></span></button><div class="goal-actions"><button type="button" class="icon-btn' + (g.pinned ? ' pinned' : '') + '" data-action="pin-goal" data-goal-id="' + escapeHtml(g.id) + '" title="Закрепить">📌</button><button type="button" class="icon-btn' + (allDone ? ' success done-hint' : '') + (total === 0 ? ' success' : '') + '" data-action="archive-goal" data-goal-id="' + escapeHtml(g.id) + '" title="Завершить">✓</button><button type="button" class="icon-btn" data-action="duplicate-goal" data-goal-id="' + escapeHtml(g.id) + '" title="Дублировать">📋</button><button type="button" class="icon-btn" data-action="edit-goal" data-goal-id="' + escapeHtml(g.id) + '" title="Редактировать">✎</button><button type="button" class="icon-btn" data-action="delete-goal" data-goal-id="' + escapeHtml(g.id) + '" title="Удалить">✕</button></div></div>' + bodyHtml + '</article>';
    }).join('');
    const massCount = Object.keys(state.massSelectedGoals).length;
    if (state.massModeGoals && massCount > 0) {
      html += '<div class="goal-mass-bar"><span>Выбрано целей: ' + massCount + '</span><div class="mass-actions">' +
        '<button type="button" data-action="mass-goals-archive">📦 В архив</button>' +
        '<button type="button" class="danger" data-action="mass-goals-delete">🗑 Удалить</button>' +
        '</div></div>';
    }
    list.innerHTML = html;
    if (col) col.scrollTop = st;
    if (refocusInlineTaskFor) { const inp = list.querySelector('.inline-task-form[data-goal-id="' + CSS.escape(refocusInlineTaskFor) + '"] input[type="text"]'); if (inp) inp.focus(); refocusInlineTaskFor = null; }
  }

    function changeTaskStatus(goalId, taskId, newStatus) {
    const g = findGoal(goalId);
    if (!g) return;
    const t = g.tasks.find(function (x) { return x.id === taskId; });
    if (!t) return;
    if (t.status === newStatus && (newStatus !== 'done') === !t.done) return;
    t.status = newStatus;
    if (newStatus === 'done') {
      if (!t.done) { t.done = true; t.doneAt = Date.now(); }
    } else {
      if (t.done) { t.done = false; t.doneAt = null; }
    }
    saveData();
    render();
    const labels = { todo: 'К выполнению', doing: 'В работе', blocked: 'Заблокировано', done: 'Готово' };
    showToast('→ ' + labels[newStatus], 'ok');
  }

function renderKanbanHtml(items) {
    const cols = [
      { key: 'todo', label: '📋 К выполнению' },
      { key: 'doing', label: '⚡ В работе' },
      { key: 'blocked', label: '🚫 Заблокировано' },
      { key: 'done', label: '✅ Готово' }
    ];
    const byStatus = { todo: [], doing: [], blocked: [], done: [] };
    items.forEach(function (it) {
      const st = it.task.done ? 'done' : (it.task.status || 'todo');
      (byStatus[st] || byStatus.todo).push(it);
    });
    return '<div class="kanban-board">' + cols.map(function (c) {
      const arr = byStatus[c.key] || [];
      return '<div class="kanban-col" data-status="' + c.key + '">' +
        '<div class="kanban-col-head"><span>' + c.label + '</span><span class="kanban-col-count">' + arr.length + '</span></div>' +
        (arr.length ? arr.map(renderKanbanCard).join('') : '<div class="kanban-empty">Пусто</div>') +
      '</div>';
    }).join('') + '</div>';
  }

  function renderKanbanCard(it) {
    const t = it.task, g = it.goal;
    const od = isOverdue(t);
    const soon = isUpcomingSoon(t);
    const meta = [];
    if (!g.isInbox) meta.push('<span class="tag">' + escapeHtml(g.title) + '</span>');
    meta.push(PRIORITY_LABEL[t.priority] || '—');
    if (t.deadline) {
      if (od) meta.push('<span class="overdue">' + relativeDate(t.deadline) + '</span>');
      else if (soon) meta.push('<span class="soon">' + relativeDate(t.deadline) + '</span>');
      else meta.push(relativeDate(t.deadline));
    }
      return '<div class="kanban-card' + (t.done ? ' done' : '') + '" data-action="kanban-open-task" data-goal-id="' + escapeHtml(g.id) + '" data-task-id="' + escapeHtml(t.id) + '">' +
      '<div class="kanban-card-row">' +
        '<input type="checkbox" class="kanban-card-check" data-action="kanban-toggle-task" data-goal-id="' + escapeHtml(g.id) + '" data-task-id="' + escapeHtml(t.id) + '" ' + (t.done ? 'checked' : '') + ' />' +
        '<div class="kanban-card-text">' + escapeHtml(t.text) + '</div>' +
      '</div>' +
      '<div class="kanban-card-meta">' + meta.join(' • ') + '</div>' +
    '</div>';
  }

  function renderEisenhowerHtml(items) {
    const tomorrowISO = (function () { const d = new Date(); d.setDate(d.getDate() + 1); return dateToISO(d); })();
    const quads = {
      q1: { label: '🔥 Важно и срочно', sub: 'сделать сейчас', items: [] },
      q2: { label: '📅 Важно, не срочно', sub: 'запланировать', items: [] },
      q3: { label: '⚡ Срочно, не важно', sub: 'делегировать', items: [] },
      q4: { label: '🌿 Не важно, не срочно', sub: 'отложить', items: [] }
    };
    items.forEach(function (it) {
      const t = it.task;
      const urgent = !t.done && (isOverdue(t) || (t.deadline && t.deadline <= tomorrowISO));
      const important = t.priority === 'high';
      let q;
      if (important && urgent) q = 'q1';
      else if (important && !urgent) q = 'q2';
      else if (!important && urgent) q = 'q3';
      else q = 'q4';
      quads[q].items.push(it);
    });
    return '<div class="eisenhower-board">' + ['q1', 'q2', 'q3', 'q4'].map(function (qk) {
      const q = quads[qk];
      return '<div class="eisenhower-quad" data-quad="' + qk + '">' +
        '<div class="eisenhower-quad-head"><span>' + q.label + '<span class="eisenhower-quad-sub">· ' + q.sub + '</span></span><span class="kanban-col-count">' + q.items.length + '</span></div>' +
        (q.items.length ? q.items.map(renderKanbanCard).join('') : '<div class="kanban-empty">Пусто</div>') +
      '</div>';
    }).join('') + '</div>';
  }

  function renderTasks() {
    const list = document.getElementById('tasksList');
    const col = document.getElementById('tasksColumn');
    const st = col ? col.scrollTop : 0;
    const ui = state.ui;
    const q = (ui.search || '').trim().toLowerCase();
    const selectedDate = state.calSelectedDate;
    let allItems = [];
    state.goals.forEach(function (g) { if (g.archivedAt) return; g.tasks.forEach(function (t) { if (!t.archivedAt) allItems.push({ goal: g, task: t }); }); });
    let items = selectedDate ? allItems.filter(function (it) { return it.task.deadline === selectedDate; }) : allItems.slice();
    items = items.filter(function (it) {
      const t = it.task;
      if (ui.filter === 'active' && t.done) return false;
      if (ui.filter === 'done' && !t.done) return false;
      if (ui.filter === 'overdue' && !isOverdue(t)) return false;
      if (state.tagFilter && (t.tags || []).indexOf(state.tagFilter) === -1) return false;
      if (q) return (t.text + ' ' + it.goal.title + ' ' + (t.tags || []).join(' ')).toLowerCase().indexOf(q) !== -1;
      return true;
    });
    items.sort(function (a, b) {
      if (!!a.task.pinned !== !!b.task.pinned) return a.task.pinned ? -1 : 1;
      if (a.task.done !== b.task.done) return a.task.done ? 1 : -1;
      if (ui.sort === 'priority') { const pa = PRIORITY_ORDER[a.task.priority], pb = PRIORITY_ORDER[b.task.priority]; if (pa !== pb) return (pa == null ? 1 : pa) - (pb == null ? 1 : pb); return (a.task.createdAt || 0) - (b.task.createdAt || 0); }
      if (ui.sort === 'created') return (b.task.createdAt || 0) - (a.task.createdAt || 0);
      const da = a.task.deadline || '', db = b.task.deadline || '';
      if (da && !db) return -1; if (!da && db) return 1;
      if (da && db && da !== db) return da < db ? -1 : 1;
      return (PRIORITY_ORDER[a.task.priority] || 1) - (PRIORITY_ORDER[b.task.priority] || 1);
    });
    const titleEl = document.getElementById('tasksColumnTitle');
    if (titleEl) {
      let title = selectedDate ? '✓ Задачи на ' + formatDate(selectedDate) : '✓ Все задачи';
      if (state.tagFilter) title += ' · #' + state.tagFilter;
      titleEl.textContent = title;
    }
    const banner = document.getElementById('dateFilterBanner');
    const bannerText = document.getElementById('dateFilterText');
    if (banner && bannerText) {
      if (selectedDate) {
        const totalOnDate = allItems.filter(function (it) { return it.task.deadline === selectedDate; }).length;
        bannerText.innerHTML = '📅 Показаны задачи только на <b>' + formatDate(selectedDate) + '</b> · найдено: <b>' + totalOnDate + '</b>';
        banner.hidden = false;
      } else banner.hidden = true;
    }

        if (state.tasksGrouping === 'kanban') {
      list.innerHTML = renderKanbanHtml(items);
      if (col) col.scrollTop = st;
      return;
    }

    // Если выбрана конкретная дата — покажем карточки своих вкладок на эту дату
    if (selectedDate) {
      const cardsOnDate = [];
      if (Array.isArray(state.customTabs)) {
        state.customTabs.forEach(function (tab) {
          (tab.cards || []).forEach(function (c) {
            if (c.done) return;
            if (c.dueDate === selectedDate) cardsOnDate.push({ tab: tab, card: c });
          });
        });
      }
      if (cardsOnDate.length) {
        let cardsHtml = '<div class="tasks-group"><div class="tasks-group-title">🗂 Карточки (' + cardsOnDate.length + ')</div>';
        cardsOnDate.forEach(function (it) {
          const c = it.card, tab = it.tab;
          const meta = [];
          meta.push('<span class="tag">' + escapeHtml((tab.icon || '⭐') + ' ' + (tab.label || '')) + '</span>');
          if (c.price) meta.push('💰 ' + escapeHtml(c.price));
          if (c.address) meta.push('📍 ' + escapeHtml(c.address));
          cardsHtml += '<div class="task" data-tab-id="' + escapeHtml(tab.id) + '" data-card-id="' + escapeHtml(c.id) + '">' +
            '<div class="task-content"><div class="task-text">' + escapeHtml(c.text) + '</div><div class="task-meta">' + meta.join(' • ') + '</div></div>' +
            '<div class="task-actions">' +
              '<button type="button" class="icon-btn" data-action="custom-card-open-from-tasks" data-tab-id="' + escapeHtml(tab.id) + '" data-card-id="' + escapeHtml(c.id) + '" title="Открыть">✎</button>' +
            '</div>' +
          '</div>';
        });
        cardsHtml += '</div>';
        list.innerHTML = cardsHtml + (items.length ? '<div class="tasks-group"><div class="tasks-group-title">✓ Задачи (' + items.length + ')</div></div>' : '');
      }
    }

    if (!items.length) {
      if (selectedDate) {
        const hasOther = allItems.length > 0;
        list.innerHTML = '<div class="empty-with-action">На ' + formatDate(selectedDate) + ' задач нет.' + (hasOther ? '<br><button type="button" data-action="clear-date-filter">Показать все задачи (' + allItems.length + ')</button>' : '') + '</div>';
      } else list.innerHTML = '<div class="empty">' + (state.goals.length ? 'Нет задач по фильтру.' : 'Пока нет задач. Добавьте первую!') + '</div>';
      if (col) col.scrollTop = st;
      return;
    }
    let html = '';
    const groupByDate = state.tasksGrouping === 'date' && !selectedDate;
    if (groupByDate) {
      const groups = { overdue: [], today: [], tomorrow: [], week: [], later: [], noDeadline: [] };
      const today = dateToISO(new Date());
      const tomorrow = (function () { const d = new Date(); d.setDate(d.getDate() + 1); return dateToISO(d); })();
      const weekEnd = (function () { const d = new Date(); d.setDate(d.getDate() + 7); return dateToISO(d); })();
      items.forEach(function (it) { const t = it.task; if (!t.deadline) { groups.noDeadline.push(it); return; } if (isOverdue(t)) groups.overdue.push(it); else if (t.deadline === today) groups.today.push(it); else if (t.deadline === tomorrow) groups.tomorrow.push(it); else if (t.deadline <= weekEnd) groups.week.push(it); else groups.later.push(it); });
      const defs = [{ key: 'overdue', label: '⚠ Просрочено', cls: 'overdue' }, { key: 'today', label: '📌 Сегодня' }, { key: 'tomorrow', label: '📅 Завтра' }, { key: 'week', label: '📆 На этой неделе' }, { key: 'later', label: '🗓 Позже' }, { key: 'noDeadline', label: '— Без срока' }];
      defs.forEach(function (def) { const arr = groups[def.key]; if (!arr.length) return; html += '<div class="tasks-group"><div class="tasks-group-title ' + (def.cls || '') + '">' + def.label + ' (' + arr.length + ')</div>'; arr.forEach(function (it) { html += renderTaskItem(it); }); html += '</div>'; });
    } else html = items.map(renderTaskItem).join('');
    const massCount = Object.keys(state.massSelected).length;
    if (state.massMode && massCount > 0) {
            html += '<div class="mass-bar"><span>Выбрано: ' + massCount + '</span><div class="mass-actions">' +
        '<button type="button" data-action="mass-done">✓ Выполнить</button>' +
        '<button type="button" data-action="mass-priority">⚡ Приоритет</button>' +
        '<button type="button" data-action="mass-deadline">📅 Дедлайн</button>' +
        '<button type="button" data-action="mass-tag">🏷 Теги</button>' +
        '<button type="button" data-action="mass-move">🎯 Цель</button>' +
        '<button type="button" data-action="mass-archive">📦 Архив</button>' +
        '<button type="button" data-action="mass-export">⬇ Экспорт</button>' +
        '<button type="button" class="danger" data-action="mass-delete">🗑 Удалить</button>' +
        '</div></div>';
    }
    list.innerHTML = html;
    if (col) col.scrollTop = st;
  }

    function renderTaskItem(it) {
    const g = it.goal, t = it.task;
    const od = isOverdue(t);
    const soon = isUpcomingSoon(t);
    const meta = [];
        if (!g.isInbox) meta.push('<span class="tag">' + escapeHtml(g.title) + '</span>');
    meta.push(PRIORITY_LABEL[t.priority] || '—');
    if (t.status && t.status !== 'todo' && t.status !== 'done') {
      const stLabel = { doing: 'В работе', blocked: 'Блок', done: 'Готово' }[t.status] || '';
      meta.push('<span class="task-status ' + t.status + '">' + stLabel + '</span>');
    }
    if (t.deadline) {
      if (od) meta.push('<span class="overdue">' + relativeDate(t.deadline) + '</span>');
      else if (soon) meta.push('<span class="soon">' + relativeDate(t.deadline) + '</span>');
      else meta.push(relativeDate(t.deadline));
    } else meta.push('<span class="no-deadline">без срока</span>');
    if (t.time) meta.push('<span class="task-time-badge">🕐 ' + escapeHtml(t.time) + '</span>');
    if (t.repeat) { const rmap = { daily: 'ежедн', weekdays: 'будни', weekly: 'нед', monthly: 'мес' }; meta.push('<span class="repeat-badge">🔁 ' + rmap[t.repeat.type] + '</span>'); }
    if (t.tags) t.tags.forEach(function (tag) { meta.push('<span class="tag-chip-sm" data-action="filter-tag-click" data-tag="' + escapeHtml(tag) + '">#' + escapeHtml(tag) + '</span>'); });
    if (t.subtasks && t.subtasks.length) meta.push(subtaskProgress(t));
    const selected = !!state.massSelected[t.id];
    const massCheckbox = state.massMode ? '<input type="checkbox" class="mass-check" data-action="mass-check" data-task-id="' + escapeHtml(t.id) + '" data-goal-id="' + escapeHtml(g.id) + '" ' + (selected ? 'checked' : '') + ' />' : '';
    const odCls = od && !t.done ? ' overdue' : '';
    const subtasksHtml = renderSubtasksHtml(g.id, t);
    return '<div class="task ' + (t.done ? 'done' : '') + (selected ? ' selected' : '') + odCls + (t.pinned ? ' pinned' : '') + '" data-goal-id="' + escapeHtml(g.id) + '" data-task-id="' + escapeHtml(t.id) + '">' +
      '<input type="checkbox" ' + (t.done ? 'checked' : '') + ' data-action="toggle-task" data-goal-id="' + escapeHtml(g.id) + '" data-task-id="' + escapeHtml(t.id) + '" />' +
      massCheckbox +
      '<div class="task-content"><div class="task-text">' + escapeHtml(t.text) + '</div><div class="task-meta">' + meta.join(' • ') + '</div>' + subtasksHtml + '</div>' +
      '<div class="task-actions">' +
        '<button type="button" class="icon-btn' + (t.pinned ? ' pinned' : '') + '" data-action="pin-task" data-goal-id="' + escapeHtml(g.id) + '" data-task-id="' + escapeHtml(t.id) + '" title="Закрепить">📌</button>' +
                '<button type="button" class="icon-btn" data-action="duplicate-task" data-goal-id="' + escapeHtml(g.id) + '" data-task-id="' + escapeHtml(t.id) + '" title="Дублировать">📋</button>' +
        '<button type="button" class="icon-btn" data-action="edit-task" data-goal-id="' + escapeHtml(g.id) + '" data-task-id="' + escapeHtml(t.id) + '" title="Редактировать">✎</button>' +
        (t.done ? '<button type="button" class="icon-btn" data-action="archive-task" data-goal-id="' + escapeHtml(g.id) + '" data-task-id="' + escapeHtml(t.id) + '" title="В архив">📦</button>' : '') +
        '<button type="button" class="icon-btn" data-action="delete-task" data-goal-id="' + escapeHtml(g.id) + '" data-task-id="' + escapeHtml(t.id) + '" title="Удалить">✕</button>' +
      '</div></div>';
  }
  // === ПОДЗАДАЧИ ===
  function addSubtask(goalId, taskId, text) {
    const g = findGoal(goalId); if (!g) return;
    const t = g.tasks.find(function (x) { return x.id === taskId; }); if (!t) return;
    if (!Array.isArray(t.subtasks)) t.subtasks = [];
    t.subtasks.push({ id: uid(), text: String(text || '').slice(0, 500), done: false, createdAt: Date.now() });
    saveData(); render();
  }
  function toggleSubtask(goalId, taskId, subId) {
    const g = findGoal(goalId); if (!g) return;
    const t = g.tasks.find(function (x) { return x.id === taskId; }); if (!t || !t.subtasks) return;
    const s = t.subtasks.find(function (x) { return x.id === subId; }); if (!s) return;
    s.done = !s.done;
    // Автоматически отметить родительскую задачу, если все подзадачи сделаны
    const allDone = t.subtasks.length > 0 && t.subtasks.every(function (x) { return x.done; });
    if (allDone && !t.done) { t.done = true; t.status = 'done'; }
    else if (!allDone && t.done) { t.done = false; t.status = t.status === 'done' ? 'doing' : t.status; }
    saveData(); render();
  }
  function deleteSubtask(goalId, taskId, subId) {
    const g = findGoal(goalId); if (!g) return;
    const t = g.tasks.find(function (x) { return x.id === taskId; }); if (!t || !t.subtasks) return;
    t.subtasks = t.subtasks.filter(function (x) { return x.id !== subId; });
    saveData(); render();
  }
  function editSubtask(goalId, taskId, subId) {
    const g = findGoal(goalId); if (!g) return;
    const t = g.tasks.find(function (x) { return x.id === taskId; }); if (!t || !t.subtasks) return;
    const s = t.subtasks.find(function (x) { return x.id === subId; }); if (!s) return;
    const newText = prompt('Изменить подзадачу:', s.text);
    if (newText === null) return;
    const v = String(newText).trim();
    if (!v) return;
    s.text = v.slice(0, 500);
    saveData(); render();
  }
  function subtaskProgress(t) {
    if (!t.subtasks || !t.subtasks.length) return '';
    const done = t.subtasks.filter(function (x) { return x.done; }).length;
    return '<span class="subtask-progress">' + done + '/' + t.subtasks.length + '</span>';
  }

  // === РЕНДЕР ПОДЗАДАЧ (внутри карточки задачи) ===
  function renderSubtasksHtml(goalId, task) {
    if (!task.subtasks || !task.subtasks.length) {
      return '<div class="subtask-add"><input type="text" placeholder="+ подзадача…" data-subtask-input data-goal-id="' + escapeHtml(goalId) + '" data-task-id="' + escapeHtml(task.id) + '" /><button type="button" class="secondary" data-action="add-subtask-inline" data-goal-id="' + escapeHtml(goalId) + '" data-task-id="' + escapeHtml(task.id) + '">+</button></div>';
    }
    const rows = task.subtasks.map(function (s) {
      return '<div class="subtask ' + (s.done ? 'done' : '') + '">' +
        '<input type="checkbox" ' + (s.done ? 'checked' : '') + ' data-action="toggle-subtask" data-goal-id="' + escapeHtml(goalId) + '" data-task-id="' + escapeHtml(task.id) + '" data-sub-id="' + escapeHtml(s.id) + '" />' +
        '<span class="subtask-text">' + escapeHtml(s.text) + '</span>' +
        '<span class="subtask-actions">' +
          '<button type="button" data-action="edit-subtask" data-goal-id="' + escapeHtml(goalId) + '" data-task-id="' + escapeHtml(task.id) + '" data-sub-id="' + escapeHtml(s.id) + '" title="Изменить">✎</button>' +
          '<button type="button" data-action="delete-subtask" data-goal-id="' + escapeHtml(goalId) + '" data-task-id="' + escapeHtml(task.id) + '" data-sub-id="' + escapeHtml(s.id) + '" title="Удалить">✕</button>' +
        '</span>' +
      '</div>';
    }).join('');
    return '<div class="subtasks">' + rows + '</div>' + '<div class="subtask-add"><input type="text" placeholder="+ подзадача…" data-subtask-input data-goal-id="' + escapeHtml(goalId) + '" data-task-id="' + escapeHtml(task.id) + '" /><button type="button" class="secondary" data-action="add-subtask-inline" data-goal-id="' + escapeHtml(goalId) + '" data-task-id="' + escapeHtml(task.id) + '">+</button></div>';
  }

  // === ТЕПЛОВАЯ КАРТА ===
    let _heatmapLastSig = '';
    function renderHeatmap() {
    const grid = document.getElementById('heatmapGrid');
    const statsEl = document.getElementById('heatmapStats');
    if (!grid) return;

        let sig = 0, cnt = 0;
    state.goals.forEach(function (g) {
      if (g.archivedAt && !g.isInbox) { cnt++; sig += (g.archivedAt % 100000); }
      g.tasks.forEach(function (t) { if (t.done) { cnt++; sig += (t.doneAt || t.archivedAt || t.createdAt || 0) % 100000; } });
    });
    const newSig = cnt + '|' + sig;
    if (newSig === _heatmapLastSig) return;
    _heatmapLastSig = newSig;

    const now = new Date();
    const year = now.getFullYear();
    const byMonth = [0,0,0,0,0,0,0,0,0,0,0,0];

    state.goals.forEach(function (g) {
      // Выполненные задачи
      g.tasks.forEach(function (t) {
        if (!t.done) return;
        const ts = t.doneAt || t.archivedAt || t.createdAt;
        if (!ts) return;
        const d = new Date(ts);
        if (d.getFullYear() !== year) return;
        byMonth[d.getMonth()] += 1;
      });
      // Завершённые цели (кроме «Быстрых задач»)
      if (g.archivedAt && !g.isInbox) {
        const d = new Date(g.archivedAt);
        if (d.getFullYear() === year) byMonth[d.getMonth()] += 1;
      }
    });

    const total = byMonth.reduce(function (a, b) { return a + b; }, 0);
    const max = Math.max.apply(null, byMonth.concat([1]));
    const MONTH_SHORT = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];

        const html = byMonth.map(function (count, i) {
            const pct = max > 0 ? Math.max(8, (count / max) * 100) : 8;
      return '<div class="heatmap-bar-wrap" title="' + MONTH_SHORT[i] + ': ' + count + '">' +
        '<div class="heatmap-bar-track"><div class="heatmap-bar" style="height:' + pct + '%"></div></div>' +
        '<span class="heatmap-bar-label">' + MONTH_SHORT[i] + '</span>' +
      '</div>';
    }).join('');

    grid.innerHTML = html;
    if (statsEl) statsEl.textContent = 'За ' + year + ' год: ' + total + ' задач · Макс. в месяц: ' + max;
  }

    // === ПИКЕР ЭМОДЗИ ===
  let _emojiPickerTarget = null;
  function openEmojiPicker(targetInputId) {
    _emojiPickerTarget = targetInputId;
    const modal = document.getElementById('emojiPickerModal');
    if (!modal) return;
    const grid = document.getElementById('emojiPickerGrid');
    if (grid && !grid.dataset.built) {
      grid.innerHTML = EMOJI_SET.map(function (e) {
        return '<button type="button" class="emoji-cell" data-emoji="' + e + '" style="font-size:22px; padding:6px 0; background:transparent; border:1px solid var(--border); border-radius:8px; cursor:pointer; line-height:1;">' + e + '</button>';
      }).join('');
      grid.dataset.built = '1';
    }
    const search = document.getElementById('emojiPickerSearch');
    if (search) search.value = '';
    if (grid) grid.querySelectorAll('.emoji-cell').forEach(function (b) { b.style.display = ''; });
    modal.hidden = false;
    setTimeout(function () { if (search) search.focus(); }, 50);
  }
  function closeEmojiPicker() {
    const modal = document.getElementById('emojiPickerModal');
    if (modal) modal.hidden = true;
    _emojiPickerTarget = null;
  }

// === ШПАРГАЛКА ГОРЯЧИХ КЛАВИШ ===
  function openKbdHelp() { document.getElementById('kbdHelpModal').hidden = false; }
  function closeKbdHelp() { document.getElementById('kbdHelpModal').hidden = true; }

  // === ПЛОТНОСТЬ ===
  function applyDensity() {
    document.body.classList.toggle('density-compact', state.density === 'compact');
  }

  // === ПОДЗАДАЧИ в edit-модале ===
  function renderEditSubtasks() {
    const box = document.getElementById('editSubtaskList');
    if (!box) return;
    const g = findGoal(state.editingTaskGoalId);
    const t = g ? g.tasks.find(function (x) { return x.id === state.editingTaskId; }) : null;
    if (!t || !t.subtasks || !t.subtasks.length) { box.innerHTML = '<div class="muted" style="font-size:11px;">Пока нет подзадач</div>'; return; }
    box.innerHTML = t.subtasks.map(function (s) {
      return '<div class="subtask ' + (s.done ? 'done' : '') + '">' +
        '<input type="checkbox" ' + (s.done ? 'checked' : '') + ' data-action="edit-toggle-subtask" data-sub-id="' + escapeHtml(s.id) + '" />' +
        '<span class="subtask-text">' + escapeHtml(s.text) + '</span>' +
        '<span class="subtask-actions"><button type="button" data-action="edit-delete-subtask" data-sub-id="' + escapeHtml(s.id) + '">✕</button></span>' +
      '</div>';
    }).join('');
  }
  function editAddSubtask() {
    const inp = document.getElementById('editSubtaskNew');
    const v = (inp.value || '').trim(); if (!v) return;
    const g = findGoal(state.editingTaskGoalId);
    const t = g ? g.tasks.find(function (x) { return x.id === state.editingTaskId; }) : null;
    if (!t) return;
    if (!Array.isArray(t.subtasks)) t.subtasks = [];
    t.subtasks.push({ id: uid(), text: v.slice(0, 500), done: false, createdAt: Date.now() });
    inp.value = '';
    saveData(); renderEditSubtasks(); render();
  }
  function editToggleSubtask(subId) {
    const g = findGoal(state.editingTaskGoalId);
    const t = g ? g.tasks.find(function (x) { return x.id === state.editingTaskId; }) : null;
    if (!t || !t.subtasks) return;
    const s = t.subtasks.find(function (x) { return x.id === subId; }); if (!s) return;
    s.done = !s.done;
    saveData(); renderEditSubtasks(); render();
  }
  function editDeleteSubtask(subId) {
    const g = findGoal(state.editingTaskGoalId);
    const t = g ? g.tasks.find(function (x) { return x.id === state.editingTaskId; }) : null;
    if (!t || !t.subtasks) return;
    t.subtasks = t.subtasks.filter(function (x) { return x.id !== subId; });
    saveData(); renderEditSubtasks(); render();
  }

  // === ЗАМЕТКИ: ИЗБРАННОЕ ===
  function toggleNoteFav(id) {
    const n = findNote(id); if (!n) return;
    n.fav = !n.fav;
    saveNotes(); renderNotesList();
  }

  // === ТЕГИ ЦЕЛЕЙ ===
  function setGoalTags(id, tags) {
    const g = findGoal(id); if (!g) return;
    g.tags = normalizeTags(tags);
    saveData(); render();
  }

  function exportSelectedTasks() {
    const ids = Object.keys(state.massSelected);
    if (!ids.length) { showToast('Ничего не выбрано', 'warn'); return; }
    const stamp = new Date().toISOString().slice(0, 10);
    let md = '# Выбранные задачи (' + ids.length + ')\n\n' + formatDateTime(Date.now()) + '\n\n';
    ids.forEach(function (taskId) {
      const info = state.massSelected[taskId];
      const g = findGoal(info.goalId); if (!g) return;
      const t = g.tasks.find(function (x) { return x.id === taskId; }); if (!t) return;
      md += '- [' + (t.done ? 'x' : ' ') + '] ' + t.text;
            if (!g.isInbox) md += '\n  - Цель: ' + g.title;
      md += '\n  - Приоритет: ' + (PRIORITY_LABEL[t.priority] || '—');
      if (t.deadline) md += '\n  - Дедлайн: ' + formatDate(t.deadline);
      if ((t.tags || []).length) md += '\n  - Теги: ' + t.tags.map(function (x) { return '#' + x; }).join(' ');
      md += '\n\n';
    });
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'selected_tasks_' + stamp + '.md';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    showToast('Экспортировано: ' + ids.length, 'ok');
  }
    function renderDashboard() {
    const helloEl = document.getElementById('dashHello');
    const dateEl = document.getElementById('dashDate');
    const contentEl = document.getElementById('dashContent');
    if (!helloEl || !contentEl) return;

    const now = new Date();
    const h = now.getHours();
    const greet = h < 5 ? 'Доброй ночи' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';
    helloEl.textContent = greet + ' 👋';
    dateEl.textContent = formatDate(dateToISO(now)) + ' · ' + ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'][now.getDay()];

    const todayISO = dateToISO(now);
    const all = [];
    state.goals.forEach(function (g) {
      if (g.archivedAt) return;
      g.tasks.forEach(function (t) {
        if (t.archivedAt) return;
        all.push({ goal: g, task: t });
      });
    });

    // === ИТОГ ДНЯ (сводка за сегодня) ===
    const dayStart = todayStart().getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    // Задачи, выполненные сегодня
    let doneTodayTasks = 0;
    all.forEach(function (it) {
      if (it.task.done && it.task.doneAt && it.task.doneAt >= dayStart && it.task.doneAt < dayEnd) {
        doneTodayTasks++;
      }
    });

    // Цели, завершённые сегодня
    let doneTodayGoals = 0;
    state.goals.forEach(function (g) {
      if (g.archivedAt && g.archivedAt >= dayStart && g.archivedAt < dayEnd && !g.isInbox) {
        doneTodayGoals++;
      }
    });

    // Привычки, отмеченные сегодня
    let doneTodayHabits = 0;
    state.habits.forEach(function (hh) {
      if ((hh.marks || []).indexOf(todayISO) !== -1) doneTodayHabits++;
    });

    // Дневник за сегодня
    const diaryTitle = 'Дневник ' + formatDate(todayISO);
    const hasDiary = state.notes.some(function (n) { return n.title === diaryTitle; });

    // Серия продуктивных дней
    const byDay = {};
    all.forEach(function (it) {
      if (it.task.done && it.task.doneAt) {
        const iso = dateToISO(new Date(it.task.doneAt));
        byDay[iso] = (byDay[iso] || 0) + 1;
      }
    });
    state.goals.forEach(function (g) {
      if (g.archivedAt && !g.isInbox) {
        const iso = dateToISO(new Date(g.archivedAt));
        byDay[iso] = (byDay[iso] || 0) + 1;
      }
    });
    let streak = 0;
    const probe = new Date(todayStart());
    if (!byDay[todayISO]) probe.setDate(probe.getDate() - 1);
    let safety = 0;
    while (safety++ < 3650) {
      const iso = dateToISO(probe);
      if (byDay[iso] > 0) { streak++; probe.setDate(probe.getDate() - 1); }
      else break;
    }

    // Просроченные
    const overdueCount = all.filter(function (it) { return isOverdue(it.task); }).length;

    const totalDone = doneTodayTasks + doneTodayGoals + doneTodayHabits + (hasDiary ? 1 : 0);
    const totalIcon = totalDone === 0 ? '🌱' : (totalDone < 3 ? '🙂' : (totalDone < 6 ? '💪' : '🚀'));
    const totalText = totalDone === 0
      ? 'Денёк только начинается. Сделай первое дело!'
      : 'Ты закрыл ' + totalDone + ' ' + pluralize(totalDone, ['дело', 'дела', 'дел']) + ' сегодня';

    let summaryHtml = '<div class="dash-summary">';
    summaryHtml += '<div class="dash-summary-head">';
    summaryHtml += '<span class="dash-summary-icon">' + totalIcon + '</span>';
    summaryHtml += '<span class="dash-summary-text">' + escapeHtml(totalText) + '</span>';
    summaryHtml += '<button type="button" class="secondary dash-summary-btn" data-action="dash-open-report">📄 Полный отчёт</button>';
    summaryHtml += '</div>';
    summaryHtml += '<div class="dash-summary-grid">';
    summaryHtml += '<div class="dash-summary-item' + (doneTodayTasks > 0 ? ' has-value' : '') + '"><span class="num">' + doneTodayTasks + '</span><span class="lbl">✅ задач</span></div>';
    summaryHtml += '<div class="dash-summary-item' + (doneTodayHabits > 0 ? ' has-value' : '') + '"><span class="num">' + doneTodayHabits + '</span><span class="lbl">📆 привычек</span></div>';
    summaryHtml += '<div class="dash-summary-item' + (doneTodayGoals > 0 ? ' has-value' : '') + '"><span class="num">' + doneTodayGoals + '</span><span class="lbl">🎯 целей</span></div>';
    summaryHtml += '<div class="dash-summary-item' + (hasDiary ? ' has-value' : '') + '"><span class="num">' + (hasDiary ? '✓' : '—') + '</span><span class="lbl">📝 дневник</span></div>';
    summaryHtml += '<div class="dash-summary-item' + (streak > 0 ? ' has-value' : '') + '"><span class="num">🔥 ' + streak + '</span><span class="lbl">серия</span></div>';
    if (overdueCount > 0) {
      summaryHtml += '<div class="dash-summary-item has-warn"><span class="num">⚠ ' + overdueCount + '</span><span class="lbl">просрочено</span></div>';
    }
    summaryHtml += '</div>';
    summaryHtml += '</div>';

    const overdue = all.filter(function (it) { return isOverdue(it.task); });
    const today = all.filter(function (it) { return !it.task.done && it.task.deadline === todayISO; });
    const doing = all.filter(function (it) { return !it.task.done && it.task.status === 'doing' && it.task.deadline !== todayISO && !isOverdue(it.task); });

    // Карточки своих вкладок на сегодня
    const cardsToday = [];
    if (Array.isArray(state.customTabs)) {
      state.customTabs.forEach(function (tab) {
        (tab.cards || []).forEach(function (c) {
          if (c.done) return;
          if (c.dueDate === todayISO) cardsToday.push({ tab: tab, card: c });
        });
      });
    }

    const goalsWithDeadline = state.goals
      .filter(function (g) { return !g.archivedAt && !g.isInbox && g.deadline; })
      .sort(function (a, b) { return (a.deadline || '').localeCompare(b.deadline || ''); })
      .slice(0, 3);

    function renderTaskRow(it) {
      const t = it.task, g = it.goal;
      const od = isOverdue(t);
      const meta = [];
      if (!g.isInbox) meta.push('<span class="tag">' + escapeHtml(g.title) + '</span>');
      meta.push(PRIORITY_LABEL[t.priority] || '—');
      if (t.deadline) {
        if (od) meta.push('<span class="overdue">' + relativeDate(t.deadline) + '</span>');
        else meta.push(relativeDate(t.deadline));
      }
      if (t.time) meta.push('🕐 ' + escapeHtml(t.time));
      if (t.tags) t.tags.forEach(function (tag) { meta.push('<span class="tag">#' + escapeHtml(tag) + '</span>'); });
      return '<div class="dash-item" data-action="dash-open-task" data-goal-id="' + escapeHtml(g.id) + '" data-task-id="' + escapeHtml(t.id) + '">' +
        '<input type="checkbox" ' + (t.done ? 'checked' : '') + ' data-action="dash-toggle-task" data-goal-id="' + escapeHtml(g.id) + '" data-task-id="' + escapeHtml(t.id) + '" />' +
        '<div><div class="dash-item-text">' + escapeHtml(t.text) + '</div><div class="dash-item-meta">' + meta.join(' • ') + '</div></div>' +
      '</div>';
    }

    let html = summaryHtml; // ← Итог дня первым блоком

    // Просроченные
    if (overdue.length) {
      html += '<div class="dash-block overdue"><div class="dash-block-head"><span class="dash-block-title">🔴 Просрочено</span><span class="dash-block-count">' + overdue.length + '</span></div>';
      overdue.slice(0, 5).forEach(function (it) { html += renderTaskRow(it); });
      if (overdue.length > 5) html += '<div class="dash-empty">…и ещё ' + (overdue.length - 5) + '</div>';
      html += '</div>';
    }

    // На сегодня
    html += '<div class="dash-block' + (today.length ? '' : ' allgood') + '"><div class="dash-block-head"><span class="dash-block-title">📌 На сегодня</span><span class="dash-block-count">' + today.length + '</span></div>';
    if (today.length) today.forEach(function (it) { html += renderTaskRow(it); });
    else html += '<div class="dash-empty">Ничего не запланировано на сегодня. Хорошего дня! ✨</div>';
    html += '</div>';

    // В работе
    if (doing.length) {
      html += '<div class="dash-block"><div class="dash-block-head"><span class="dash-block-title">⚡ В работе</span><span class="dash-block-count">' + doing.length + '</span></div>';
      doing.slice(0, 5).forEach(function (it) { html += renderTaskRow(it); });
      if (doing.length > 5) html += '<div class="dash-empty">…и ещё ' + (doing.length - 5) + '</div>';
      html += '</div>';
    }

    // Карточки на сегодня
    if (cardsToday.length) {
      html += '<div class="dash-block"><div class="dash-block-head"><span class="dash-block-title">🗂 Карточки на сегодня</span><span class="dash-block-count">' + cardsToday.length + '</span></div>';
      cardsToday.forEach(function (it) {
        const c = it.card, tab = it.tab;
        const meta = [];
        meta.push('<span class="tag">' + escapeHtml((tab.icon || '⭐') + ' ' + (tab.label || '')) + '</span>');
        if (c.price) meta.push('💰 ' + escapeHtml(c.price));
        if (c.address) meta.push('📍 ' + escapeHtml(c.address));
        html += '<div class="dash-item" data-action="dash-open-card" data-tab-id="' + escapeHtml(tab.id) + '" data-card-id="' + escapeHtml(c.id) + '">' +
          '<input type="checkbox" data-action="dash-toggle-card" data-tab-id="' + escapeHtml(tab.id) + '" data-card-id="' + escapeHtml(c.id) + '" />' +
          '<div><div class="dash-item-text">' + escapeHtml(c.text) + '</div><div class="dash-item-meta">' + meta.join(' • ') + '</div></div>' +
        '</div>';
      });
      html += '</div>';
    }

    // Цели с ближайшим дедлайном
    if (goalsWithDeadline.length) {
      html += '<div class="dash-block"><div class="dash-block-head"><span class="dash-block-title">🎯 Ближайшие цели</span></div>';
      goalsWithDeadline.forEach(function (g) {
        const active = g.tasks.filter(function (t) { return !t.archivedAt; });
        const done = active.filter(function (t) { return t.done; }).length;
        const od = g.deadline && new Date(g.deadline + 'T00:00:00') < todayStart();
        html += '<div class="dash-goal-item" data-action="dash-open-goal" data-goal-id="' + escapeHtml(g.id) + '">' +
          '<div class="dash-goal-title">' + escapeHtml(g.title) + '</div>' +
          '<div class="dash-goal-meta">' +
            (od ? '<span class="overdue">' + relativeDate(g.deadline) + '</span>' : '<span>до ' + relativeDate(g.deadline) + '</span>') +
            '<span>' + done + '/' + active.length + ' задач</span>' +
          '</div>' +
        '</div>';
      });
      html += '</div>';
    }

    contentEl.innerHTML = html;
  }

  // Утилита: склонение русских слов
  function pluralize(n, forms) {
    const a = Math.abs(n) % 100;
    const b = a % 10;
    if (a > 10 && a < 20) return forms[2];
    if (b > 1 && b < 5) return forms[1];
    if (b === 1) return forms[0];
    return forms[2];
  }

    const sortedDays = Object.keys(byDay).sort();
    let bestStreak = 0, curStreak = 0, prevDate = null;
    sortedDays.forEach(function (iso) {
      if (prevDate) {
        const d1 = new Date(prevDate + 'T00:00:00');
        const d2 = new Date(iso + 'T00:00:00');
        const diff = Math.round((d2 - d1) / (24 * 60 * 60 * 1000));
        if (diff === 1) curStreak++; else curStreak = 1;
      } else curStreak = 1;
      if (curStreak > bestStreak) bestStreak = curStreak;
      prevDate = iso;
    });

    const word = (streak % 10 === 1 && streak % 100 !== 11) ? 'день'
               : ((streak % 10 >= 2 && streak % 10 <= 4 && (streak % 100 < 10 || streak % 100 >= 20)) ? 'дня' : 'дней');

    streakEl.innerHTML =
      '<div class="analytics-streak">' +
        '<div class="analytics-streak-num">🔥 ' + streak + '</div>' +
        '<div class="analytics-streak-text">' +
          'Подряд: <b>' + streak + ' ' + word + '</b><br>' +
          'Рекорд: <b>' + bestStreak + '</b><br>' +
          'Всего продуктивных дней: <b>' + sortedDays.length + '</b>' +
        '</div>' +
      '</div>';

    // === ГРАФИК 30 ДНЕЙ ===
    const days = [];
    let sum30 = 0;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 29);
    for (let i = 0; i < 30; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const iso = dateToISO(d);
      const cnt = byDay[iso] || 0;
      days.push({ iso: iso, count: cnt, date: d });
      sum30 += cnt;
    }
    const maxCount = Math.max.apply(null, days.map(function (x) { return x.count; }).concat([1]));

    const barsHtml = days.map(function (x) {
      const h = x.count > 0 ? Math.max(6, (x.count / maxCount) * 100) : 2;
      const isToday = x.iso === todayISO;
      const title = formatDate(x.iso) + ': ' + x.count;
      return '<div class="analytics-chart-bar' + (isToday ? ' today' : '') + '" style="height:' + h + '%" title="' + title + '"></div>';
    }).join('');
    const labelsHtml = days.map(function (x) {
      const num = x.date.getDate();
      const show = (num === 1) || (num === 15);
      return '<div>' + (show ? num : '') + '</div>';
    }).join('');

    chartEl.innerHTML =
      '<div class="analytics-chart">' + barsHtml + '</div>' +
      '<div class="analytics-chart-labels">' + labelsHtml + '</div>';

    const activeDays = days.filter(function (x) { return x.count > 0; }).length;
    const avgAll = (sum30 / 30).toFixed(1);
    const avgActive = activeDays > 0 ? (sum30 / activeDays).toFixed(1) : '0';
    const summaryEl = document.createElement('div');
    summaryEl.className = 'analytics-summary';
    summaryEl.innerHTML =
      '<div class="analytics-summary-item">Выполнено за 30 дней<b>' + sum30 + '</b></div>' +
      '<div class="analytics-summary-item">В среднем в день<b>' + avgAll + '</b></div>' +
      '<div class="analytics-summary-item">В среднем за активный день<b>' + avgActive + '</b></div>' +
      '<div class="analytics-summary-item">Активных дней из 30<b>' + activeDays + '</b></div>';
    chartEl.appendChild(summaryEl);

    // === ТОП ЦЕЛЕЙ ===
    const byGoal = {};
    completed.forEach(function (it) {
      if (!byGoal[it.goal.id]) byGoal[it.goal.id] = { goal: it.goal, count: 0 };
      byGoal[it.goal.id].count++;
    });
    const topGoals = Object.keys(byGoal).map(function (k) { return byGoal[k]; })
      .sort(function (a, b) { return b.count - a.count; }).slice(0, 5);

    if (!topGoals.length) {
      topEl.innerHTML = '<div class="analytics-empty">Пока нет выполненных задач.</div>';
    } else {
      const maxG = topGoals[0].count;
      topEl.innerHTML = '<div class="analytics-list">' + topGoals.map(function (x) {
        const w = Math.max(4, (x.count / maxG) * 100);
        return '<div class="analytics-list-item">' +
          '<div><div class="name">🎯 ' + escapeHtml(x.goal.title) + '</div><div class="bar-mini" style="width:' + w + '%"></div></div>' +
          '<div class="count">' + x.count + '</div>' +
        '</div>';
      }).join('') + '</div>';
    }

    // === ТЕГИ ===
    const tagDone = {}, tagAll = {};
    state.goals.forEach(function (g) {
      if (g.isInbox) return;
      g.tasks.forEach(function (t) {
        (t.tags || []).forEach(function (tag) {
          tagAll[tag] = (tagAll[tag] || 0) + 1;
          if (t.done) tagDone[tag] = (tagDone[tag] || 0) + 1;
        });
      });
    });
    const tagList = Object.keys(tagAll).map(function (tag) {
      return { tag: tag, done: tagDone[tag] || 0, total: tagAll[tag] };
    }).sort(function (a, b) { return b.done - a.done; });

    if (!tagList.length) {
      tagsEl.innerHTML = '<div class="analytics-empty">Пока нет тегов в задачах.</div>';
    } else {
      const maxT = Math.max.apply(null, tagList.map(function (x) { return x.done; }).concat([1]));
      tagsEl.innerHTML = '<div class="analytics-list">' + tagList.slice(0, 15).map(function (x) {
        const w = Math.max(4, (x.done / maxT) * 100);
        const pct = x.total > 0 ? Math.round((x.done / x.total) * 100) : 0;
        return '<div class="analytics-list-item">' +
          '<div><div class="name">#' + escapeHtml(x.tag) + ' <span style="color:var(--muted);font-size:11px">' + x.done + '/' + x.total + ' (' + pct + '%)</span></div><div class="bar-mini" style="width:' + w + '%"></div></div>' +
          '<div class="count">' + x.done + '</div>' +
        '</div>';
      }).join('') + '</div>';
    }
  }

  function renderArchive() {
    const ag = state.goals.filter(function (g) { return g.archivedAt && !g.isInbox; });
    const goalsEl = document.getElementById('archivedGoalsList');
    if (!ag.length) goalsEl.innerHTML = '<div class="empty">Архив целей пуст.</div>';
    else { ag.sort(function (a, b) { return b.archivedAt - a.archivedAt; }); goalsEl.innerHTML = ag.map(function (g) { const total = g.tasks.length, done = g.tasks.filter(function (t) { return t.done; }).length; const meta = [total + ' задач, выполнено ' + done]; if (g.archivedAt) meta.push('завершено ' + formatDateTime(g.archivedAt)); return '<article class="archive-item"><div class="archive-head"><div><div class="archive-title">' + escapeHtml(g.title) + '</div><div class="archive-meta">' + meta.join(' • ') + '</div></div><div style="display:flex;gap:4px;"><button type="button" class="icon-btn" data-action="restore-goal" data-goal-id="' + escapeHtml(g.id) + '" title="Восстановить">↺</button><button type="button" class="icon-btn" data-action="delete-goal" data-goal-id="' + escapeHtml(g.id) + '" title="Удалить">✕</button></div></div></article>'; }).join(''); }
    const at = [];
    state.goals.forEach(function (g) { if (g.archivedAt) return; g.tasks.forEach(function (t) { if (t.archivedAt) at.push({ goal: g, task: t }); }); });
    const tasksEl = document.getElementById('archivedTasksList');
    if (!at.length) tasksEl.innerHTML = '<div class="empty">Архив задач пуст.</div>';
    else { at.sort(function (a, b) { return b.task.archivedAt - a.task.archivedAt; }); tasksEl.innerHTML = at.map(function (it) { const g = it.goal, t = it.task; const meta = [];
if (!g.isInbox) meta.push(escapeHtml(g.title));
meta.push(PRIORITY_LABEL[t.priority] || '—'); return '<article class="archive-item"><div class="archive-head"><div><div class="archive-title">' + escapeHtml(t.text) + '</div><div class="archive-meta">' + meta.join(' · ') + '</div></div><div style="display:flex;gap:4px;"><button type="button" class="icon-btn" data-action="restore-task" data-goal-id="' + escapeHtml(g.id) + '" data-task-id="' + escapeHtml(t.id) + '" title="Восстановить">↺</button><button type="button" class="icon-btn" data-action="delete-task" data-goal-id="' + escapeHtml(g.id) + '" data-task-id="' + escapeHtml(t.id) + '" title="Удалить">✕</button></div></div></article>'; }).join(''); }
        const _ac = document.getElementById('archiveCount'); if (_ac) _ac.textContent = ag.length + at.length;
  }

          function renderGoalSelect() {
    const sel = document.getElementById('taskGoal');
    const prev = sel.value;
    const goals = state.goals.filter(function (g) { return !g.isInbox && !g.archivedAt; });
    sel.innerHTML = '<option value="">— Без цели —</option>' + goals.map(function (g) { return '<option value="' + escapeHtml(g.id) + '">' + escapeHtml(g.title) + '</option>'; }).join('');
    if (prev) { const found = Array.prototype.some.call(sel.options, function (o) { return o.value === prev; }); if (found) sel.value = prev; }

    // Заполняем селекты «Родительская цель» — в форме и в модале
    fillGoalParentSelects();
  }

  // Заполнить оба селекта «Родительская цель»: в форме создания и в модале редактирования
  function fillGoalParentSelects() {
    const parents = state.goals.filter(function (g) { return !g.isInbox && !g.archivedAt; });

    const selNew = document.getElementById('goalParent');
    if (selNew) {
      const prevNew = selNew.value;
      selNew.innerHTML = '<option value="">— Верхний уровень —</option>' + parents.map(function (g) {
        return '<option value="' + escapeHtml(g.id) + '">' + escapeHtml(g.title) + '</option>';
      }).join('');
      if (prevNew && parents.some(function (g) { return g.id === prevNew; })) selNew.value = prevNew;
      else selNew.value = '';
    }

    const selEdit = document.getElementById('editGoalParent');
    if (selEdit) {
      // В модале редактирования нельзя выбрать саму цель или её потомков —
      // иначе получится цикл (цель окажется внутри самой себя).
      const editingId = state.editingGoalId;
      const excluded = collectDescendantIds(editingId);
      const editParents = parents.filter(function (g) {
        return g.id !== editingId && !excluded[g.id];
      });
      const prevEdit = selEdit.value;
      selEdit.innerHTML = '<option value="">— Верхний уровень —</option>' + editParents.map(function (g) {
        return '<option value="' + escapeHtml(g.id) + '">' + escapeHtml(g.title) + '</option>';
      }).join('');
      if (prevEdit && editParents.some(function (g) { return g.id === prevEdit; })) selEdit.value = prevEdit;
      else selEdit.value = '';
    }
  }

  // Собрать id всех потомков цели (защита от циклов при выборе родителя)
  function collectDescendantIds(goalId) {
    const result = {};
    if (!goalId) return result;
    function walk(id) {
      state.goals.forEach(function (g) {
        if (g.parentId === id && !result[g.id]) {
          result[g.id] = true;
          walk(g.id);
        }
      });
    }
    walk(goalId);
    return result;
  }
    function renderToggleAllButton() {
    const btn = document.getElementById('toggleAllBtn'); if (!btn) return;
    const goals = visibleGoals();
    const allCollapsed = goals.length > 0 && goals.every(function (g) { return state.collapsed[g.id]; });
    btn.textContent = allCollapsed ? 'Развернуть все' : 'Свернуть все';
    btn.disabled = goals.length === 0;
  }

  function renderCalendar() {
    const y = state.calYear, m = state.calMonth;
    document.getElementById('calTitle').textContent = MONTHS[m] + ' ' + y;
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const startDow = (first.getDay() + 6) % 7;
    const daysInMonth = last.getDate();
    const byDate = {};
    state.goals.forEach(function (g) {
      if (g.archivedAt) return;
      if (g.deadline && !g.isInbox) { if (!byDate[g.deadline]) byDate[g.deadline] = { goals: 0, tasks: 0, overdue: 0 }; byDate[g.deadline].goals++; }
      g.tasks.forEach(function (t) { if (t.archivedAt || !t.deadline) return; if (!byDate[t.deadline]) byDate[t.deadline] = { goals: 0, tasks: 0, overdue: 0 }; byDate[t.deadline].tasks++; if (!t.done && isOverdue(t)) byDate[t.deadline].overdue++; });
    });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayISO = dateToISO(today);

    // Карточки своих вкладок с датой
    if (Array.isArray(state.customTabs)) {
      state.customTabs.forEach(function (tab) {
        (tab.cards || []).forEach(function (c) {
          if (!c.dueDate || c.done) return;
          if (!byDate[c.dueDate]) byDate[c.dueDate] = { goals: 0, tasks: 0, overdue: 0 };
          byDate[c.dueDate].tasks++;
          if (c.dueDate < todayISO) byDate[c.dueDate].overdue++;
        });
      });
    }

    const cells = [];
    ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].forEach(function (dow) { cells.push('<div class="cal-dow">' + dow + '</div>'); });
    for (let i = 0; i < startDow; i++) cells.push('<div class="cal-cell empty"></div>');
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(y, m, d);
      const iso = dateToISO(dt);
      const isToday = iso === todayISO;
      const isSelected = state.calSelectedDate === iso;
      const info = byDate[iso] || { goals: 0, tasks: 0, overdue: 0 };
            const cls = ['cal-cell'];
      if (isToday) cls.push('today');
      if (isSelected) cls.push('selected');
      if (info.tasks > 0 || info.goals > 0) cls.push('has-items');
      if (info.overdue > 0) cls.push('has-overdue-items');
      let dots = '';
      const totalDots = Math.min(info.tasks + info.goals, 6);
      let dotsAdded = 0;
      for (let i = 0; i < Math.min(info.overdue, totalDots - dotsAdded); i++) { dots += '<span class="cal-dot overdue"></span>'; dotsAdded++; }
      for (let i = 0; i < Math.min(info.tasks - info.overdue, totalDots - dotsAdded); i++) { dots += '<span class="cal-dot task"></span>'; dotsAdded++; }
      for (let i = 0; i < Math.min(info.goals, totalDots - dotsAdded); i++) { dots += '<span class="cal-dot goal"></span>'; dotsAdded++; }
      cells.push('<div class="' + cls.join(' ') + '" data-date="' + iso + '"><div class="cal-daynum">' + d + '</div>' + (dots ? '<div class="cal-dots">' + dots + '</div>' : '') + '</div>');
    }
    const totalCells = startDow + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let i = 0; i < remaining; i++) cells.push('<div class="cal-cell empty"></div>');
    document.getElementById('calGrid').innerHTML = cells.join('');
    const info = document.getElementById('calInfo');
    if (state.calSelectedDate) { const cnt = byDate[state.calSelectedDate] || { goals: 0, tasks: 0, overdue: 0 }; info.innerHTML = '<span>' + formatDate(state.calSelectedDate) + ': <b>' + cnt.tasks + '</b> задач' + (cnt.goals ? ', <b>' + cnt.goals + '</b> целей' : '') + '</span><button class="clear-day-btn" data-action="clear-day">Показать все</button>'; }
    else info.innerHTML = '<span class="muted">Клик по дню — фильтр задач</span>';
  }
  function calPrev() { state.calMonth--; if (state.calMonth < 0) { state.calMonth = 11; state.calYear--; } renderCalendar(); }
  function calNext() { state.calMonth++; if (state.calMonth > 11) { state.calMonth = 0; state.calYear++; } renderCalendar(); }
  function calToday() { const d = new Date(); state.calYear = d.getFullYear(); state.calMonth = d.getMonth(); state.calSelectedDate = dateToISO(d); renderCalendar(); renderTasks(); syncQuickHint(); }
  function selectCalendarDay(iso) { state.calSelectedDate = state.calSelectedDate === iso ? null : iso; renderCalendar(); renderTasks(); syncQuickHint(); }
  function clearDateFilter() { state.calSelectedDate = null; renderCalendar(); renderTasks(); syncQuickHint(); }

    // === УПРАВЛЕНИЕ ВКЛАДКАМИ (логика окна) ===
    function openTabsManageModal() {
    _confirmDeleteCustomTabId = null;
    renderTabsManageList();
    const m = document.getElementById('tabsManageModal');
    if (m) m.hidden = false;
  }
  function closeTabsManageModal() {
    const m = document.getElementById('tabsManageModal');
    if (m) m.hidden = true;
  }
     function renderTabsManageList() {
    const box = document.getElementById('tabsManageList');
    if (!box) return;
    let html = state.tabs.map(function (t, i) {
      const upDis = i === 0 ? ' disabled' : '';
      const dnDis = i === state.tabs.length - 1 ? ' disabled' : '';
      return '<div class="tabs-manage-row" data-tab-id="' + escapeHtml(t.id) + '">' +
        '<input type="checkbox" data-action="tab-toggle-visible" ' + (t.visible ? 'checked' : '') + ' title="Показывать вкладку" />' +
        '<input type="text" class="icon-input" data-action="tab-icon" value="' + escapeHtml(t.icon) + '" maxlength="4" title="Иконка" />' +
        '<input type="text" class="label-input" data-action="tab-label" value="' + escapeHtml(t.label) + '" maxlength="30" title="Название" />' +
        '<div class="order-btns">' +
          '<button type="button" data-action="tab-move-up" title="Выше"' + upDis + '>↑</button>' +
          '<button type="button" data-action="tab-move-down" title="Ниже"' + dnDis + '>↓</button>' +
        '</div>' +
      '</div>';
    }).join('');

    if (Array.isArray(state.customTabs) && state.customTabs.length) {
      html += '<div style="font-size:11px;font-weight:700;color:var(--muted);padding:14px 0 6px;text-transform:uppercase;letter-spacing:.05em;">✨ Свои вкладки</div>';
      html += state.customTabs.map(function (t) {
        const isConfirming = _confirmDeleteCustomTabId === t.id;
        let delButtons;
        if (isConfirming) {
          delButtons =
            '<button type="button" class="danger" data-action="custom-tab-delete-confirm" title="Да, удалить" style="padding:4px 10px; font-weight:700;">✓</button>' +
            '<button type="button" data-action="custom-tab-delete-cancel" title="Отмена" style="padding:4px 10px;">✕</button>';
        } else {
          delButtons =
            '<button type="button" class="danger" data-action="custom-tab-delete-ask" title="Удалить вкладку" style="padding:4px 10px;">🗑</button>';
        }
        return '<div class="tabs-manage-row" data-custom-tab-id="' + escapeHtml(t.id) + '">' +
          '<span style="display:inline-block;width:18px;text-align:center;color:var(--muted);">⭐</span>' +
          '<input type="text" class="icon-input" data-action="custom-tab-icon" value="' + escapeHtml(t.icon || '⭐') + '" maxlength="4" />' +
          '<input type="text" class="label-input" data-action="custom-tab-label" value="' + escapeHtml(t.label || '') + '" maxlength="30" />' +
          '<div class="order-btns">' + delButtons + '</div>' +
        '</div>';
      }).join('');
    }
    box.innerHTML = html;
  }
  // === ШТОРКИ НА ТЕЛЕФОНЕ: свайп вниз для закрытия модалок ===
// На ПК ничего не делает. На телефоне — если потянуть модалку
// вниз больше чем на 80px, она закроется.
function initMobileSheetSwipe() {
  var isMobile = function () { return window.matchMedia('(max-width: 700px)').matches; };

  document.addEventListener('touchstart', function (e) {
    if (!isMobile()) return;
    var modal = e.target.closest('.modal-backdrop:not([hidden]) .modal');
    if (!modal) return;
    // Не мешаем свайпам по скроллящимся элементам
    if (e.target.closest('input, textarea, select, .modal-body[style*="overflow"], [data-no-swipe]')) return;

    var startY = e.touches[0].clientY;
    var startX = e.touches[0].clientX;
    var currentY = 0;
    var dragging = false;
    var decided = false;   // решили ли, что это свайп вниз, а не что-то другое

    function onMove(ev) {
      if (ev.touches.length !== 1) return;
      var dy = ev.touches[0].clientY - startY;
      var dx = ev.touches[0].clientX - startX;

      if (!decided) {
        if (Math.abs(dy) < 6 && Math.abs(dx) < 6) return;
        // Если движение больше по горизонтали — отменяем
        if (Math.abs(dx) > Math.abs(dy)) { decided = true; dragging = false; return; }
        // Если тянем вверх — не закрываем
        if (dy < 0) { decided = true; dragging = false; return; }
        decided = true;
        dragging = true;
        modal.style.transition = 'none';
      }
      if (!dragging) return;
      currentY = Math.max(0, dy);
      modal.style.transform = 'translateY(' + currentY + 'px)';
      // Затемнение подстраиваем
      var bd = modal.closest('.modal-backdrop');
      if (bd) {
        var k = Math.min(1, currentY / 300);
        bd.style.background = 'rgba(0,0,0,' + (0.55 * (1 - k)).toFixed(3) + ')';
      }
      if (currentY > 10) {
        // Не даём странице скроллиться под свайпом
        ev.preventDefault();
      }
    }

    function onEnd() {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
      if (!dragging) return;
      modal.style.transition = '';
      var bd = modal.closest('.modal-backdrop');
      var threshold = 80;
      if (currentY > threshold) {
        // Закрываем — плавно уезжает вниз и скрываем
        modal.style.transform = 'translateY(100%)';
        if (bd) bd.style.background = 'rgba(0,0,0,0)';
        setTimeout(function () {
          if (bd) { bd.hidden = true; bd.style.background = ''; }
          modal.style.transform = '';
        }, 260);
      } else {
        // Возврат на место
        modal.style.transform = 'translateY(0)';
        if (bd) bd.style.background = '';
      }
      dragging = false;
      decided = false;
      currentY = 0;
    }

    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);
  }, { passive: true });
}

 // === ПРАВАЯ ПАНЕЛЬ: переключаемые разделы ===
function switchSidePanel(name) {
  if (['calendar','today','notes'].indexOf(name) === -1) name = 'calendar';
  state.sidePanel = name;
  savePrefs();
  document.querySelectorAll('#sidePanelTabs .side-tab').forEach(function (b) {
    b.classList.toggle('active', b.dataset.sidePanel === name);
  });
  document.querySelectorAll('.side-panel-body').forEach(function (el) {
    el.hidden = el.dataset.sidePanelBody !== name;
  });
  if (name === 'calendar') renderCalendar();
  if (name === 'today') renderSidePanelToday();
  if (name === 'notes') renderSidePanelNotes();
}

function renderSidePanelToday() {
  const box = document.getElementById('sideTodayList');
  if (!box) return;
  const items = getTodayTasks();
  if (!items.length) {
    box.innerHTML = '<div class="side-list-empty">На сегодня пусто ✨</div>';
    return;
  }
  box.innerHTML = items.map(function (it) {
    const t = it.task, g = it.goal;
    const meta = [];
    if (!g.isInbox) meta.push('<span class="tag">' + escapeHtml(g.title) + '</span>');
    if (it.overdue) meta.push('<span class="overdue">просрочено</span>');
    if (t.priority === 'high') meta.push('высокий');
    if (t.deadline) meta.push(relativeDate(t.deadline));
    return '<div class="side-item" data-action="side-open-task" data-goal-id="' + escapeHtml(g.id) + '" data-task-id="' + escapeHtml(t.id) + '">' +
      '<div class="side-item-text">' + escapeHtml(t.text) + '</div>' +
      (meta.length ? '<div class="side-item-meta">' + meta.join(' · ') + '</div>' : '') +
    '</div>';
  }).join('');
}

function renderSidePanelNotes() {
  const box = document.getElementById('sideNotesList');
  if (!box) return;
  const notes = state.notes.slice().sort(function (a, b) { return b.updatedAt - a.updatedAt; }).slice(0, 10);
  let html = '<div class="side-add-input">' +
    '<input type="text" id="sideNoteQuickInput" placeholder="Новая заметка…" />' +
    '<button type="button" id="sideNoteAddBtn">+</button>' +
  '</div>';
  if (!notes.length) {
    html += '<div class="side-list-empty">Пока нет заметок</div>';
  } else {
    html += '<div class="side-list">' + notes.map(function (n) {
      return '<div class="side-item" data-action="side-open-note" data-id="' + escapeHtml(n.id) + '">' +
        '<div class="side-item-text">' + escapeHtml(n.title || 'Без названия') + '</div>' +
        '<div class="side-item-meta">' + formatDateTime(n.updatedAt) + '</div>' +
      '</div>';
    }).join('') + '</div>';
  }
  box.innerHTML = html;

  const inp = document.getElementById('sideNoteQuickInput');
  const btn = document.getElementById('sideNoteAddBtn');
  function addQuickNote() {
    const v = (inp.value || '').trim();
    if (!v) return;
    addNote({ title: v.slice(0, 200), body: '' });
    inp.value = '';
    renderSidePanelNotes();
  }
  if (btn) btn.addEventListener('click', addQuickNote);
  if (inp) inp.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); addQuickNote(); }
  });
}
  
function toggleCalendar() { state.calendarVisible = !state.calendarVisible; savePrefs(); applyCalendarVisibility(); if (state.calendarVisible) renderCalendar(); syncQuickHint(); }
  function applyCalendarVisibility() { const shell = document.getElementById('appShell'); const btn = document.getElementById('calToggle'); if (shell) shell.classList.toggle('with-cal', !!state.calendarVisible); if (btn) btn.classList.toggle('active', !!state.calendarVisible); }

  function toggleMassMode() { state.massMode = !state.massMode; if (!state.massMode) state.massSelected = {}; document.getElementById('massModeToggle').textContent = state.massMode ? '☒ Отменить' : '☑ Выбрать'; document.getElementById('massModeToggle').classList.toggle('active', state.massMode); renderTasks(); }
  function toggleMassCheck(goalId, taskId) { if (state.massSelected[taskId]) delete state.massSelected[taskId]; else state.massSelected[taskId] = { goalId: goalId }; renderTasks(); }
          function massAction(action) {
    const ids = Object.keys(state.massSelected);
    if (!ids.length) return;
    if (action === 'export') { exportSelectedTasks(); return; }
    if (action === 'delete') {
      pgtConfirm({ title: 'Удалить выбранные задачи?', message: 'Выбрано ' + ids.length + ' задач. Они будут удалены безвозвратно.', yesLabel: 'Да, удалить', onYes: function(){ massActionApply('delete'); } });
      return;
    }
    if (action === 'archive') {
      pgtConfirm({ title: 'Переместить в архив?', message: 'Выбрано ' + ids.length + ' задач.', yesLabel: 'В архив', danger: false, onYes: function(){ massActionApply('archive'); } });
      return;
    }
    massActionApply(action);
  }
   function massActionApply(action) {
    const ids = Object.keys(state.massSelected);
    if (!ids.length) return;
    const snapshot = [];
    ids.forEach(function (taskId) { const info = state.massSelected[taskId]; const g = findGoal(info.goalId); if (!g) return; const t = g.tasks.find(function (x) { return x.id === taskId; }); if (!t) return; snapshot.push({ goalId: info.goalId, task: JSON.parse(JSON.stringify(t)) }); if (action === 'delete') g.tasks = g.tasks.filter(function (x) { return x.id !== taskId; }); else if (action === 'archive') { t.archivedAt = Date.now(); if (!t.done) t.done = true; } else if (action === 'done') t.done = true; });
    saveData(); state.massSelected = {}; render();
    if (action === 'delete' || action === 'archive') pushUndo(function () { snapshot.forEach(function (s) { const g = findGoal(s.goalId); if (g) g.tasks.push(s.task); }); saveData(); render(); }, 'массовое ' + (action === 'delete' ? 'удаление' : 'архивирование'));
    showToast('Обработано: ' + ids.length + ' задач', 'ok');
  }

  // === МАССОВАЯ ПРАВКА: приоритет / дедлайн / тег / цель ===
  function massSetPriority() {
    const ids = Object.keys(state.massSelected);
    if (!ids.length) return;
    const ans = prompt('Новый приоритет для ' + ids.length + ' задач:\n\nhigh = высокий\nmedium = средний\nlow = низкий', 'medium');
    if (ans === null) return;
    const v = String(ans).trim().toLowerCase();
    if (['high','medium','low'].indexOf(v) === -1) { showToast('Неверное значение. Введите high, medium или low.', 'warn', null, null, 4000); return; }
    let n = 0;
    ids.forEach(function (taskId) {
      const info = state.massSelected[taskId];
      const g = findGoal(info.goalId); if (!g) return;
      const t = g.tasks.find(function (x) { return x.id === taskId; }); if (!t) return;
      t.priority = v; n++;
    });
    saveData(); render();
    showToast('Приоритет обновлён: ' + n, 'ok');
  }

  function massSetDeadline() {
    const ids = Object.keys(state.massSelected);
    if (!ids.length) return;
    const ans = prompt('Новый дедлайн (ГГГГ-ММ-ДД). Пусто = убрать дедлайн.\nПример: 2026-12-31', '');
    if (ans === null) return;
    const v = String(ans).trim();
    if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) { showToast('Неверный формат. Нужно ГГГГ-ММ-ДД', 'warn', null, null, 4000); return; }
    let n = 0;
    ids.forEach(function (taskId) {
      const info = state.massSelected[taskId];
      const g = findGoal(info.goalId); if (!g) return;
      const t = g.tasks.find(function (x) { return x.id === taskId; }); if (!t) return;
      t.deadline = v; n++;
    });
    saveData(); render();
    showToast('Дедлайн обновлён: ' + n, 'ok');
  }

  function massAddTag() {
    const ids = Object.keys(state.massSelected);
    if (!ids.length) return;
    const ans = prompt('Добавить тег (без #). Например: работа', '');
    if (ans === null) return;
    const v = String(ans).replace(/^#+/, '').trim().toLowerCase();
    if (!v) { showToast('Пустой тег', 'warn'); return; }
    let n = 0;
    ids.forEach(function (taskId) {
      const info = state.massSelected[taskId];
      const g = findGoal(info.goalId); if (!g) return;
      const t = g.tasks.find(function (x) { return x.id === taskId; }); if (!t) return;
      if (!Array.isArray(t.tags)) t.tags = [];
      if (t.tags.indexOf(v) === -1) { t.tags.push(v); n++; }
    });
    saveData(); render();
    showToast('Тег «#' + v + '» добавлен к ' + n + ' задачам', 'ok');
  }

  function massMoveGoal() {
    const ids = Object.keys(state.massSelected);
    if (!ids.length) return;
    const goals = state.goals.filter(function (g) { return !g.archivedAt && !g.isInbox; });
    const list = goals.map(function (g, i) { return (i + 1) + '. ' + g.title; }).join('\n');
    const ans = prompt('В какую цель перенести ' + ids.length + ' задач?\n\n0 = без цели (в «Быстрые задачи»)\n\n' + list, '0');
    if (ans === null) return;
    const num = parseInt(ans, 10);
    if (isNaN(num) || num < 0 || num > goals.length) { showToast('Неверный номер', 'warn'); return; }
    const target = num === 0 ? ensureInboxGoal() : goals[num - 1];
    if (!target) return;
    let n = 0;
    ids.forEach(function (taskId) {
      const info = state.massSelected[taskId];
      const src = findGoal(info.goalId); if (!src) return;
      if (src.id === target.id) return;
      const t = src.tasks.find(function (x) { return x.id === taskId; }); if (!t) return;
      src.tasks = src.tasks.filter(function (x) { return x.id !== taskId; });
      target.tasks.push(t);
      n++;
    });
    state.massSelected = {};
    saveData(); render();
    showToast('Перенесено: ' + n + ' → ' + target.title, 'ok');
  }
 
  function exportData() { const blob = new Blob([JSON.stringify({ goals: state.goals, folders: state.folders, snippets: state.snippets, notes: state.notes, templates: state.templates }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'backup_' + new Date().toISOString().slice(0, 10) + '.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }
  function importData(e) {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = function () {
      try {
        const parsed = JSON.parse(r.result);
        if (!parsed || !Array.isArray(parsed.goals)) { alert('Неверный формат'); return; }
   makeBackup('before-json-import').catch(function () {});
        state.goals = parsed.goals.map(normalizeGoal).filter(Boolean);
        if (parsed.folders && typeof parsed.folders === 'object') { SECTIONS.forEach(function (s) { if (parsed.folders[s] && typeof parsed.folders[s] === 'object') state.folders[s] = { name: String(parsed.folders[s].name || ''), files: Array.isArray(parsed.folders[s].files) ? parsed.folders[s].files.filter(function (f) { return f && typeof f.name === 'string'; }) : [], updatedAt: typeof parsed.folders[s].updatedAt === 'number' ? parsed.folders[s].updatedAt : null, needsPermission: false, defaultName: state.folders[s].defaultName }; }); }
        if (Array.isArray(parsed.snippets)) { state.snippets = parsed.snippets.map(normalizeSnippet).filter(Boolean); saveSnippets(); }
        if (Array.isArray(parsed.notes)) { state.notes = parsed.notes.map(normalizeNote).filter(Boolean); saveNotes(); }
                if (Array.isArray(parsed.templates)) { state.templates = parsed.templates; }
        state.collapsed = {}; saveData(); savePrefs(); resetGoalForm(); resetTaskForm(); render();
      } catch (err) { alert('Ошибка: ' + err.message); }
    };
    r.readAsText(file); e.target.value = '';
  }
        function clearAllData() {
    pgtConfirm({
      title: 'Удалить все данные?',
      message: 'Будут удалены: цели, задачи, заметки, цитаты, привычки, кэшированные файлы и резервные копии. Перед удалением автоматически создастся бэкап.',
      yesLabel: 'Удалить всё',
      onYes: function () {
        makeBackup('before-clear').then(async function () {
      // 1. Отменяем все отложенные сохранения, чтобы они не вернули данные
      clearTimeout(_saveDataTimer);
      clearTimeout(_savePrefsTimer);
      clearTimeout(_saveSnippetsTimer);
      clearTimeout(_saveNotesTimer);
      _saveDataTimer = _savePrefsTimer = _saveSnippetsTimer = _saveNotesTimer = null;
      _lastDataHash = '';
      _lastPrefsHash = '';

            // 2. Чистим ТОЛЬКО данные текущего пользователя (через сырое API)
      try {
        const uid = window.__pgtRawStorage.get('pgt_v25_current_user') || '';
        const suffix = uid ? '_' + uid : '';
            const KEEP = {
          'pgt_v25_current_user': 1, 'pgt_v25_had_login': 1,
          'pgt_v25_google_token': 1, 'pgt_v25_user_email': 1,
          'pgt_v25_known_users': 1,
          'pgt_v25_pin_hash': 1, 'pgt_v25_pin_salt': 1, 'pgt_v25_pin_len': 1,
          'pgt_v25_pin_attempts': 1, 'pgt_v25_pin_lock_until': 1, 'pgt_v25_pin_lock_level': 1
        };
        // bundle чистим вместе с остальными ключами текущего пользователя
        window.__pgtRawStorage.keys().forEach(function (k) {
          if (k.indexOf('pgt_v25_') !== 0) return;
          if (KEEP[k]) return;
          if (suffix && k.slice(-suffix.length) === suffix) {
            window.__pgtRawStorage.remove(k);
          }
        });
      } catch (e) {}
      try { sessionStorage.removeItem('pgt_v25_unlocked'); } catch (e) {}

      // 3. Чистим IndexedDB: handles, index, backups, files
      await idbClear(IDB_HANDLES);
      await idbClear(IDB_INDEX);
      await idbClear(IDB_BACKUPS);
      try { await storageClearAll(); } catch (e) { console.warn('[clear files]', e); }

      // 4. Сбрасываем состояние в памяти
      SECTIONS.forEach(function (s) {
        cleanupPdf(s);
        runtime[s].handle = null;
        runtime[s].fileCache.clear();
        runtime[s].selected = null;
      });
      state.goals = []; state.snippets = []; state.notes = []; state.templates = []; state.habits = [];
      state.folders = { articles: emptySection('Статьи'), books: emptySection('Книги') };
      state.collapsed = {};
      state.colorTotal = DEFAULT_TOTAL_COLOR;
      state.colorDone = DEFAULT_DONE_COLOR;
      state.favorites = { articles: {}, books: {} };
      state.readingPos = { articles: {}, books: {} };
      state.pdfPage = { articles: {}, books: {} };
      state.pdfZoom = { articles: 100, books: 100 };
      state.pdfInvert = { articles: false, books: false };
      state.litSort = { articles: 'name', books: 'name' };
      state.litFavFilter = { articles: false, books: false };
      state.listHidden = { articles: false, books: false };
      state.readerOnly = { articles: false, books: false };
      state.calSelectedDate = null;
      state.massMode = false; state.massSelected = {};
      state.massModeGoals = false; state.massSelectedGoals = {};
      state.tagFilter = '';
      state.ui = { search: '', filter: 'all', sort: 'deadline', tab: 'active', activeTab: 'goals', litTab: 'articles', litSearch: { articles: '', books: '' }, snippetsSearch: '', snippetsSort: 'new', snippetsTagFilter: '', snippetsGroup: 'flat', notesSearch: '' };

      // 5. Перерисовываем
      resetGoalForm();
      resetTaskForm();
      applyColors();
      syncToolbarInputs();
      render();
      SECTIONS.forEach(renderReaderEmpty);
      if (typeof renderBackupList === 'function') renderBackupList();
      if (typeof renderCacheStats === 'function') renderCacheStats();

            showToast('Все данные удалены. Страница будет перезагружена.', 'ok', null, null, 2500);
      setTimeout(function () { location.reload(); }, 2500);
        }).catch(function (e) {
          showToast('Ошибка при очистке: ' + (e.message || e), 'error');
        });
      }
    });
  }

  // === ПОИСКОВЫЙ ИНДЕКС ===
  function rebuildSearchIndex() {
    searchIndex = [];
    state.goals.forEach(function (g) {
      if (g.archivedAt) return;
      if (!g.isInbox) searchIndex.push({ type: 'goal', id: g.id, title: g.title, desc: g.description, haystack: (g.title + ' ' + g.description).toLowerCase() });
      g.tasks.forEach(function (t) {
        if (t.archivedAt) return;
           searchIndex.push({ type: 'task', goalId: g.id, id: t.id, title: t.text, desc: (g.isInbox ? '' : g.title) + (t.deadline ? ' · ' + formatDate(t.deadline) : ''), haystack: (t.text + ' ' + (t.tags || []).join(' ') + ' ' + g.title).toLowerCase() });
      });
    });
    state.snippets.forEach(function (s) { searchIndex.push({ type: 'snippet', id: s.id, title: s.text.slice(0, 140), desc: s.fileName || '', haystack: ((s.text || '') + ' ' + (s.note || '') + ' ' + (s.fileName || '') + ' ' + (s.tags || []).join(' ')).toLowerCase() }); });
    state.notes.forEach(function (n) { searchIndex.push({ type: 'note', id: n.id, title: n.title, desc: n.body.slice(0, 120), haystack: (n.title + ' ' + n.body + ' ' + (n.tags || []).join(' ')).toLowerCase() }); });
    SECTIONS.forEach(function (sec) { state.folders[sec].files.forEach(function (f) { searchIndex.push({ type: 'file', section: sec, name: f.name, title: f.name, desc: sec === 'articles' ? 'Статья' : 'Книга', haystack: f.name.toLowerCase() }); }); });
  }

  // === МАССОВЫЕ ОПЕРАЦИИ С ЦЕЛЯМИ ===
  function toggleMassModeGoals() {
    state.massModeGoals = !state.massModeGoals;
    if (!state.massModeGoals) state.massSelectedGoals = {};
    const btn = document.getElementById('massModeGoalsToggle');
    if (btn) { btn.textContent = state.massModeGoals ? '☒ Отменить' : '☑ Выбрать'; btn.classList.toggle('active', state.massModeGoals); }
    renderGoals();
  }
  function toggleMassCheckGoal(goalId) {
    if (state.massSelectedGoals[goalId]) delete state.massSelectedGoals[goalId];
    else state.massSelectedGoals[goalId] = true;
    renderGoals();
  }
        function massActionGoals(action) {
    const ids = Object.keys(state.massSelectedGoals);
    if (!ids.length) return;
    if (action === 'delete') {
      pgtConfirm({ title: 'Удалить выбранные цели?', message: 'Выбрано ' + ids.length + ' целей. Они и все их задачи будут удалены безвозвратно.', yesLabel: 'Да, удалить', onYes: function(){ massActionGoalsApply('delete'); } });
      return;
    }
    if (action === 'archive') {
      pgtConfirm({ title: 'Завершить выбранные цели?', message: 'Выбрано ' + ids.length + ' целей. Они уйдут в архив.', yesLabel: 'Завершить', danger: false, onYes: function(){ massActionGoalsApply('archive'); } });
      return;
    }
    massActionGoalsApply(action);
  }
  function massActionGoalsApply(action) {
    const ids = Object.keys(state.massSelectedGoals);
    if (!ids.length) return;
    const snapshot = ids.map(function (id) { const g = findGoal(id); return g ? JSON.parse(JSON.stringify(g)) : null; }).filter(Boolean);
    ids.forEach(function (id) {
      const g = findGoal(id); if (!g) return;
      if (action === 'delete') {
        const idx = state.goals.indexOf(g);
        if (idx !== -1) state.goals.splice(idx, 1);
        delete state.collapsed[id];
      } else if (action === 'archive') {
        g.tasks.forEach(function (t) { if (!t.archivedAt) { t.done = true; } });
        g.archivedAt = Date.now();
      }
    });
    state.massSelectedGoals = {};
    saveData(); render();
    pushUndo(function () {
      snapshot.forEach(function (g) {
        if (action === 'delete') { if (!findGoal(g.id)) state.goals.push(g); }
        else if (action === 'archive') { const cur = findGoal(g.id); if (cur) cur.archivedAt = null; }
      });
      saveData(); render();
    }, 'массовое ' + action + ' целей');
    showToast('Обработано: ' + ids.length, 'ok');
  }

  // === ПИН ===
  function togglePinTask(goalId, taskId) {
    const g = findGoal(goalId); if (!g) return;
    const t = g.tasks.find(function (x) { return x.id === taskId; }); if (!t) return;
    t.pinned = !t.pinned; saveData(); render();
  }
    function togglePinGoal(goalId) {
    const g = findGoal(goalId); if (!g) return;
    g.pinned = !g.pinned; saveData(); render();
  }

  // === ДУБЛИРОВАНИЕ ЗАДАЧИ ===
  function duplicateTask(goalId, taskId) {
    const g = findGoal(goalId); if (!g) return;
    const t = g.tasks.find(function (x) { return x.id === taskId; }); if (!t) return;
    const copy = JSON.parse(JSON.stringify(t));
    copy.id = uid();
    copy.done = false;
    copy.doneAt = null;
    copy.status = 'todo';
    copy.archivedAt = null;
    copy.pinned = false;
    copy.createdAt = Date.now();
    if (Array.isArray(copy.subtasks)) {
      copy.subtasks.forEach(function (s) {
        s.id = uid(); s.done = false; s.createdAt = Date.now();
      });
    }
    copy.text = (copy.text || '').slice(0, 950) + ' (копия)';
    const idx = g.tasks.indexOf(t);
    g.tasks.splice(idx + 1, 0, copy);
    saveData(); render();
    showToast('Задача продублирована', 'ok');
  }

  // === ДУБЛИРОВАНИЕ ЦЕЛИ ===
  function duplicateGoal(goalId) {
    const g = findGoal(goalId); if (!g) return;
    const copy = JSON.parse(JSON.stringify(g));
    copy.id = uid();
    copy.title = (copy.title || '').slice(0, 480) + ' (копия)';
    copy.archivedAt = null;
    copy.pinned = false;
    copy.createdAt = Date.now();
    copy.journal = [];
    if (Array.isArray(copy.tasks)) {
      copy.tasks.forEach(function (t) {
        t.id = uid();
        t.done = false; t.doneAt = null; t.status = 'todo';
        t.archivedAt = null; t.pinned = false; t.createdAt = Date.now();
        if (Array.isArray(t.subtasks)) {
          t.subtasks.forEach(function (s) { s.id = uid(); s.done = false; s.createdAt = Date.now(); });
        }
      });
    }
    if (Array.isArray(copy.milestones)) {
      copy.milestones.forEach(function (m) { m.id = uid(); m.done = false; m.createdAt = Date.now(); });
    }
    const idx = state.goals.indexOf(g);
    state.goals.splice(idx + 1, 0, copy);
    saveData(); render();
    showToast('Цель продублирована', 'ok');
  }

  // === ВАЛИДАЦИЯ ===
  function markInvalid(el) {
    if (!el) return;
    el.classList.add('invalid');
    try { el.focus(); } catch (e) {}
    setTimeout(function () { el.classList.remove('invalid'); }, 1600);
  }

  // === MARKDOWN + KATEX ===
  function sanitizeHtml(html) {
  const raw = String(html == null ? '' : html);
  if (!raw.trim()) return '';
  if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
    return window.DOMPurify.sanitize(raw, {
      ADD_ATTR: ['target', 'rel'],
      ADD_TAGS: ['math', 'semantics', 'annotation', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'msqrt', 'mroot', 'mtext', 'mspace', 'mover', 'munder', 'mtable', 'mtr', 'mtd', 'mstyle', 'menclose', 'mpadded', 'mphantom', 'merror'],
      ALLOW_DATA_ATTR: true,
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
    });
  }
  // Fallback — если DOMPurify по какой-то причине не загрузился (офлайн)
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/ on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript\s*:/gi, '');
}
  function renderMdText(text) {
    const t = String(text == null ? '' : text);
    if (!t.trim()) return '';
    if (window.marked && typeof window.marked.parse === 'function') {
      try { return sanitizeHtml(window.marked.parse(t)); } catch (e) { return escapeHtml(t); }
    }
    return escapeHtml(t);
  }
    function renderKatex(el) {
    if (!el) return;
    if (typeof el.__katexTries !== 'number') el.__katexTries = 0;
    if (!window.renderMathInElement) {
      el.__katexTries++;
      if (el.__katexTries > 10) {
        if (!el.__katexWarned) { el.__katexWarned = true; console.warn('[katex] renderMathInElement не загрузился за 3 сек — формулы не отрендерятся'); }
        return;
      }
      setTimeout(function () { renderKatex(el); }, 300);
      return;
    }
    try {
      window.renderMathInElement(el, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false,
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
      });
    } catch (e) {}
  }
  // === ПРИВЫЧКИ ===
  function findHabit(id) {
    for (let i = 0; i < state.habits.length; i++) if (state.habits[i].id === id) return state.habits[i];
    return null;
  }

  function habitStreak(h) {
    const set = {};
    (h.marks || []).forEach(function (m) { set[m] = true; });
    const d = new Date(); d.setHours(0, 0, 0, 0);
    const todayISO = dateToISO(d);
    if (!set[todayISO]) d.setDate(d.getDate() - 1);
    let streak = 0;
    while (set[dateToISO(d)]) { streak++; d.setDate(d.getDate() - 1); }
    return streak;
  }

  function habitBestStreak(h) {
    const marks = (h.marks || []).slice().sort();
    if (!marks.length) return 0;
    let best = 1, cur = 1;
    for (let i = 1; i < marks.length; i++) {
      const prev = new Date(marks[i - 1] + 'T00:00:00');
      const now = new Date(marks[i] + 'T00:00:00');
      const diff = Math.round((now - prev) / (24 * 60 * 60 * 1000));
      if (diff === 1) { cur++; if (cur > best) best = cur; }
      else if (diff > 1) { cur = 1; }
    }
    return best;
  }

  function toggleHabitToday(id) {
    const h = findHabit(id); if (!h) return;
    if (!Array.isArray(h.marks)) h.marks = [];
    const todayISO = dateToISO(new Date());
    const i = h.marks.indexOf(todayISO);
    if (i === -1) { h.marks.push(todayISO); showToast('Отмечено: ' + h.title, 'ok'); }
    else { h.marks.splice(i, 1); showToast('Снято: ' + h.title, 'warn'); }
    saveHabits();
    renderHabits();
  }

  function addHabitFromForm(title, icon) {
    const t = String(title || '').trim();
    if (!t) return;
    const newHabit = {
      id: 'h-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: t.slice(0, 200),
      icon: (String(icon || '').trim() || '🎯').slice(0, 4),
      marks: [],
      createdAt: Date.now()
    };
    state.habits.push(newHabit);
    saveHabits();
    renderHabits();
    showToast('Привычка добавлена', 'ok');
  }

  function deleteHabit(id) {
    const h = findHabit(id); if (!h) return;
    if (!confirm('Удалить привычку «' + h.title + '»? Все отметки будут потеряны.')) return;
    const idx = state.habits.indexOf(h);
    const snapshot = JSON.parse(JSON.stringify(h));
    state.habits.splice(idx, 1);
    saveHabits();
    renderHabits();
    pushUndo(function () { state.habits.splice(idx, 0, snapshot); saveHabits(); renderHabits(); }, 'удаление привычки');
  }

    function startEditHabit(id) {
    _editingHabitId = id;
    _confirmDeleteHabitId = null;
    renderHabits();
    setTimeout(function () {
      const inp = document.querySelector('[data-habit-edit-title]');
      if (inp) { inp.focus(); inp.select(); }
    }, 30);
  }
  function cancelHabitEdit() {
    _editingHabitId = null;
    renderHabits();
  }
  function saveHabitEdit(id) {
    const h = findHabit(id);
    if (!h) { _editingHabitId = null; renderHabits(); return; }
    const titleInput = document.querySelector('[data-habit-edit-title]');
    const iconInput = document.querySelector('[data-habit-edit-icon]');
    const title = (titleInput ? titleInput.value : '').trim();
    const icon = (iconInput ? iconInput.value : '').trim();
    if (!title) { showToast('Название не может быть пустым', 'warn'); if (titleInput) titleInput.focus(); return; }
    h.title = title.slice(0, 200);
    h.icon = (icon || '🎯').slice(0, 4);
    _editingHabitId = null;
    saveHabits();
    renderHabits();
    showToast('Привычка обновлена', 'ok');
  }
  function startDeleteHabit(id) {
    _confirmDeleteHabitId = id;
    _editingHabitId = null;
    renderHabits();
  }
  function cancelDeleteHabit() {
    _confirmDeleteHabitId = null;
    renderHabits();
  }
  function confirmDeleteHabit(id) {
    const h = findHabit(id);
    if (!h) { _confirmDeleteHabitId = null; renderHabits(); return; }
    const idx = state.habits.indexOf(h);
    const snapshot = JSON.parse(JSON.stringify(h));
    state.habits.splice(idx, 1);
    _confirmDeleteHabitId = null;
    saveHabits();
    renderHabits();
    pushUndo(function () { state.habits.splice(idx, 0, snapshot); saveHabits(); renderHabits(); }, 'удаление привычки');
    showToast('Привычка удалена', 'ok');
  }

  function renderHabits() {
    const list = document.getElementById('habitList');
    const yearBadge = document.getElementById('habitsYearBadge');
    if (!list) return;
    if (yearBadge) yearBadge.textContent = '📅 ' + new Date().getFullYear();
    if (!state.habits.length) {
      list.innerHTML = '<div class="habit-empty">Пока нет привычек. Добавьте первую — например, «Читать 30 минут каждый день».</div>';
      return;
    }
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const todayISO = dateToISO(now);
    const dowShort = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
    const todayDow = now.getDay();
    const monOff = (todayDow === 0 ? -6 : 1 - todayDow);
    const monday = new Date(now); monday.setDate(now.getDate() + monOff);

    list.innerHTML = state.habits.map(function (h) {
      const streak = habitStreak(h);
      const best = habitBestStreak(h);
      const total = (h.marks || []).length;
      const doneToday = (h.marks || []).indexOf(todayISO) !== -1;
      const markSet = {};
      (h.marks || []).forEach(function (m) { markSet[m] = true; });

      let weekHtml = '';
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday); d.setDate(monday.getDate() + i);
        const iso = dateToISO(d);
        const dow = dowShort[d.getDay()];
        const num = d.getDate();
        const isToday = iso === todayISO;
        const isDone = !!markSet[iso];
        const isFuture = d > now;
        const cls = 'habit-day' + (isDone ? ' done' : '') + (isToday ? ' today' : '') + (isFuture ? ' future' : '');
        const titleAttr = dow + ' ' + String(num).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear();
        weekHtml += '<div class="' + cls + '" title="' + titleAttr + '">' +
          '<span class="habit-day-dow">' + dow + '</span>' +
          '<span class="habit-day-num">' + String(num).padStart(2, '0') + '</span>' +
        '</div>';
      }

      const isEditing = _editingHabitId === h.id;
      const isConfirming = _confirmDeleteHabitId === h.id;

      let infoHtml;
      if (isEditing) {
        infoHtml = '<div class="habit-title-row">' +
          '<input type="text" class="habit-edit-icon" value="' + escapeHtml(h.icon || '🎯') + '" maxlength="4" data-habit-edit-icon />' +
          '<input type="text" class="habit-edit-input" value="' + escapeHtml(h.title) + '" data-habit-edit-title />' +
        '</div>' +
        '<div class="habit-stats">' +
          '<span class="streak">🔥 ' + streak + '</span>' +
          '<span class="best">🏆 ' + best + '</span>' +
          '<span>всего: ' + total + '</span>' +
        '</div>';
      } else {
        infoHtml = '<div class="habit-title-row">' +
          '<span class="habit-icon">' + escapeHtml(h.icon || '🎯') + '</span>' +
          '<span class="habit-title">' + escapeHtml(h.title) + '</span>' +
        '</div>' +
        '<div class="habit-stats">' +
          '<span class="streak">🔥 ' + streak + '</span>' +
          '<span class="best">🏆 ' + best + '</span>' +
          '<span>всего: ' + total + '</span>' +
        '</div>';
      }

      let actionsHtml;
      if (isEditing) {
        actionsHtml = '<div class="habit-actions">' +
          '<button type="button" class="icon-btn success" data-action="save-habit-edit" data-habit-id="' + escapeHtml(h.id) + '" title="Сохранить">✓</button>' +
          '<button type="button" class="icon-btn" data-action="cancel-habit-edit" data-habit-id="' + escapeHtml(h.id) + '" title="Отмена">✕</button>' +
        '</div>';
      } else if (isConfirming) {
        actionsHtml = '<div class="habit-actions">' +
          '<button type="button" class="icon-btn danger" data-action="confirm-delete-habit" data-habit-id="' + escapeHtml(h.id) + '" title="Удалить">✓ Удалить</button>' +
          '<button type="button" class="icon-btn" data-action="cancel-delete-habit" data-habit-id="' + escapeHtml(h.id) + '" title="Отмена">✕</button>' +
        '</div>';
      } else {
        actionsHtml = '<div class="habit-actions">' +
          '<button type="button" class="icon-btn" data-action="edit-habit" data-habit-id="' + escapeHtml(h.id) + '" title="Редактировать">✎</button>' +
          '<button type="button" class="icon-btn" data-action="delete-habit" data-habit-id="' + escapeHtml(h.id) + '" title="Удалить">✕</button>' +
        '</div>';
      }

      const cardCls = 'habit-card' + (doneToday ? ' done-today' : '') + (isEditing ? ' editing' : '') + (isConfirming ? ' confirming-delete' : '');
      const checkDisabled = (isEditing || isConfirming) ? ' disabled' : '';

      return '<div class="' + cardCls + '" data-habit-id="' + escapeHtml(h.id) + '">' +
        '<button type="button" class="habit-check' + (doneToday ? ' done' : '') + '" data-action="toggle-habit-today" data-habit-id="' + escapeHtml(h.id) + '" title="' + (doneToday ? 'Снять отметку на сегодня' : 'Отметить сегодня') + '"' + checkDisabled + '>✓</button>' +
        '<div class="habit-info">' + infoHtml + '</div>' +
        '<div class="habit-days-strip">' + weekHtml + '</div>' +
        actionsHtml +
      '</div>';
    }).join('');
  }

  // === DAILY NOTES ===
  function openDailyNote() {
    const todayISO = dateToISO(new Date());
    const title = 'Дневник ' + formatDate(todayISO);
    let existing = state.notes.find(function (n) { return n.title === title; });
    if (!existing) {
      const prevDay = new Date(); prevDay.setDate(prevDay.getDate() - 1);
      const prevTitle = 'Дневник ' + formatDate(dateToISO(prevDay));
      const prev = state.notes.find(function (n) { return n.title === prevTitle; });
      const body = '# ' + title + '\n\n' +
        (prev ? '## Незавершённое вчера\n\n' + ((prev.body.match(/- \[ \] .+/g) || []).join('\n')) + '\n\n' : '') +
        '## План на сегодня\n\n- [ ] \n\n## Сделано\n\n- \n\n## Заметки\n\n';
      existing = { id: uid(), title: title, body: body, tags: ['дневник'], goalId: null, createdAt: Date.now(), updatedAt: Date.now() };
      state.notes.push(existing); saveNotes();
    }
    switchTab('notes');
    state.editingNoteId = existing.id;
    renderNotesList(); renderNoteEditor();
    setTimeout(function () { const inp = document.getElementById('noteBodyInput'); if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); } }, 150);
  }

  // === ИМПОРТ CSV ===
  function parseCsv(text) {
    const rows = [];
    let cur = [], cell = '', inQ = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQ) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') inQ = false;
        else cell += c;
      } else {
        if (c === '"') inQ = true;
        else if (c === ',' || c === ';') { cur.push(cell); cell = ''; }
        else if (c === '\n' || c === '\r') {
          if (cell !== '' || cur.length) { cur.push(cell); rows.push(cur); cur = []; cell = ''; }
          if (c === '\r' && text[i + 1] === '\n') i++;
        } else cell += c;
      }
    }
    if (cell !== '' || cur.length) { cur.push(cell); rows.push(cur); }
    return rows;
  }
  function importFromCsv(text) {
    const rows = parseCsv(text).filter(function (r) { return r.some(function (c) { return c && c.trim(); }); });
    if (rows.length < 2) { showToast('CSV пустой или без заголовка', 'warn'); return; }
    const header = rows[0].map(function (h) { return h.trim().toLowerCase(); });
    const colText = header.findIndex(function (h) { return h === 'text' || h === 'задача' || h === 'task' || h === 'title'; });
    const colDeadline = header.findIndex(function (h) { return h === 'deadline' || h === 'дедлайн' || h === 'date' || h === 'дата'; });
    const colPriority = header.findIndex(function (h) { return h === 'priority' || h === 'приоритет'; });
    const colTags = header.findIndex(function (h) { return h === 'tags' || h === 'теги'; });
    const colGoal = header.findIndex(function (h) { return h === 'goal' || h === 'цель'; });
    if (colText === -1) { showToast('Не найдена колонка "text" в CSV', 'error'); return; }
    let added = 0;
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const text = (r[colText] || '').trim(); if (!text) continue;
      let deadline = colDeadline !== -1 ? (r[colDeadline] || '').trim() : '';
      if (deadline && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
        const m = deadline.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
        if (m) { let y = +m[3]; if (y < 100) y += 2000; deadline = y + '-' + String(m[2]).padStart(2, '0') + '-' + String(m[1]).padStart(2, '0'); }
        else deadline = '';
      }
      const priority = colPriority !== -1 ? (r[colPriority] || '').trim().toLowerCase() : 'medium';
      const p = (priority === 'высокий' || priority === 'high') ? 'high' : (priority === 'низкий' || priority === 'low') ? 'low' : 'medium';
      const tags = colTags !== -1 ? parseTags(r[colTags] || '') : [];
      let goalId = null;
      if (colGoal !== -1 && r[colGoal]) {
        const goalTitle = r[colGoal].trim();
        let g = state.goals.find(function (x) { return !x.archivedAt && x.title.toLowerCase() === goalTitle.toLowerCase(); });
        if (!g) { g = { id: uid(), title: goalTitle, description: '', priority: 'medium', deadline: '', isInbox: false, pinned: false, journal: [], archivedAt: null, createdAt: Date.now(), tasks: [] }; state.goals.push(g); }
        goalId = g.id;
      }
      addTask(goalId, { text: text, priority: p, deadline: deadline, tags: tags });
      added++;
    }
    saveData(); render();
    showToast('Импортировано задач: ' + added, 'ok');
  }

  // === ЭКСПОРТ .ICS ===
  function exportIcs() {
    const lines = [];
    const pad = function (n) { return String(n).padStart(2, '0'); };
    const stamp = function (d) { return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z'; };
    const now = stamp(new Date());
    lines.push('BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MyGoals//RU', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH');
    const esc = function (s) { return String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); };
    const addEvent = function (uid, dateISO, summary, description) {
      if (!dateISO) return;
      const [y, m, d] = dateISO.split('-').map(Number);
      const dtStart = y + pad(m) + pad(d);
      const next = new Date(y, m - 1, d + 1);
      const dtEnd = next.getFullYear() + pad(next.getMonth() + 1) + pad(next.getDate());
      lines.push('BEGIN:VEVENT');
      lines.push('UID:' + uid + '@mygoals');
      lines.push('DTSTAMP:' + now);
      lines.push('DTSTART;VALUE=DATE:' + dtStart);
      lines.push('DTEND;VALUE=DATE:' + dtEnd);
      lines.push('SUMMARY:' + esc(summary));
      if (description) lines.push('DESCRIPTION:' + esc(description));
      lines.push('END:VEVENT');
    };
    state.goals.forEach(function (g) {
      if (g.archivedAt) return;
      if (g.deadline && !g.isInbox) addEvent('goal-' + g.id, g.deadline, '🎯 ' + g.title, g.description || '');
      g.tasks.forEach(function (t) {
        if (t.archivedAt || !t.deadline) return;
             addEvent('task-' + t.id, t.deadline, '✓ ' + t.text, (g.isInbox ? '' : 'Цель: ' + g.title));
      });
    });
    lines.push('END:VCALENDAR');
    const content = lines.join('\r\n');
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'goals_' + new Date().toISOString().slice(0, 10) + '.ics';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    showToast('Экспортировано в .ics', 'ok');
  }

        // === Отложенный рендер (график, календарь, вкладки) ===
      let _deferredRenderTimer = null;
   function scheduleDeferredRender() {
    if (_deferredRenderTimer) cancelAnimationFrame(_deferredRenderTimer);
    _deferredRenderTimer = requestAnimationFrame(function () {
      _deferredRenderTimer = null;
      if (state.calendarVisible) renderCalendar();
      if (state.ui.tab === 'archive') renderArchive();
      if (state.ui.tab === 'literature') {
        SECTIONS.forEach(function (s) { renderMeta(s); renderList(s); applyListVisibility(s); });
      }
      if (state.ui.tab === 'notes') renderNotesList();
  if (state.ui.tab === 'analytics') renderAnalytics();
    });
  }

   function render() {
    // Если пользователь прямо сейчас печатает — не перерисовываем DOM целиком:
    // полная перерисовка выдёргивает каретку и может стереть недописанное.
    // Отложенная перерисовка (scheduleDeferredRender) догонит изменения позже.
    if (isTypingNow()) { scheduleDeferredRender(); return; }
    // Быстрый рендер — то, что видно сразу
    renderTabs();
    renderTagsDatalist(); renderTagFilterSelect();
    renderStats(); renderGoals(); renderTasks();
    if (state.ui.tab === 'today') renderDashboard();
    applyDensity();
    renderGoalSelect(); renderToggleAllButton();
    renderSectionCount(); updateSnippetsBadges();
    syncQuickHint();
    // Тяжёлое — на следующий тик (после того как браузер отпустит главный поток)
    scheduleDeferredRender();
  }
  async function uploadToDrive(section) {
    if (!window.__pgtDrive || !window.__pgtDrive.isSignedIn()) { showToast('Сначала войдите в Google', 'warn'); return; }
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.docx,.txt,.md,.markdown';
    input.onchange = async function () {
      if (!input.files || !input.files.length) return;
      let done = 0, failed = 0;
      for (const file of input.files) {
        if (!isSupportedFile(file.name)) continue;
        try {
          showToast('Загружаю: ' + file.name, 'ok', null, null, 1500);
          runtime[section].fileCache.set(file.name, file);
          await storageWrite(section, file.name, file);
          let f = state.folders[section].files.find(x => x.name === file.name);
          if (f) { f.size = file.size; f.lastModified = file.lastModified; f.remoteOnly = false; }
          else { state.folders[section].files.push({ name: file.name, ext: getExt(file.name), size: file.size, lastModified: file.lastModified, remoteOnly: false }); }
          const result = await window.__pgtDrive.uploadFile(section, file.name, file);
          if (result && result.id) {
            const fx = state.folders[section].files.find(x => x.name === file.name);
            if (fx) fx.driveId = result.id;
          }
          done++;
        } catch (e) { console.warn('[upload]', e); failed++; }
      }
      saveData(); renderList(section); renderSectionCount();
      showToast('Загружено: ' + done + (failed ? ', ошибок: ' + failed : ''), done ? 'ok' : 'warn');
      input.value = '';
    };
    input.click();
  }

  async function refreshFromDrive(section) {
    if (!window.__pgtDrive || !window.__pgtDrive.isSignedIn()) { showToast('Сначала войдите в Google', 'warn'); return; }
    showToast('Обновляю список из Drive…', 'ok');
    try {
      const remote = await window.__pgtDrive.listRemote(section);
      const byName = {};
      (remote || []).forEach(f => { byName[f.name] = f; });
      let added = 0, updated = 0;
      for (const name in byName) {
        const r = byName[name];
        const existing = state.folders[section].files.find(x => x.name === name);
        if (existing) {
          if (existing.driveId !== r.id) { existing.driveId = r.id; updated++; }
          if (typeof r.size === 'string' || typeof r.size === 'number') existing.size = parseInt(r.size, 10) || existing.size;
        } else {
          state.folders[section].files.push({ name: name, ext: getExt(name), size: parseInt(r.size, 10) || 0, lastModified: r.modifiedTime ? new Date(r.modifiedTime).getTime() : Date.now(), driveId: r.id, remoteOnly: true });
          added++;
        }
      }
      const toRemove = [];
      state.folders[section].files.forEach(f => { if (f.remoteOnly && f.driveId && !byName[f.name]) toRemove.push(f.name); });
      toRemove.forEach(n => { const idx = state.folders[section].files.findIndex(x => x.name === n); if (idx !== -1) state.folders[section].files.splice(idx, 1); });
      saveData(); renderList(section); renderSectionCount();
      showToast('Обновлено: +' + added + ' ~' + updated, 'ok');
    } catch (e) { console.warn('[refresh]', e); showToast('Ошибка обновления: ' + (e.message || e), 'error'); }
  }
      function moveTaskToGoal(oldGoalId, taskId, newGoalId) {
    const src = findGoal(oldGoalId);
    if (!src) return;
    const t = src.tasks.find(function (x) { return x.id === taskId; });
    if (!t) return;

    let target;
    if (!newGoalId) {
      target = ensureInboxGoal();
    } else {
      target = findGoal(newGoalId);
    }
    if (!target) return;
    if (target.id === src.id) return;

    src.tasks = src.tasks.filter(function (x) { return x.id !== taskId; });
    target.tasks.push(t);
    saveData();
    render();
    showToast('Задача перемещена в «' + target.title + '»', 'ok');
  }

  function initTaskToGoalDnD() {
    const container = document.getElementById('tasksList');
    if (!container) return;

    let panel = document.getElementById('goalDropPanel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'goalDropPanel';
      panel.className = 'goal-drop-panel';
      panel.hidden = true;
      panel.innerHTML = '<div class="goal-drop-title">Куда переместить задачу?</div><div class="goal-drop-list" id="goalDropList"></div>';
      document.body.appendChild(panel);
    }
    const list = panel.querySelector('#goalDropList');

    let dragging = null;
    let taskId = null;
    let oldGoalId = null;
    let startX = 0, startY = 0;
    let started = false;
    let ghost = null;
    let hoverBadge = null;
    let longPressTimer = null;
    let activePointerId = null;
    let blockNextClick = false;
    let panelShown = false;
    const THRESHOLD = 8;
    const LONG_PRESS_MS = 350;

    function buildList() {
      const goals = state.goals.filter(function (g) { return !g.archivedAt && !g.isInbox; });
      const parts = ['<div class="goal-drop-badge' + (!oldGoalId ? ' current' : '') + '" data-target-id="">🚀 Без цели</div>'];
      goals.forEach(function (g) {
        const cur = (g.id === oldGoalId) ? ' current' : '';
        parts.push('<div class="goal-drop-badge' + cur + '" data-target-id="' + escapeHtml(g.id) + '">🎯 ' + escapeHtml(g.title) + '</div>');
      });
      list.innerHTML = parts.join('');
    }

    function showPanel() {
      if (panelShown) return;
      panelShown = true;
      buildList();
      panel.hidden = false;
      requestAnimationFrame(function () { panel.classList.add('show'); });
    }

    function hidePanel() {
      panelShown = false;
      panel.classList.remove('show');
      setTimeout(function () { if (!panelShown) panel.hidden = true; }, 220);
    }

    function startDrag(x, y) {
      if (started || !dragging) return;
      started = true;
      dragging.classList.add('dragging');
      dragging.style.touchAction = 'none';
      window.__pgtTaskDragActive = true;
 document.body.classList.add('pgt-dragging');
      const rect = dragging.getBoundingClientRect();
      ghost = dragging.cloneNode(true);
      ghost.classList.add('drag-ghost');
      ghost.removeAttribute('data-action');
      ghost.querySelectorAll('[data-action]').forEach(function (el) { el.removeAttribute('data-action'); });
      ghost.style.position = 'fixed';
      ghost.style.width = rect.width + 'px';
      ghost.style.left = x + 'px';
      ghost.style.top = y + 'px';
      ghost.style.zIndex = '9999';
      ghost.style.transform = 'translate(-50%, -50%) rotate(2deg)';
      ghost.style.opacity = '0.9';
      ghost.style.boxShadow = '0 12px 32px rgba(0,0,0,.6)';
      document.body.appendChild(ghost);
      showPanel();
      if (navigator.vibrate) { try { navigator.vibrate(20); } catch (e) {} }
    }

    function endDrag() {
      clearTimeout(longPressTimer);
      longPressTimer = null;
      if (ghost) { ghost.remove(); ghost = null; }
      if (hoverBadge) { hoverBadge.classList.remove('hover'); hoverBadge = null; }
      if (dragging) {
        dragging.classList.remove('dragging');
        dragging.style.touchAction = '';
        dragging = null;
      }
      taskId = null;
      oldGoalId = null;
      started = false;
      activePointerId = null;
      window.__pgtTaskDragActive = false;
 document.body.classList.remove('pgt-dragging');
      hidePanel();
    }

    container.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.kanban-board')) return;
      const taskEl = e.target.closest('.task');
      if (!taskEl) return;
      if (e.target.closest('input, button, textarea, select, .subtask-add, .subtasks, .inline-task-form')) return;

      dragging = taskEl;
      taskId = taskEl.dataset.taskId;
      oldGoalId = taskEl.dataset.goalId;
      startX = e.clientX;
      startY = e.clientY;
      started = false;
      activePointerId = e.pointerId;
      hoverBadge = null;

      if (e.pointerType === 'touch') {
        const x0 = e.clientX, y0 = e.clientY;
        longPressTimer = setTimeout(function () { startDrag(x0, y0); }, LONG_PRESS_MS);
      }
    });

    document.addEventListener('pointermove', function (e) {
      if (!dragging || e.pointerId !== activePointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!started) {
        if (e.pointerType === 'touch') {
          if (dist > 12) { clearTimeout(longPressTimer); longPressTimer = null; endDrag(); }
          return;
        }
        if (dist < THRESHOLD) return;
        startDrag(e.clientX, e.clientY);
        if (!started) return;
      }

      if (ghost) {
        ghost.style.left = e.clientX + 'px';
        ghost.style.top = e.clientY + 'px';
      }

      const el = document.elementFromPoint(e.clientX, e.clientY);
      const badge = el ? el.closest('.goal-drop-badge') : null;
      if (badge !== hoverBadge) {
        if (hoverBadge) hoverBadge.classList.remove('hover');
        hoverBadge = badge;
        if (hoverBadge) hoverBadge.classList.add('hover');
      }
    });

    document.addEventListener('pointerup', function (e) {
      if (!dragging || e.pointerId !== activePointerId) return;
      if (started && hoverBadge && taskId && oldGoalId !== null) {
        const newGoalId = hoverBadge.dataset.targetId || '';
        if (newGoalId !== oldGoalId) {
          blockNextClick = true;
          setTimeout(function () { blockNextClick = false; }, 60);
          moveTaskToGoal(oldGoalId, taskId, newGoalId);
        }
      }
      endDrag();
    });

    document.addEventListener('pointercancel', function () {
      if (dragging) endDrag();
    });

    container.addEventListener('click', function (e) {
      if (blockNextClick) {
        e.stopPropagation();
        e.preventDefault();
        blockNextClick = false;
      }
    }, true);
  }

function initKanbanDnD() {
    const container = document.getElementById('tasksList');
    if (!container) return;

    let dragging = null;
    let dragTaskId = null;
    let dragGoalId = null;
    let startX = 0, startY = 0;
    let started = false;
    let ghost = null;
    let currentCol = null;
    let longPressTimer = null;
    let activePointerId = null;
    let blockNextClick = false;
    const THRESHOLD = 8;
    const LONG_PRESS_MS = 350;

    function startDrag(x, y) {
      if (started || !dragging) return;
      started = true;
      dragging.classList.add('dragging');
      dragging.style.touchAction = 'none';
      const rect = dragging.getBoundingClientRect();
      ghost = dragging.cloneNode(true);
      ghost.classList.add('drag-ghost');
      ghost.removeAttribute('data-action');
      ghost.querySelectorAll('[data-action]').forEach(function (el) { el.removeAttribute('data-action'); });
      ghost.style.position = 'fixed';
      ghost.style.width = rect.width + 'px';
      ghost.style.left = x + 'px';
      ghost.style.top = y + 'px';
      ghost.style.zIndex = '9999';
      ghost.style.transform = 'translate(-50%, -50%) rotate(3deg)';
      ghost.style.opacity = '0.95';
      ghost.style.boxShadow = '0 12px 32px rgba(0,0,0,.6)';
      document.body.appendChild(ghost);
      if (navigator.vibrate) { try { navigator.vibrate(20); } catch (e) {} }
    }

    function endDrag() {
      clearTimeout(longPressTimer);
      longPressTimer = null;
      if (ghost) { ghost.remove(); ghost = null; }
      if (currentCol) { currentCol.classList.remove('drag-over'); currentCol = null; }
      if (dragging) {
        dragging.classList.remove('dragging');
        dragging.style.touchAction = '';
        dragging = null;
      }
      dragTaskId = null;
      dragGoalId = null;
      started = false;
      activePointerId = null;
    }

    container.addEventListener('pointerdown', function (e) {
      if (!container.querySelector('.kanban-board')) return;
      const card = e.target.closest('.kanban-card');
      if (!card) return;
      if (e.target.closest('input, button')) return;

      dragging = card;
      dragTaskId = card.dataset.taskId;
      dragGoalId = card.dataset.goalId;
      startX = e.clientX;
      startY = e.clientY;
      started = false;
      activePointerId = e.pointerId;
      currentCol = null;

      if (e.pointerType === 'touch') {
        const x0 = e.clientX, y0 = e.clientY;
        longPressTimer = setTimeout(function () { startDrag(x0, y0); }, LONG_PRESS_MS);
      }
    });

    document.addEventListener('pointermove', function (e) {
      if (!dragging || e.pointerId !== activePointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!started) {
        if (e.pointerType === 'touch') {
          if (dist > 12) { endDrag(); }
          return;
        }
        if (dist < THRESHOLD) return;
        startDrag(e.clientX, e.clientY);
        if (!started) return;
      }

      if (ghost) {
        ghost.style.left = e.clientX + 'px';
        ghost.style.top = e.clientY + 'px';
      }

      const el = document.elementFromPoint(e.clientX, e.clientY);
      const col = el ? el.closest('.kanban-col') : null;
      if (col !== currentCol) {
        if (currentCol) currentCol.classList.remove('drag-over');
        currentCol = col;
        if (currentCol) currentCol.classList.add('drag-over');
      }
    });

    document.addEventListener('pointerup', function (e) {
      if (!dragging || e.pointerId !== activePointerId) return;
      if (started && currentCol && dragTaskId && dragGoalId) {
        const newStatus = currentCol.dataset.status;
        if (newStatus) {
          blockNextClick = true;
          setTimeout(function () { blockNextClick = false; }, 60);
          changeTaskStatus(dragGoalId, dragTaskId, newStatus);
        }
      }
      endDrag();
    });

    document.addEventListener('pointercancel', function () {
      if (dragging) endDrag();
    });

    container.addEventListener('click', function (e) {
      if (blockNextClick) {
        e.stopPropagation();
        e.preventDefault();
        blockNextClick = false;
      }
    }, true);
  }


  // ============================================================
  // СВОИ ВКЛАДКИ
  // ============================================================
  let _editingCustomTabId = null;
  let _editingCustomCardId = null;
  let _editingCustomCardTabId = null;
let _confirmDeleteCustomTabId = null;

    // Извлекает число из строки с ценой. Понимает «1500 ₽», «1 500,00», «500р», «1500.50».
  function parsePriceValue(str) {
    if (!str) return 0;
    // Убираем всё лишнее, оставляем цифры, точку, запятую. Запятую → точку.
    let s = String(str).replace(/\s+/g, '').replace(/,/g, '.');
    // Оставляем только первую группу цифр (с точкой)
    const m = s.match(/\d+(\.\d+)?/);
    if (!m) return 0;
    const n = parseFloat(m[0]);
    return isNaN(n) ? 0 : n;
  }

  function formatPriceTotal(n) {
    // 15420 → "15 420"
    return n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
  }
function findCustomTab(id) {
    if (!Array.isArray(state.customTabs)) return null;
    for (let i = 0; i < state.customTabs.length; i++) if (state.customTabs[i].id === id) return state.customTabs[i];
    return null;
  }

    function openCustomTabModal(editId) {
    _editingCustomTabId = editId || null;
    const t = editId ? findCustomTab(editId) : null;
    document.getElementById('customTabModalTitle').textContent = t ? '✎ Своя вкладка' : '＋ Своя вкладка';
    document.getElementById('customTabIcon').value = t ? (t.icon || '⭐') : '⭐';
    document.getElementById('customTabLabel').value = t ? (t.label || '') : '';
    document.getElementById('customTabModal').hidden = false;
    setTimeout(function () { document.getElementById('customTabLabel').focus(); }, 50);
  }
  function closeCustomTabModal() {
    document.getElementById('customTabModal').hidden = true;
    _editingCustomTabId = null;
  }
  function saveCustomTab() {
    const iconRaw = document.getElementById('customTabIcon').value || '';
    const icon = keepOnlyEmoji(iconRaw) || '⭐';
    const label = (document.getElementById('customTabLabel').value || '').trim();
    if (!label) { showToast('Введите название', 'warn'); return; }
    if (_editingCustomTabId) {
      const t = findCustomTab(_editingCustomTabId);
      if (t) { t.icon = icon; t.label = label.slice(0, 30); }
      showToast('Вкладка обновлена', 'ok');
    } else {
      const id = 'ct-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      if (!Array.isArray(state.customTabs)) state.customTabs = [];
            state.customTabs.push({ id: id, icon: icon, label: label.slice(0, 30), cards: [], createdAt: Date.now() });
      if (!Array.isArray(state.tabOrder)) state.tabOrder = [];
      state.tabOrder.push(id);
      state.ui.tab = id;
      showToast('Вкладка создана', 'ok');
    }
    savePrefs();
    renderTabs();
    closeCustomTabModal();
  }
  function deleteCustomTab(id) {
    pgtConfirm({
      title: 'Удалить вкладку?',
      message: 'Вкладка и все её карточки будут удалены безвозвратно.',
      yesLabel: 'Удалить',
           onYes: function () {
        state.customTabs = state.customTabs.filter(function (t) { return t.id !== id; });
        if (Array.isArray(state.tabOrder)) state.tabOrder = state.tabOrder.filter(function (x) { return x !== id; });
        if (state.ui.tab === id) state.ui.tab = 'active';
        savePrefs();
        renderTabs();
        render();
      }
    });
  }

     let _confirmDeleteCustomCardId = null;

  function openCustomCardModal(tabId, cardId) {
    _editingCustomCardTabId = tabId;
    _editingCustomCardId = cardId || null;
    const tab = findCustomTab(tabId); if (!tab) return;
    let card = null;
    if (cardId && Array.isArray(tab.cards)) {
      for (let i = 0; i < tab.cards.length; i++) if (tab.cards[i].id === cardId) { card = tab.cards[i]; break; }
    }
    document.getElementById('customCardModalTitle').textContent = card ? '✎ Карточка' : '＋ Карточка';
    document.getElementById('customCardText').value = card ? (card.text || '') : '';
    document.getElementById('customCardDue').value = card ? (card.dueDate || '') : (state.calSelectedDate || '');
    document.getElementById('customCardPrice').value = card ? (card.price || '') : '';
    document.getElementById('customCardAddress').value = card ? (card.address || '') : '';
    document.getElementById('customCardModal').hidden = false;
    setTimeout(function () { document.getElementById('customCardText').focus(); }, 50);
  }
  function closeCustomCardModal() {
    document.getElementById('customCardModal').hidden = true;
    _editingCustomCardId = null;
    _editingCustomCardTabId = null;
  }
    function saveCustomCard() {
    const text = (document.getElementById('customCardText').value || '').trim();
    if (!text) { showToast('Введите текст', 'warn'); return; }
    const due = (document.getElementById('customCardDue').value || '');
    const price = (document.getElementById('customCardPrice').value || '').trim().slice(0, 60);
    const address = (document.getElementById('customCardAddress').value || '').trim().slice(0, 300);
    const tab = findCustomTab(_editingCustomCardTabId); if (!tab) { closeCustomCardModal(); return; }
    if (!Array.isArray(tab.cards)) tab.cards = [];
    if (_editingCustomCardId) {
      for (let i = 0; i < tab.cards.length; i++) if (tab.cards[i].id === _editingCustomCardId) {
        tab.cards[i].text = text.slice(0, 2000);
        tab.cards[i].dueDate = due;
        tab.cards[i].price = price;
        tab.cards[i].address = address;
        break;
      }
    } else {
      tab.cards.push({
        id: 'cc-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        text: text.slice(0, 2000),
        dueDate: due,
        price: price,
        address: address,
        done: false,
        createdAt: Date.now()
      });
    }
    savePrefs();
    renderCustomView(tab.id);
  updateCustomTabCounters();
    closeCustomCardModal();
    if (due) {
      renderCalendar();
      if (state.ui.tab === 'today') renderDashboard();
    }
  }
    function toggleCustomCardDone(tabId, cardId) {
    const tab = findCustomTab(tabId); if (!tab || !Array.isArray(tab.cards)) return;
    let becameDone = false;
    for (let i = 0; i < tab.cards.length; i++) if (tab.cards[i].id === cardId) {
      tab.cards[i].done = !tab.cards[i].done;
      if (tab.cards[i].done) becameDone = true;
      break;
    }
    savePrefs();
    renderCustomView(tabId);
    if (becameDone) {
      showToast('🎉 МОЛОДЕЦ! Дело сделано', 'ok', null, null, 3500);
    }
  }
    function deleteCustomCard(tabId, cardId) {
    const tab = findCustomTab(tabId);
    if (!tab || !Array.isArray(tab.cards)) return;
    const idx = tab.cards.findIndex(function (c) { return c.id === cardId; });
    if (idx === -1) return;
    const snapshot = JSON.parse(JSON.stringify(tab.cards[idx]));

    tab.cards.splice(idx, 1);
        savePrefs();
    renderCustomView(tabId);
    updateCustomTabCounters();
    
    let undone = false;
    showToast('Карточка удалена', 'warn', 'Отменить', function () {
      if (undone) return;
      undone = true;
      const t = findCustomTab(tabId);
      if (!t) return;
      if (!Array.isArray(t.cards)) t.cards = [];
      t.cards.splice(Math.min(idx, t.cards.length), 0, snapshot);
      savePrefs();
      renderCustomView(tabId);
      updateCustomTabCounters();
      showToast('Карточка восстановлена', 'ok');
    }, 6000);
  }

  function updateCustomTabCounters() {
    if (!Array.isArray(state.customTabs)) return;
    state.customTabs.forEach(function (t) {
      const btn = document.querySelector('.tab[data-tab="' + CSS.escape(t.id) + '"]');
      if (!btn) return;
      let counterEl = btn.querySelector('.tab-count');
      const n = (t.cards || []).filter(function (c) { return !c.done; }).length;
      if (n > 0) {
        if (!counterEl) {
          counterEl = document.createElement('span');
          counterEl.className = 'tab-count';
          btn.appendChild(counterEl);
        }
        counterEl.textContent = String(n);
      } else if (counterEl) {
        counterEl.remove();
      }
    });
  }

      function renderCustomView(tabId) {
    const view = document.getElementById('viewCustom');
    if (!view) return;
    const tab = findCustomTab(tabId);
    if (!tab) { view.innerHTML = '<div class="custom-tab-empty">Вкладка не найдена.</div>'; return; }
    const cards = Array.isArray(tab.cards) ? tab.cards : [];
    const active = cards.filter(function (c) { return !c.done; });
    const archived = cards.filter(function (c) { return c.done; });

    function renderCard(c) {
      const isConfirming = _confirmDeleteCustomCardId === c.id;
      let actions;
      if (isConfirming) {
        actions =
          '<button type="button" class="icon-btn" style="color:var(--danger); border-color:var(--danger);" data-action="custom-card-delete-yes" data-card-id="' + escapeHtml(c.id) + '" title="Да, удалить">✓</button>' +
          '<button type="button" class="icon-btn" data-action="custom-card-delete-no" data-card-id="' + escapeHtml(c.id) + '" title="Отмена">✕</button>';
      } else {
        actions =
          '<button type="button" class="icon-btn" data-action="custom-card-edit" data-card-id="' + escapeHtml(c.id) + '" title="Редактировать">✎</button>' +
          '<button type="button" class="icon-btn" data-action="custom-card-delete" data-card-id="' + escapeHtml(c.id) + '" title="Удалить">✕</button>';
      }
      const meta = [];
      if (c.dueDate) meta.push('<span class="badge date">📅 ' + formatDate(c.dueDate) + '</span>');
      if (c.price) meta.push('<span class="badge price">💰 ' + escapeHtml(c.price) + '</span>');
      if (c.address) meta.push('<span class="badge address">📍 ' + escapeHtml(c.address) + '</span>');
      const metaHtml = meta.length ? '<div class="custom-card-meta">' + meta.join('') + '</div>' : '';
      return '<div class="custom-card' + (c.done ? ' done' : '') + '" data-custom-card-id="' + escapeHtml(c.id) + '">' +
        '<input type="checkbox" ' + (c.done ? 'checked' : '') + ' data-action="custom-card-toggle" data-card-id="' + escapeHtml(c.id) + '" />' +
        '<div class="custom-card-body"><div class="custom-card-text">' + escapeHtml(c.text) + '</div>' + metaHtml + '</div>' +
        '<div class="custom-card-actions">' + actions + '</div>' +
      '</div>';
    }

    const activeHtml = active.length
      ? active.map(renderCard).join('')
      : '<div class="custom-tab-empty">Пока нет карточек. Нажмите «＋ Добавить карточку», чтобы создать первую.</div>';

    // Считаем сумму активных карточек с ценой
    let totalSum = 0;
    let cardsWithPrice = 0;
    active.forEach(function (c) {
      const v = parsePriceValue(c.price);
      if (v > 0) { totalSum += v; cardsWithPrice++; }
    });
    const totalHtml = cardsWithPrice > 0
      ? '<div class="custom-total">' +
          '<span class="label">💰 Итого по активным:</span>' +
          '<span><b>' + formatPriceTotal(totalSum) + ' ₽</b> <span class="muted">(' + cardsWithPrice + ' из ' + active.length + ')</span></span>' +
        '</div>'
      : '';

    const archiveHtml = archived.length
      ? '<div class="custom-archive">' +
          '<div class="custom-archive-head" data-action="custom-archive-toggle">' +
            '<span>📦 Выполнено (' + archived.length + ')</span>' +
                     '<span class="custom-archive-arrow">' + (state.customArchiveOpen && state.customArchiveOpen[tabId] ? '▾' : '▸') + '</span>' +
          '</div>' +
          '<div class="custom-archive-body"' + (state.customArchiveOpen && state.customArchiveOpen[tabId] ? '' : ' hidden') + '>' +
            '<div class="custom-cards">' + archived.map(renderCard).join('') + '</div>' +
          '</div>' +
        '</div>'
      : '';

    view.innerHTML =
      '<div class="custom-tab-head">' +
        '<h2>' + escapeHtml(tab.icon || '⭐') + ' ' + escapeHtml(tab.label) + '</h2>' +
        '<div style="display:flex; gap:6px; flex-wrap:wrap;">' +
          '<button type="button" data-action="custom-card-add">＋ Добавить карточку</button>' +
          '<button type="button" class="secondary" data-action="custom-tab-edit">✎ Переименовать</button>' +
          '<button type="button" class="danger" data-action="custom-tab-delete">🗑 Удалить вкладку</button>' +
        '</div>' +
      '</div>' +
            '<div class="custom-cards">' + activeHtml + '</div>' +
      totalHtml +
      archiveHtml;
  }

    // === ПЕРЕТАСКИВАНИЕ КАРТОЧЕК ВНУТРИ ОДНОЙ ВКЛАДКИ ===
    // === ПЕРЕТАСКИВАНИЕ КАРТОЧЕК ВНУТРИ ОДНОЙ ВКЛАДКИ И МЕЖДУ ВКЛАДКАМИ ===
  function initCustomCardsDnD() {
    const view = document.getElementById('viewCustom');
    if (!view || view.dataset.dndBound === '1') return;
    view.dataset.dndBound = '1';

    let dragging = null;
    let tabId = null;
    let startX = 0, startY = 0;
    let grabDX = 0, grabDY = 0;
    let started = false;
    let ghost = null;
    let activePointerId = null;
    let longPressTimer = null;
    let blockNextClick = false;
    let hoverTabId = null;   // id вкладки, над которой висит курсор
    const THRESHOLD = 8;
    const LONG_PRESS_MS = 300;

    function activeContainer() {
      return view.querySelector('.custom-cards');
    }

    function captureRects() {
      const rects = new Map();
      const c = activeContainer();
      if (!c) return rects;
      c.querySelectorAll('.custom-card').forEach(function (el) {
        rects.set(el.dataset.customCardId, el.getBoundingClientRect());
      });
      return rects;
    }

    function playFlip(oldRects) {
      const c = activeContainer();
      if (!c) return;
      c.querySelectorAll('.custom-card').forEach(function (el) {
        const id = el.dataset.customCardId;
        const oldR = oldRects.get(id);
        if (!oldR) return;
        const newR = el.getBoundingClientRect();
        const dx = oldR.left - newR.left;
        const dy = oldR.top - newR.top;
        if (dx === 0 && dy === 0) return;
        el.style.transition = 'none';
        el.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
        requestAnimationFrame(function () {
          el.style.transition = 'transform 200ms cubic-bezier(0.22, 0.61, 0.36, 1)';
          el.style.transform = '';
          setTimeout(function () {
            el.style.transition = '';
            el.style.transform = '';
          }, 240);
        });
      });
    }

    function setHoverTab(id) {
      if (hoverTabId === id) return;
      if (hoverTabId) {
        const prev = document.querySelector('.tab[data-tab="' + CSS.escape(hoverTabId) + '"]');
        if (prev) prev.classList.remove('tab-drop-target');
      }
      hoverTabId = id;
      if (id) {
        const t = document.querySelector('.tab[data-tab="' + CSS.escape(id) + '"]');
        if (t) t.classList.add('tab-drop-target');
      }
    }

    function clearHoverTab() { setHoverTab(null); }

    function startDrag(x, y) {
      if (started || !dragging) return;
      started = true;

      const r = dragging.getBoundingClientRect();
      ghost = dragging.cloneNode(true);
      ghost.classList.add('dragging-ghost-card');
      ghost.style.position = 'fixed';
      ghost.style.left = r.left + 'px';
      ghost.style.top = r.top + 'px';
      ghost.style.width = r.width + 'px';
      ghost.style.zIndex = '9999';
      ghost.style.pointerEvents = 'none';
      ghost.style.margin = '0';
      ghost.style.transform = 'scale(1.03) rotate(1.5deg)';
      ghost.style.opacity = '0.95';
      ghost.style.boxShadow = '0 12px 32px rgba(0,0,0,.6), 0 0 0 2px rgba(88,166,255,.5)';
      document.body.appendChild(ghost);

      dragging.classList.add('dragging-card');
      document.body.classList.add('pgt-dragging');
      if (navigator.vibrate) { try { navigator.vibrate(15); } catch (err) {} }
    }

    function endDrag(e) {
      if (!dragging || (e && e.pointerId !== activePointerId)) return;
      clearTimeout(longPressTimer);
      longPressTimer = null;

      const droppedOnTab = hoverTabId;
      const draggedCardId = dragging.dataset.customCardId;
      const sourceTabId = tabId;
      const wasStarted = started;

      if (ghost) {
        const target = dragging.getBoundingClientRect();
        ghost.style.transition = 'left .2s cubic-bezier(0.22,0.61,0.36,1), top .2s cubic-bezier(0.22,0.61,0.36,1), width .2s, transform .2s, opacity .2s';
        ghost.style.left = target.left + 'px';
        ghost.style.top = target.top + 'px';
        ghost.style.width = target.width + 'px';
        ghost.style.transform = 'scale(1)';
        ghost.style.opacity = '0';
        const g = ghost;
        setTimeout(function () { if (g && g.parentNode) g.parentNode.removeChild(g); }, 220);
        ghost = null;
      }

      if (dragging) dragging.classList.remove('dragging-card');
      document.body.classList.remove('pgt-dragging');
      clearHoverTab();

      if (wasStarted) {
        blockNextClick = true;
        setTimeout(function () { blockNextClick = false; }, 80);
      }

      dragging = null;
      tabId = null;
      started = false;
      activePointerId = null;

      // === Логика дропа ===
      if (wasStarted && droppedOnTab && droppedOnTab !== sourceTabId) {
        // переносим в другую вкладку
        moveCardBetweenTabs(sourceTabId, droppedOnTab, draggedCardId);
      } else if (wasStarted) {
        // остались на месте — применяем новый порядок внутри вкладки
        applyNewOrder(sourceTabId);
      }
    }

    function applyNewOrder(srcTabId) {
      const tab = findCustomTab(srcTabId);
      if (!tab || !Array.isArray(tab.cards)) return;
      const c = activeContainer();
      if (!c) return;

      const newIds = Array.from(c.querySelectorAll('.custom-card')).map(function (el) {
        return el.dataset.customCardId;
      });

      const newActive = [];
      newIds.forEach(function (id) {
        const card = tab.cards.find(function (x) { return x.id === id; });
        if (card && !card.done) newActive.push(card);
      });
      const newDone = tab.cards.filter(function (x) { return x.done; });

      tab.cards = newActive.concat(newDone);
      savePrefs();
    }

    function moveCardBetweenTabs(srcTabId, dstTabId, cardId) {
      const src = findCustomTab(srcTabId);
      const dst = findCustomTab(dstTabId);
      if (!src || !dst || src === dst) return;
      if (!Array.isArray(src.cards)) return;
      const idx = src.cards.findIndex(function (c) { return c.id === cardId; });
      if (idx === -1) return;

      const card = src.cards.splice(idx, 1)[0];
      if (!Array.isArray(dst.cards)) dst.cards = [];
      dst.cards.push(card);
      savePrefs();

      renderCustomView(srcTabId);
      updateCustomTabCounters();

      const icon = dst.icon || '⭐';
      const label = dst.label || 'без имени';
      showToast(
        'Карточка → ' + icon + ' ' + label,
        'ok',
        'Открыть',
        function () { switchTab(dstTabId); },
        5000
      );
    }

    view.addEventListener('pointerdown', function (e) {
      if (e.button && e.button !== 0) return;
      const card = e.target.closest('.custom-card');
      if (!card) return;
      if (e.target.closest('input, button, textarea, select')) return;
      if (card.classList.contains('done')) return;
      if (card.closest('.custom-archive-body')) return;

      dragging = card;
      tabId = state.ui.tab;
      startX = e.clientX;
      startY = e.clientY;
      const r = card.getBoundingClientRect();
      grabDX = e.clientX - r.left;
      grabDY = e.clientY - r.top;
      started = false;
      activePointerId = e.pointerId;
      hoverTabId = null;

      if (e.pointerType === 'touch') {
        const x0 = e.clientX, y0 = e.clientY;
        longPressTimer = setTimeout(function () { startDrag(x0, y0); }, LONG_PRESS_MS);
      }
    });

    document.addEventListener('pointermove', function (e) {
      if (!dragging || e.pointerId !== activePointerId) return;
      if (state.ui.tab !== tabId) { endDrag(e); return; }

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!started) {
        if (e.pointerType === 'touch') {
          if (dist > 12) { clearTimeout(longPressTimer); longPressTimer = null; dragging = null; activePointerId = null; }
          return;
        }
        if (dist < THRESHOLD) return;
        startDrag(e.clientX, e.clientY);
        if (!started) return;
      }

      if (ghost) {
        ghost.style.left = (e.clientX - grabDX) + 'px';
        ghost.style.top = (e.clientY - grabDY) + 'px';
      }

            // === 1. Проверяем, над какой вкладкой мы (по bounding rect, не через elementFromPoint) ===
      const allTabs = document.querySelectorAll('#tabsNav .tab[data-tab]');
      let hitTab = null;
      for (let i = 0; i < allTabs.length; i++) {
        const t = allTabs[i];
        const r = t.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
          hitTab = t;
          break;
        }
      }

      const validTab = hitTab
        && hitTab.dataset.tab !== tabId
        && findCustomTab(hitTab.dataset.tab);

      if (validTab) {
        setHoverTab(hitTab.dataset.tab);
        return; // карточки не переставляем, пока висим над вкладкой
      }
      clearHoverTab();

      // === 2. Иначе — обычная перестановка внутри сетки ===
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el) return;
      const targetCard = el.closest('.custom-card');
      if (!targetCard || targetCard === dragging) return;
      if (targetCard.closest('.custom-archive-body')) return;
      const c = activeContainer();
      if (!c || !c.contains(targetCard)) return;

      const targetR = targetCard.getBoundingClientRect();
      const before = (e.clientY < targetR.top + targetR.height / 2);

      const children = Array.from(c.querySelectorAll('.custom-card'));
      const dragIdx = children.indexOf(dragging);
      const targetIdx = children.indexOf(targetCard);
      if (dragIdx === -1 || targetIdx === -1) return;

      let insertAt = before ? targetIdx : targetIdx + 1;
      if (insertAt > dragIdx) insertAt--;
      if (insertAt === dragIdx) return;

      const oldRects = captureRects();
      if (before) {
        c.insertBefore(dragging, targetCard);
      } else {
        c.insertBefore(dragging, targetCard.nextSibling);
      }
      playFlip(oldRects);
    });

    document.addEventListener('pointerup', endDrag);
    document.addEventListener('pointercancel', endDrag);

    document.addEventListener('touchmove', function (e) {
      if (started && dragging) e.preventDefault();
    }, { passive: false });

    view.addEventListener('click', function (e) {
      if (blockNextClick) {
        e.stopPropagation();
        e.preventDefault();
        blockNextClick = false;
      }
    }, true);
  }

(function bindCustomView() {
    const view = document.getElementById('viewCustom');
    if (!view || view.dataset.bound === '1') return;
    view.dataset.bound = '1';
    view.addEventListener('click', function (e) {
      const el = e.target.closest('[data-action]');
      if (!el) return;
      const action = el.dataset.action;
      const tabId = state.ui.tab;
            if (action === 'custom-card-add') openCustomCardModal(tabId, null);
      else if (action === 'custom-card-edit') openCustomCardModal(tabId, el.dataset.cardId);
      else if (action === 'custom-card-delete') { _confirmDeleteCustomCardId = el.dataset.cardId; renderCustomView(tabId); }
      else if (action === 'custom-card-delete-yes') { _confirmDeleteCustomCardId = null; deleteCustomCard(tabId, el.dataset.cardId); }
      else if (action === 'custom-card-delete-no') { _confirmDeleteCustomCardId = null; renderCustomView(tabId); }
            else if (action === 'custom-archive-toggle') {
        if (!state.customArchiveOpen) state.customArchiveOpen = {};
        state.customArchiveOpen[tabId] = !state.customArchiveOpen[tabId];
        savePrefs();
        renderCustomView(tabId);
      }
      else if (action === 'custom-tab-edit') openCustomTabModal(tabId);
      else if (action === 'custom-tab-delete') deleteCustomTab(tabId);
    });
    view.addEventListener('change', function (e) {
      const el = e.target;
      if (el.matches && el.matches('input[data-action="custom-card-toggle"]')) {
        toggleCustomCardDone(state.ui.tab, el.dataset.cardId);
      }
    });
  })();

  initCustomCardsDnD();

  (function bindCustomModals() {
    const ct = document.getElementById('customTabModal');
    if (ct && ct.dataset.bound !== '1') {
      ct.dataset.bound = '1';
      ct.addEventListener('click', function (e) {
        if (e.target === ct) { closeCustomTabModal(); return; }
        const el = e.target.closest('[data-action]'); if (!el) return;
        if (el.dataset.action === 'close-custom-tab') closeCustomTabModal();
        else if (el.dataset.action === 'save-custom-tab') saveCustomTab();
      });
      ct.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeCustomTabModal();
        else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveCustomTab(); }
      });
    }
    const cc = document.getElementById('customCardModal');
    if (cc && cc.dataset.bound !== '1') {
      cc.dataset.bound = '1';
      cc.addEventListener('click', function (e) {
        if (e.target === cc) { closeCustomCardModal(); return; }
        const el = e.target.closest('[data-action]'); if (!el) return;
        if (el.dataset.action === 'close-custom-card') closeCustomCardModal();
        else if (el.dataset.action === 'save-custom-card') saveCustomCard();
      });
      cc.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeCustomCardModal();
        else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveCustomCard(); }
      });
    }
  })();
	// === Часы реального времени в шапке ===
    
function tickLiveClock() {
      const el = document.getElementById('liveClock');
      if (!el) return;
      const d = new Date();
      el.textContent = '🕐 ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
    }
	   // === Автосинхронизация (снаружи bindEvents, доступна для saveData) ===
  let _autoSyncTimer = null;
  let _autoSyncInFlight = false;

  function setSyncDot(state) {
    const el = document.getElementById('syncDot');
    if (!el) return;
    el.className = 'sync-dot' + (state ? ' ' + state : '');
    const titles = {
      '': 'Не синхронизировано',
      active: 'Синхронизация…',
      ok: 'Синхронизировано',
      error: 'Ошибка — нет связи',
      auth: 'Войдите в Google'
    };
    el.title = titles[state] || '';
  }

  window.__pgtSetSyncDot = setSyncDot;

  function scheduleAutoSync() {
    clearTimeout(_autoSyncTimer);
    _autoSyncTimer = setTimeout(function () {
      if (_autoSyncInFlight) { scheduleAutoSync(); return; }
      if (typeof window.__pgtAutoSync !== 'function') return;
      _autoSyncInFlight = true;
      try { window.__pgtAutoSync(); } catch (e) { console.warn('[autoSync]', e); _autoSyncInFlight = false; }
    }, 3000);
  }

  window.__pgtAutoSyncDone = function (ok) { _autoSyncInFlight = false; };
  
     // ============================================================
  // BIND EVENTS — все обработчики приложения
  // ============================================================
  function bindEvents() {
    // Часы
    tickLiveClock();
    setInterval(tickLiveClock, 1000);

    // Шапка
    const _sb = document.getElementById('settingsBtn');
    if (_sb) _sb.addEventListener('click', function () {
      document.getElementById('settingsModal').hidden = false;
      syncToolbarInputs();
      renderBackupList();
      renderCacheStats();
      refreshDriveSettingsUI();
    });
    const _gsb = document.getElementById('globalSearchBtn');
    if (_gsb) _gsb.addEventListener('click', openGlobalSearch);
        const _ct = document.getElementById('calToggle');
    if (_ct) _ct.addEventListener('click', toggleCalendar);

    // === Переключение разделов правой панели ===
    const _sideTabs = document.getElementById('sidePanelTabs');
    if (_sideTabs) {
      _sideTabs.addEventListener('click', function (e) {
        const btn = e.target.closest('.side-tab');
        if (!btn) return;
        switchSidePanel(btn.dataset.sidePanel);
      });
    }
    const _appCalClick = document.getElementById('appCalendar');
    if (_appCalClick) {
      _appCalClick.addEventListener('click', function (e) {
        const el = e.target.closest('[data-action]');
        if (!el) return;
        if (el.dataset.action === 'side-open-task') {
          openEditTask(el.dataset.goalId, el.dataset.taskId);
        } else if (el.dataset.action === 'side-open-note') {
          switchTab('notes');
          state.editingNoteId = el.dataset.id;
          renderNotesList();
          renderNoteEditor();
        }
      });
    }

    // Подвкладки активного раздела
    document.querySelectorAll('[data-active-tab-btn]').forEach(function (b) {
      b.addEventListener('click', function () { switchActiveTab(b.dataset.activeTabBtn); });
    });
    document.querySelectorAll('[data-lit-tab]').forEach(function (b) {
      b.addEventListener('click', function () { switchLitTab(b.dataset.litTab); });
    });

    // Быстрый ввод
    const _qa = document.getElementById('quickAddBtn');
    if (_qa) _qa.addEventListener('click', handleQuickAdd);
        const _qv = document.getElementById('quickVoiceBtn');
    if (_qv) _qv.addEventListener('click', function () {
      // startVoiceInput() сам разбирается: если запись идёт — остановит
      // (со сбросом _voiceShouldBeActive), если нет — запустит.
      startVoiceInput();
    });
    const _qi = document.getElementById('quickInput');
    if (_qi) _qi.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); handleQuickAdd(); }
    });

    // Форма цели
        const _gf = document.getElementById('goalForm');
    if (_gf) _gf.addEventListener('submit', function (e) {
      e.preventDefault();
      const titleEl = document.getElementById('goalTitle');
      const title = titleEl.value.trim();
      if (!title) { markInvalid(titleEl); showToast('Введите название цели', 'warn'); return; }
      let deadline = document.getElementById('goalDeadline').value || '';
      if (!deadline && state.calSelectedDate) deadline = state.calSelectedDate;
      const parentId = document.getElementById('goalParent').value || '';
      addGoal({
        title: title,
        description: document.getElementById('goalDesc').value.trim(),
        priority: document.getElementById('goalPriority').value,
        deadline: deadline,
        parentId: parentId
      });
      resetGoalForm();
      showToast('Цель добавлена', 'ok');
    });
    const _gm = document.getElementById('goalMoreBtn');
    if (_gm) _gm.addEventListener('click', function () {
      const el = document.getElementById('goalMoreBody');
      el.hidden = !el.hidden;
    });

    // Форма задачи
    const _tm = document.getElementById('taskMoreBtn');
    if (_tm) _tm.addEventListener('click', function () {
      const el = document.getElementById('taskMoreBody');
      el.hidden = !el.hidden;
    });
        const _tf = document.getElementById('taskForm');
    if (_tf) _tf.addEventListener('submit', function (e) {
      e.preventDefault();
      const textEl = document.getElementById('taskText');
      const text = textEl.value.trim();
      if (!text) { markInvalid(textEl); showToast('Введите текст задачи', 'warn'); return; }
      let deadline = document.getElementById('taskDeadline').value || '';
      if (!deadline && state.calSelectedDate) deadline = state.calSelectedDate;
      const goalId = document.getElementById('taskGoal').value;
      addTask(goalId, {
        text: text,
        priority: document.getElementById('taskPriority').value,
        deadline: deadline,
        tags: parseTags(document.getElementById('taskTags').value)
      });
      const keep = goalId;
      resetTaskForm();
      document.getElementById('taskGoal').value = keep;
      // Принудительно перерисовываем списки, пока фокус ещё не в поле:
      // render() внутри addTask мог быть пропущен из-за isTypingNow().
      renderGoals();
      renderTasks();
      document.getElementById('taskText').focus();
      showToast('Задача добавлена', 'ok');
    });

        // Обработчики списков задач и целей (делегирование)
    function attachTaskListHandlers(container) {
      if (!container || container.dataset.bound === '1') return;
      container.dataset.bound = '1';

      container.addEventListener('click', function (e) {
        const el = e.target.closest('[data-action]');
        if (!el) return;
        const action = el.dataset.action;
        const gid = el.dataset.goalId;
        const tid = el.dataset.taskId;
        const subId = el.dataset.subId;

        if (action === 'toggle-goal') { toggleGoalCollapse(gid); return; }
        if (action === 'pin-goal') { togglePinGoal(gid); return; }
        if (action === 'edit-goal') { openEditGoal(gid); return; }
        if (action === 'archive-goal') { archiveGoal(gid); return; }
        if (action === 'delete-goal') {
          const g = findGoal(gid);
          pgtConfirm({ title: 'Удалить цель?', message: g ? ('«' + g.title + '» и все её задачи будут удалены безвозвратно.') : 'Цель будет удалена безвозвратно.', yesLabel: 'Да, удалить', onYes: function(){ deleteGoal(gid); } });
          return;
        }
             if (action === 'pin-task') { togglePinTask(gid, tid); return; }
        if (action === 'duplicate-task') { duplicateTask(gid, tid); return; }
        if (action === 'duplicate-goal') { duplicateGoal(gid); return; }
        if (action === 'edit-task') { openEditTask(gid, tid); return; }
        if (action === 'archive-task') { archiveTask(gid, tid); return; }
        if (action === 'delete-task') {
          const g = findGoal(gid); const t = g ? g.tasks.find(function(x){return x.id===tid;}) : null;
          pgtConfirm({ title: 'Удалить задачу?', message: t ? t.text : 'Задача будет удалена безвозвратно.', yesLabel: 'Да, удалить', onYes: function(){ deleteTask(gid, tid); } });
          return;
        }
        if (action === 'add-subtask-inline') {
          const inp = container.querySelector('[data-subtask-input][data-goal-id="' + CSS.escape(gid) + '"][data-task-id="' + CSS.escape(tid) + '"]');
          const v = inp ? inp.value.trim() : '';
          if (v) { addSubtask(gid, tid, v); if (inp) inp.value = ''; }
          return;
        }
        if (action === 'edit-subtask') { editSubtask(gid, tid, subId); return; }
        if (action === 'delete-subtask') { deleteSubtask(gid, tid, subId); return; }
        if (action === 'mass-check-goal') { toggleMassCheckGoal(gid); return; }
        if (action === 'mass-goals-archive') { massActionGoals('archive'); return; }
        if (action === 'mass-goals-delete') { massActionGoals('delete'); return; }
        if (action === 'mass-check') { toggleMassCheck(gid, tid); return; }
               if (action === 'mass-done') { massAction('done'); return; }
        if (action === 'mass-priority') { massSetPriority(); return; }
        if (action === 'mass-deadline') { massSetDeadline(); return; }
        if (action === 'mass-tag') { massAddTag(); return; }
        if (action === 'mass-move') { massMoveGoal(); return; }
        if (action === 'mass-archive') { massAction('archive'); return; }
        if (action === 'mass-export') { massAction('export'); return; }
        if (action === 'mass-delete') { massAction('delete'); return; }
        if (action === 'clear-date-filter') { clearDateFilter(); return; }
        if (action === 'filter-tag-click') { state.tagFilter = el.dataset.tag; savePrefs(); renderTagFilterSelect(); renderTasks(); return; }
        if (action === 'filter-goal-tag') { state.tagFilter = el.dataset.tag; savePrefs(); renderTagFilterSelect(); renderTasks(); return; }
        if (action === 'open-snippet-from-goal') { openSnippetsModal(); state.editingSnippetId = el.dataset.id; renderSnippetsList(); return; }
        if (action === 'open-note-from-goal') { switchTab('notes'); state.editingNoteId = el.dataset.id; renderNotesList(); renderNoteEditor(); return; }
                if (action === 'custom-card-open-from-tasks') {
          openCustomCardModal(el.dataset.tabId, el.dataset.cardId);
          return;
        }
	if (action === 'kanban-open-task') { openEditTask(gid, tid); return; }
      });

      container.addEventListener('change', function (e) {
        const el = e.target;
        if (!el.matches) return;
        if (el.matches('input[data-action="toggle-task"]')) { toggleTask(el.dataset.goalId, el.dataset.taskId); return; }
        if (el.matches('input[data-action="toggle-subtask"]')) { toggleSubtask(el.dataset.goalId, el.dataset.taskId, el.dataset.subId); return; }
        if (el.matches('input[data-action="kanban-toggle-task"]')) { toggleTask(el.dataset.goalId, el.dataset.taskId); return; }
        if (el.matches('input[data-action="mass-check"]')) { toggleMassCheck(el.dataset.goalId, el.dataset.taskId); return; }
        if (el.matches('input[data-action="mass-check-goal"]')) { toggleMassCheckGoal(el.dataset.goalId); return; }
      });

      container.addEventListener('submit', function (e) {
        const form = e.target.closest('.inline-task-form');
        if (!form) return;
        e.preventDefault();
        const gid = form.dataset.goalId;
        const inp = form.querySelector('input[type="text"]');
        const dateInp = form.querySelector('input[type="date"]');
        const text = inp ? inp.value.trim() : '';
        if (!text) return;
        const deadline = dateInp && dateInp.value ? dateInp.value : (state.calSelectedDate || '');
        addTask(gid, { text: text, deadline: deadline });
        refocusInlineTaskFor = gid;
        renderGoals();
      });

      container.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        const inp = e.target.closest('[data-subtask-input]');
        if (!inp) return;
        e.preventDefault();
        const gid = inp.dataset.goalId;
        const tid = inp.dataset.taskId;
        const v = inp.value.trim();
        if (!v) return;
        addSubtask(gid, tid, v);
        inp.value = '';
      });
    }
    attachTaskListHandlers(document.getElementById('goalsList'));
    attachTaskListHandlers(document.getElementById('tasksColumn'));

    // Kanban и drag&drop
    initKanbanDnD();
    initTaskToGoalDnD();
    // === УПРАВЛЕНИЕ ВКЛАДКАМИ ===
    const _tmm = document.getElementById('tabsManageModal');
    if (_tmm) {
      _tmm.addEventListener('click', function (e) {
        if (e.target === this) { closeTabsManageModal(); return; }
        const el = e.target.closest('[data-action]');
        if (!el) return;
        const action = el.dataset.action;
        if (action === 'close-tabs-manage') { closeTabsManageModal(); return; }
        if (action === 'reset-tabs') {
          pgtConfirm({ title: 'Сбросить вкладки?', message: 'Иконки, названия и порядок вернутся к стандартным.', yesLabel: 'Сбросить', danger: false, onYes: function(){
            state.tabs = mergeTabs(null); savePrefs(); renderTabsManageList(); renderTabs();
            showToast('Вкладки сброшены', 'ok');
          }});
          return;
        }
        const row = el.closest('.tabs-manage-row');
        if (!row) return;

              const ctId = row.dataset.customTabId;
        if (ctId) {
          if (action === 'custom-tab-delete-ask') {
            _confirmDeleteCustomTabId = ctId;
            renderTabsManageList();
                    } else if (action === 'custom-tab-delete-confirm') {
            _confirmDeleteCustomTabId = null;
            state.customTabs = state.customTabs.filter(function (t) { return t.id !== ctId; });
            if (Array.isArray(state.tabOrder)) state.tabOrder = state.tabOrder.filter(function (x) { return x !== ctId; });
            if (state.ui.tab === ctId) state.ui.tab = 'active';
            savePrefs(); renderTabsManageList(); renderTabs(); render();
 updateCustomTabCounters();
            showToast('Вкладка удалена', 'ok');
          } else if (action === 'custom-tab-delete-cancel') {
            _confirmDeleteCustomTabId = null;
            renderTabsManageList();
          }
          return;
        }

        const tabId = row.dataset.tabId;
        const idx = state.tabs.findIndex(function (t) { return t.id === tabId; });
        if (idx === -1) return;
               if (action === 'tab-move-up' && idx > 0) {
          const tmp = state.tabs[idx - 1]; state.tabs[idx - 1] = state.tabs[idx]; state.tabs[idx] = tmp;
          if (Array.isArray(state.tabOrder)) {
            const idA = state.tabs[idx - 1].id, idB = state.tabs[idx].id;
            const oA = state.tabOrder.indexOf(idA), oB = state.tabOrder.indexOf(idB);
            if (oA !== -1 && oB !== -1) { state.tabOrder[oA] = idB; state.tabOrder[oB] = idA; }
          }
          savePrefs(); renderTabsManageList(); renderTabs();
        } else if (action === 'tab-move-down' && idx < state.tabs.length - 1) {
          const tmp = state.tabs[idx + 1]; state.tabs[idx + 1] = state.tabs[idx]; state.tabs[idx] = tmp;
          if (Array.isArray(state.tabOrder)) {
            const idA = state.tabs[idx + 1].id, idB = state.tabs[idx].id;
            const oA = state.tabOrder.indexOf(idA), oB = state.tabOrder.indexOf(idB);
            if (oA !== -1 && oB !== -1) { state.tabOrder[oA] = idB; state.tabOrder[oB] = idA; }
          }
          savePrefs(); renderTabsManageList(); renderTabs();
        }
      });

      _tmm.addEventListener('change', function (e) {
        const el = e.target;
        const row = el.closest('.tabs-manage-row'); if (!row) return;
        if (row.dataset.customTabId) return;
        const tab = state.tabs.find(function (t) { return t.id === row.dataset.tabId; });
        if (!tab) return;
        if (el.dataset.action === 'tab-toggle-visible') {
          tab.visible = el.checked;
          savePrefs(); renderTabs();
        }
      });

      _tmm.addEventListener('input', function (e) {
        const el = e.target;
        const row = el.closest('.tabs-manage-row'); if (!row) return;
        if (row.dataset.customTabId) {
          const ct = (state.customTabs || []).find(function (t) { return t.id === row.dataset.customTabId; });
          if (!ct) return;
          if (el.dataset.action === 'custom-tab-icon') { ct.icon = el.value.slice(0, 4) || '⭐'; savePrefs(); renderTabs(); }
          else if (el.dataset.action === 'custom-tab-label') { ct.label = el.value.slice(0, 30); savePrefs(); renderTabs(); }
          return;
        }
        const tab = state.tabs.find(function (t) { return t.id === row.dataset.tabId; });
        if (!tab) return;
        if (el.dataset.action === 'tab-icon') { tab.icon = el.value.slice(0, 4); savePrefs(); renderTabs(); }
        else if (el.dataset.action === 'tab-label') { tab.label = el.value.slice(0, 30); savePrefs(); renderTabs(); }
      });
    }

    // === ЭМОДЗИ-ПИКЕР ===
    const _epm = document.getElementById('emojiPickerModal');
    if (_epm) {
      _epm.addEventListener('click', function (e) {
        if (e.target === this) { closeEmojiPicker(); return; }
        const cell = e.target.closest('.emoji-cell');
        if (cell) {
          const emoji = cell.dataset.emoji;
          if (_emojiPickerTarget) {
            const inp = document.getElementById(_emojiPickerTarget);
            if (inp) { inp.value = emoji; }
          }
          closeEmojiPicker();
          return;
        }
        const el = e.target.closest('[data-action]');
        if (el && el.dataset.action === 'close-emoji-picker') closeEmojiPicker();
      });
    }
    const _eps = document.getElementById('emojiPickerSearch');
    if (_eps) _eps.addEventListener('input', function () {
      const q = (this.value || '').trim().toLowerCase();
      const grid = document.getElementById('emojiPickerGrid');
      if (!grid) return;
      grid.querySelectorAll('.emoji-cell').forEach(function (btn) {
        btn.style.display = !q ? '' : 'none';
      });
    });
    const _ctPick = document.getElementById('customTabIconPickBtn');
    if (_ctPick) _ctPick.addEventListener('click', function () { openEmojiPicker('customTabIcon'); });
    const _ctIcon = document.getElementById('customTabIcon');
    if (_ctIcon) {
      _ctIcon.addEventListener('input', function () {
        const filtered = keepOnlyEmoji(this.value);
        if (this.value !== filtered) this.value = filtered;
      });
    }

    // Кнопки массового выбора
    const _mmt = document.getElementById('massModeToggle');
    if (_mmt) _mmt.addEventListener('click', toggleMassMode);
    const _mmg = document.getElementById('massModeGoalsToggle');
    if (_mmg) _mmg.addEventListener('click', toggleMassModeGoals);
     
  // Модал задачи
    const _etm = document.getElementById('editTaskModal');
    if (_etm) {
      _etm.addEventListener('click', function (e) {
        if (e.target === this) { closeEditTask(); return; }
        const el = e.target.closest('[data-action]'); if (!el) return;
        const action = el.dataset.action;
        if (action === 'close-edit-task') closeEditTask();
        else if (action === 'save-edit-task') saveEditTask();
        else if (action === 'delete-task-from-edit') deleteTaskFromEdit();
        else if (action === 'add-subtask') editAddSubtask();
        else if (action === 'edit-delete-subtask') editDeleteSubtask(el.dataset.subId);
      });
      _etm.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeEditTask();
        else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveEditTask(); }
      });
      _etm.addEventListener('change', function (e) {
        const el = e.target;
        if (el.matches && el.matches('input[data-action="edit-toggle-subtask"]')) editToggleSubtask(el.dataset.subId);
      });
    }
    const _esn = document.getElementById('editSubtaskNew');
    if (_esn) _esn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); editAddSubtask(); }
    });

    // Модал цели
    const _egm = document.getElementById('editGoalModal');
    if (_egm) {
      _egm.addEventListener('click', function (e) {
        if (e.target === this) { closeEditGoal(); return; }
        const el = e.target.closest('[data-action]'); if (!el) return;
        const action = el.dataset.action;
        if (action === 'close-edit-goal') closeEditGoal();
        else if (action === 'save-edit-goal') saveEditGoal();
        else if (action === 'delete-goal-from-edit') deleteGoalFromEdit();
        else if (action === 'delete-goal-journal') deleteGoalJournalEntry(+el.dataset.idx);
      });
      _egm.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeEditGoal();
        else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveEditGoal(); }
      });
    }
    const _egaj = document.getElementById('editGoalAddJournalBtn');
    if (_egaj) _egaj.addEventListener('click', addGoalJournalEntry);
    const _egjn = document.getElementById('editGoalJournalNew');
    if (_egjn) _egjn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); addGoalJournalEntry(); }
    });

    // Архив
    const _va = document.getElementById('viewArchive');
    if (_va) _va.addEventListener('click', function (e) {
      const el = e.target.closest('[data-action]'); if (!el) return;
      const action = el.dataset.action; const gid = el.dataset.goalId, tid = el.dataset.taskId;
      if (action === 'restore-goal') restoreGoal(gid);
      else if (action === 'restore-task') restoreTask(gid, tid);
      else if (action === 'delete-goal') {
        const g = findGoal(gid);
        pgtConfirm({ title: 'Удалить цель?', message: g ? ('«' + g.title + '» и все её задачи будут удалены безвозвратно.') : 'Цель будет удалена безвозвратно.', yesLabel: 'Да, удалить', onYes: function(){ deleteGoal(gid); } });
      }
      else if (action === 'delete-task') {
        const g = findGoal(gid); const t = g ? g.tasks.find(function(x){return x.id===tid;}) : null;
        pgtConfirm({ title: 'Удалить задачу?', message: t ? t.text : 'Задача будет удалена безвозвратно.', yesLabel: 'Да, удалить', onYes: function(){ deleteTask(gid, tid); } });
      }
    });

    // Литература (статьи / книги)
    SECTIONS.forEach(function (section) {
      const view = document.getElementById(section === 'articles' ? 'articlesPanel' : 'booksPanel');
      if (!view) return;
      view.addEventListener('click', function (e) {
        const favBtn = e.target.closest('[data-action="toggle-fav"]');
        if (favBtn) { e.stopPropagation(); toggleFavorite(section, favBtn.dataset.name, false); return; }
        const item = e.target.closest('.lit-item');
        if (item && !e.target.closest('[data-action]')) {
          const name = item.dataset.name; if (name) { selectFile(section, name); return; }
        }
        const el = e.target.closest('[data-action]'); if (!el) return;
        const action = el.dataset.action;
        const sec = el.dataset.section || section;
        if (action === 'upload-to-drive') uploadToDrive(sec);
        else if (action === 'refresh-from-drive') refreshFromDrive(sec);
        else if (action === 'pick-folder') { if (fsSupported) pickFolderFSA(sec); else pickFolderFallback(sec); }
        else if (action === 'pick-files') pickFiles(sec);
        else if (action === 'refresh-folder') refreshFolder(sec);
        else if (action === 'disconnect-folder') disconnectFolder(sec);
        else if (action === 'request-permission') requestPermission(sec);
        else if (action === 'close-reader') closeReader(sec);
        else if (action === 'toggle-fullscreen') toggleFullscreen(sec);
        else if (action === 'toggle-reader-only') toggleReaderOnly(sec);
        else if (action === 'download-file') downloadFile(sec);
        else if (action === 'nav-prev') navigateFile(sec, -1);
        else if (action === 'nav-next') navigateFile(sec, 1);
        else if (action === 'toggle-list') toggleListVisibility(sec);
        else if (action === 'save-snippet') saveSelectionAsSnippet();
        else if (action === 'open-snippets') openSnippetsModal();
        else if (action === 'index-folder') indexFolder(sec);
        else if (action === 'search-content') openContentSearch(sec);
        else if (action === 'speak-text') speakText(sec);
        else if (action === 'toggle-fav-current') { const name = runtime[sec].selected; if (name) toggleFavorite(sec, name, true); }
        else if (action === 'toggle-fav-filter') { state.litFavFilter[sec] = !state.litFavFilter[sec]; el.classList.toggle('active', state.litFavFilter[sec]); savePrefs(); renderList(sec); }
        else if (action === 'pdf-zoom-in') { state.pdfZoom[sec] = clampZoom((state.pdfZoom[sec] || 100) + 10); savePrefs(); rerenderPdfViewer(sec); }
        else if (action === 'pdf-zoom-out') { state.pdfZoom[sec] = clampZoom((state.pdfZoom[sec] || 100) - 10); savePrefs(); rerenderPdfViewer(sec); }
        else if (action === 'pdf-zoom-reset') { state.pdfZoom[sec] = 100; savePrefs(); rerenderPdfViewer(sec); }
        else if (action === 'pdf-invert') { state.pdfInvert[sec] = !state.pdfInvert[sec]; el.classList.toggle('active', state.pdfInvert[sec]); savePrefs(); togglePdfInvert(sec); }
      });
      view.addEventListener('input', function (e) {
        const inp = e.target.closest('[data-action="pdf-page"]'); if (!inp) return;
        const sec = inp.dataset.section; const name = runtime[sec].selected; if (!name) return;
        let v = parseInt(inp.value, 10); if (isNaN(v) || v < 1) v = 1;
        if (!state.pdfPage[sec]) state.pdfPage[sec] = {};
        state.pdfPage[sec][name] = v; savePrefs();
      });
      view.addEventListener('change', function (e) {
        const inp = e.target.closest('[data-action="pdf-page"]'); if (!inp) return;
        const v = parseInt(inp.value, 10);
        if (!isNaN(v) && v > 0) scrollToPdfPage(inp.dataset.section, v);
      });
      const search = document.getElementById(section + 'SearchInput');
      if (search) search.addEventListener('input', function () {
        state.ui.litSearch[section] = search.value; savePrefs(); renderList(section);
      });
      const sortSel = view.querySelector('[data-action="set-sort"][data-section="' + section + '"]');
      if (sortSel) sortSel.addEventListener('change', function () {
        state.litSort[section] = sortSel.value; savePrefs(); renderList(section);
      });
    });

    // Заметки
    const _nsi = document.getElementById('notesSearchInput');
    if (_nsi) _nsi.addEventListener('input', function (e) {
      state.ui.notesSearch = e.target.value; savePrefs(); renderNotesList();
    });
    const _nnb = document.getElementById('newNoteBtn');
    if (_nnb) _nnb.addEventListener('click', function () { addNote({ title: 'Новая заметка', body: '' }); });
    const _dnb = document.getElementById('dailyNoteBtn');
    if (_dnb) _dnb.addEventListener('click', openDailyNote);
    const _nl = document.getElementById('notesList');
    if (_nl) {
      _nl.addEventListener('click', function (e) {
        const fav = e.target.closest('[data-action="toggle-note-fav"]');
        if (fav) { e.stopPropagation(); toggleNoteFav(fav.dataset.id); return; }
        const goalBadge = e.target.closest('[data-action="goto-goal-from-note"]');
        if (goalBadge) {
          e.stopPropagation();
          const gid = goalBadge.dataset.goalId;
          switchTab('active');
          if (gid) {
            state.collapsed[gid] = false; savePrefs(); renderGoals();
            setTimeout(function () {
              const g = document.querySelector('.goal[data-goal-id="' + CSS.escape(gid) + '"]');
              if (g) g.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
          }
          return;
        }
        const item = e.target.closest('.note-item'); if (!item) return;
        state.editingNoteId = item.dataset.id; renderNotesList(); renderNoteEditor();
      }, true);
    }
    const _ne = document.getElementById('noteEditor');
    if (_ne) _ne.addEventListener('click', function (e) {
      const el = e.target.closest('[data-action]'); if (!el) return;
      const action = el.dataset.action; const id = el.dataset.id;
      if (action === 'note-delete') {
        pgtConfirm({ title: 'Удалить заметку?', message: 'Заметка будет удалена безвозвратно.', yesLabel: 'Да, удалить', onYes: function(){ deleteNote(id); } });
      }
            else if (action === 'note-export-md') exportNoteAsMd(id);
      else if (action === 'note-copy') copyNote(id);
      else if (action === 'note-to-task') {
        var note = findNote(id); if (!note) return;
        var firstLine = String(note.title || '').trim();
        if (!firstLine) {
          var lines = String(note.body || '').split('\n').map(function(l){ return l.replace(/^#+\s*/, '').trim(); }).filter(Boolean);
          firstLine = lines[0] || '';
        }
        if (!firstLine) { showToast('Заметка пуста', 'warn'); return; }
        addTask(note.goalId || null, { text: firstLine.slice(0, 200), priority: 'medium', deadline: '', tags: (note.tags || []).slice() });
        showToast('Задача создана: ' + firstLine.slice(0, 40), 'ok');
      }
    });
    document.querySelectorAll('[data-notes-filter]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.notesFilter = b.dataset.notesFilter;
        document.querySelectorAll('[data-notes-filter]').forEach(function (x) {
          x.classList.toggle('active', x.dataset.notesFilter === state.notesFilter);
        });
        renderNotesList();
      });
    });

    // Привычки
    const _hf = document.getElementById('habitForm');
    if (_hf) _hf.addEventListener('submit', function (e) {
      e.preventDefault();
      const titleEl = document.getElementById('habitTitle');
      const iconEl = document.getElementById('habitIcon');
      addHabitFromForm(titleEl.value, iconEl.value);
      titleEl.value = '';
      iconEl.value = '';
      titleEl.focus();
    });
    const _hl = document.getElementById('habitList');
    if (_hl) {
      _hl.addEventListener('click', function (e) {
        const el = e.target.closest('[data-action]'); if (!el) return;
        const action = el.dataset.action; const id = el.dataset.habitId;
        if (action === 'toggle-habit-today') toggleHabitToday(id);
        else if (action === 'edit-habit') startEditHabit(id);
        else if (action === 'save-habit-edit') saveHabitEdit(id);
        else if (action === 'cancel-habit-edit') cancelHabitEdit();
        else if (action === 'delete-habit') startDeleteHabit(id);
        else if (action === 'confirm-delete-habit') confirmDeleteHabit(id);
        else if (action === 'cancel-delete-habit') cancelDeleteHabit();
      });
      _hl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && e.target && e.target.matches && e.target.matches('[data-habit-edit-title], [data-habit-edit-icon]')) {
          e.preventDefault();
          if (_editingHabitId) saveHabitEdit(_editingHabitId);
        } else if (e.key === 'Escape' && _editingHabitId) {
          e.preventDefault();
          cancelHabitEdit();
        }
      });
    }

    // Настройки
    const _sm = document.getElementById('settingsModal');
    if (_sm) _sm.addEventListener('click', function (e) {
      if (e.target === this) { this.hidden = true; return; }
      const el = e.target.closest('[data-action]'); if (!el) return;
      const action = el.dataset.action;
      if (action === 'close-settings') this.hidden = true;
      else if (action === 'restore-backup') restoreBackup(el.dataset.date);
    });
    document.querySelectorAll('[data-theme-opt]').forEach(function (b) {
      b.addEventListener('click', function () { setTheme(b.dataset.themeOpt); });
    });
    const _tadv = document.getElementById('toggleAdvancedBtn');
    if (_tadv) _tadv.addEventListener('click', function () {
      state.advancedToolsVisible = !state.advancedToolsVisible;
      savePrefs(); applyAdvancedToolsVisibility();
    });
    const _tqi = document.getElementById('toggleQuickInputBtn');
    if (_tqi) _tqi.addEventListener('click', function () {
      state.quickInputVisible = !state.quickInputVisible;
      savePrefs(); applyQuickInputVisibility();
    });
    const _nt = document.getElementById('notifToggle');
    if (_nt) _nt.addEventListener('click', function () {
      if (state.notificationsEnabled) {
        state.notificationsEnabled = false; savePrefs();
        showToast('Уведомления выключены', 'warn'); updateNotifBtn();
      } else requestNotifications();
    });

    // PIN
    const _psb = document.getElementById('pinSetupBtn');
    if (_psb) _psb.addEventListener('click', function () { openPinSetup('setup'); });
    const _pcb = document.getElementById('pinChangeBtn');
    if (_pcb) _pcb.addEventListener('click', function () { openPinSetup('change'); });
    const _prb = document.getElementById('pinRemoveBtn');
    if (_prb) _prb.addEventListener('click', function () {
      pgtConfirm({ title: 'Убрать PIN?', message: 'Приложение перестанет спрашивать PIN при открытии.', yesLabel: 'Убрать', onYes: function(){
        removePin(); renderPinStatus(); showToast('PIN убран', 'ok');
      } });
    });
    const _pln = document.getElementById('pinLockNowBtn');
    if (_pln) _pln.addEventListener('click', function () {
      const sm = document.getElementById('settingsModal');
      if (sm) sm.hidden = true;
      lockNow();
    });
    const _ql = document.getElementById('quickLockBtn');
    if (_ql) _ql.addEventListener('click', function () {
      if (!hasPin()) { pgtConfirm({ title: 'PIN не установлен', message: 'Установить сейчас?', yesLabel: 'Установить', danger: false, onYes: function(){ openPinSetup('setup'); } }); return; }
      lockNow();
    });
    const _pm = document.getElementById('pinSetupModal');
    if (_pm) {
      _pm.addEventListener('click', function (e) {
        if (e.target === this) { closePinSetup(); return; }
        const el = e.target.closest('[data-action]'); if (!el) return;
        if (el.dataset.action === 'close-pin-setup') closePinSetup();
        else if (el.dataset.action === 'save-pin') savePin();
      });
      _pm.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closePinSetup();
        else if (e.key === 'Enter') { e.preventDefault(); savePin(); }
      });
    }
    const _lb = document.getElementById('lockSubmitBtn');
    if (_lb) _lb.addEventListener('click', tryUnlock);
    // Формы вокруг PIN-полей: Enter отправляет форму — превращаем это в обычное
    // действие (разблокировать / сохранить) и не даём странице перезагрузиться.
    // Заодно Chrome перестаёт ругаться, что поле пароля вне формы.
    const _pf = document.getElementById('pinSetupForm');
    if (_pf) _pf.addEventListener('submit', function (e) { e.preventDefault(); savePin(); });
    const _lf = document.getElementById('lockForm');
    if (_lf) _lf.addEventListener('submit', function (e) { e.preventDefault(); tryUnlock(); });
    const _li = document.getElementById('lockPinInput');
    if (_li) {
      let _autoUnlockTimer = null;
      _li.addEventListener('input', function () {
        const inp = this;
        inp.value = inp.value.replace(/\D/g, '');
        if (isCurrentlyLocked()) return;
        const expectedLen = getPinLength();
        if (expectedLen > 0) {
          if (inp.value.length === expectedLen) tryUnlock();
        } else if (inp.value.length >= 4) {
          clearTimeout(_autoUnlockTimer);
          _autoUnlockTimer = setTimeout(function () { tryUnlock(); }, 400);
        }
      });
      _li.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); tryUnlock(); }
      });
    }
    const _lrb = document.getElementById('lockResetBtn');
    if (_lrb) _lrb.addEventListener('click', function () {
      pgtConfirm({
        title: 'Сбросить PIN и удалить всё?',
        message: 'Будут удалены ВСЕ данные приложения: цели, задачи, заметки, настройки. Это необратимо.',
        yesLabel: 'Удалить всё',
        onYes: function () {
          removePin();
          try {
            Object.keys(localStorage).forEach(function (k) { if (k.indexOf('pgt_v25_') === 0) localStorage.removeItem(k); });
            sessionStorage.clear();
          } catch (e) {}
          location.reload();
        }
      });
    });

    // Цвета статистики
    const _ct2 = document.getElementById('colorTotal');
    if (_ct2) _ct2.addEventListener('input', function (e) {
      state.colorTotal = e.target.value;
      document.documentElement.style.setProperty('--color-total', e.target.value);
      savePrefs();
    });
    const _cd = document.getElementById('colorDone');
    if (_cd) _cd.addEventListener('input', function (e) {
      state.colorDone = e.target.value;
      document.documentElement.style.setProperty('--color-done', e.target.value);
      savePrefs();
    });

    // Кэш и Zip
    const _cab = document.getElementById('cacheAllBtn');
    if (_cab) _cab.addEventListener('click', async function () {
      let total = 0, failed = 0;
      for (const s of SECTIONS) {
        if (!state.folders[s].files.length) continue;
        showToast('Кэширование: ' + (s === 'articles' ? 'статьи' : 'книги'), 'ok');
        const r = await cacheSectionFiles(s);
        total += r.done; failed += r.failed;
      }
      renderCacheStats();
      showToast('Сохранено: ' + total + (failed ? ', ошибок: ' + failed : ''), total ? 'ok' : 'warn');
    });
    const _scb = document.getElementById('syncCacheBtn');
    if (_scb) _scb.addEventListener('click', async function () {
      let added = 0, updated = 0, removed = 0, failed = 0;
      for (const s of SECTIONS) {
        if (!state.folders[s].files.length) continue;
        const r = await smartRefreshSection(s);
        added += r.added; updated += r.updated; removed += r.removed; failed += r.failed;
      }
      renderCacheStats();
      showToast('Обновлено: +' + added + ' ~' + updated + ' −' + removed + (failed ? ' ⚠' + failed : ''), failed ? 'warn' : 'ok');
    });
    const _ccb = document.getElementById('clearCacheBtn');
    if (_ccb) _ccb.addEventListener('click', function () {
      pgtConfirm({ title: 'Очистить кэш файлов?', message: 'Книги и статьи придётся подключать заново. Цели, задачи, заметки останутся.', yesLabel: 'Очистить', onYes: async function(){
        await clearCachedFiles(null);
        renderCacheStats();
        showToast('Кэш очищен', 'ok');
      } });
    });
    const _ezb = document.getElementById('exportZipBtn');
    if (_ezb) _ezb.addEventListener('click', exportAllToZip);
    const _izi = document.getElementById('importZipInput');
    if (_izi) _izi.addEventListener('change', function (e) {
      const f = e.target.files[0];
      if (f) importFromZip(f);
      e.target.value = '';
    });

    // Дашборд
        const _dc = document.getElementById('dashContent');
    if (_dc) {
      _dc.addEventListener('click', function (e) {
        const el = e.target.closest('[data-action]'); if (!el) return;
        const action = el.dataset.action;
        const gid = el.dataset.goalId; const tid = el.dataset.taskId;
        const tabId = el.dataset.tabId; const cardId = el.dataset.cardId;
        if (action === 'dash-open-task' && gid && tid) openEditTask(gid, tid);
		 else if (action === 'dash-open-report') openDailyReport();
        else if (action === 'dash-open-goal' && gid) openEditGoal(gid);
        else if (action === 'dash-open-card' && tabId && cardId) {
          switchTab(tabId);
          setTimeout(function () { openCustomCardModal(tabId, cardId); }, 120);
        }
      });
      _dc.addEventListener('change', function (e) {
        const el = e.target;
        if (!el.matches) return;
        if (el.matches('input[data-action="dash-toggle-task"]')) {
          toggleTask(el.dataset.goalId, el.dataset.taskId);
          setTimeout(renderDashboard, 50);
        }
        if (el.matches('input[data-action="dash-toggle-card"]')) {
          toggleCustomCardDone(el.dataset.tabId, el.dataset.cardId);
          setTimeout(renderDashboard, 50);
        }
      });
    }

    // Шпаргалка
    const _kb = document.getElementById('kbdHelpBtn');
    if (_kb) _kb.addEventListener('click', openKbdHelp);
    const _km = document.getElementById('kbdHelpModal');
    if (_km) _km.addEventListener('click', function (e) {
      if (e.target === this) { closeKbdHelp(); return; }
      const el = e.target.closest('[data-action]');
      if (el && el.dataset.action === 'close-kbd-help') closeKbdHelp();
    });

    // Папка данных
    const _pdf = document.getElementById('pickDataFolderBtn');
    if (_pdf) _pdf.addEventListener('click', pickDataFolder);
    const _ddf = document.getElementById('disconnectDataFolderBtn');
    if (_ddf) _ddf.addEventListener('click', disconnectDataFolder);

    // Бэкапы
    const _mb = document.getElementById('manualBackupBtn');
    if (_mb) _mb.addEventListener('click', async function () {
      await makeBackup('manual'); renderBackupList(); showToast('Резервная копия создана', 'ok');
    });
    const _cb = document.getElementById('clearBackupsBtn');
    if (_cb) _cb.addEventListener('click', clearAllBackups);

    // Глобальный поиск
    const _gsm = document.getElementById('globalSearchModal');
    if (_gsm) _gsm.addEventListener('click', function (e) {
      if (e.target === this) { closeGlobalSearch(); return; }
      const el = e.target.closest('[data-action]'); if (!el) return;
      const action = el.dataset.action;
      if (action === 'close-gsearch') { closeGlobalSearch(); return; }
      if (action === 'goto-goal') { const gid = el.dataset.id; closeGlobalSearch(); switchTab('active'); if (state.collapsed[gid]) { state.collapsed[gid] = false; savePrefs(); renderGoals(); } setTimeout(function () { const g = document.querySelector('.goal[data-goal-id="' + CSS.escape(gid) + '"]'); if (g) g.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100); }
      else if (action === 'goto-task') { const gid = el.dataset.goalId; const tid = el.dataset.taskId; closeGlobalSearch(); switchTab('active'); if (state.collapsed[gid]) { state.collapsed[gid] = false; savePrefs(); renderGoals(); } setTimeout(function () { openEditTask(gid, tid); }, 150); }
      else if (action === 'goto-note') { const nid = el.dataset.id; closeGlobalSearch(); switchTab('notes'); state.editingNoteId = nid; renderNotesList(); renderNoteEditor(); }
      else if (action === 'goto-snippet') { const sid = el.dataset.id; closeGlobalSearch(); openSnippetsModal(); state.editingSnippetId = sid; renderSnippetsList(); }
      else if (action === 'goto-file') { const sec = el.dataset.section; const fname = el.dataset.name; closeGlobalSearch(); switchTab('literature'); state.ui.litTab = sec; savePrefs(); renderTabs(); setTimeout(function () { selectFile(sec, fname); }, 100); }
    });
    const _gsi = document.getElementById('globalSearchInput');
    if (_gsi) _gsi.addEventListener('input', debounce(function (e) { performGlobalSearch(e.target.value); }, 180));

    // Цитаты
    const _sn = document.getElementById('snippetsModal');
    if (_sn) _sn.addEventListener('click', function (e) {
      if (e.target === this) { closeSnippetsModal(); return; }
      const el = e.target.closest('[data-action]'); if (!el) return;
      const action = el.dataset.action; const id = el.dataset.id;
      if (action === 'close-snippets') closeSnippetsModal();
      else if (action === 'clear-snippets') clearAllSnippets();
      else if (action === 'delete-snippet') {
        const s = findSnippet(id);
        pgtConfirm({ title: 'Удалить цитату?', message: s ? (s.text.slice(0, 120) + (s.text.length > 120 ? '…' : '')) : 'Цитата будет удалена безвозвратно.', yesLabel: 'Да, удалить', onYes: function(){ deleteSnippet(id); } });
      }
      else if (action === 'edit-snippet') editSnippet(id);
      else if (action === 'cancel-snippet-edit') cancelSnippetEdit();
      else if (action === 'save-snippet-edit') saveSnippetEdit(id);
      else if (action === 'copy-snippet') copySnippetToClipboard(id);
      else if (action === 'filter-tag') { const t = el.dataset.tag; state.ui.snippetsTagFilter = state.ui.snippetsTagFilter === t ? '' : t; document.getElementById('snippetsTagFilter').value = state.ui.snippetsTagFilter; renderSnippetsList(); }
      else if (action === 'export-menu') { const fmt = prompt('Формат: doc, md, csv, bib, txt'); if (!fmt) return; const f = fmt.toLowerCase().trim(); if (['doc', 'md', 'csv', 'bib', 'txt'].indexOf(f) === -1) { showToast('Неизвестный формат', 'warn'); return; } exportSnippets(f); }
    });
    const _ss = document.getElementById('snippetsSearch');
    if (_ss) _ss.addEventListener('input', debounce(function (e) { state.ui.snippetsSearch = e.target.value; savePrefs(); renderSnippetsList(); }, 180));
    const _sst = document.getElementById('snippetsSort');
    if (_sst) _sst.addEventListener('change', function (e) { state.ui.snippetsSort = e.target.value; savePrefs(); renderSnippetsList(); });
    const _stf = document.getElementById('snippetsTagFilter');
    if (_stf) _stf.addEventListener('change', function (e) { state.ui.snippetsTagFilter = e.target.value; savePrefs(); renderSnippetsList(); });
    const _sg = document.getElementById('snippetsGroup');
    if (_sg) _sg.addEventListener('change', function (e) { state.ui.snippetsGroup = e.target.value; savePrefs(); renderSnippetsList(); });

    // Поиск по содержимому
    const _csm = document.getElementById('contentSearchModal');
    if (_csm) _csm.addEventListener('click', function (e) {
      if (e.target === this) { this.hidden = true; return; }
      const el = e.target.closest('[data-action]'); if (!el) return;
      const action = el.dataset.action;
      if (action === 'close-csearch') this.hidden = true;
      else if (action === 'open-indexed') {
        const sec = el.dataset.section; const fname = el.dataset.file;
        this.hidden = true; switchTab('literature'); state.ui.litTab = sec; savePrefs(); renderTabs();
        setTimeout(function () { selectFile(sec, fname); }, 100);
      }
    });
    const _csi = document.getElementById('contentSearchInput');
    if (_csi) _csi.addEventListener('input', debounce(function (e) { performContentSearch(e.target.value, e.target.dataset.section || 'articles'); }, 200));

    // Календарь
    const _cal = document.getElementById('appCalendar');
    if (_cal) _cal.addEventListener('click', function (e) {
      const navBtn = e.target.closest('[data-action]');
      if (navBtn) {
        const action = navBtn.dataset.action;
        if (action === 'cal-prev') calPrev();
        else if (action === 'cal-next') calNext();
        else if (action === 'cal-today') calToday();
        else if (action === 'clear-day') clearDateFilter();
        return;
      }
      const cell = e.target.closest('.cal-cell');
      if (cell && !cell.classList.contains('empty') && cell.dataset.date) selectCalendarDay(cell.dataset.date);
    });

    // Тулбар списка задач
    const _si = document.getElementById('searchInput');
    if (_si) _si.addEventListener('input', debounce(function (e) { state.ui.search = e.target.value; savePrefs(); renderTasks(); }, 150));
    const _fs = document.getElementById('filterSelect');
    if (_fs) _fs.addEventListener('change', function (e) { state.ui.filter = e.target.value; savePrefs(); renderTasks(); });
    const _ssel = document.getElementById('sortSelect');
    if (_ssel) _ssel.addEventListener('change', function (e) { state.ui.sort = e.target.value; savePrefs(); renderTasks(); });
    const _gsel = document.getElementById('groupSelect');
    if (_gsel) _gsel.addEventListener('change', function (e) { state.tasksGrouping = e.target.value; savePrefs(); renderTasks(); });
    const _tfs = document.getElementById('tagFilterSelect');
    if (_tfs) _tfs.addEventListener('change', function (e) { state.tagFilter = e.target.value; savePrefs(); renderTasks(); });
    const _tab = document.getElementById('toggleAllBtn');
    if (_tab) _tab.addEventListener('click', function () {
      const goals = visibleGoals();
      const allCollapsed = goals.length > 0 && goals.every(function (g) { return state.collapsed[g.id]; });
      if (allCollapsed) expandAll(); else collapseAll();
    });

    // Экспорт/импорт
    const _eb = document.getElementById('exportBtn');
    if (_eb) _eb.addEventListener('click', exportData);
      const _emb = document.getElementById('exportMdBtn');
    if (_emb) _emb.addEventListener('click', exportMarkdownReport);
    const _ecv = document.getElementById('exportCsvBtn');
    if (_ecv) _ecv.addEventListener('click', exportTasksCsv);
    const _eib = document.getElementById('exportIcsBtn');
    if (_eib) _eib.addEventListener('click', exportIcs);
    const _ii = document.getElementById('importInput');
    if (_ii) _ii.addEventListener('change', importData);
    const _ici = document.getElementById('importCsvInput');
    if (_ici) _ici.addEventListener('change', function (e) {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = function () { importFromCsv(String(r.result || '')); e.target.value = ''; };
      r.readAsText(f);
    });
    const _clb = document.getElementById('clearBtn');
    if (_clb) _clb.addEventListener('click', clearAllData);

    // Клавиатурные сокращения
    document.addEventListener('keydown', function (e) {
      const ae = document.activeElement;
      const inField = ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT' || ae.isContentEditable);
      const anyModal = document.querySelector('.modal-backdrop:not([hidden])');
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z' || e.key === 'я' || e.key === 'Я')) { if (!inField) { e.preventDefault(); performUndo(); return; } }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S' || e.key === 's' || e.key === 'Ы' || e.key === 'ы')) { if (state.ui.tab === 'literature') { e.preventDefault(); saveSelectionAsSnippet(); } return; }
       if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'k' || e.key === 'K' || e.key === 'л' || e.key === 'Л')) { e.preventDefault(); openCommandPalette(); return; }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'k' || e.key === 'K' || e.key === 'л' || e.key === 'Л')) { e.preventDefault(); toggleCalendar(); return; }    
      if ((e.ctrlKey || e.metaKey) && (e.key === '/' || e.key === '.')) { e.preventDefault(); openGlobalSearch(); return; }
      // Alt + 1..9 — переключение на первые 9 видимых вкладок
      if (e.altKey && !e.ctrlKey && !e.metaKey && !inField && !anyModal) {
        const m = String(e.key).match(/^([1-9])$/);
        if (m) {
          e.preventDefault();
          const digit = parseInt(m[1], 10); // 1..9
          // Берём видимые вкладки в порядке отображения
          const visibleIds = state.tabOrder.filter(function (id) {
            const std = state.tabs.find(function (t) { return t.id === id; });
            if (std) return std.visible;
            const ct = (state.customTabs || []).find(function (t) { return t.id === id; });
            return !!ct;
          });
          const targetId = visibleIds[digit - 1];
          if (targetId && targetId !== state.ui.tab) {
            switchTab(targetId);
          }
          return;
        }
      }
      if (e.key === 'Escape') {
        if (anyModal) { anyModal.hidden = true;
          if (anyModal.id === 'editTaskModal') { state.editingTaskId = null; state.editingTaskGoalId = null; }
          if (anyModal.id === 'editGoalModal') { state.editingGoalId = null; }
          return;
        }
        let handled = false;
        SECTIONS.forEach(function (s) { const pane = document.getElementById(s + 'Reader'); if (pane && pane.classList.contains('fullscreen')) { pane.classList.remove('fullscreen'); handled = true; } });
        if (!handled && state.ui.tab === 'literature' && !inField) closeReader(state.ui.litTab);
        return;
      }
      if (!anyModal && !inField && state.ui.tab === 'literature') {
        if (e.key === 'ArrowLeft') { e.preventDefault(); navigateFile(state.ui.litTab, -1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); navigateFile(state.ui.litTab, 1); }
      }
    });
    document.addEventListener('keydown', function (e) {
      const ae = document.activeElement;
      const inField = ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT' || ae.isContentEditable);
      const anyModal = document.querySelector('.modal-backdrop:not([hidden])');
      if (inField || anyModal) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = (e.key || '').toLowerCase();
      if (k === 'n') { e.preventDefault(); document.getElementById('taskText').focus(); }
      else if (k === 'g') { e.preventDefault(); document.getElementById('goalTitle').focus(); }
      else if (e.key === '?') { e.preventDefault(); openKbdHelp(); }
    });

    // Перед закрытием — сохранить
    window.addEventListener('beforeunload', function () {
      if (_dataFolderHandle && _dataFolderWriteTimer) {
        clearTimeout(_dataFolderWriteTimer);
        _dataFolderWriteTimer = null;
        try { writeAllToDisk(); } catch (e) {}
      }
    });
    window.addEventListener('beforeunload', function () {
      if (runtime.articles.selected) saveCurrentPosition('articles');
      if (runtime.books.selected) saveCurrentPosition('books');
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    });

    // Синхронизация между вкладками браузера.
    // Раньше здесь безусловно вызывался loadState() + render(): если во второй
    // вкладке что-то сохранилось, первая молча перечитывала данные и теряла
    // недописанный текст в открытом редакторе. Теперь при активном вводе
    // показываем предупреждение с кнопкой «Обновить» и ждём решения человека.
    window.addEventListener('storage', function (e) {
  if (!e.key) return;
  // Слушаем не только старые ключи, но и bundle
  const bases = [DATA_KEY, PREFS_KEY, SNIPPETS_KEY, NOTES_KEY, TEMPLATES_KEY, BUNDLE_KEY];
  const hit = bases.some(function (b) { return e.key === b || e.key.indexOf(b + '_') === 0; });
  if (!hit) return;

  // Проверяем: не новее ли данные в другой вкладке?
  try {
    const raw = localStorage.getItem(BUNDLE_KEY);
    if (raw) {
      const b = JSON.parse(raw);
      if (b && typeof b.rev === 'number' && b.rev > (state._rev || 0)) {
        // Данные новее — обновляемся
        if (isTypingNow()) {
          if (!document._pgtRemoteChangeNotified) {
            document._pgtRemoteChangeNotified = true;
            showToast('Данные изменились в другой вкладке', 'warn', 'Обновить', function () {
              document._pgtRemoteChangeNotified = false;
              loadState(); _searchIndexDirty = true;
              applyTheme(); applyColors(); syncToolbarInputs(); applyCalendarVisibility();
              render();
            }, 12000);
          }
          return;
        }
        loadState(); _searchIndexDirty = true;
        applyTheme(); applyColors(); syncToolbarInputs(); applyCalendarVisibility(); render();
        return;
      }
    }
  } catch (err) { /* ignore */ }

  // Старые ключи — просто перечитываем
  if (isTypingNow()) {
    if (!document._pgtRemoteChangeNotified) {
      document._pgtRemoteChangeNotified = true;
      showToast('Данные изменились в другой вкладке', 'warn', 'Обновить', function () {
        document._pgtRemoteChangeNotified = false;
        loadState(); _searchIndexDirty = true;
        applyTheme(); applyColors(); syncToolbarInputs(); applyCalendarVisibility();
        render();
      }, 12000);
    }
    return;
  }
  document._pgtRemoteChangeNotified = false;
  loadState(); _searchIndexDirty = true;
  applyTheme(); applyColors(); syncToolbarInputs(); applyCalendarVisibility(); render();
});
  } 

initLoginGate();
  // Помечаем секции настроек, которые не нужны на телефоне:
  // элементы интерфейса, расширенные инструменты, уведомления,
  // бэкапы, папка данных, кэш. На телефоне оставляем только:
  // Google Drive, PIN, цвета статистики.
  (function markMobileHiddenSettings() {
    const HIDE_TITLES = [
      'элементы интерфейса',
      'расширенные инструменты',
      'уведомления',
      'резервные копии',
      'папка данных',
      'кэш файлов'
    ];
    const mark = function () {
      const modal = document.getElementById('settingsModal');
      if (!modal) return;
      modal.querySelectorAll('.settings-section').forEach(function (sec) {
        const h3 = sec.querySelector('h3');
        if (!h3) return;
        const text = (h3.textContent || '').toLowerCase();
        const shouldHide = HIDE_TITLES.some(function (t) { return text.indexOf(t) !== -1; });
        sec.classList.toggle('settings-mobile-hide', shouldHide);
      });
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mark);
    } else {
      mark();
    }
  })();
   // Сначала пробуем загрузить единый пакет. Если его нет — работаем
  // со старыми ключами (loadState ниже). Это даёт обратную совместимость
  // и позволяет откатиться без потери данных.
  var bundleLoaded = tryLoadBundle();
  if (!bundleLoaded) loadState();
  // Через 2 секунды после старта, если bundle ещё нет — сохраним его
  // (миграция разовая, при первом запуске после обновления).
  setTimeout(function () {
    try {
      if (!localStorage.getItem(BUNDLE_KEY)) saveBundle();
    } catch (e) {}
  }, 2000);
  applyTheme();
  applyColors();
  syncToolbarInputs();
    applyCalendarVisibility();
applyQuickInputVisibility();
      switchSidePanel(state.sidePanel || 'calendar');
  // Инициализируем свайп по модалкам на телефоне
  initMobileSheetSwipe();

  // Тап по верхней части модалки (за «ручку») — тоже закрывает шторку на телефоне
  document.addEventListener('click', function (e) {
    if (!window.matchMedia('(max-width: 700px)').matches) return;
    var modal = e.target.closest('.modal-backdrop:not([hidden]) .modal');
    if (!modal) return;
    var rect = modal.getBoundingClientRect();
    // Зона 22px сверху
    if (e.clientY - rect.top > 22) return;
    // Не мешаем кнопкам в шапке модалки
    if (e.target.closest('button, a, input, select')) return;
    var bd = modal.closest('.modal-backdrop');
    if (!bd) return;
    modal.style.transition = '';
    modal.style.transform = 'translateY(100%)';
    bd.style.background = 'rgba(0,0,0,0)';
    setTimeout(function () {
      bd.hidden = true;
      bd.style.background = '';
      modal.style.transform = '';
    }, 260);
  });
  applyAdvancedToolsVisibility();
  bindEvents();
 initTabsDragAndDrop();
  resetGoalForm();
  resetTaskForm();
  render();
  // Подписи для кнопок-иконок + повторная разметка после каждой перерисовки
  // списков (goals/tasks/notes/literature строятся через innerHTML).
  applyA11yLabels();
  (function watchA11y() {
    if (typeof MutationObserver !== 'function') return;
    let scheduled = false;
    const observer = new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      setTimeout(function () {
        scheduled = false;
        applyA11yLabels._dirty = true;
        applyA11yLabels();
      }, 200);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  })();
  SECTIONS.forEach(renderReaderEmpty);
  updateSnippetsBadges();
  tryRestoreHandles();
  updateNotifBtn();
   bootApp();
  setTimeout(checkBackup, 3000);
  setInterval(checkNotifications, 5 * 60 * 1000);
 setTimeout(checkNotifications, 30000);
 setTimeout(initDataFolder, 500);
 setTimeout(autoArchiveOldCompletedTasks, 1500);
  setTimeout(autoCleanTrash, 2000);
      setTimeout(function () {
       // Кнопка «Корзина» в шапке (ПК)
       const trashHdr = document.getElementById('trashHeaderBtn');
       if (trashHdr) trashHdr.addEventListener('click', openTrashModal);

       // Кнопка «Корзина» в нижней навигации (телефон) —
       // привязываем через делегирование, потому что nav пересоздаётся
       const tabsNavForTrash = document.getElementById('tabsNav');
       if (tabsNavForTrash && tabsNavForTrash.dataset.trashBound !== '1') {
         tabsNavForTrash.dataset.trashBound = '1';
         tabsNavForTrash.addEventListener('click', function (e) {
           const trashBtn = e.target.closest('#trashTabBtn');
           if (trashBtn) {
             e.stopPropagation();
             e.preventDefault();
             openTrashModal();
           }
         }, true);
       }
    // Кнопки в модалке корзины
    const trashModal = document.getElementById('trashModal');
    if (trashModal) {
      trashModal.addEventListener('click', function (e) {
        if (e.target === trashModal) { closeTrashModal(); return; }
        const el = e.target.closest('[data-action]');
        if (!el) return;
        const action = el.dataset.action;
        const id = el.dataset.id;
        if (action === 'close-trash') closeTrashModal();
        else if (action === 'trash-empty') emptyTrash();
        else if (action === 'trash-restore') restoreFromTrash(id);
        else if (action === 'trash-delete') {
          pgtConfirm({
            title: 'Удалить навсегда?',
            message: 'Запись будет удалена безвозвратно.',
            yesLabel: 'Удалить',
            onYes: function () { permanentlyDeleteFromTrash(id); }
          });
        }
      });
    }
    saveTrash();
  }, 700);
   setTimeout(checkSmartReminders, 6000);
     setTimeout(maybeAutoShowReport, 4000);
  setTimeout(function () {
    const rModal = document.getElementById('dailyReportModal');
    if (!rModal) return;
    rModal.addEventListener('click', function (e) {
      if (e.target === rModal) { rModal.hidden = true; return; }
      const el = e.target.closest('[data-action]');
      if (el && el.dataset.action === 'close-report') rModal.hidden = true;
    });
  }, 500);
 initTaskSwipe();
  // Миграция старых IDB-блобов в OPFS и запрос persistent-хранилища
  (async function initStorage() {
    try {
      if (navigator.storage && navigator.storage.persist) {
        const persisted = await navigator.storage.persisted();
        if (!persisted) await navigator.storage.persist();
      }
    } catch (e) {}
        try { await migrateIdbBlobsToOpfs(); } catch (e) {}
  })();

   // === PWA: установка приложения + регистрация Service Worker + автообновление ===
  (function initPwa() {
    const btn = document.getElementById('installPwaBtn');
    let deferred = null;
    if (btn) {
      btn.addEventListener('click', function () {
        if (deferred) {
          deferred.prompt();
          deferred.userChoice.then(function (choice) {
            if (choice && choice.outcome === 'accepted') showToast('Приложение установлено', 'ok');
            deferred = null;
            btn.hidden = true;
          }).catch(function () {});
        } else {
          showToast('Установка недоступна. Откройте сайт по HTTPS (или localhost).', 'warn', null, null, 6000);
        }
      });
    }
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferred = e;
      if (btn) btn.hidden = false;
    });
    window.addEventListener('appinstalled', function () {
      deferred = null;
      if (btn) btn.hidden = true;
      showToast('Приложение установлено! 🎉', 'ok');
    });

    if (!('serviceWorker' in navigator)) return;

    // Показываем плашку «Доступно обновление» с кнопкой «Обновить»
    // === БЕСШОВНОЕ ОБНОВЛЕНИЕ ===
// Новый Service Worker устанавливается «в фоне» и активируется
// при следующем открытии приложения. Пользователь ничего не видит.
// Если пользователь прямо сейчас в приложении — обновление
// применится при следующем запуске, без потери данных.
function installSilently(worker) {
  // Отправляем команду «активируйся» — воркер станет активным.
  // Страница НЕ перезагрузится сама.
  try { worker.postMessage({ type: 'SKIP_WAITING' }); } catch (e) {}
}

// Заменяем все вызовы showUpdateToast на installSilently

    window.addEventListener('load', function () {
     navigator.serviceWorker.register('./sw-v2.js').then(function (reg) {
        // Если новый воркер уже ждёт — активируем молча
if (reg.waiting) installSilently(reg.waiting);

reg.addEventListener('updatefound', function () {
  const newWorker = reg.installing;
  if (!newWorker) return;
  newWorker.addEventListener('statechange', function () {
    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
      // Новый воркер установился — активируем без уведомления
      installSilently(newWorker);
    }
  });
});

        // Раз в час проверяем обновления
        setInterval(function () { reg.update().catch(function () {}); }, 60 * 60 * 1000);
      }).catch(function (err) {
        console.warn('[PWA] Ошибка SW:', err.message);
      });

            // Когда новый воркер стал контроллером — НЕ перезагружаем принудительно.
      // Обновление применится при следующем открытии приложения.
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (refreshing) return;
        refreshing = true;
        // Не делаем location.reload() — ждём следующего запуска.
      });
    });
  })();
    // ============================================================
  // МОСТ ДЛЯ GOOGLE DRIVE (sync.js ↔ index.html)
  // ============================================================

  // Отдаём sync.js доступ к локальному хранилищу
  window.__pgtRemoteFiles = {
    // Метаданные локально сохранённых файлов секции (без чтения содержимого)
    getLocalFileMeta: function (section) {
      const result = [];
      const files = state.folders[section].files || [];
      files.forEach(function (f) {
        // считаем "локальным" только если файл есть в runtime.fileCache или в OPFS
        // (проверка storageHas — async, поэтому здесь полагаемся на отсутствие флага remoteOnly)
        if (!f.remoteOnly) {
          result.push({ name: f.name, size: f.size || 0, lastModified: f.lastModified || 0 });
        }
      });
      return result;
    },

    // Прочитать содержимое локального файла
    readLocalFile: async function (section, name) {
      try {
        const f = await resolveFile(section, name);
        return f || null;
      } catch (e) { return null; }
    },

    // Записать скачанный файл в локальное хранилище
    writeLocalFile: async function (section, name, blob) {
      const file = new File([blob], name, { type: blob.type || '', lastModified: Date.now() });
      runtime[section].fileCache.set(name, file);
      await storageWrite(section, name, file);
      // снять флаг remoteOnly
      const existing = state.folders[section].files.find(f => f.name === name);
      if (existing) {
        existing.remoteOnly = false;
        existing.size = file.size;
        existing.lastModified = file.lastModified;
      } else {
        state.folders[section].files.push({
          name: name, ext: getExt(name), size: file.size,
          lastModified: file.lastModified, remoteOnly: false
        });
      }
      saveData();
      renderList(section);
      renderSectionCount();
    },

    // Зарегистрировать файл, существующий только в облаке
    registerRemote: function (section, meta) {
      const existing = state.folders[section].files.find(f => f.name === meta.name);
      if (existing) {
        existing.driveId = meta.driveId;
        existing.size = meta.size;
        existing.lastModified = meta.lastModified;
        // если он есть локально — remoteOnly снимаем
        if (!existing.remoteOnly && runtime[section].fileCache.has(meta.name)) {
          existing.remoteOnly = false;
        }
      } else {
        state.folders[section].files.push(meta);
      }
      saveData();
      renderList(section);
      renderSectionCount();
    },

    setDriveId: function (section, name, driveId) {
      const f = state.folders[section].files.find(f => f.name === name);
      if (f) f.driveId = driveId;
    },

    removeRemote: function (section, name) {
      const idx = state.folders[section].files.findIndex(f => f.name === name);
      if (idx !== -1) {
        const f = state.folders[section].files[idx];
        if (f.remoteOnly) {
          // удалим полностью — он был только в облаке
          state.folders[section].files.splice(idx, 1);
        }
      }
      saveData();
      renderList(section);
      renderSectionCount();
    }
  };

  // Позволяем sync.js перечитать состояние после применения облачных данных
  window.__pgtApplyRemoteData = function () {
    loadState();
    _searchIndexDirty = true;
    applyTheme();
    applyColors();
    syncToolbarInputs();
    applyCalendarVisibility();
    render();
  };

  // ---- Правка resolveFile: если файла нет локально, но есть driveId — тянем из облака
  const _originalResolveFile = resolveFile;
  resolveFile = async function (section, name) {
    // 1. Сначала стандартный путь (кэш, OPFS, FileSystemAccess)
    let file = await _originalResolveFile(section, name);
    if (file) return file;

    // 2. Файла нет локально — попробуем скачать из Drive
    const meta = state.folders[section].files.find(f => f.name === name);
    if (meta && meta.driveId && window.__pgtDrive && window.__pgtDrive.isSignedIn()) {
      try {
        if (typeof showToast === 'function') showToast('Скачиваю из облака: ' + name, 'ok');
        const blob = await window.__pgtDrive.downloadFile(section, name, meta.driveId);
        return new File([blob], name, { type: blob.type || '', lastModified: Date.now() });
      } catch (e) {
        console.warn('[drive-download]', e);
        if (typeof showToast === 'function') showToast('Не удалось скачать: ' + name, 'error');
      }
    }
    return null;
  };

  // ---- Правка renderList: добавить значок облака к файлам, которых нет локально
  const _originalRenderList = renderList;
  renderList = function (section) {
    _originalRenderList(section);
    const listEl = document.getElementById(section + 'List');
    if (!listEl) return;
    const items = listEl.querySelectorAll('.lit-item');
    items.forEach(function (item) {
      const name = item.dataset.name;
      const meta = state.folders[section].files.find(f => f.name === name);
      if (!meta) return;
      const body = item.querySelector('.lit-item-sub');
      if (!body) return;
      // убираем старые значки
      body.querySelectorAll('.lit-item-remote-badge').forEach(b => b.remove());
      if (meta.remoteOnly) {
        const badge = document.createElement('span');
        badge.className = 'lit-item-remote-badge cloud';
        badge.textContent = '☁️ в облаке';
        badge.title = 'Файл только в Drive. Откроется при клике — скачается автоматически.';
        body.appendChild(badge);
      } else if (meta.driveId) {
        const badge = document.createElement('span');
        badge.className = 'lit-item-remote-badge local';
        badge.textContent = '💾 + ☁️';
        badge.title = 'Файл есть и локально, и в Drive.';
        body.appendChild(badge);
      }
    });
  };

  // ---- Кнопка выхода и обновление панели Drive в настройках
  async function refreshDriveSettingsUI() {
    const statusEl = document.getElementById('driveStatusRow');
    const cloudEl = document.getElementById('driveCloudCount');
    const localEl = document.getElementById('driveLocalCount');
    const signOutBtn = document.getElementById('driveSignOutBtn');
    if (!statusEl) return;

    const signedIn = window.__pgtDrive && window.__pgtDrive.isSignedIn();
    if (!signedIn) {
      statusEl.innerHTML = '<b style="color:var(--gold)">Не подключено.</b> Перезагрузите страницу и войдите через экран входа.';
      if (signOutBtn) signOutBtn.hidden = true;
    } else {
      statusEl.innerHTML = '<b style="color:var(--color-total)">Подключено.</b> Синхронизация активна.';
      if (signOutBtn) signOutBtn.hidden = false;
    }

    // Считаем локальные и облачные
    let localCount = 0, cloudCount = 0;
    SECTIONS.forEach(function (s) {
      state.folders[s].files.forEach(function (f) {
        if (f.remoteOnly) cloudCount++;
        else localCount++;
      });
    });
    if (cloudEl) cloudEl.textContent = String(cloudCount);
    if (localEl) localEl.textContent = String(localCount);
  }

  // Обновлять панель при открытии настроек
  const _settingsBtn = document.getElementById('settingsBtn');
  if (_settingsBtn) {
    _settingsBtn.addEventListener('click', function () {
      setTimeout(refreshDriveSettingsUI, 100);
    });
  }

  // ---- Привязка кнопок Drive в настройках
  setTimeout(function () {
    const syncNowBtn = document.getElementById('driveSyncNowBtn');
    if (syncNowBtn) syncNowBtn.addEventListener('click', async function () {
      if (!window.__pgtDrive || !window.__pgtDrive.isSignedIn()) {
        showToast('Сначала войдите в Google', 'warn');
        return;
      }
      this.disabled = true;
      this.textContent = '⏳ Синхронизация…';
      try {
        await window.__pgtDrive.syncNow();
        await refreshDriveSettingsUI();
        showToast('Синхронизировано', 'ok');
      } catch (e) {
        showToast('Ошибка: ' + e.message, 'error');
      } finally {
        this.disabled = false;
        this.textContent = '🔄 Синхронизировать сейчас';
      }
    });

    const cacheAllBtn = document.getElementById('driveCacheAllBtn');
    if (cacheAllBtn) cacheAllBtn.addEventListener('click', async function () {
      if (!window.__pgtDrive || !window.__pgtDrive.isSignedIn()) {
        showToast('Сначала войдите в Google', 'warn');
        return;
      }
      const remoteFiles = [];
      SECTIONS.forEach(function (s) {
        state.folders[s].files.forEach(function (f) {
          if (f.remoteOnly && f.driveId) remoteFiles.push({ section: s, name: f.name, driveId: f.driveId });
        });
      });
      if (!remoteFiles.length) { showToast('Все файлы уже локально', 'ok'); return; }
      this.disabled = true;
      let done = 0;
      for (const rf of remoteFiles) {
        this.textContent = '⏳ ' + (done + 1) + '/' + remoteFiles.length;
        try {
          await window.__pgtDrive.downloadFile(rf.section, rf.name, rf.driveId);
          done++;
        } catch (e) { console.warn('[cacheAll]', e); }
      }
      this.disabled = false;
      this.textContent = '💾 Скачать всё в кэш';
      await refreshDriveSettingsUI();
      showToast('Скачано: ' + done + ' из ' + remoteFiles.length, 'ok');
    });

    const signOutBtn = document.getElementById('driveSignOutBtn');
        if (signOutBtn) signOutBtn.addEventListener('click', function () {
      pgtConfirm({ title: 'Выйти из Google?', message: 'Синхронизация остановится. Локальные данные останутся.', yesLabel: 'Выйти', onYes: function(){
        if (window.__pgtDrive) window.__pgtDrive.signOut();
        refreshDriveSettingsUI();
        showToast('Вы вышли из Google', 'ok');
     } });
    });
  }, 500);

  // ---- Запоминаем, когда локальные данные последний раз менялись
  // (чтобы sync.js мог понять, что новее — облако или локально)
  
  // === FEATURE: MINI-TASKS PANEL ===
  function getTodayTasks() {
    const todayISO = dateToISO(new Date());
    const out = [];
    state.goals.forEach(function (g) {
      if (g.archivedAt) return;
      g.tasks.forEach(function (t) {
        if (t.archivedAt || t.done) return;
        if (t.deadline === todayISO || isOverdue(t)) out.push({ goal: g, task: t, overdue: isOverdue(t) });
      });
    });
    out.sort(function (a, b) { return (a.overdue === b.overdue) ? 0 : (a.overdue ? -1 : 1); });
    return out;
  }
  function updateMiniTasksBadge() {
    const el = document.getElementById('miniTasksCount');
    if (!el) return;
    const n = getTodayTasks().length;
    el.textContent = String(n);
    el.classList.toggle('zero', n === 0);
  }
  function renderMiniTasksPanel() {
    const list = document.getElementById('miniTasksList');
    const sub = document.getElementById('miniTasksSub');
    if (!list) return;
    const items = getTodayTasks();
    if (sub) sub.textContent = items.length ? (items.length + ' шт.') : '';
    if (!items.length) { list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px;">На сегодня пусто ✨</div>'; return; }
    list.innerHTML = items.map(function (it) {
      const t = it.task, g = it.goal;
      const meta = [];
      if (!g.isInbox) meta.push(escapeHtml(g.title));
      if (it.overdue) meta.push('<span style="color:var(--danger);font-weight:700;">просрочено</span>');
      if (t.priority === 'high') meta.push('высокий');
      return '<div class="mini-task-item" data-action="mini-open" data-goal-id="' + escapeHtml(g.id) + '" data-task-id="' + escapeHtml(t.id) + '">' +
        '<input type="checkbox" data-action="mini-toggle" data-goal-id="' + escapeHtml(g.id) + '" data-task-id="' + escapeHtml(t.id) + '" />' +
        '<div><div class="text">' + escapeHtml(t.text) + '</div><div class="meta">' + meta.join(' • ') + '</div></div>' +
      '</div>';
    }).join('');
  }
  function bindMiniTasks() {
    const btn = document.getElementById('miniTasksBtn');
    const panel = document.getElementById('miniTasksPanel');
    if (!btn || !panel) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (panel.hidden) { renderMiniTasksPanel(); panel.hidden = false; }
      else panel.hidden = true;
    });
    document.addEventListener('click', function (e) {
      if (panel.hidden) return;
      if (e.target.closest('#miniTasksPanel') || e.target.closest('#miniTasksBtn')) return;
      panel.hidden = true;
    });
    panel.addEventListener('click', function (e) {
      const el = e.target.closest('[data-action]'); if (!el) return;
      const a = el.dataset.action;
      const gid = el.dataset.goalId, tid = el.dataset.taskId;
         if (a === 'mini-open') { openEditTask(gid, tid); panel.hidden = true; }
    });
    panel.addEventListener('change', function (e) {
      if (e.target.matches('input[data-action="mini-toggle"]')) {
        toggleTask(e.target.dataset.goalId, e.target.dataset.taskId);
        setTimeout(function(){ renderMiniTasksPanel(); updateMiniTasksBadge(); }, 30);
      }
    });
  }
  // Хук: обновляем счётчик при каждом рендере
  const _origRenderForMini = render;
  render = function () {
    _origRenderForMini();
    updateMiniTasksBadge();
  };
   // Привязка кнопки «Сегодня» в шапке
  setTimeout(function () {
    const btn = document.getElementById('todayWidgetBtn');
    if (btn) btn.addEventListener('click', function () { switchTab('today'); });
  }, 400);
    // Кнопка «＋» на мобильном — фокус на быстрый ввод
  setTimeout(function () {
    const fab = document.getElementById('mobileFab');
    if (!fab) return;
    fab.addEventListener('click', function () {
      if (!state.quickInputVisible) {
        state.quickInputVisible = true;
        savePrefs();
        applyQuickInputVisibility();
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(function () {
        const inp = document.getElementById('quickInput');
        if (inp) { inp.focus(); }
      }, 350);
    });
  }, 400);
 // Запуск
  setTimeout(function () {
    bindMiniTasks();
    updateMiniTasksBadge();
    setInterval(updateMiniTasksBadge, 60000);
  }, 300);
  // === FEATURE 2: COMMAND PALETTE (Ctrl+K) ===
  const commandPalette = { el: null, input: null, list: null, items: [], activeIdx: 0 };

  function openCommandPalette() {
    if (!commandPalette.el) initCommandPalette();
    commandPalette.el.hidden = false;
    commandPalette.input.value = '';
    renderCommandPalette('');
    setTimeout(function () { commandPalette.input.focus(); }, 30);
  }
  function closeCommandPalette() {
    if (commandPalette.el) commandPalette.el.hidden = true;
  }
  function initCommandPalette() {
    const bd = document.getElementById('cmdPalette');
    if (!bd) return;
    commandPalette.el = bd;
    commandPalette.input = document.getElementById('cmdInput');
    commandPalette.list = document.getElementById('cmdList');
    bd.addEventListener('click', function (e) { if (e.target === bd) closeCommandPalette(); });
    commandPalette.input.addEventListener('input', function () { renderCommandPalette(this.value); });
    commandPalette.input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); moveCmdActive(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); moveCmdActive(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); runCmdActive(); }
      else if (e.key === 'Escape') { e.preventDefault(); closeCommandPalette(); }
    });
    commandPalette.list.addEventListener('click', function (e) {
      const it = e.target.closest('.cmd-item'); if (!it) return;
      const idx = +it.dataset.idx; if (isNaN(idx)) return;
      commandPalette.activeIdx = idx; runCmdActive();
    });
  }
  function moveCmdActive(dir) {
    const n = commandPalette.items.length; if (!n) return;
    commandPalette.activeIdx = (commandPalette.activeIdx + dir + n) % n;
    refreshCmdActive();
  }
  function refreshCmdActive() {
    const items = commandPalette.list.querySelectorAll('.cmd-item');
    items.forEach(function (el, i) { el.classList.toggle('active', i === commandPalette.activeIdx); });
    const cur = items[commandPalette.activeIdx];
    if (cur) cur.scrollIntoView({ block: 'nearest' });
  }
  function runCmdActive() {
    const c = commandPalette.items[commandPalette.activeIdx];
    if (!c) return;
    closeCommandPalette();
    try { c.run(); } catch (e) { showToast('Ошибка: ' + e.message, 'error'); }
  }
   function getCommands() {
    const cmds = [
      // === РАСШИРЕННЫЕ КОМАНДЫ ===

      // Быстрые фильтры
      { icon: '⚠️', label: 'Показать просроченные', keywords: 'просрочено overdue фильтр',
        run: function(){ switchTab('active'); switchActiveTab('tasks'); state.ui.filter = 'overdue'; savePrefs(); syncToolbarInputs(); renderTasks(); showToast('Фильтр: просроченные', 'ok'); } },
      { icon: '📋', label: 'Показать все задачи', keywords: 'все задачи фильтр сброс',
        run: function(){ switchTab('active'); switchActiveTab('tasks'); state.ui.filter = 'all'; state.tagFilter = ''; savePrefs(); syncToolbarInputs(); renderTasks(); showToast('Фильтр сброшен', 'ok'); } },

      // Переходы по вкладкам
      { icon: '📌', label: 'Открыть: Сегодня', keywords: 'сегодня today дашборд',
        run: function(){ switchTab('today'); } },
      { icon: '📊', label: 'Открыть: Аналитика', keywords: 'аналитика analytics статистика',
        run: function(){ switchTab('analytics'); } },
      { icon: '📦', label: 'Открыть: Архив', keywords: 'архив archive завершённые',
        run: function(){ switchTab('archive'); } },
      { icon: '📝', label: 'Открыть: Заметки', keywords: 'заметки notes',
        run: function(){ switchTab('notes'); } },
      { icon: '📆', label: 'Открыть: Привычки', keywords: 'привычки habits',
        run: function(){ switchTab('habits'); } },
      { icon: '☁️', label: 'Открыть: Хранилище', keywords: 'хранилище файлы статьи книги literature',
        run: function(){ switchTab('literature'); } },

      // Инструменты
      { icon: '🗑', label: 'Открыть: Корзина', keywords: 'корзина trash удалённые',
        run: function(){ openTrashModal(); } },
      { icon: '🌙', label: 'Сменить тему (тёмная/светлая)', keywords: 'тема theme тёмная светлая',
        run: function(){ setTheme(state.theme === 'dark' ? 'light' : 'dark'); showToast('Тема: ' + (state.theme === 'dark' ? 'тёмная' : 'светлая'), 'ok'); } },
      { icon: '📦', label: 'Экспорт JSON', keywords: 'экспорт export json сохранить',
        run: function(){ exportData(); } },
      { icon: '📄', label: 'Экспорт Markdown-отчёт', keywords: 'экспорт export markdown отчёт',
        run: function(){ exportMarkdownReport(); } },
      { icon: '📊', label: 'Экспорт CSV (задачи)', keywords: 'экспорт export csv таблица',
        run: function(){ exportTasksCsv(); } },
      { icon: '📅', label: 'Экспорт .ics (календарь)', keywords: 'экспорт export ics календарь',
        run: function(){ exportIcs(); } },
      { icon: '➕', label: 'Создать свою вкладку', keywords: 'вкладка tab своя',
        run: function(){ openCustomTabModal(null); } },
      { icon: '⚙️', label: 'Управление вкладками', keywords: 'вкладки tabs управление',
        run: function(){ openTabsManageModal(); } },

      // === ОРИГИНАЛЬНЫЕ КОМАНДЫ ===
      { icon: '✓', label: 'Новая задача', hint: 'N', keywords: 'задача task', run: function(){ switchTab('active'); switchActiveTab('tasks'); setTimeout(function(){ document.getElementById('taskText').focus(); }, 100); } },
      { icon: '🎯', label: 'Новая цель', hint: 'G', keywords: 'цель goal', run: function(){ switchTab('active'); switchActiveTab('goals'); setTimeout(function(){ document.getElementById('goalTitle').focus(); }, 100); } },
      { icon: '📝', label: 'Новая заметка', keywords: 'заметка note', run: function(){ switchTab('notes'); addNote({ title: 'Новая заметка', body: '' }); } },
      { icon: '📅', label: 'Дневник на сегодня', keywords: 'дневник daily note', run: function(){ openDailyNote(); } },
      { icon: '🔍', label: 'Глобальный поиск', hint: 'Ctrl+/', keywords: 'поиск search find', run: openGlobalSearch },
      { icon: '📅', label: 'Переключить календарь', hint: 'Ctrl+Shift+K', keywords: 'календарь calendar', run: toggleCalendar },
      { icon: '⚙', label: 'Настройки', keywords: 'настройки settings', run: function(){ document.getElementById('settingsModal').hidden = false; syncToolbarInputs(); renderBackupList(); renderCacheStats(); refreshDriveSettingsUI(); } },
      { icon: '⌨', label: 'Горячие клавиши', hint: '?', keywords: 'клавиши hotkeys', run: openKbdHelp },
      { icon: '🔒', label: 'Заблокировать', keywords: 'lock блок', run: function(){ if (hasPin()) lockNow(); else showToast('PIN не установлен', 'warn'); } },
    ];

    // === ТЕГИ (до 10 штук) ===
    try {
      const tags = getAllTags().slice(0, 10);
      tags.forEach(function(tag) {
        cmds.push({
          icon: '🏷',
          label: 'Задачи с #' + tag,
          keywords: 'тег tag ' + tag,
          run: function(){
            switchTab('active');
            switchActiveTab('tasks');
            state.tagFilter = tag;
            savePrefs();
            syncToolbarInputs();
            renderTasks();
            showToast('Фильтр: #' + tag, 'ok');
          }
        });
      });
    } catch (e) {}

    // === ВКЛАДКИ ПОЛЬЗОВАТЕЛЯ (стандартные) ===
    state.tabs.forEach(function (t) {
      if (!t.visible) return;
      cmds.push({ icon: t.icon, label: 'Открыть: ' + t.label, keywords: 'вкладка tab ' + t.label, run: function(){ switchTab(t.id); } });
    });

    // === ВКЛАДКИ ПОЛЬЗОВАТЕЛЯ (свои) ===
    state.customTabs.forEach(function (t) {
      cmds.push({ icon: t.icon || '⭐', label: 'Открыть: ' + t.label, keywords: 'вкладка tab ' + t.label, run: function(){ switchTab(t.id); } });
    });

    // === ЦЕЛИ (до 40 штук) ===
    visibleGoals().slice(0, 40).forEach(function (g) {
      cmds.push({ icon: '🎯', label: g.title, hint: 'цель', keywords: 'цель goal ' + g.title, run: function(){ switchTab('active'); switchActiveTab('goals'); state.collapsed[g.id] = false; savePrefs(); renderGoals(); setTimeout(function(){ const el = document.querySelector('.goal[data-goal-id="' + CSS.escape(g.id) + '"]'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100); } });
    });

    return cmds;
  }
  function renderCommandPalette(query) {
    const q = (query || '').trim().toLowerCase();
    const all = getCommands();
    let items;
    if (!q) {
      items = all.slice(0, 30);
    } else {
      const m = q.match(/^(задача|task|цель|goal|заметка|note)\s+(.+)$/i);
      if (m) {
        const kind = m[1].toLowerCase();
        const text = m[2];
        const quick = {
          icon: '⚡', label: 'Создать: ' + text, hint: kind,
          run: function () {
            if (/^задача|^task/.test(kind)) { addTask(null, { text: text, priority: 'medium', deadline: state.calSelectedDate || '' }); showToast('Задача создана', 'ok'); }
            else if (/^цель|^goal/.test(kind)) { addGoal({ title: text, priority: 'medium', deadline: state.calSelectedDate || '' }); showToast('Цель создана', 'ok'); }
            else if (/^заметка|^note/.test(kind)) { addNote({ title: text, body: '' }); switchTab('notes'); showToast('Заметка создана', 'ok'); }
          }
        };
        items = [quick].concat(all.filter(function (c) {
          return (c.label + ' ' + (c.keywords || '')).toLowerCase().indexOf(text) !== -1;
        }).slice(0, 20));
      } else {
        items = all.filter(function (c) {
          return (c.label + ' ' + (c.keywords || '')).toLowerCase().indexOf(q) !== -1;
        }).slice(0, 30);
      }
    }
    commandPalette.items = items;
    commandPalette.activeIdx = 0;
    if (!items.length) {
      commandPalette.list.innerHTML = '<div class="cmd-empty">Ничего не найдено. Попробуй: <code>задача купить молоко</code></div>';
      return;
    }
    commandPalette.list.innerHTML = items.map(function (c, i) {
      return '<div class="cmd-item' + (i === 0 ? ' active' : '') + '" data-idx="' + i + '">' +
        '<span class="cmd-icon">' + escapeHtml(c.icon || '•') + '</span>' +
        '<span class="cmd-label">' + escapeHtml(c.label) + '</span>' +
        (c.hint ? '<span class="cmd-hint">' + escapeHtml(c.hint) + '</span>' : '') +
      '</div>';
    }).join('');
  }
  // Разбудить палитру при загрузке
  setTimeout(function () { initCommandPalette(); }, 300);
  // ============================================================
  // === FEATURE 3: READING PROGRESS ===
  // ============================================================
  function injectReadingProgressRow(section, name) {
    const pane = document.getElementById(section + 'Reader');
    if (!pane) return;

    // Удаляем старую полоску, если есть
    const old = pane.querySelector('.reader-progress-row');
    if (old) old.remove();

    const head = pane.querySelector('.reader-head');
    if (!head) return; // ридер закрыт или пустой

    const meta = state.folders[section].files.find(function (f) { return f.name === name; }) || {};
    const ext = meta.ext || getExt(name);
    let inner = '';

    if (ext === 'pdf') {
      // Для PDF — общее число страниц берём из уже открытого pdf-документа
      const total = (runtime[section].pdfDoc && runtime[section].pdfDoc.numPages) || 0;
      if (!total) return;
      const current = (state.pdfPage[section] && state.pdfPage[section][name]) || 1;
      inner = '<span class="rp-label">📖 Стр.</span>' +
        '<input type="range" min="1" max="' + total + '" value="' + current + '" data-rp-range data-rp-section="' + section + '" data-rp-name="' + escapeHtml(name) + '" />' +
        '<span class="rp-label"><b data-rp-current>' + current + '</b> / ' + total + '</span>';
    } else {
      // Для текстовых — процент прокрутки
      const body = document.getElementById('readerBody_' + section);
      if (!body) return;
      const savedTop = (state.readingPos[section] && state.readingPos[section][name]) || 0;
      const maxScroll = body.scrollHeight - body.clientHeight;
      const pct = maxScroll > 0 ? Math.round((savedTop / maxScroll) * 100) : 0;
      inner = '<span class="rp-label">📖 Прочитано</span>' +
        '<input type="range" min="0" max="100" value="' + pct + '" data-rp-range data-rp-section="' + section + '" data-rp-name="' + escapeHtml(name) + '" />' +
        '<span class="rp-label"><b data-rp-current>' + pct + '</b>%</span>';
    }

    const row = document.createElement('div');
    row.className = 'reader-progress-row';
    row.innerHTML = inner;
    head.parentNode.insertBefore(row, head.nextSibling);
  }

  // === Хук в renderReader: после отрисовки ридера — вставить полоску ===
  const _origRenderReaderForProgress = renderReader;
  renderReader = async function (section, name) {
    const r = await _origRenderReaderForProgress.call(this, section, name);
    // Небольшая задержка, чтобы PDF успел отрисоваться и появился .reader-head
    setTimeout(function () { injectReadingProgressRow(section, name); }, 250);
    return r;
  };

  // === Хук в updateCurrentPdfPage: при скролле PDF двигать ползунок ===
  const _origUpdateCurrentPdfPage = updateCurrentPdfPage;
  updateCurrentPdfPage = function (section, name) {
    _origUpdateCurrentPdfPage.call(this, section, name);
    const range = document.querySelector('[data-rp-range][data-rp-section="' + CSS.escape(section) + '"]');
    if (!range) return;
    const current = (state.pdfPage[section] && state.pdfPage[section][name]) || 1;
    if (document.activeElement !== range) range.value = current;
    const label = range.parentNode.querySelector('[data-rp-current]');
    if (label) label.textContent = current;
  };

  // === Обработчик движения ползунка ===
  document.addEventListener('input', function (e) {
    const range = e.target.closest && e.target.closest('[data-rp-range]');
    if (!range) return;
    const label = range.parentNode.querySelector('[data-rp-current]');
    if (label) label.textContent = range.value;
  });

  document.addEventListener('change', function (e) {
    const range = e.target.closest && e.target.closest('[data-rp-range]');
    if (!range) return;
    const section = range.dataset.rpSection;
    const name = range.dataset.rpName;
    const v = parseInt(range.value, 10);
    if (isNaN(v)) return;
    const ext = getExt(name);

    if (ext === 'pdf') {
      // Перейти на страницу
      scrollToPdfPage(section, v);
      if (!state.pdfPage[section]) state.pdfPage[section] = {};
      state.pdfPage[section][name] = v;
      savePrefs();
    } else {
      // Прокрутить текстовый файл
      const body = document.getElementById('readerBody_' + section);
      if (body) {
        const maxScroll = body.scrollHeight - body.clientHeight;
        body.scrollTop = (v / 100) * maxScroll;
        if (!state.readingPos[section]) state.readingPos[section] = {};
        state.readingPos[section][name] = body.scrollTop;
        savePrefs();
      }
    }
  });

  // === При скролле текстового файла — двигать ползунок (для PDF уже есть свой хук) ===
  document.addEventListener('scroll', function (e) {
    const body = e.target;
    if (!body || !body.id || body.id.indexOf('readerBody_') !== 0) return;
    const section = body.id.slice('readerBody_'.length);
    const name = runtime[section].selected;
    if (!name) return;
    const ext = getExt(name);
    if (ext === 'pdf') return; // PDF обновляется в updateCurrentPdfPage
    const range = document.querySelector('[data-rp-range][data-rp-section="' + CSS.escape(section) + '"]');
    if (!range) return;
    if (document.activeElement === range) return;
    const maxScroll = body.scrollHeight - body.clientHeight;
    const pct = maxScroll > 0 ? Math.round((body.scrollTop / maxScroll) * 100) : 0;
    range.value = pct;
    const label = range.parentNode.querySelector('[data-rp-current]');
    if (label) label.textContent = pct;
    if (!state.readingPos[section]) state.readingPos[section] = {};
    state.readingPos[section][name] = body.scrollTop;
  }, true);
   
   // ============================================================
// === FEATURE 5: NOTE GRAPH (Граф связей) ===
// ============================================================
function openGraphModal() {
  const modal = document.getElementById('graphModal');
  if (!modal) return;
  modal.hidden = false;
  renderGraph();
}

function closeGraphModal() {
  const modal = document.getElementById('graphModal');
  if (modal) modal.hidden = true;
}

   async function renderGraph() {
     const container = document.getElementById('graphContainer');
     if (!container) return;
     container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px;">Загрузка библиотеки графа…</div>';
     try { await ensureVisNetwork(); } catch (e) {
       container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--danger);">Не удалось загрузить граф. Проверьте интернет.</div>';
       return;
     }
     container.innerHTML = '';
  if (!container) return;
  if (!window.vis) {
    container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--muted);">Библиотека для графа не загрузилась. Проверьте интернет.</div>';
    return;
  }

  const nodes = [];
  const edges = [];
  const nodeIds = new Set();

  // 1. Добавляем заметки
  state.notes.forEach(n => {
    nodes.push({ id: 'note_' + n.id, label: n.title, group: 'notes', title: n.title });
    nodeIds.add('note_' + n.id);
  });

  // 2. Добавляем цели
  state.goals.forEach(g => {
    if (g.archivedAt) return;
    nodes.push({ id: 'goal_' + g.id, label: '🎯 ' + g.title, group: 'goals', title: g.title });
    nodeIds.add('goal_' + g.id);
  });

  // 3. Добавляем теги
  const allTags = getAllTags();
  allTags.forEach(tag => {
    nodes.push({ id: 'tag_' + tag, label: '#' + tag, group: 'tags', title: '#' + tag });
    nodeIds.add('tag_' + tag);
  });

  // 4. Связи: Заметки <-> Цели
  state.notes.forEach(n => {
    if (n.goalId && nodeIds.has('goal_' + n.goalId)) {
      edges.push({ from: 'note_' + n.id, to: 'goal_' + n.goalId, color: 'var(--accent)' });
    }
  });

  // 5. Связи: Заметки <-> Теги
  state.notes.forEach(n => {
    (n.tags || []).forEach(tag => {
      if (nodeIds.has('tag_' + tag)) {
        edges.push({ from: 'note_' + n.id, to: 'tag_' + tag, color: 'var(--gold)' });
      }
    });
  });

  // 6. Связи: Цели <-> Теги (через задачи)
  state.goals.forEach(g => {
     if (g.archivedAt) return;
     g.tasks.forEach(t => {
        (t.tags || []).forEach(tag => {
           if (nodeIds.has('tag_' + tag)) {
             edges.push({ from: 'goal_' + g.id, to: 'tag_' + tag, color: 'var(--muted)', dashes: true });
           }
        });
     });
  });

   // vis-network рисует на <canvas> и не понимает CSS-переменные.
  // Читаем актуальные цвета из документа — это работает и в тёмной,
  // и в светлой теме, и меняется автоматически при смене темы.
  function cssVar(name, fallback) {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }
  const cText    = cssVar('--text',     '#f2f6fb');
  const cMuted   = cssVar('--muted',    '#b8c7db');
  const cCard    = cssVar('--card',     '#151f32');
  const cCardAlt = cssVar('--card-alt', '#0d1525');
  const cAccent  = cssVar('--accent',   '#58a6ff');
  const cDanger  = cssVar('--danger',   '#ff7b72');
  const cGold    = cssVar('--gold',     '#f5c518');
  const cBorder  = cssVar('--border',   '#2a3a55');

  const data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
  const options = {
    nodes: {
      shape: 'box',
      size: 16,
      borderWidth: 2,
      margin: { top: 8, bottom: 8, left: 12, right: 12 },
      font: {
        size: 14,
        color: cText,
        face: 'system-ui',
        strokeWidth: 0,
        align: 'center',
        bold: { color: cText, size: 14 }
      },
      shadow: { enabled: true, color: 'rgba(0,0,0,0.35)', size: 6, x: 0, y: 2 },
      color: {
        background: cCardAlt,
        border: cAccent,
        highlight: { background: cAccent, border: cText },
        hover:     { background: cCardAlt, border: cGold }
      }
    },
    groups: {
      // Заметки — нейтральные с синей рамкой
      notes: {
        shape: 'box',
        color: { background: cCardAlt, border: cAccent },
        font: { color: cText }
      },
      // Цели — красная рамка, текст светлый
      goals: {
        shape: 'box',
        color: { background: cCardAlt, border: cDanger },
        font: { color: cText }
      },
      // Теги — золотая рамка и золотой текст
      tags: {
        shape: 'box',
        color: { background: cCardAlt, border: cGold },
        font: { color: cGold }
      }
    },
    edges: {
      width: 1.5,
      smooth: { type: 'continuous' },
      color: {
        color: cBorder,
        highlight: cAccent,
        hover: cAccent
      }
    },
    physics: {
      stabilization: true,
      barnesHut: { gravitationalConstant: -3000, centralGravity: 0.3, springLength: 130 }
    },
    interaction: { hover: true, tooltipDelay: 200 }
  };

  new vis.Network(container, data, options);
}

// Привязываем кнопки
setTimeout(function() {
  const graphBtn = document.getElementById('graphBtn');
  if (graphBtn) graphBtn.addEventListener('click', openGraphModal);
  
  const graphModal = document.getElementById('graphModal');
  if (graphModal) {
    graphModal.addEventListener('click', function(e) {
      if (e.target === this) { closeGraphModal(); return; }
      const el = e.target.closest('[data-action]');
      if (el && el.dataset.action === 'close-graph') closeGraphModal();
    });
  }
}, 300);
     // === АВТОКАТЕГОРИЯ ЗАДАЧ ===
  const AUTO_CATEGORY_RULES = [
    { tag: 'покупки', words: ['купить', 'куплю', 'магазин', 'продукты', 'молоко', 'хлеб', 'доставка', 'аптека', 'лекарств'] },
    { tag: 'работа', words: ['отчёт', 'отчет', 'совещание', 'созвон', 'позвонить', 'письмо', 'клиент', 'заказчик', 'проект', 'презентация', 'митинг', 'коллега', 'начальник', 'собеседован'] },
    { tag: 'дом', words: ['убрать', 'уборка', 'помыть', 'постирать', 'посуда', 'ремонт', 'кран', 'мебель', 'стирка', 'готовить', 'ужин', 'обед', 'завтрак'] },
    { tag: 'здоровье', words: ['врач', 'тренировка', 'спортзал', 'зарядка', 'витамины', 'анализы', 'прививк', 'стоматолог', 'здоровье', 'бассейн'] },
    { tag: 'учёба', words: ['учить', 'выучить', 'прочитать', 'книга', 'курс', 'лекция', 'экзамен', 'домашка', 'задание', 'изучить', 'конспект'] },
    { tag: 'финансы', words: ['оплатить', 'счёт', 'счет', 'налог', 'банк', 'кредит', 'перевод', 'зарплат', 'бюджет'] },
    { tag: 'документы', words: ['паспорт', 'справка', 'документ', 'заявлени', 'госуслуг', 'мфц', 'полис', 'страховк'] },
    { tag: 'путешествие', words: ['билет', 'поезд', 'самолёт', 'самолет', 'отель', 'виза', 'чемодан', 'отпуск', 'поездк'] },
    { tag: 'общение', words: ['поздрав', 'день рожден', 'подарок', 'написать', 'напомнить', 'позвонить мам', 'позвонить пап'] }
  ];

  function autoCategorize(text) {
    if (!text) return [];
    const lower = String(text).toLowerCase();
    const found = [];
    for (let i = 0; i < AUTO_CATEGORY_RULES.length; i++) {
      const rule = AUTO_CATEGORY_RULES[i];
      for (let j = 0; j < rule.words.length; j++) {
        if (lower.indexOf(rule.words[j]) !== -1) { found.push(rule.tag); break; }
      }
    }
    return found;
  }
    // === ЕЖЕДНЕВНЫЙ ОТЧЁТ ===
  function openDailyReport() {
    const modal = document.getElementById('dailyReportModal');
    const body = document.getElementById('dailyReportBody');
    if (!modal || !body) return;

    const todayISO = dateToISO(new Date());
    const start = todayStart().getTime();
    const end = start + 24 * 60 * 60 * 1000;

    const doneTasks = [];
    state.goals.forEach(function (g) {
      if (g.isInbox && g.archivedAt) return;
      g.tasks.forEach(function (t) {
        if (t.done && t.doneAt && t.doneAt >= start && t.doneAt < end) {
          doneTasks.push({ task: t, goal: g });
        }
      });
    });

    const archivedGoals = state.goals.filter(function (g) {
      return g.archivedAt && !g.isInbox && g.archivedAt >= start && g.archivedAt < end;
    });

    const doneHabits = state.habits.filter(function (h) {
      return (h.marks || []).indexOf(todayISO) !== -1;
    });

    const total = doneTasks.length + archivedGoals.length + doneHabits.length;

    let html = '<div style="text-align:center;font-size:14px;color:var(--muted);margin-bottom:14px;">' + formatDate(todayISO) + '</div>';
    if (!total) {
      html += '<div style="text-align:center;padding:30px 10px;color:var(--muted);font-size:13px;">Пока нечего подвести. Денёк только начинается 🌱</div>';
    } else {
      html += '<div style="text-align:center;font-size:44px;font-weight:800;color:var(--accent);line-height:1;margin-bottom:6px;">' + total + '</div>';
      html += '<div style="text-align:center;font-size:12px;color:var(--muted);margin-bottom:20px;">достижений за день</div>';
    }

    if (doneTasks.length) {
      html += '<div style="margin-bottom:14px;"><div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">✓ Задачи (' + doneTasks.length + ')</div>';
      doneTasks.forEach(function (it) {
        html += '<div style="padding:5px 0;border-bottom:1px solid var(--border);font-size:13px;">' + escapeHtml(it.task.text) + (it.goal.isInbox ? '' : ' <span style="color:var(--muted);font-size:11px;">· ' + escapeHtml(it.goal.title) + '</span>') + '</div>';
      });
      html += '</div>';
    }

    if (archivedGoals.length) {
      html += '<div style="margin-bottom:14px;"><div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">🎯 Завершено целей (' + archivedGoals.length + ')</div>';
      archivedGoals.forEach(function (g) {
        html += '<div style="padding:5px 0;border-bottom:1px solid var(--border);font-size:13px;">' + escapeHtml(g.title) + '</div>';
      });
      html += '</div>';
    }

    if (doneHabits.length) {
      html += '<div style="margin-bottom:14px;"><div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">📆 Привычки (' + doneHabits.length + ')</div>';
      doneHabits.forEach(function (h) {
        html += '<div style="padding:5px 0;border-bottom:1px solid var(--border);font-size:13px;">' + escapeHtml(h.icon || '🎯') + ' ' + escapeHtml(h.title) + '</div>';
      });
      html += '</div>';
    }

    body.innerHTML = html;
    modal.hidden = false;
  }

  function maybeAutoShowReport() {
    const now = new Date();
    if (now.getHours() < 19) return;
    const todayISO = dateToISO(now);
    try {
      if (localStorage.getItem('pgt_last_report_shown') === todayISO) return;
      localStorage.setItem('pgt_last_report_shown', todayISO);
    } catch (e) { return; }
    setTimeout(openDailyReport, 2500);
  }
    // === УМНЫЕ НАПОМИНАНИЯ ===
  function checkSmartReminders() {
    const now = todayStart().getTime();
    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
    const stale = [];
    state.goals.forEach(function (g) {
      if (g.archivedAt) return;
      g.tasks.forEach(function (t) {
        if (t.archivedAt || t.done || !t.deadline) return;
        const d = new Date(t.deadline + 'T00:00:00').getTime();
        if (now - d > THREE_DAYS) stale.push({ goal: g, task: t });
      });
    });
    if (!stale.length) return;
    try {
      const todayISO = dateToISO(new Date());
      if (sessionStorage.getItem('pgt_smart_reminders_shown') === todayISO) return;
      sessionStorage.setItem('pgt_smart_reminders_shown', todayISO);
    } catch (e) {}
    showToast('⚠ Просрочено больше 3 дней: ' + stale.length, 'warn', 'Перепланировать', function () {
      pgtConfirm({
        title: 'Перепланировать задачи?',
        message: 'Найдено ' + stale.length + ' задач, просроченных больше 3 дней. Перенести все на сегодня?',
        yesLabel: 'На сегодня',
        danger: false,
        onYes: function () {
          const todayISO = dateToISO(new Date());
          stale.forEach(function (it) { it.task.deadline = todayISO; });
          saveData(); render();
          showToast('Перепланировано: ' + stale.length, 'ok');
        }
      });
    }, 15000);
  }
    // ============================================================
  // === FEATURE 4: MILESTONES (этапы у целей) ===
  // ============================================================

  // Ищем цель по ID этапа — не зависим от state.editingGoalId
  function findGoalByMilestoneId(mid) {
    for (let i = 0; i < state.goals.length; i++) {
      const g = state.goals[i];
      if (Array.isArray(g.milestones) && g.milestones.some(function (m) { return m.id === mid; })) return g;
    }
    return null;
  }

  function renderEditGoalMilestones(g) {
    const box = document.getElementById('editGoalMilestonesList');
    if (!box) return;
    const ms = (g && g.milestones) || [];
    if (!ms.length) {
      box.innerHTML = '<div class="empty" style="font-size:11px;">Пока нет этапов. Добавь первый — например, «10 км пробежать».</div>';
      return;
    }
    box.innerHTML = ms.map(function (m) {
      return '<div class="milestone-list-row">' +
        '<input type="checkbox" ' + (m.done ? 'checked' : '') + ' data-action="milestone-toggle" data-milestone-id="' + escapeHtml(m.id) + '" />' +
        '<input type="text" value="' + escapeHtml(m.text) + '" data-action="milestone-text" data-milestone-id="' + escapeHtml(m.id) + '" autocomplete="off" />' +
        '<button type="button" class="icon-btn" data-action="milestone-delete" data-milestone-id="' + escapeHtml(m.id) + '" title="Удалить">✕</button>' +
      '</div>';
    }).join('');
  }

  function addGoalMilestone() {
    let g = findGoal(state.editingGoalId);
    if (!g) {
      const titleField = document.getElementById('editGoalTitle');
      if (titleField) {
        const t = titleField.value.trim();
        g = state.goals.find(function (x) { return !x.archivedAt && x.title === t; });
      }
    }
    if (!g) { showToast('Не удалось определить цель. Откройте ✎ заново.', 'error'); return; }
    const inp = document.getElementById('editGoalMilestoneNew');
    const text = (inp.value || '').trim();
    if (!text) return;
    if (!Array.isArray(g.milestones)) g.milestones = [];
    g.milestones.push({ id: uid(), text: text.slice(0, 200), done: false, createdAt: Date.now() });
    inp.value = '';
    saveData();
    renderEditGoalMilestones(g);
    renderGoals();
  }

  function toggleMilestoneById(mid) {
    const g = findGoalByMilestoneId(mid); if (!g) return;
    const m = g.milestones.find(function (x) { return x.id === mid; }); if (!m) return;
    m.done = !m.done;
    saveData();
    renderEditGoalMilestones(g);
    renderGoals();
  }

  function deleteMilestone(mid) {
    const g = findGoalByMilestoneId(mid); if (!g) return;
    g.milestones = g.milestones.filter(function (x) { return x.id !== mid; });
    saveData();
    renderEditGoalMilestones(g);
    renderGoals();
  }

  function updateMilestoneText(mid, text) {
    const g = findGoalByMilestoneId(mid); if (!g) return;
    const m = g.milestones.find(function (x) { return x.id === mid; }); if (!m) return;
    const newText = String(text == null ? '' : text).slice(0, 200);
    if (m.text === newText) return;
    m.text = newText;
    saveData();
    renderGoals();
  }

  function milestonesHtml(g) {
    if (!g.milestones || !g.milestones.length) return '';
    return '<div class="goal-milestones">' + g.milestones.map(function (m) {
      return '<span class="milestone-chip' + (m.done ? ' done' : '') + '" data-action="milestone-chip-toggle" data-goal-id="' + escapeHtml(g.id) + '" data-milestone-id="' + escapeHtml(m.id) + '" title="Клик — отметить · Двойной клик — изменить текст">' +
        (m.done ? '✓' : '◯') + ' ' + escapeHtml(m.text) + '</span>';
    }).join('') + '</div>';
  }

  // === Обработчики полей в модале редактирования цели ===
  document.addEventListener('input', function (e) {
    const el = e.target;
    if (!el || !el.dataset || el.dataset.action !== 'milestone-text') return;
    updateMilestoneText(el.dataset.milestoneId, el.value);
  });

  document.addEventListener('change', function (e) {
    const el = e.target;
    if (!el || !el.dataset) return;
    if (el.dataset.action === 'milestone-toggle') {
      toggleMilestoneById(el.dataset.milestoneId);
    } else if (el.dataset.action === 'milestone-text') {
      updateMilestoneText(el.dataset.milestoneId, el.value);
    }
  });

  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    if (el.dataset.action === 'milestone-delete') {
      deleteMilestone(el.dataset.milestoneId);
    }
  });

  document.addEventListener('click', function (e) {
    const el = e.target.closest('#editGoalAddMilestoneBtn');
    if (el) { e.preventDefault(); addGoalMilestone(); }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    const el = e.target;
    if (el && el.id === 'editGoalMilestoneNew') {
      e.preventDefault();
      addGoalMilestone();
    }
  });

  // === Клик по чипсу этапа в карточке — отметить/снять (обычный клик) ===
  // === Двойной клик — редактировать текст ===
  document.addEventListener('click', function (e) {
    const chip = e.target.closest('[data-action="milestone-chip-toggle"]');
    if (!chip) return;
    e.stopPropagation();
    e.preventDefault();
    // Клик с detail === 2 — это второй клик в двойном; пропускаем, отдаём dblclick
    if (e.detail >= 2) return;
    const mid = chip.dataset.milestoneId;
    toggleMilestoneById(mid);
  });

  document.addEventListener('dblclick', function (e) {
    const chip = e.target.closest('[data-action="milestone-chip-toggle"]');
    if (!chip) return;
    e.preventDefault();
    e.stopPropagation();
    const mid = chip.dataset.milestoneId;
    const g = findGoalByMilestoneId(mid); if (!g) return;
    const m = g.milestones.find(function (x) { return x.id === mid; }); if (!m) return;
    const newText = prompt('Изменить название этапа:', m.text);
    if (newText === null) return;
    const v = String(newText).trim();
    if (!v) return;
    m.text = v.slice(0, 200);
    saveData();
    renderGoals();
  });

  // === Двойной клик по названию цели → открыть редактирование цели ===
  document.addEventListener('dblclick', function (e) {
    const goalName = e.target.closest('.goal-name');
    if (!goalName) return;
    e.preventDefault();
    e.stopPropagation();
    const goalEl = goalName.closest('.goal');
    if (!goalEl) return;
    const gid = goalEl.dataset.goalId;
    if (gid) openEditGoal(gid);
  });

  // === Хук в openEditGoal — рендерить список этапов при открытии модала ===
  const _origOpenEditGoalForMs = openEditGoal;
  openEditGoal = function (id) {
    _origOpenEditGoalForMs(id);
    const g = findGoal(id);
    if (g) renderEditGoalMilestones(g);
  };

  // === Хук в renderGoals — вставить чипсы этапов и умную полосу прогресса ===
  const _origRenderGoalsForMs = renderGoals;
  renderGoals = function () {
    _origRenderGoalsForMs();
    const list = document.getElementById('goalsList');
    if (!list) return;
    list.querySelectorAll('.goal').forEach(function (el) {
      const gid = el.dataset.goalId;
      const g = findGoal(gid); if (!g) return;

      // 1. Чипсы этапов
      if (g.milestones && g.milestones.length) {
        const body = el.querySelector('.goal-body');
        if (body) {
          const existing = body.querySelector('.goal-milestones');
          if (existing) existing.remove();
          const target = body.querySelector('.goal-progress');
          const html = milestonesHtml(g);
          if (target) target.insertAdjacentHTML('beforebegin', html);
          else body.insertAdjacentHTML('beforeend', html);
        }
      }

      // 2. Если задач нет, но есть этапы — полоса показывает прогресс по этапам
      const activeTasks = g.tasks.filter(function (t) { return !t.archivedAt; });
      if (activeTasks.length === 0 && g.milestones && g.milestones.length > 0) {
        const total = g.milestones.length;
        const done = g.milestones.filter(function (m) { return m.done; }).length;
        const prog = Math.round(done / total * 100);
        const bar = el.querySelector('.goal-progress .bar');
        const label = el.querySelector('.goal-progress > span');
        if (bar) bar.style.width = prog + '%';
        if (label) label.textContent = done + '/' + total;
        // И уберём подсказку «Нет задач — можно завершить сразу», если есть этапы
        const hint = el.querySelector('.goal-hint');
        if (hint && /Нет задач/.test(hint.textContent)) hint.remove();
      }
    });
  };

  state.goals.forEach(function (g) { if (!Array.isArray(g.milestones)) g.milestones = []; });

  // === Клик по чипсу прямо в карточке — переключить отметку ===
  setTimeout(function () {
    const goalsList = document.getElementById('goalsList');
    if (goalsList && goalsList.dataset.msBound !== '1') {
      goalsList.dataset.msBound = '1';
      goalsList.addEventListener('click', function (e) {
        const chip = e.target.closest('[data-action="milestone-chip-toggle"]');
        if (!chip) return;
        e.stopPropagation();
        const gid = chip.dataset.goalId, mid = chip.dataset.milestoneId;
        const g = findGoal(gid); if (!g || !g.milestones) return;
        const m = g.milestones.find(function (x) { return x.id === mid; }); if (!m) return;
        m.done = !m.done;
        saveData(); renderGoals();
      });
    }

    // При загрузке — убедимся, что у каждой цели есть массив milestones
    state.goals.forEach(function (g) { if (!Array.isArray(g.milestones)) g.milestones = []; });

      renderGoals();
  }, 500);
})();