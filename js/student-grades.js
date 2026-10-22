/* ------------------------------------------------------------------
   student-grades.js — the grade sheet on Grades.html.

   The subject comes from the student's record in js/store.js. The scores
   come from the teacher assigned to that classroom: api/student-grades.php
   returns this student's row from MySQL on XAMPP, and the local teacher
   grade book is a same-browser fallback when the server is unavailable.

   DEMO ONLY: there is no real authentication, so the API trusts the
   student id in the query string.
   ------------------------------------------------------------------ */

const studentGradeBody = document.getElementById('studentGradeBody');

if (studentGradeBody) {
  const QUARTERS = ['q1', 'q2', 'q3', 'q4'];
  const record = typeof SP_STUDENT_RECORD !== 'undefined' ? SP_STUDENT_RECORD : null;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function pendingCell() {
    const cell = el('td', 'score');
    cell.append(el('span', 'pending', '—'));
    return cell;
  }

  function isGrade(value) {
    if (value === '' || value == null) return false;
    const number = Number(value);
    return Number.isInteger(number) && number >= 60 && number <= 100;
  }

  function finalOf(values) {
    if (!values.every(isGrade)) return null;
    return Math.round(values.reduce((sum, value) => sum + Number(value), 0) / values.length);
  }

  /* the teacher's saved grade book in this browser (fallback) */
  function localGrades() {
    if (!record || !record.class || !record.teacher) return {};

    try {
      const raw = localStorage.getItem(
        'sp_teacher_data_' + record.teacher.id.toLowerCase()
      );
      if (!raw) return {};
      const data = JSON.parse(raw);
      const book = data && data.grades && data.grades[record.class.id];
      return (book && book[record.student.id]) || {};
    } catch (e) {
      return {};
    }
  }

  /* XAMPP/MySQL copy — only this student's quarters are returned */
  function serverGrades() {
    if (!record || !window.SPSync || typeof window.SPSync.get !== 'function') {
      return null;
    }

    const result = window.SPSync.get(
      'api/student-grades.php?id=' + encodeURIComponent(record.student.id)
    );

    if (!result || !result.ok || !result.grades) return null;
    return result.grades;
  }

  function savedGrades() {
    const server = serverGrades();
    const local = localGrades();

    if (server && QUARTERS.some(quarter => isGrade(server[quarter]))) {
      return server;
    }
    return local;
  }

  function setSummary(finalValue) {
    const average = document.getElementById('generalAverage');
    const subjects = document.getElementById('gradeSubjects');

    if (subjects) subjects.textContent = record && record.class ? '1' : '0';

    if (average) {
      if (finalValue == null) {
        average.textContent = '—';
        average.classList.add('pending');
      } else {
        average.textContent = String(finalValue);
        average.classList.remove('pending');
      }
    }
  }

  function emptyRow(message) {
    const row = el('tr');
    const cell = el('td', 'empty-cell', message);
    cell.colSpan = 6;
    row.append(cell);
    studentGradeBody.append(row);
  }

  function render() {
    const head = document.getElementById('gradeHead');
    studentGradeBody.innerHTML = '';
    setSummary(null);

    if (!record) {
      emptyRow('No student account is signed in. Sign in with the account the '
        + 'administrator created for you.');
      if (head) head.textContent = 'School Year 2026–2027 · Second Quarter';
      return;
    }

    if (!record.class) {
      emptyRow('Your account is not in a classroom yet, so there are no grades to show. '
        + 'Ask the administrator to assign your section.');
      if (head) head.textContent = 'School Year 2026–2027 · Second Quarter';
      return;
    }

    const cls = record.class;
    const mine = savedGrades();
    const values = QUARTERS.map(quarter => mine[quarter]);
    const finalValue = finalOf(values);

    const row = el('tr');

    const subject = el('td', 'subj', cls.subject);
    subject.scope = 'row';
    row.append(subject);

    QUARTERS.forEach((quarter, index) => {
      const cell = el('td', 'score' + (quarter === 'q2' ? ' cur' : ''));
      if (isGrade(values[index])) {
        cell.textContent = String(values[index]);
      } else {
        cell.append(el('span', 'pending', '—'));
      }
      row.append(cell);
    });

    const finalCell = el('td', 'score');
    if (finalValue == null) {
      finalCell.append(el('span', 'pending', '—'));
    } else {
      finalCell.textContent = String(finalValue);
    }
    row.append(finalCell);

    studentGradeBody.append(row);

    if (head) {
      head.textContent = cls.section + ' · S.Y. 2026–2027 · Second Quarter';
    }
    setSummary(finalValue);
  }

  render();
}
