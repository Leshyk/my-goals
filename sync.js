// === Синхронизация с Google Drive ===
// Приложение само подгружает данные из localStorage и отправляет в облако.

(function () {
  'use strict';

  const CLIENT_ID = '358788438808-j3duf0p7pfec636k6oscv0dtv14ffacu.apps.googleusercontent.com'; 
  const SCOPE = 'https://www.googleapis.com/auth/drive.file';
  const FILE_NAME = 'pgt_v25_sync_data.json';

  let tokenClient = null;
  let accessToken = null;
  let busy = false;

  function setStatus(text, cls) {
    const el = document.getElementById('syncStatus');
    if (!el) return;
    el.textContent = text || '';
    el.className = 'sync-status ' + (cls || '');
  }

  function initAuth() {
    if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) return false;
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: function (resp) {
        if (resp && resp.access_token) {
          accessToken = resp.access_token;
          document.getElementById('googleSignInBtn').hidden = true;
          document.getElementById('syncBtn').hidden = false;
          setStatus('☁️ Готово', 'ok');
          setTimeout(function () { setStatus(''); }, 2000);
        } else {
          setStatus('✗ Вход не удался', 'error');
        }
      },
    });
    return true;
  }

  function signIn() {
    if (!tokenClient) {
      if (!initAuth()) { setStatus('Google не загружен', 'error'); return; }
    }
    tokenClient.requestAccessToken({ prompt: 'consent' });
  }

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

  async function sync() {
    if (busy) return;
    if (!accessToken) { setStatus('Сначала войдите', 'error'); return; }
    busy = true;
    setStatus('⏳ Синхронизация…', 'syncing');
    try {
      const content = JSON.stringify(collectData(), null, 2);
      const existing = await findFile();
      await upload(existing ? existing.id : null, content);
      setStatus('✓ Готово', 'ok');
      setTimeout(function () { setStatus('☁️ Готово', 'ok'); }, 2500);
    } catch (e) {
      console.error('[sync]', e);
      setStatus('✗ Ошибка', 'error');
    } finally {
      busy = false;
    }
  }

  function bind() {
    const signBtn = document.getElementById('googleSignInBtn');
    const syncBtn = document.getElementById('syncBtn');
    if (signBtn) signBtn.addEventListener('click', signIn);
    if (syncBtn) syncBtn.addEventListener('click', sync);

    // Google API может грузиться с задержкой — ждём её
    let tries = 0;
    const t = setInterval(function () {
      if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
        clearInterval(t);
        initAuth();
      }
      if (++tries > 40) clearInterval(t);
    }, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();