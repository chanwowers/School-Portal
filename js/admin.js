/* ------------------------------------------------------------------
   admin.js — small shared helpers for the Admin* pages. The data itself
   lives in js/store.js; the shell (sidebar, top bar, sign out) is in
   js/portal.js.
   ------------------------------------------------------------------ */

function adminEl(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function adminStatus(node, message, kind) {
  if (!node) return;
  node.textContent = message || '';
  node.className = 'status' + (kind ? ' ' + kind : '');
}

function adminTeacherName(teacherId) {
  const teacher = SPStore.teacherById(teacherId);
  return teacher ? teacher.name : 'Unassigned';
}

function adminClassLabel(cls) {
  return cls.section + ' · ' + cls.subject;
}

/* eight-character demo password, easy to read aloud */
function adminRandomPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 8; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
