// === Синхронизация с Google Drive (с автовходом) ===
// Приложение запоминает вход и само продлевает доступ.

(function () {
  'use strict';

  const CLIENT_ID = '358788438808-j3duf0p7pfec636k6oscv0dtv14ffacu.apps.googleusercontent.com';
  const SCOPE = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file';
  const FILE_NAME = 'pgt_v25_sync_data.json';
  const TOKEN_KEY = 'pgt_v25_google_token'; // здесь браузер хранит «пропуск» от Google

  let tokenClient = null;
  let accessToken = null;
  let busy = false;

  // --- Сохранение «пропуска» между перезагрузками ---
  function saveToken(token, expiresInSec) {
    try {
      // вычитаем 2 минуты про запас, чтобы не поймать «истёк в самый момент»
      const expiresAt = Date.now() + Math.max(0, (expiresInSec - 120)) * 1000;
      localStorage.setItem(TOKEN_KEY, JSON.stringify({ token: token, expiresAt: expiresAt }));
    } catch (e) {}
  }
  function loadToken() {
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !data.token || !data.expiresAt) return null;
      if (Date.now() >= data.expiresAt) return null; // истёк
      return data.token;
    } catch (e) { return null; }
  }
  function clearToken() {
    try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
  }

  // --- Кнопки и статус ---
  function setStatus(text, cls) {
    const el = document.getElementById('syncStatus');
    if (!el) return;
    el.textContent = text || '';
    el.className = 'sync-status ' + (cls || '');
  }
  function showSignedInUI() {
    const btnIn = document.getElementById('googleSignInBtn');
    const btnSync = document.getElementById('syncBtn');
    if (btnIn) btnIn.hidden = true;
    if (btnSync) btnSync.hidden = false;
	  if (window.__pgtSetSyncDot) window.__pgtSetSyncDot('ok');
  }
  function showSignedOutUI() {
    const btnIn = document.getElementById('googleSignInBtn');
    const btnSync = document.getElementById('syncBtn');
    if (btnIn) btnIn.hidden = false;
    if (btnSync) btnSync.hidden = true;
	 if (window.__pgtSetSyncDot) window.__pgtSetSyncDot('auth');
  }

  // --- Авторизация Google ---
  function initAuth() {
    if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) return false;
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: function (resp) {
        if (resp && resp.access_token) {
          accessToken = resp.access_token;
          saveToken(resp.access_token, parseInt(resp.expires_in, 10) || 3600);
          showSignedInUI();
          setStatus('☁️ Готово', 'ok');
          setTimeout(function () { setStatus(''); }, 2000);
        } else {
          setStatus('✗ Вход не удался', 'error');
        }
      },
      error_callback: function (err) {
        // При «тихом» обновлении, если не удалось — просто показываем кнопку входа
        console.warn('[auth]', err);
        showSignedOutUI();
        setStatus('');
      },
    });
    return true;
  }

  function signInUser() {
    if (!tokenClient) {
      if (!initAuth()) { setStatus('Google не загружен', 'error'); return; }
    }
    // Явный вход — показываем окно согласия
    tokenClient.requestAccessToken({ prompt: 'consent' });
  }

    // --- Google Drive: поиск, загрузка, сбор данных ---
  async function findFile() {
    const r = await fetch(
      "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='" + FILE_NAME + "'",
      { headers: { 'Authorization': 'Bearer ' + accessToken } }
    );
    if (!r.ok) throw new Error('Поиск файла: ' + r.status);
    const data = await r.json();
    return (data.files && data.files.length) ? data.files[0] : null;
  }

  async function upload(fileId, content) {
    const boundary = '-------pgt314159265358979323846';
    const meta = { name: FILE_NAME, mimeType: 'application/json' };
    if (!fileId) meta.parents = ['appDataFolder'];
    const body =
      '\r\n--' + boundary + '\r\nContent-Type: application/json\r\n\r\n' + JSON.stringify(meta) +
      '\r\n--' + boundary + '\r\nContent-Type: application/json\r\n\r\n' + content +
      '\r\n--' + boundary + '--';
    const url = fileId
      ? 'https://www.googleapis.com/upload/drive/v3/files/' + fileId + '?uploadType=multipart'
      : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    const r = await fetch(url, {
      method: fileId ? 'PATCH' : 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'multipart/related; boundary="' + boundary + '"',
      },
      body: body,
    });
    if (!r.ok) throw new Error('Загрузка: ' + r.status);
    return r.json();
  }

  function collectData() {
    const read = function (key, fallback) {
      try { return JSON.parse(localStorage.getItem(key) || fallback); } catch (e) { return JSON.parse(fallback); }
    };
    const data = read('pgt_v25_data', '{"goals":[],"folders":{}}');
    return {
      version: 1,
      savedAt: Date.now(),
      goals: data.goals || [],
      folders: data.folders || {},
      snippets: read('pgt_v25_snippets', '[]'),
      notes: read('pgt_v25_notes', '[]'),
      templates: read('pgt_v25_templates', '[]'),
      prefs: read('pgt_v25_prefs', '{}'),
    };
  }

    async function sync(silent) {
    if (busy) { if (silent && window.__pgtAutoSyncDone) window.__pgtAutoSyncDone(false); return; }
    if (!accessToken) accessToken = loadToken();
    if (!accessToken) {
      if (!silent) { setStatus('Сначала войдите', 'error'); showSignedOutUI(); }
      if (silent && window.__pgtSetSyncDot) window.__pgtSetSyncDot('auth');
      if (silent && window.__pgtAutoSyncDone) window.__pgtAutoSyncDone(false);
      return;
    }
    busy = true;
    if (!silent) setStatus('⏳ Синхронизация…', 'syncing');
    if (silent && window.__pgtSetSyncDot) window.__pgtSetSyncDot('active');
    try {
      const content = JSON.stringify(collectData(), null, 2);
      const existing = await findFile();
      await upload(existing ? existing.id : null, content);
      if (silent) {
        if (window.__pgtSetSyncDot) window.__pgtSetSyncDot('ok');
      } else {
        setStatus('✓ Готово', 'ok');
        setTimeout(function () { setStatus('☁️ Готово', 'ok'); }, 2500);
      }
    } catch (e) {
      console.error('[sync]', e);
      if (String(e.message).indexOf('401') !== -1) {
        clearToken();
        accessToken = null;
        if (!silent) { showSignedOutUI(); setStatus('Нужно войти заново', 'error'); }
        if (silent && window.__pgtSetSyncDot) window.__pgtSetSyncDot('auth');
      } else {
        if (silent) {
          if (window.__pgtSetSyncDot) window.__pgtSetSyncDot('error');
        } else {
          setStatus('✗ Ошибка', 'error');
        }
      }
    } finally {
      busy = false;
      if (silent && window.__pgtAutoSyncDone) window.__pgtAutoSyncDone(true);
    }
  }

  // --- Запуск ---
  function bind() {
    const signBtn = document.getElementById('googleSignInBtn');
    const syncBtn = document.getElementById('syncBtn');
    if (signBtn) signBtn.addEventListener('click', signInUser);
    if (syncBtn) syncBtn.addEventListener('click', sync);

    // 1. Сначала — восстановить сохранённый «пропуск», если он ещё жив
    const saved = loadToken();
    if (saved) {
      accessToken = saved;
      showSignedInUI();
      setStatus('☁️ Готово', 'ok');
    } else {
      showSignedOutUI();
    }

        // 2. Дождаться загрузки Google API и проинициализировать OAuth-клиент.
    // Не делаем тихий вход сам — Chrome блокирует prompt:'' без активного
    // жеста пользователя. Если токен сохранён — он уже подхвачен выше.
    let tries = 0;
    const t = setInterval(function () {
      if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
        clearInterval(t);
        initAuth();
      }
      if (++tries > 40) clearInterval(t);
    }, 250);

    // === Автосинхронизация (тихий режим) ===
  window.__pgtAutoSync = function () {
    if (busy) { if (window.__pgtAutoSyncDone) window.__pgtAutoSyncDone(false); return; }
    if (!accessToken) accessToken = loadToken();
    if (!accessToken) {
      if (window.__pgtSetSyncDot) window.__pgtSetSyncDot('auth');
      if (window.__pgtAutoSyncDone) window.__pgtAutoSyncDone(false);
      return;
    }
    if (navigator.onLine === false) {
      if (window.__pgtSetSyncDot) window.__pgtSetSyncDot('error');
      if (window.__pgtAutoSyncDone) window.__pgtAutoSyncDone(false);
      return;
    }
    if (window.__pgtSetSyncDot) window.__pgtSetSyncDot('active');
    sync(true); // silent = true
  };

  window.addEventListener('online', function () {
    if (accessToken && window.__pgtSetSyncDot) window.__pgtSetSyncDot('ok');
  });
  window.addEventListener('offline', function () {
    if (window.__pgtSetSyncDot) window.__pgtSetSyncDot('error');
  });

    if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
}
})();