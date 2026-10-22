/* ------------------------------------------------------------------
   teacher.js — shared data and dashboard behaviour for the Teacher*
   pages. Loaded after js/portal.js, which handles the sidebar toggle,
   the signed-in ID and the logout button.

   DEMO DATA ONLY. There is no school database behind this. Classes,
   students, grades and attendance are samples, and everything the
   teacher enters is saved in this browser's localStorage under their
   own teacher ID. Replace this file with real API calls before use.
   ------------------------------------------------------------------ */

/* ---------- demo classes (fallback) ---------- */
/* The teacher pages read their sections from js/store.js, so a class the
   administrator reassigns (and every student moved on the roster) shows up
   here. The records below are only used when the store is unavailable,
   for example a page opened without js/store.js loaded. */
const TC_FALLBACK_CLASSES = [
  {
    id: 'math7-rizal',
    subject: 'Mathematics 7',
    section: 'Grade 7 – Rizal',
    room: 'Room 201',
    time: '7:30 – 8:30 AM',
    days: 'Mon–Fri',
    students: [
      { id: '2026-0701', name: 'Aguilar, Maria Sofia' },
      { id: '2026-0702', name: 'Bautista, John Paul' },
      { id: '2026-0703', name: 'Cruz, Angela Mae' },
      { id: '2026-0704', name: 'Dela Cruz, Rafael' },
      { id: '2026-0705', name: 'Garcia, Nicole Anne' },
      { id: '2026-0706', name: 'Hernandez, Miguel' },
      { id: '2026-0707', name: 'Iglesia, Bea Kristine' },
      { id: '2026-0708', name: 'Javier, Luis Antonio' },
      { id: '2026-0709', name: 'Mendoza, Patricia' },
      { id: '2026-0710', name: 'Navarro, Daniel' },
      { id: '2026-0711', name: 'Ocampo, Jasmine' },
      { id: '2026-0712', name: 'Reyes, Carlo Miguel' }
    ]
  },
  {
    id: 'math8-bonifacio',
    subject: 'Mathematics 8',
    section: 'Grade 8 – Bonifacio',
    room: 'Room 204',
    time: '9:30 – 10:30 AM',
    days: 'Mon–Fri',
    students: [
      { id: '2026-0801', name: 'Aquino, Bianca' },
      { id: '2026-0802', name: 'Bernardo, Joshua' },
      { id: '2026-0803', name: 'Castillo, Andrea' },
      { id: '2026-0804', name: 'Domingo, Mark Angelo' },
      { id: '2026-0805', name: 'Espinosa, Carla' },
      { id: '2026-0806', name: 'Fernandez, Paolo' },
      { id: '2026-0807', name: 'Gonzales, Rhea' },
      { id: '2026-0808', name: 'Lim, Kevin' },
      { id: '2026-0809', name: 'Manalo, Sophia' },
      { id: '2026-0810', name: 'Ortega, Gabriel' }
    ]
  },
  {
    id: 'math9-mabini',
    subject: 'Mathematics 9',
    section: 'Grade 9 – Mabini',
    room: 'Room 302',
    time: '1:00 – 2:00 PM',
    days: 'Mon–Fri',
    students: [
      { id: '2026-0901', name: 'Abad, Isabella' },
      { id: '2026-0902', name: 'Buenaventura, Nathan' },
      { id: '2026-0903', name: 'Cortez, Camille' },
      { id: '2026-0904', name: 'Dizon, Adrian' },
      { id: '2026-0905', name: 'Evangelista, Kyla' },
      { id: '2026-0906', name: 'Flores, Rafael' },
      { id: '2026-0907', name: 'Gutierrez, Marielle' },
      { id: '2026-0908', name: 'Herrera, Lorenzo' },
      { id: '2026-0909', name: 'Ignacio, Zoe' },
      { id: '2026-0910', name: 'Jimenez, Paolo' }
    ]
  }
];

/* sections assigned to the signed-in teacher, from the shared store */
const TC_CLASSES = (function () {
  if (typeof SPStore === 'undefined') return TC_FALLBACK_CLASSES;
  try {
    const id = SPStore.currentUserId();
    // opened without going through Login.html: show the demo sections so
    // the layout can be previewed; a signed-in teacher sees only their own
    if (!id) return TC_FALLBACK_CLASSES;
    return SPStore.classesForTeacher(id);
  } catch (e) {
    return TC_FALLBACK_CLASSES;
  }
})();

/* seeded once, the first time a teacher opens the portal */
const TC_DEFAULT_ANNOUNCEMENTS = [
  {
    id: 'demo-1',
    title: 'Second quarter exam coverage',
    body: 'Our second quarter examination covers Chapters 5 to 8. Bring a scientific calculator and your own writing materials. Review the practice sets posted in class.',
    audience: 'All my classes',
    when: 'Sep 10, 2026'
  },
  {
    id: 'demo-2',
    title: 'Parent–teacher conference',
    body: 'Parent–teacher conferences are scheduled for September 18, 1:00–4:00 PM in Room 201. Please coordinate with the class adviser for your time slot.',
    audience: 'Grade 7 – Rizal',
    when: 'Sep 5, 2026'
  }
];

/* ---------- storage ---------- */
/* Each teacher gets their own key, so two IDs on the same browser do not
   overwrite one another. If storage is blocked, the portal still works
   for the current page but nothing is remembered after a reload. */
let tcMemory = null;

function tcTeacherId() {
  try {
    return (sessionStorage.getItem('sp_user_id')
         || sessionStorage.getItem('sp_student_id')
         || 'demo').trim() || 'demo';
  } catch (e) { return 'demo'; }
}

function tcStorageKey() {
  return 'sp_teacher_data_' + tcTeacherId().toLowerCase();
}

function tcLoad() {
  if (tcMemory) return tcMemory;

  let saved = null;
  try {
    const raw = localStorage.getItem(tcStorageKey());
    if (raw) saved = JSON.parse(raw);
  } catch (e) { /* missing or unreadable — use the defaults */ }

  tcMemory = {
    attendance: (saved && saved.attendance) || {},
    grades: (saved && saved.grades) || {},
    announcements: Array.isArray(saved && saved.announcements)
      ? saved.announcements
      : TC_DEFAULT_ANNOUNCEMENTS.map(a => ({ ...a }))
  };

  return tcMemory;
}

function tcSave(data) {
  tcMemory = data;
  try { localStorage.setItem(tcStorageKey(), JSON.stringify(data)); } catch (e) {}

  // XAMPP/MySQL copy (js/sync.js). The teacher's own row only; the student
  // Grades page reads this through api/student-grades.php.
  const id = tcTeacherId();
  if (id !== 'demo' && window.SPSync && typeof window.SPSync.push === 'function') {
    window.SPSync.push('api/teacher-data.php', { id: id, data: data });
  }
}

function tcClass(classId) {
  return TC_CLASSES.find(c => c.id === classId) || null;
}

/* ---------- small helpers ---------- */
function tcTodayISO() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function tcDateLabel(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function tcEl(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

/* announcement card shared by the dashboard and the announcements page */
function tcAnnouncementEl(ann, options = {}) {
  const item = tcEl('article', 'ann-item' + (options.isNew ? ' new' : ''));

  const head = tcEl('div', 'ann-head');
  const left = tcEl('div');

  left.append(tcEl('h3', 'ann-title', ann.title));

  const meta = tcEl('div', 'ann-meta');
  if (ann.audience) meta.append(tcEl('span', 'ann-audience', ann.audience));
  meta.append(document.createTextNode(ann.when || ''));
  left.append(meta);

  head.append(left);

  if (options.onDelete) {
    const del = tcEl('button', 'ann-del', 'Delete');
    del.type = 'button';
    del.setAttribute('aria-label', 'Delete announcement: ' + ann.title);
    del.addEventListener('click', () => options.onDelete(ann));
    head.append(del);
  }

  item.append(head);
  if (ann.body) item.append(tcEl('p', 'ann-body', ann.body));

  return item;
}

/* ---------- dashboard ---------- */
const scheduleList = document.getElementById('scheduleList');

if (scheduleList) {
  const data = tcLoad();

  const students = TC_CLASSES.reduce((sum, c) => sum + c.students.length, 0);
  const statClasses = document.getElementById('statClasses');
  const statStudents = document.getElementById('statStudents');
  const statAnnouncements = document.getElementById('statAnnouncements');
  const statAttendance = document.getElementById('statAttendance');

  if (statClasses) statClasses.textContent = String(TC_CLASSES.length);
  if (statStudents) statStudents.textContent = String(students);
  if (statAnnouncements) statAnnouncements.textContent = String(data.announcements.length);

  // today's attendance across every class, if any has been marked
  const today = tcTodayISO();
  let present = 0;
  let marked = 0;
  TC_CLASSES.forEach(c => {
    const day = data.attendance[c.id] && data.attendance[c.id][today];
    if (!day) return;
    Object.values(day).forEach(v => {
      if (v === 'present' || v === 'late') present += 1;
      marked += 1;
    });
  });

  if (statAttendance) {
    if (marked === 0) {
      statAttendance.textContent = 'Not marked';
      statAttendance.classList.add('pending');
    } else {
      statAttendance.textContent = present + ' / ' + students;
      statAttendance.title = present + ' present or late out of ' + students + ' students';
      statAttendance.classList.remove('pending');
    }
  }

  // today's schedule
  if (TC_CLASSES.length === 0) {
    scheduleList.append(tcEl('p', 'schedule-empty',
      'No classes assigned yet. Ask the administrator to post your sections.'));
  } else {
    TC_CLASSES.forEach(c => {
      const row = tcEl('div', 'schedule-row');
      row.append(tcEl('div', 'schedule-time', c.time));

      const main = tcEl('div', 'schedule-main');
      main.append(tcEl('div', 't', c.subject));
      main.append(tcEl('div', 's', c.section + ' · ' + c.room));
      row.append(main);
      scheduleList.append(row);
    });
  }

  // newest announcements first (the store keeps the newest at the front)
  const recent = document.getElementById('recentAnnouncements');
  if (recent) {
    const latest = data.announcements.slice(0, 2);
    if (latest.length === 0) {
      recent.append(tcEl('p', 'ann-empty', 'No announcements posted yet.'));
    } else {
      latest.forEach(a => recent.append(tcAnnouncementEl(a)));
    }
  }
}

/* ---------- floating help button ---------- */
const helpBtn = document.querySelector('.help');
if (helpBtn) {
  helpBtn.addEventListener('click', () => {
    alert('For account concerns, contact the ICT Office:\n'
        + 'Narra Corner Receiver Streets, BF International Village, Las Piñas City\n'
        + 'Monday to Friday, 8:00 AM – 5:00 PM');
  });
}
