/* ------------------------------------------------------------------
   home.js — behaviour for index.html.
   Loaded with <script defer>, so the DOM is ready and no
   DOMContentLoaded wrapper is needed.
   ------------------------------------------------------------------ */

// If this session already passed through the login page, offer a shortcut
// straight back instead of making the user sign in again.
// Display-only: sessionStorage proves nothing about who is viewing.
try {
  const role = sessionStorage.getItem('sp_role') || 'student';
  const id = sessionStorage.getItem('sp_user_id')
          || sessionStorage.getItem('sp_student_id');

  if (id) {
    const teacher = role === 'teacher';
    const admin = role === 'admin';
    const cta = document.getElementById('ctaSignin');
    const icon = cta.querySelector('svg');
    cta.textContent = admin ? 'Continue to admin dashboard'
                     : teacher ? 'Continue to teacher dashboard'
                     : 'Continue to dashboard';
    if (icon) cta.prepend(icon);
    cta.setAttribute('href', admin ? 'AdminDashboard.html'
                         : teacher ? 'TeacherDashboard.html'
                         : 'Dashboard.html');

    const note = document.getElementById('sessionNote');
    note.textContent = 'You are already signed in for this session.';
    note.hidden = false;
  }
} catch (e) { /* storage blocked — the plain Sign in call to action still works */ }

document.getElementById('year').textContent = new Date().getFullYear();

document.getElementById('helpBtn').addEventListener('click', () => {
  alert('For account concerns, contact the ICT Office:\n'
      + 'Narra Corner Receiver Streets, BF International Village, Las Piñas City\n'
      + 'Monday to Friday, 8:00 AM – 5:00 PM');
});
