/* ------------------------------------------------------------------
   login.js — behaviour for Login.html.
   Loaded with <script defer>, so the DOM is ready and no
   DOMContentLoaded wrapper is needed.
   ------------------------------------------------------------------ */

const form = document.getElementById('loginForm');
const username = document.getElementById('username');
const userLabel = document.getElementById('userLabel');
const password = document.getElementById('password');
const userError = document.getElementById('userError');
const passError = document.getElementById('passError');
const alertBox = document.getElementById('alert');
const toggle = document.getElementById('toggle');
const roleSelect = document.getElementById('role');

/* ---------- account type ---------- */
/* Students and teachers share this form. The choice only changes the ID
   label and which dashboard we open after a successful (demo) sign-in. */
function currentRole() {
  if (!roleSelect) return 'student';
  if (roleSelect.value === 'teacher') return 'teacher';
  if (roleSelect.value === 'admin') return 'admin';
  return 'student';
}

function syncRole() {
  const role = currentRole();
  const teacher = role === 'teacher';
  const admin = role === 'admin';

  userLabel.textContent = admin ? 'Admin ID' : teacher ? 'Employee ID' : 'Student ID';
  username.placeholder = admin ? 'e.g. ADMIN-0001'
                       : teacher ? 'e.g. EMP-00231'
                       : 'e.g. 2026-0701';

  userError.textContent = '';
  passError.textContent = '';
  username.removeAttribute('aria-invalid');
  password.removeAttribute('aria-invalid');
}

if (roleSelect) {
  roleSelect.addEventListener('change', syncRole);
}
syncRole();

toggle.addEventListener('click', () => {
  const hidden = password.type === 'password';
  password.type = hidden ? 'text' : 'password';
  toggle.textContent = hidden ? 'Hide' : 'Show';
  toggle.setAttribute('aria-label', hidden ? 'Hide password' : 'Show password');
  password.focus();
});

function setError(input, box, message) {
  box.textContent = message;
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  return !message;
}

function validate() {
  const okUser = setError(username, userError,
    username.value.trim() ? '' : 'Enter your ID.');
  const okPass = setError(password, passError,
    password.value ? (password.value.length < 6 ? 'Password must be at least 6 characters.' : '')
                   : 'Enter your password.');
  return okUser && okPass;
}

[username, password].forEach(el => {
  el.addEventListener('input', () => {
    if (el.getAttribute('aria-invalid') === 'true') validate();
  });
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  alertBox.classList.remove('show');

  if (!validate()) {
    (username.getAttribute('aria-invalid') === 'true' ? username : password).focus();
    return;
  }

  // DEMO ONLY — there is no server. Student and teacher accounts are checked
  // against the same demo store the administrator edits (js/store.js), so an
  // account the admin creates, resets or moves works here immediately. The
  // passwords are plain text in localStorage; a real portal must authenticate
  // on the server and never store or return them like this.
  const role = currentRole();
  let accountId = username.value.trim();

  if (typeof SPStore !== 'undefined') {
    if (role === 'admin') {
      const account = SPStore.admin();
      const idOk = account
        && username.value.trim().toLowerCase() === account.id.toLowerCase();
      const passOk = account && password.value === account.password;

      if (!idOk || !passOk) {
        setError(password, passError, 'Incorrect administrator ID or password.');
        password.focus();
        return;
      }
      accountId = account.id;
    } else {
      const result = role === 'teacher'
        ? SPStore.loginTeacher(username.value, password.value)
        : SPStore.loginStudent(username.value, password.value);

      if (!result.ok) {
        setError(password, passError, result.message);
        password.focus();
        return;
      }

      accountId = result.student ? result.student.id : result.teacher.id;
    }
  }

  try {
    sessionStorage.setItem('sp_user_id', accountId);
    sessionStorage.setItem('sp_role', role);
    // clear the old student-only key from earlier versions of this page
    sessionStorage.removeItem('sp_student_id');
  } catch (e) {}

  window.location.href = role === 'admin' ? 'AdminDashboard.html'
                       : role === 'teacher' ? 'TeacherDashboard.html'
                       : 'Dashboard.html';
});
