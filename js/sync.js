/* ------------------------------------------------------------------
   sync.js — keeps the browser's localStorage cache in step with the
   MySQL database served by XAMPP (api/store.php and api/teacher-data.php).

   Runs BEFORE the page's own scripts, and uses synchronous requests on
   purpose: the pages read their data synchronously from localStorage and
   need the MySQL copy already there. On localhost this costs a few
   milliseconds per load.

   If the site is opened straight from disk (file://) or Apache/MySQL is
   not running, nothing here changes and the portal keeps working from
   localStorage alone.
   ------------------------------------------------------------------ */

(function () {
  const overHttp = window.location.protocol === 'http:'
    || window.location.protocol === 'https:';
  if (!overHttp) return;

  function readJson(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const value = JSON.parse(raw);
      return value && typeof value === 'object' ? value : null;
    } catch (e) {
      return null;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* storage blocked — the page still works for this load */ }
  }

  function request(method, url, payload) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url, false);
      if (payload !== undefined) {
        xhr.setRequestHeader('Content-Type', 'application/json');
      }
      xhr.send(payload === undefined ? null : JSON.stringify(payload));
      if (xhr.status < 200 || xhr.status >= 300) return null;
      return JSON.parse(xhr.responseText);
    } catch (e) {
      return null;
    }
  }

  /* used by store.js and teacher.js to push every change to MySQL */
  window.SPSync = {
    enabled: true,
    get: function (url) { return request('GET', url); },
    push: function (url, payload) { return request('POST', url, payload); }
  };

  /* ---------- shared school store ---------- */
  const server = window.SPSync.get('api/store.php');
  const localStore = readJson('sp_portal_store_v1');
  const localOk = localStore
    && Array.isArray(localStore.students)
    && Array.isArray(localStore.classes);

  if (server && server.ok && server.store) {
    if (server.fresh && localOk) {
      // first run against an empty database: keep the demo data that is
      // already in this browser instead of replacing it with the seed
      window.SPSync.push('api/store.php', localStore);
    } else {
      writeJson('sp_portal_store_v1', server.store);
    }
  } else {
    console.warn('School Portal: MySQL sync is unavailable — using localStorage only. '
      + 'Start Apache and MySQL in XAMPP, then reload.');
  }

  /* ---------- the signed-in teacher's attendance/grades/announcements ---------- */
  let role = '';
  let userId = '';

  try {
    role = sessionStorage.getItem('sp_role') || '';
    userId = sessionStorage.getItem('sp_user_id') || '';
  } catch (e) { /* storage blocked */ }

  if (role === 'teacher' && userId) {
    const key = 'sp_teacher_data_' + userId.toLowerCase();
    const result = window.SPSync.get(
      'api/teacher-data.php?id=' + encodeURIComponent(userId)
    );

    if (result && result.ok) {
      if (result.data && typeof result.data === 'object') {
        writeJson(key, result.data);
      } else {
        const local = readJson(key);
        if (local) {
          window.SPSync.push('api/teacher-data.php', { id: userId, data: local });
        }
      }
    }
  }
})();
