/* ------------------------------------------------------------------
   teacher-attendance.js — daily attendance on TeacherAttendance.html.

   Attendance is stored per teacher (js/teacher.js), then per class and
   date: data.attendance[classId][YYYY-MM-DD][studentId] = status.
   Every change is saved to localStorage immediately; the Save button
   is there so the teacher gets a clear confirmation.
   ------------------------------------------------------------------ */

const attClassSelect = document.getElementById('classSelect');
const attDateInput = document.getElementById('dateInput');
const attBody = document.getElementById('attBody');
const attSummary = document.getElementById('attSummary');
const attStatus = document.getElementById('attStatus');
const markAllBtn = document.getElementById('markAll');
const saveBtn = document.getElementById('saveAttendance');

if (attBody) {
  const data = tcLoad();
  const STATUSES = ['present', 'late', 'absent', 'excused'];
  const LABELS = { present: 'Present', late: 'Late', absent: 'Absent', excused: 'Excused' };

  // class picker
  TC_CLASSES.forEach(cls => {
    const option = document.createElement('option');
    option.value = cls.id;
    option.textContent = cls.subject + ' · ' + cls.section;
    attClassSelect.append(option);
  });

  // ?class=math7-rizal lets the class cards link straight to a roster
  const requested = new URLSearchParams(window.location.search).get('class');
  if (requested && TC_CLASSES.some(c => c.id === requested)) {
    attClassSelect.value = requested;
  }

  attDateInput.value = tcTodayISO();

  function selectedClass() {
    return tcClass(attClassSelect.value);
  }

  function dayData(cls, date, create) {
    const attendance = data.attendance;
    if (!attendance[cls.id]) {
      if (!create) return {};
      attendance[cls.id] = {};
    }
    if (!attendance[cls.id][date]) {
      if (!create) return {};
      attendance[cls.id][date] = {};
    }
    return attendance[cls.id][date];
  }

  function setStatus(message, kind) {
    attStatus.textContent = message;
    attStatus.className = 'status' + (kind ? ' ' + kind : '');
  }

  function renderSummary(cls, date) {
    const day = dayData(cls, date, false);
    const counts = { present: 0, late: 0, absent: 0, excused: 0, unmarked: 0 };

    cls.students.forEach(student => {
      const value = day[student.id];
      if (STATUSES.includes(value)) counts[value] += 1;
      else counts.unmarked += 1;
    });

    attSummary.innerHTML = '';

    STATUSES.forEach(status => {
      const chip = tcEl('span', 'att-chip ' + status);
      chip.append(document.createTextNode(LABELS[status] + ' '));
      chip.append(tcEl('b', '', String(counts[status])));
      attSummary.append(chip);
    });

    const unmarked = tcEl('span', 'att-chip');
    unmarked.append(document.createTextNode('Unmarked '));
    unmarked.append(tcEl('b', '', String(counts.unmarked)));
    attSummary.append(unmarked);
  }

  function renderRoster() {
    const cls = selectedClass();

    if (!cls) {
      attBody.innerHTML = '';
      const row = tcEl('tr');
      const cell = tcEl('td', 'empty-cell',
        'No classes are assigned to you yet. Ask the administrator to assign your sections.');
      cell.colSpan = 3;
      row.append(cell);
      attBody.append(row);
      attSummary.innerHTML = '';
      return;
    }

    const date = attDateInput.value || tcTodayISO();
    const day = dayData(cls, date, false);

    attBody.innerHTML = '';

    cls.students.forEach(student => {
      const row = tcEl('tr');

      const name = tcEl('td', 'att-name', student.name);
      const id = tcEl('td', 'att-id', student.id);
      const actions = tcEl('td', 'att-actions');

      const seg = tcEl('div', 'seg');
      seg.setAttribute('role', 'group');
      seg.setAttribute('aria-label', 'Attendance for ' + student.name);

      STATUSES.forEach(status => {
        const label = tcEl('label');

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'att-' + cls.id + '-' + student.id;
        input.value = status;
        input.checked = day[student.id] === status;

        const text = tcEl('span', '', LABELS[status]);
        label.append(input, text);
        seg.append(label);
      });

      actions.append(seg);
      row.append(name, id, actions);
      attBody.append(row);
    });

    renderSummary(cls, date);
  }

  function persist(message) {
    tcSave(data);
    setStatus(message, 'ok');
  }

  /* one listener for the whole roster; the radios are rebuilt on
     every class/date change, so per-row listeners would leak */
  attBody.addEventListener('change', event => {
    const input = event.target;
    if (!input.matches('input[type="radio"]')) return;

    const cls = selectedClass();
    if (!cls) return;

    const date = attDateInput.value || tcTodayISO();
    const row = input.closest('tr');
    const studentName = row ? row.querySelector('.att-name').textContent : 'student';
    const studentId = row ? row.querySelector('.att-id').textContent : '';

    if (!studentId) return;

    const day = dayData(cls, date, true);
    day[studentId] = input.value;

    renderSummary(cls, date);
    persist('Saved ' + studentName + ' as ' + LABELS[input.value].toLowerCase() + '.');
  });

  markAllBtn.addEventListener('click', () => {
    const cls = selectedClass();
    if (!cls) return;

    const date = attDateInput.value || tcTodayISO();
    const day = dayData(cls, date, true);

    cls.students.forEach(student => { day[student.id] = 'present'; });

    renderRoster();
    persist('Marked all ' + cls.students.length + ' students present for ' + tcDateLabel(date) + '.');
  });

  saveBtn.addEventListener('click', () => {
    const cls = selectedClass();
    if (!cls) return;

    const date = attDateInput.value || tcTodayISO();
    const day = dayData(cls, date, false);
    const unmarked = cls.students.filter(s => !STATUSES.includes(day[s.id])).length;

    const message = unmarked === 0
      ? 'Attendance saved for ' + cls.section + ' · ' + tcDateLabel(date) + '.'
      : 'Saved, but ' + unmarked + ' student' + (unmarked === 1 ? ' is' : 's are')
        + ' still unmarked for ' + tcDateLabel(date) + '.';

    persist(message);
  });

  attClassSelect.addEventListener('change', () => {
    renderRoster();
    setStatus('');
  });

  attDateInput.addEventListener('change', () => {
    // a cleared date field falls back to today, matching what gets saved
    if (!attDateInput.value) attDateInput.value = tcTodayISO();
    renderRoster();
    setStatus('');
  });

  renderRoster();
}
