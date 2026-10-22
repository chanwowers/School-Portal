/* ------------------------------------------------------------------
   teacher-grades.js — the editable grade book on TeacherGrades.html.

   Grades are stored per teacher, class and student in js/teacher.js:
   data.grades[classId][studentId] = { q1, q2, q3, q4 }.
   The final grade is computed only when all four quarters are filled.
   ------------------------------------------------------------------ */

const gradeClassSelect = document.getElementById('classSelect');
const gradeBody = document.getElementById('gradeBody');
const gradeStatus = document.getElementById('gradeStatus');
const exportBtn = document.getElementById('exportCsv');
const saveGradesBtn = document.getElementById('saveGrades');

if (gradeBody) {
  const data = tcLoad();
  const QUARTERS = ['q1', 'q2', 'q3', 'q4'];
  const QUARTER_LABELS = { q1: '1st Quarter', q2: '2nd Quarter', q3: '3rd Quarter', q4: '4th Quarter' };

  TC_CLASSES.forEach(cls => {
    const option = document.createElement('option');
    option.value = cls.id;
    option.textContent = cls.subject + ' · ' + cls.section;
    gradeClassSelect.append(option);
  });

  const requested = new URLSearchParams(window.location.search).get('class');
  if (requested && TC_CLASSES.some(c => c.id === requested)) {
    gradeClassSelect.value = requested;
  }

  function selectedClass() {
    return tcClass(gradeClassSelect.value);
  }

  function classGrades(cls, create) {
    if (!data.grades[cls.id]) {
      if (!create) return {};
      data.grades[cls.id] = {};
    }
    return data.grades[cls.id];
  }

  function studentGrade(cls, studentId, create) {
    const grades = classGrades(cls, create);
    if (!grades[studentId]) {
      if (!create) return {};
      grades[studentId] = { q1: '', q2: '', q3: '', q4: '' };
    }
    return grades[studentId];
  }

  function parseGrade(raw) {
    const text = String(raw).trim();
    if (text === '') return { value: '', valid: true };
    const number = Number(text);
    const valid = Number.isInteger(number) && number >= 60 && number <= 100;
    return { value: valid ? number : text, valid };
  }

  function finalOf(values) {
    const numbers = values.map(v => Number(v));
    if (numbers.length !== 4 || numbers.some(n => !Number.isInteger(n) || n < 60 || n > 100)) {
      return null;
    }
    return Math.round(numbers.reduce((sum, n) => sum + n, 0) / numbers.length);
  }

  function setStatus(message, kind) {
    gradeStatus.textContent = message;
    gradeStatus.className = 'status' + (kind ? ' ' + kind : '');
  }

  function finalCell(finalValue) {
    const cell = tcEl('td', 'final');
    if (finalValue == null) {
      cell.append(tcEl('span', 'pending', '—'));
    } else {
      cell.textContent = String(finalValue);
    }
    return cell;
  }

  function rowValues(row) {
    return Array.from(row.querySelectorAll('.grade-input')).map(input => input.value);
  }

  function updateFinal(row) {
    const cell = row.querySelector('td.final');
    if (!cell) return;
    cell.innerHTML = '';
    const finalValue = finalOf(rowValues(row));
    if (finalValue == null) {
      cell.append(tcEl('span', 'pending', '—'));
    } else {
      cell.textContent = String(finalValue);
    }
  }

  function renderRoster() {
    const cls = selectedClass();

    if (!cls) {
      gradeBody.innerHTML = '';
      const row = tcEl('tr');
      const cell = tcEl('td', 'empty-cell',
        'No classes are assigned to you yet. Ask the administrator to assign your sections.');
      cell.colSpan = 6;
      row.append(cell);
      gradeBody.append(row);
      setStatus('');
      return;
    }

    const grades = classGrades(cls, false);

    gradeBody.innerHTML = '';
    setStatus('');

    cls.students.forEach(student => {
      const saved = grades[student.id] || {};
      const row = tcEl('tr');
      row.dataset.studentId = student.id;

      const name = tcEl('td', '', student.name);
      name.scope = 'row';
      row.append(name, tcEl('td', 'att-id', student.id));

      QUARTERS.forEach(quarter => {
        const cell = tcEl('td', quarter === 'q2' ? 'cur' : '');
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '60';
        input.max = '100';
        input.step = '1';
        input.inputMode = 'numeric';
        input.className = 'grade-input';
        input.dataset.quarter = quarter;
        input.value = saved[quarter] == null ? '' : String(saved[quarter]);
        input.setAttribute('aria-label', student.name + ' · ' + QUARTER_LABELS[quarter]);
        cell.append(input);
        row.append(cell);
      });

      row.append(finalCell(finalOf(QUARTERS.map(q => saved[q]))));
      gradeBody.append(row);
    });
  }

  /* live final while typing; persistence waits for change so a
     half-typed number is never saved */
  gradeBody.addEventListener('input', event => {
    if (!event.target.matches('.grade-input')) return;
    const row = event.target.closest('tr');
    if (row) updateFinal(row);
  });

  gradeBody.addEventListener('change', event => {
    const input = event.target;
    if (!input.matches('.grade-input')) return;

    const row = input.closest('tr');
    const parsed = parseGrade(input.value);

    if (!parsed.valid) {
      input.setAttribute('aria-invalid', 'true');
      setStatus('Grades must be whole numbers from 60 to 100.', 'error');
      input.focus();
      return;
    }

    input.removeAttribute('aria-invalid');
    const cls = selectedClass();
    if (!cls) return;

    const grade = studentGrade(cls, row.dataset.studentId, true);
    grade[input.dataset.quarter] = parsed.value;

    updateFinal(row);
    tcSave(data);
    setStatus('Saved automatically.', 'ok');
  });

  saveGradesBtn.addEventListener('click', () => {
    const cls = selectedClass();
    if (!cls) return;

    const inputs = Array.from(gradeBody.querySelectorAll('.grade-input'));
    const invalid = inputs.find(input => !parseGrade(input.value).valid);

    if (invalid) {
      inputs.forEach(input => {
        if (!parseGrade(input.value).valid) input.setAttribute('aria-invalid', 'true');
      });
      setStatus('Fix the highlighted grades (whole numbers from 60 to 100) before saving.', 'error');
      invalid.focus();
      return;
    }

    inputs.forEach(input => {
      input.removeAttribute('aria-invalid');
    });

    inputs.forEach(input => {
      const row = input.closest('tr');
      const grade = studentGrade(cls, row.dataset.studentId, true);
      grade[input.dataset.quarter] = parseGrade(input.value).value;
    });

    tcSave(data);
    setStatus('Grades saved for ' + cls.section + '.', 'ok');
  });

  exportBtn.addEventListener('click', () => {
    const cls = selectedClass();
    if (!cls) return;

    const grades = classGrades(cls, false);

    const escape = value => {
      const text = String(value == null ? '' : value);
      return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
    };

    const rows = [
      ['Student', 'Student ID', 'Q1', 'Q2', 'Q3', 'Q4', 'Final']
    ];

    cls.students.forEach(student => {
      const grade = grades[student.id] || {};
      const values = QUARTERS.map(q => grade[q] == null ? '' : grade[q]);
      rows.push([
        student.name,
        student.id,
        values[0], values[1], values[2], values[3],
        finalOf(values) == null ? '' : finalOf(values)
      ]);
    });

    const csv = '﻿' + rows.map(row => row.map(escape).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'grades-' + cls.section.replace(/[^\w]+/g, '-').toLowerCase() + '.csv';
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setStatus('CSV exported for ' + cls.section + '.', 'ok');
  });

  gradeClassSelect.addEventListener('change', renderRoster);

  renderRoster();
}
