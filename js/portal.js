/* ------------------------------------------------------------------
   portal.js — behaviour for the signed-in shell.
   Shared by Dashboard.html and Calendar.html (and any portal page
   added later), so the sidebar logic only exists in one place.

   Loaded with <script defer>, so the DOM is ready and no
   DOMContentLoaded wrapper is needed.
   ------------------------------------------------------------------ */

/* ---------- session (display only) ---------- */
// Shows whatever ID was typed on the login page, and adapts the shared
// pages (Calendar.html) to the teacher portal when a teacher is signed in.
// This is NOT authentication — it proves nothing about who is viewing,
// and these pages can still be opened directly without going through Login.html.

let role = 'student';
let userId = '';

try {
  userId = sessionStorage.getItem('sp_user_id')
        || sessionStorage.getItem('sp_student_id') || '';
  role = sessionStorage.getItem('sp_role') || 'student';
} catch (e) { /* storage blocked — keep the defaults */ }

const tbUser = document.getElementById('tbUser');
if (userId && tbUser) tbUser.textContent = userId.toUpperCase();

/* ---------- teacher navigation on shared pages ---------- */
// Teacher pages ship their own sidebar (data-teacher), so this only runs on
// the student pages. It lets a signed-in teacher open Calendar.html and get
// teacher links instead of student ones.
const nav = document.querySelector('.sb-nav');

if (role === 'teacher' && nav && !nav.dataset.teacher && !nav.dataset.admin) {
  const here = (window.location.pathname.split('/').pop() || '').toLowerCase();

  const links = [
    ['TeacherDashboard.html',    'Dashboard',         'i-home'],
    ['TeacherClasses.html',      'Classes',           'i-user'],
    ['TeacherAttendance.html',   'Attendance',        'i-clipboard'],
    ['TeacherGrades.html',       'Grade Book',        'i-file'],
    ['TeacherAnnouncements.html','Announcements',     'i-chat'],
    ['Calendar.html',            'Academic Calendar', 'i-calendar']
  ];

  nav.innerHTML = links.map(([href, label, icon]) => {
    const current = here === href.toLowerCase() ? ' aria-current="page"' : '';
    return `<a href="${href}"${current}><svg class="ic"><use href="#${icon}"/></svg>${label}</a>`;
  }).join('');

  const sub = document.querySelector('.sb-sub');
  if (sub) sub.textContent = 'Teacher Portal';

  const avatar = document.querySelector('.tb-avatar');
  if (avatar) avatar.textContent = 'TR';

  // the crumb on shared pages points at the student dashboard
  const crumbLink = document.querySelector('.crumb a[href="Dashboard.html"]');
  if (crumbLink) {
    crumbLink.href = 'TeacherDashboard.html';
    crumbLink.textContent = 'Teacher Dashboard';
  }
}

/* ---------- administrator navigation on shared pages ---------- */
// Admin pages ship their own sidebar (data-admin). This swaps the student
// nav for admin links when an administrator opens a page such as Calendar.
if (role === 'admin' && nav && !nav.dataset.teacher && !nav.dataset.admin) {
  const here = (window.location.pathname.split('/').pop() || '').toLowerCase();

  const links = [
    ['AdminDashboard.html',  'Dashboard',         'i-home'],
    ['AdminStudents.html',   'Students',          'i-user'],
    ['AdminClasses.html',    'Classes',           'i-layers'],
    ['Calendar.html',        'Academic Calendar', 'i-calendar']
  ];

  nav.innerHTML = links.map(([href, label, icon]) => {
    const current = here === href.toLowerCase() ? ' aria-current="page"' : '';
    return `<a href="${href}"${current}><svg class="ic"><use href="#${icon}"/></svg>${label}</a>`;
  }).join('');

  // mark the nav so the student notification bell stays out of admin pages
  nav.dataset.admin = 'true';

  const sub = document.querySelector('.sb-sub');
  if (sub) sub.textContent = 'Admin Portal';

  const avatar = document.querySelector('.tb-avatar');
  if (avatar) avatar.textContent = 'AD';

  const crumbLink = document.querySelector('.crumb a[href="Dashboard.html"]');
  if (crumbLink) {
    crumbLink.href = 'AdminDashboard.html';
    crumbLink.textContent = 'Admin Dashboard';
  }
}

/* ---------- notifications (student pages) ---------- */
// Student notifications are READ-ONLY. The Teacher Portal writes them to
// localStorage under "sp_notifications"; this page only reads and shows
// them. There is deliberately no delete, dismiss, or "clear all" control,
// and nothing here removes an entry — once a teacher posts a notification,
// it stays in the list. Closing the panel only hides it; the contents
// remain and come back when the bell is opened again.
const bell = document.querySelector('.bell');

if (bell && nav && !nav.dataset.teacher && !nav.dataset.admin) {
  const NOTIF_KEY = 'sp_notifications';
  const READ_KEY = 'sp_notifications_seen';

  function storedList(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (err) {
      return [];
    }
  }

  const notifications = storedList(NOTIF_KEY).filter(
    item => item && item.id != null && typeof item.title === 'string'
  );
  const seen = storedList(READ_KEY);

  const wrap = document.createElement('div');
  wrap.className = 'notif-wrap';
  bell.parentNode.insertBefore(wrap, bell);
  wrap.append(bell);

  const panel = document.createElement('div');
  panel.className = 'notif-panel';
  panel.id = 'notifPanel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Notifications');

  const head = document.createElement('div');
  head.className = 'notif-head';

  const title = document.createElement('h2');
  title.textContent = 'Notifications';

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'notif-close';
  close.setAttribute('aria-label', 'Close notifications');
  close.innerHTML = '<svg class="ic"><use href="#i-x"/></svg>';

  head.append(title, close);

  let dot = null;

  if (notifications.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'notif-empty';
    empty.textContent = 'No notifications yet.';
    panel.append(head, empty);
  } else {
    const list = document.createElement('ul');
    list.className = 'notif-list';

    notifications.forEach(item => {
      const row = document.createElement('li');
      row.className = 'notif-item';

      const heading = document.createElement('h3');
      heading.className = 'notif-title';
      heading.textContent = item.title;
      row.append(heading);

      if (item.message) {
        const message = document.createElement('p');
        message.className = 'notif-msg';
        message.textContent = item.message;
        row.append(message);
      }

      if (item.at) {
        const time = document.createElement('span');
        time.className = 'notif-time';
        time.textContent = item.at;
        row.append(time);
      }

      list.append(row);
    });

    panel.append(head, list);

    const unread = notifications.filter(
      item => seen.indexOf(String(item.id)) === -1
    ).length;

    if (unread > 0) {
      dot = document.createElement('span');
      dot.className = 'dot';
      dot.setAttribute('aria-hidden', 'true');
      bell.append(dot);
      bell.setAttribute('aria-label', 'Notifications, ' + unread + ' unread');
    }
  }

  // Shown with the list too: notification text is set by the teacher and
  // cannot be cleared from this page.
  const foot = document.createElement('p');
  foot.className = 'notif-foot';
  foot.textContent = 'Posted by your teachers. Notifications cannot be removed.';
  panel.append(foot);

  wrap.append(panel);

  bell.setAttribute('aria-haspopup', 'dialog');
  bell.setAttribute('aria-expanded', 'false');
  bell.setAttribute('aria-controls', 'notifPanel');

  // Opening the panel marks items as read. That only clears the badge —
  // the notifications themselves stay in the list.
  function markSeen() {
    if (!dot) return;
    dot.remove();
    dot = null;
    bell.setAttribute('aria-label', 'Notifications');
    try {
      const ids = Array.from(new Set(
        seen.concat(notifications.map(item => String(item.id)))
      ));
      localStorage.setItem(READ_KEY, JSON.stringify(ids));
    } catch (err) {
      /* private mode — items still never disappear, the dot just returns */
    }
  }

  function setNotifOpen(open) {
    panel.hidden = !open;
    bell.setAttribute('aria-expanded', String(open));
    if (open) {
      markSeen();
      close.focus();
    }
  }

  bell.addEventListener('click', () => setNotifOpen(panel.hidden));
  close.addEventListener('click', () => {
    setNotifOpen(false);
    bell.focus();
  });

  document.addEventListener('click', event => {
    if (!panel.hidden && !wrap.contains(event.target)) setNotifOpen(false);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) {
      setNotifOpen(false);
      bell.focus();
    }
  });
}


/* ---------- sidebar toggle ---------- */
const navToggle = document.getElementById('navToggle');

if (navToggle) {
  const toggleIcon = document.getElementById('navToggleIcon');
  const backdrop = document.getElementById('backdrop');
  const narrow = window.matchMedia('(max-width: 860px)');

  const setNav = (open) => {
    document.body.classList.toggle('nav-closed', !open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Hide menu' : 'Show menu');
    if (toggleIcon) {
      toggleIcon.firstElementChild.setAttribute('href', open ? '#i-x' : '#i-menu');
    }
  };

  // start collapsed on phones, open on desktop
  setNav(!narrow.matches);
  narrow.addEventListener('change', (e) => setNav(!e.matches));

  navToggle.addEventListener('click', () => {
    setNav(document.body.classList.contains('nav-closed'));
  });

  if (backdrop) backdrop.addEventListener('click', () => setNav(false));
}

/* ---------- sign out (dashboard only) ---------- */
const signout = document.getElementById('signout');

if (signout) {
  signout.addEventListener('click', () => {
    try {
      sessionStorage.removeItem('sp_user_id');
      sessionStorage.removeItem('sp_role');
      sessionStorage.removeItem('sp_student_id');
    } catch (e) {}
    window.location.href = 'Login.html';
  });
}
