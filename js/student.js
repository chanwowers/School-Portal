/* ------------------------------------------------------------------
   student.js — connects the student pages to the account the
   administrator manages in js/store.js.

   There is no second copy of the student's details: the name, section,
   subject and teacher all come from the same record AdminStudents.html
   and AdminClasses.html edit. If the administrator moves the student to
   another section or resets the password, the next sign-in and page load
   show the new values.

   Loaded after portal.js and store.js, before the page's own script.
   ------------------------------------------------------------------ */

/* The signed-in student's full record, or null when no student account is
   signed in (a teacher opening a shared page, or a page opened directly). */
const SP_STUDENT_RECORD = (function () {
  try {
    const role = sessionStorage.getItem('sp_role') || 'student';
    if (role !== 'student') return null;
    if (typeof SPStore === 'undefined') return null;

    const id = SPStore.currentUserId();
    return id ? SPStore.recordForStudent(id) : null;
  } catch (e) {
    return null;
  }
})();

/* "Aguilar, Maria Sofia" → "AM", "Reyes" → "RE" */
function spInitials(fullName) {
  const parts = String(fullName || '').replace(/,/g, ' ').split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ST';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/* "Aguilar, Maria Sofia" → "Maria" (used only in the welcome line) */
function spGivenName(fullName) {
  const text = String(fullName || '').trim();
  if (!text) return '';
  const given = text.includes(',') ? text.split(',').slice(1).join(',').trim() : text;
  return given.split(/\s+/)[0] || '';
}

/* ---------- shell: ID and avatar match the stored account ---------- */
if (SP_STUDENT_RECORD) {
  const topId = document.getElementById('tbUser');
  if (topId) topId.textContent = SP_STUDENT_RECORD.student.id;

  const avatar = document.querySelector('.tb-avatar');
  if (avatar) avatar.textContent = spInitials(SP_STUDENT_RECORD.student.name);
}

/* ---------- dashboard record card ---------- */
const studentGreeting = document.getElementById('studentGreeting');

if (studentGreeting) {
  const record = SP_STUDENT_RECORD;
  const cls = record ? record.class : null;

  function put(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  if (record) {
    studentGreeting.textContent = 'Welcome back, ' + spGivenName(record.student.name);
    put('studentName', record.student.name);
    put('studentRecordId', record.student.id);
    put('studentSection', cls ? cls.section : 'Not assigned yet');
    put('studentSubject', cls ? cls.subject : '—');
    put('studentTeacher', record.teacher ? record.teacher.name : 'Not assigned yet');
    put('studentRoom', cls ? cls.room : '—');
    put('studentSchedule', cls ? cls.days + ', ' + cls.time : '—');
    put('recordState', cls ? 'Synced with the registrar' : 'Waiting for a section');
  } else {
    studentGreeting.textContent = 'Welcome to the School Portal';
    put('studentName', 'No account signed in');
    put('studentRecordId', '—');
    put('studentSection', '—');
    put('studentSubject', '—');
    put('studentTeacher', '—');
    put('studentRoom', '—');
    put('studentSchedule', '—');
    put('recordState', 'Not signed in');
  }

  const note = document.getElementById('studentRecordNote');
  if (note) {
    if (!record) {
      note.textContent = 'No student account is signed in. Sign in with the account '
        + 'the administrator created for you.';
      note.hidden = false;
    } else if (!cls) {
      note.textContent = 'Your account is not in a classroom yet. Ask the administrator '
        + 'to assign your section on the Classrooms page.';
      note.hidden = false;
    } else {
      note.hidden = true;
    }
  }
}
