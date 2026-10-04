// === Синхронизация с Google Drive (двусторонняя) ===
// Данные (цели/задачи/заметки/цитаты) и файлы (статьи/книги) — в облаке.
// Файлы физически лежат в папке "Мои цели и задачи" в вашем Google Drive.

(function () {
  'use strict';

  const CLIENT_ID = '358788438808-j3duf0p7pfec636k6oscv0dtv14ffacu.apps.googleusercontent.com';
  const SCOPE = [
    'https://www.googleapis.com/auth/drive.appdata',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.profile'
  ].join(' ');

  const DATA_FILE_NAME = 'pgt_v25_sync_data.json';
  const APP_FOLDER_NAME = 'Мои цели и задачи';
  const TOKEN_KEY = 'pgt_v25_google_token';
  const FOLDERS_KEY = 'pgt_v25_drive_folders'; // { root, articles, books }
  const LOCAL_SAVED_AT = 'pgt_v25_local_saved_at';
  const SECTIONS = ['articles', 'books'];

  let tokenClient = null;
  let accessToken = null;
  let busy = false;
  let folderIds = { root: null, articles: null, books: null };

  // ---------- Пропуск (токен) ----------
  function saveToken(token, expiresInSec) {
    try {
      const expiresAt = Date.now() + Math.max(0, (expiresInSec - 120)) * 1000;
      localStorage.setItem(TOKEN_KEY, JSON.stringify({ token, expiresAt }));
    } catch (e) {}
  }
  function loadToken() {
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      if (!raw) return null;
      const d = JSON.parse(raw);
      if (!d || !d.token || !d.expiresAt) return null;
      if (Date.now() >= d.expiresAt) return null;
      return d.token;
    } catch (e) { return null; }
  }
  function clearToken() {
    try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
  }

  function loadFolderIds() {
    try {
      const raw = localStorage.getItem(FOLDERS_KEY);
      if (raw) folderIds = JSON.parse(raw);
    } catch (e) {}
  }
  function saveFolderIds() {
    try { localStorage.setItem(FOLDERS_KEY, JSON.stringify(folderIds)); } catch (e) {}
  }

  // ---------- UI-статусы ----------
  function setStatus(text, cls) {
    const el = document.getElementById('syncStatus');
    if (!el) return;
    el.textContent = text || '';
    el.className = 'sync-status ' + (cls || '');
  }
  function setDot(s) { if (window.__pgtSetSyncDot) window.__pgtSetSyncDot(s); }
  function showSignedInUI() {
    const a = document.getElementById('googleSignInBtn');
    const b = document.getElementById('syncBtn');
    if (a) a.hidden = true;
    if (b) b.hidden = false;
    setDot('ok');
  }
  function showSignedOutUI() {
    const a = document.getElementById('googleSignInBtn');
    const b = document.getElementById('syncBtn');
    if (a) a.hidden = false;
    if (b) b.hidden = true;
    setDot('auth');
  }

  // ---------- Авторизация ----------
  function initAuth() {
    if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) return false;
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: function (resp) {
        if (resp && resp.access_token) {
          accessToken = resp.access_token;
          saveToken(resp.access_token, parseInt(resp.expires_in, 10) || 3600);
		  try { localStorage.setItem('pgt_v25_had_login', '1'); } catch (e) {}
          showSignedInUI();
          setStatus('☁️ Готово', 'ok');
          setTimeout(function () { setStatus(''); }, 2000);
          // Первый вход — сразу создаём папки и синхронизируем
          bootstrap().catch(function (e) { console.warn('[bootstrap]', e); });
        } else {
          setStatus('✗ Вход не удался', 'error');
        }
      },
      error_callback: function (err) {
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
    tokenClient.requestAccessToken({ prompt: 'consent' });
  }

  // ---------- Drive: общие запросы ----------
  function driveUrl(path) { return 'https://www.googleapis.com/drive/v3/' + path; }
  function uploadUrl(path) { return 'https://www.googleapis.com/upload/drive/v3/' + path; }

  async function driveFetch(url, opts) {
    opts = opts || {};
    const headers = Object.assign({}, opts.headers || {});
    headers.Authorization = 'Bearer ' + accessToken;
    return fetch(url, Object.assign({}, opts, { headers }));
  }

  // ---------- Папки ----------
  async function findFolder(name, parentId) {
    const q = ["name='" + name.replace(/'/g, "\\'") + "'",
               "mimeType='application/vnd.google-apps.folder'",
               'trashed=false'];
    if (parentId) q.push("'" + parentId + "' in parents");
    const url = driveUrl('files?fields=files(id,name)&q=' + encodeURIComponent(q.join(' and ')));
    const r = await driveFetch(url);
    if (!r.ok) return null;
    const data = await r.json();
    return (data.files && data.files[0]) || null;
  }
  async function createFolder(name, parentId) {
    const body = { name, mimeType: 'application/vnd.google-apps.folder' };
    if (parentId) body.parents = [parentId];
    const r = await driveFetch(driveUrl('files?fields=id,name'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error('createFolder: ' + r.status);
    return r.json();
  }
  async function ensureFolderAlive(id) {
    if (!id) return false;
    const r = await driveFetch(driveUrl('files/' + id + '?fields=id,trashed'));
    if (!r.ok) return false;
    const d = await r.json();
    return !d.trashed;
  }

  async function ensureAppFolders() {
    // проверим сохранённые
    if (folderIds.root && await ensureFolderAlive(folderIds.root)) {
      // досоздаём подпапки если пропали
      for (const s of SECTIONS) {
        if (folderIds[s] && await ensureFolderAlive(folderIds[s])) continue;
        let f = await findFolder(s, folderIds.root);
        if (!f) f = await createFolder(s, folderIds.root);
        folderIds[s] = f.id;
      }
      saveFolderIds();
      return;
    }
    // создаём всё с нуля
    let root = await findFolder(APP_FOLDER_NAME, null);
    if (!root) root = await createFolder(APP_FOLDER_NAME, null);
    folderIds.root = root.id;
    for (const s of SECTIONS) {
      let f = await findFolder(s, root.id);
      if (!f) f = await createFolder(s, root.id);
      folderIds[s] = f.id;
    }
    saveFolderIds();
  }

  // ---------- JSON-данные ----------
  async function findDataFile() {
    const q = "name='" + DATA_FILE_NAME + "'";
    const url = driveUrl('files?spaces=appDataFolder&q=' + encodeURIComponent(q) + '&fields=files(id,name,modifiedTime)');
    const r = await driveFetch(url);
    if (!r.ok) throw new Error('findDataFile: ' + r.status);
    const data = await r.json();
    return (data.files && data.files[0]) || null;
  }
  async function uploadJson(fileId, content) {
    const boundary = '-------pgt' + Date.now();
    const meta = { name: DATA_FILE_NAME, mimeType: 'application/json' };
    if (!fileId) meta.parents = ['appDataFolder'];
    const body =
      '\r\n--' + boundary + '\r\nContent-Type: application/json\r\n\r\n' + JSON.stringify(meta) +
      '\r\n--' + boundary + '\r\nContent-Type: application/json\r\n\r\n' + content +
      '\r\n--' + boundary + '--';
    const url = fileId
      ? uploadUrl('files/' + fileId + '?uploadType=multipart')
      : uploadUrl('files?uploadType=multipart');
    const r = await driveFetch(url, {
      method: fileId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'multipart/related; boundary="' + boundary + '"' },
      body
    });
    if (!r.ok) throw new Error('uploadJson: ' + r.status);
    return r.json();
  }
  async function downloadFileContent(fileId) {
    const r = await driveFetch(driveUrl('files/' + fileId + '?alt=media'));
    if (!r.ok) throw new Error('download: ' + r.status);
    return r.text();
  }
  async function downloadFileBlob(fileId) {
    const r = await driveFetch(driveUrl('files/' + fileId + '?alt=media'));
    if (!r.ok) throw new Error('downloadBlob: ' + r.status);
    return r.blob();
  }

  function collectData() {
    const read = (key, fallback) => {
      try { return JSON.parse(localStorage.getItem(key) || fallback); }
      catch (e) { return JSON.parse(fallback); }
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

  function applyRemoteData(remote) {
    if (!remote) return;
    try {
      if (Array.isArray(remote.goals)) {
        localStorage.setItem('pgt_v25_data', JSON.stringify({
          goals: remote.goals, folders: remote.folders || {}
        }));
      }
      if (Array.isArray(remote.snippets)) localStorage.setItem('pgt_v25_snippets', JSON.stringify(remote.snippets));
      if (Array.isArray(remote.notes)) localStorage.setItem('pgt_v25_notes', JSON.stringify(remote.notes));
      if (Array.isArray(remote.templates)) localStorage.setItem('pgt_v25_templates', JSON.stringify(remote.templates));
      if (remote.prefs && typeof remote.prefs === 'object') localStorage.setItem('pgt_v25_prefs', JSON.stringify(remote.prefs));
      if (window.__pgtApplyRemoteData) window.__pgtApplyRemoteData();
    } catch (e) { console.warn('[applyRemote]', e); }
  }

  async function syncData(silent) {
    const remote = await findDataFile();
    let remoteContent = null;
    if (remote) {
      try { remoteContent = JSON.parse(await downloadFileContent(remote.id)); } catch (e) {}
    }
    const localSavedAt = parseInt(localStorage.getItem(LOCAL_SAVED_AT) || '0', 10);
    const remoteSavedAt = remoteContent ? (remoteContent.savedAt || 0) : 0;

    // Если облако свежее — применяем себе
    if (remoteSavedAt > localSavedAt + 1000) {
      applyRemoteData(remoteContent);
      localStorage.setItem(LOCAL_SAVED_AT, String(remoteSavedAt));
    }
    // Выгружаем свой свежий слепок
    const content = JSON.stringify(collectData(), null, 2);
    await uploadJson(remote ? remote.id : null, content);
    localStorage.setItem(LOCAL_SAVED_AT, String(Date.now()));
  }

  // ---------- Файлы статей/книг ----------
  async function listFilesInFolder(folderId) {
    const url = driveUrl('files?fields=files(id,name,size,modifiedTime,md5Checksum)&q=' +
      encodeURIComponent("'" + folderId + "' in parents and trashed=false") + '&pageSize=1000');
    const r = await driveFetch(url);
    if (!r.ok) throw new Error('list: ' + r.status);
    const data = await r.json();
    return data.files || [];
  }

  async function uploadRemoteFile(section, name, blob, replaceId) {
    const folderId = folderIds[section];
    if (!folderId) throw new Error('no folder');
    const boundary = '-------pgtfile' + Date.now();
    const meta = { name };
    if (!replaceId) meta.parents = [folderId];
    const body = [
      '\r\n--' + boundary,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify(meta),
      '\r\n--' + boundary,
      'Content-Type: ' + (blob.type || 'application/octet-stream'),
      '',
      ''
    ].join('\r\n');

    // Для бинарных данных — собираем как Blob
    const head = new Blob([body]);
    const tail = new Blob(['\r\n--' + boundary + '--']);
    const full = new Blob([head, blob, tail]);

    const url = replaceId
      ? uploadUrl('files/' + replaceId + '?uploadType=multipart&fields=id,name,size,modifiedTime')
      : uploadUrl('files?uploadType=multipart&fields=id,name,size,modifiedTime');
    const r = await driveFetch(url, {
      method: replaceId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'multipart/related; boundary="' + boundary + '"' },
      body: full
    });
    if (!r.ok) throw new Error('uploadFile: ' + r.status);
    return r.json();
  }

  async function deleteRemoteFile(fileId) {
    const r = await driveFetch(driveUrl('files/' + fileId), { method: 'DELETE' });
    if (!r.ok && r.status !== 404) throw new Error('delete: ' + r.status);
  }

  function getExt(name) {
    const i = name.lastIndexOf('.');
    return i > 0 ? name.slice(i + 1).toLowerCase() : '';
  }

  async function syncFiles(section, silent) {
    const folderId = folderIds[section];
    if (!folderId) return { uploaded: 0, downloaded: 0, removed: 0 };

    const bridge = window.__pgtRemoteFiles;
    if (!bridge) return { uploaded: 0, downloaded: 0, removed: 0 };

    const remote = await listFilesInFolder(folderId);
    const remoteByName = {};
    remote.forEach(f => { remoteByName[f.name] = f; });

    const localMeta = bridge.getLocalFileMeta(section) || [];
    const localByName = {};
    localMeta.forEach(m => { localByName[m.name] = m; });

    let uploaded = 0, downloaded = 0;

    // 1. Локальные → в облако (если новее или отсутствуют)
    for (const m of localMeta) {
      try {
        const rem = remoteByName[m.name];
        const remTime = rem ? new Date(rem.modifiedTime).getTime() : 0;
        const localTime = m.lastModified || 0;
        const needUpload = !rem || (localTime > remTime + 1000);
        if (needUpload) {
          const blob = await bridge.readLocalFile(section, m.name);
          if (blob) {
            await uploadRemoteFile(section, m.name, blob, rem ? rem.id : null);
            uploaded++;
          }
        }
      } catch (e) { console.warn('[upload]', m.name, e); }
    }

    // 2. Облачные → регистрируем в списке (для отсутствующих локально)
    for (const f of remote) {
      if (!localByName[f.name]) {
        bridge.registerRemote(section, {
          name: f.name,
          ext: getExt(f.name),
          size: parseInt(f.size, 10) || 0,
          lastModified: new Date(f.modifiedTime).getTime(),
          driveId: f.id,
          remoteOnly: true
        });
        downloaded++;
      } else {
        bridge.setDriveId(section, f.name, f.id);
      }
    }

    // 3. Локальные, которых нет в облаке и которые уже были синхронизированы ранее — пометить
    //    (не удаляем автоматически, чтобы не потерять данные)
    return { uploaded, downloaded, removed: 0 };
  }

  // ---------- Основной процесс ----------
  async function bootstrap() {
    if (!accessToken) return;
    await ensureAppFolders();
  }

  async function syncAll(silent) {
    if (busy) { if (silent && window.__pgtAutoSyncDone) window.__pgtAutoSyncDone(false); return; }
    if (!accessToken) accessToken = loadToken();
    if (!accessToken) {
      if (!silent) { setStatus('Сначала войдите', 'error'); showSignedOutUI(); }
      if (silent) { setDot('auth'); if (window.__pgtAutoSyncDone) window.__pgtAutoSyncDone(false); }
      return;
    }
    if (navigator.onLine === false) {
      if (silent) { setDot('error'); if (window.__pgtAutoSyncDone) window.__pgtAutoSyncDone(false); }
      else setStatus('Нет сети', 'error');
      return;
    }
    busy = true;
    if (!silent) setStatus('⏳ Синхронизация…', 'syncing');
    if (silent) setDot('active');
    try {
      await ensureAppFolders();
      await syncData(silent);
      for (const s of SECTIONS) await syncFiles(s, silent);
      if (silent) setDot('ok');
      else {
        setStatus('✓ Готово', 'ok');
        setTimeout(() => setStatus('☁️ Готово', 'ok'), 2500);
      }
    } catch (e) {
      console.error('[sync]', e);
      if (String(e.message).indexOf('401') !== -1) {
        clearToken();
        accessToken = null;
        if (!silent) { showSignedOutUI(); setStatus('Нужно войти заново', 'error'); }
        if (silent) setDot('auth');
      } else {
        if (silent) setDot('error');
        else setStatus('✗ Ошибка', 'error');
      }
    } finally {
      busy = false;
      if (silent && window.__pgtAutoSyncDone) window.__pgtAutoSyncDone(true);
    }
  }

  // ---------- Публичный интерфейс для index.html ----------
  window.__pgtDrive = {
    isSignedIn: () => !!accessToken,
	    hasLoggedInBefore: function () {
      try { return localStorage.getItem('pgt_v25_had_login') === '1'; } catch (e) { return false; }
    },
    trySilentReauth: function () {
      if (!tokenClient) initAuth();
      if (!tokenClient) return Promise.reject(new Error('GIS не загружен'));
      return new Promise(function (resolve, reject) {
        const prev = tokenClient.callback;
        tokenClient.callback = function (resp) {
          tokenClient.callback = prev;
          if (resp && resp.access_token) {
            accessToken = resp.access_token;
            saveToken(resp.access_token, parseInt(resp.expires_in, 10) || 3600);
            showSignedInUI();
            try { localStorage.setItem('pgt_v25_had_login', '1'); } catch (e) {}
            resolve(true);
          } else { reject(new Error('no token')); }
        };
        try { tokenClient.requestAccessToken({ prompt: 'none' }); } catch (e) { reject(e); }
      });
    },
	      });
    },
      listRemote: async function (section) {
      if (!accessToken) accessToken = loadToken();
      if (!accessToken) throw new Error('Нет доступа. Войдите в Google.');
      await ensureAppFolders();
      const folderId = folderIds[section];
      if (!folderId) throw new Error('Папка не найдена: ' + section);
      const files = await listFilesInFolder(folderId);
      return files.map(function (f) {
        return {
          id: f.id,
          name: f.name,
          size: f.size || 0,
          modifiedTime: f.modifiedTime || null,
          md5Checksum: f.md5Checksum || null
        };
      });
    },
       signIn: signInUser,
    signOut: function () {
    signIn: signInUser,
    signOut: function () {
      if (accessToken && window.google && google.accounts && google.accounts.oauth2) {
        try { google.accounts.oauth2.revoke(accessToken, () => {}); } catch (e) {}
      }
      accessToken = null;
      clearToken();
      showSignedOutUI();
    },
    // Скачать конкретный файл из Drive и записать локально
    downloadFile: async function (section, name, driveId) {
      if (!accessToken) accessToken = loadToken();
      if (!accessToken) throw new Error('Нет доступа');
      const blob = await downloadFileBlob(driveId);
      const bridge = window.__pgtRemoteFiles;
      if (bridge) await bridge.writeLocalFile(section, name, blob);
      return blob;
    },
    // Загрузить локальный файл в Drive (используется при добавлении новых)
    uploadFile: async function (section, name, blob) {
      if (!accessToken) accessToken = loadToken();
      if (!accessToken) return null;
      await ensureAppFolders();
      const remote = await listFilesInFolder(folderIds[section]);
      const existing = remote.find(f => f.name === name);
      return await uploadRemoteFile(section, name, blob, existing ? existing.id : null);
    },
    // Удалить с Drive
    deleteFile: async function (section, name) {
      if (!accessToken) accessToken = loadToken();
      if (!accessToken) return;
      const folderId = folderIds[section];
      if (!folderId) return;
      const remote = await listFilesInFolder(folderId);
      const existing = remote.find(f => f.name === name);
      if (existing) await deleteRemoteFile(existing.id);
    },
    syncNow: () => syncAll(false),
    syncSilent: () => syncAll(true),
    bootstrap: bootstrap,
  };

  // ---------- Запуск ----------
  function bind() {
    loadFolderIds();
    const signBtn = document.getElementById('googleSignInBtn');
    const syncBtn = document.getElementById('syncBtn');
    if (signBtn) signBtn.addEventListener('click', signInUser);
    if (syncBtn) syncBtn.addEventListener('click', function () { syncAll(false); });

    const saved = loadToken();
    if (saved) {
      accessToken = saved;
	  try { localStorage.setItem('pgt_v25_had_login', '1'); } catch (e) {}
      showSignedInUI();
      setStatus('☁️ Готово', 'ok');
      // доготовим папки в фоне
      bootstrap().catch(e => console.warn('[bootstrap]', e));
    } else {
      showSignedOutUI();
    }

    let tries = 0;
    const t = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
        clearInterval(t);
        initAuth();
      }
      if (++tries > 40) clearInterval(t);
    }, 250);

    // Хук из index.html: вызывается при saveData()
    window.__pgtAutoSync = function () {
      if (busy) { if (window.__pgtAutoSyncDone) window.__pgtAutoSyncDone(false); return; }
      if (!accessToken) accessToken = loadToken();
      if (!accessToken) { setDot('auth'); if (window.__pgtAutoSyncDone) window.__pgtAutoSyncDone(false); return; }
      if (navigator.onLine === false) { setDot('error'); if (window.__pgtAutoSyncDone) window.__pgtAutoSyncDone(false); return; }
      setDot('active');
      syncAll(true);
    };

    window.addEventListener('online', () => { if (accessToken) setDot('ok'); });
    window.addEventListener('offline', () => setDot('error'));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();