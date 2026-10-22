/* ------------------------------------------------------------------
   admin-students.js — student account management on AdminStudents.html.

   The administrator can add and remove accounts, see (and reset) each
   demo password, and move a student between classrooms. Every change is
   written to js/store.js immediately, so the teacher rosters update too.

   DEMO ONLY: passwords are plain text in localStorage. Never build a
   real portal this way.
   ------------------------------------------------------------------ */

const studentBody = document.getElementById('studentBody');

if (studentBody) {
  const searchInput = document.getElementById('studentSearch');
  const statusBox = document.getElementById('studentStatus');
  const countLabel = document.getElementById('studentCount');

  const addForm = document.getElementById('addStudentForm');
  const newId = document.getElementById('newId');
  const newName = document.getElementById('newName');
  const newPass = document.getElementById('newPass');
  const newClass = document.getElementById('newClass');

  // passwords start masked; this set remembers which rows were revealed
  // while the page is open (nothing is stored about what was viewed)
  const revealed = new Set();

  function placedIds(classes) {
    const placed = new Set();
    classes.forEach(cls => cls.studentIds.forEach(id => placed.add(id)));
    return placed;
  }

  function renderClassPicker(classes) {
    newClass.innerHTML = '';

    const none = document.createElement('option');
    none.value = '';
    none.textContent = 'No classroom yet';
    newClass.append(none);

    classes.forEach(cls => {
      const option = document.createElement('option');
      option.value = cls.id;
      option.textContent = cls.section + ' · ' + cls.subject;
      newClass.append(option);
    });
  }

  function updateSummary(students, classes) {
    const placed = placedIds(classes);

    const setText = (id, value) => {
      const node = document.getElementById(id);
      if (node) node.textContent = String(value);
    };

    setText('sumStudents', students.length);
    setText('sumAssigned', students.filter(s => placed.has(s.id)).length);
    setText('sumUnassigned', students.filter(s => !placed.has(s.id)).length);
    setText('sumClasses', classes.length);

    if (countLabel) {
      countLabel.textContent = students.length
        + (students.length === 1 ? ' account' : ' accounts')
        + ' · ' + classes.length + (classes.length === 1 ? ' classroom' : ' classrooms');
    }
  }

  function render() {
    const students = SPStore.students();
    const classes = SPStore.classes();
    const query = (searchInput.value || '').trim().toLowerCase();

    const filtered = students.filter(student => {
      if (!query) return true;
      return student.name.toLowerCase().includes(query)
          || student.id.toLowerCase().includes(query);
    });

    studentBody.innerHTML = '';

    if (filtered.length === 0) {
      const row = adminEl('tr');
      const cell = adminEl('td', 'empty-cell',
        students.length === 0 ? 'No student accounts yet. Add one above.'
                              : 'No students match that search.');
      cell.colSpan = 5;
      row.append(cell);
      studentBody.append(row);
    }

    filtered.forEach(student => {
      const row = adminEl('tr');
      row.append(adminEl('td', 'admin-strong', student.id));
      row.append(adminEl('td', '', student.name));

      /* classroom picker — moving a student removes them from their
         previous section, so no one is on two rosters at once */
      const classCell = adminEl('td');
      const classSelect = document.createElement('select');
      classSelect.className = 'control control-sm';
      classSelect.setAttribute('aria-label', 'Classroom for ' + student.name);

      const noneOption = document.createElement('option');
      noneOption.value = '';
      noneOption.textContent = '— Not assigned —';
      classSelect.append(noneOption);

      classes.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls.id;
        option.textContent = cls.section;
        if (cls.studentIds.includes(student.id)) option.selected = true;
        classSelect.append(option);
      });

      classSelect.addEventListener('change', () => {
        SPStore.assignStudent(student.id, classSelect.value);
        const target = classes.find(cls => cls.id === classSelect.value);
        adminStatus(statusBox,
          target
            ? student.name + ' moved to ' + target.section + '.'
            : student.name + ' is no longer in a classroom.',
          'ok');
        render();
      });

      classCell.append(classSelect);
      row.append(classCell);

      /* password — masked until the administrator reveals it */
      const passCell = adminEl('td', 'pw-cell');
      const shown = revealed.has(student.id);
      const value = adminEl('span', 'pw-value', shown ? student.password : '••••••••');
      value.title = shown ? 'Demo password' : 'Hidden';

      const toggle = adminEl('button', 'btn btn-ghost btn-xs', shown ? 'Hide' : 'Show');
      toggle.type = 'button';
      toggle.setAttribute('aria-label',
        (shown ? 'Hide' : 'Show') + ' password for ' + student.name + ' (' + student.id + ')');
      toggle.addEventListener('click', () => {
        if (revealed.has(student.id)) revealed.delete(student.id);
        else revealed.add(student.id);
        render();
      });

      passCell.append(value, toggle);
      row.append(passCell);

      const actions = adminEl('td', 'row-actions');

      const reset = adminEl('button', 'btn btn-ghost btn-xs', 'Reset');
      reset.type = 'button';
      reset.setAttribute('aria-label', 'Reset password for ' + student.name);
      reset.addEventListener('click', () => {
        const password = adminRandomPassword();
        SPStore.setPassword(student.id, password);
        revealed.add(student.id);
        render();
        adminStatus(statusBox, 'New password for ' + student.name + ': ' + password, 'ok');
      });

      const remove = adminEl('button', 'btn btn-danger btn-xs', 'Remove');
      remove.type = 'button';
      remove.setAttribute('aria-label', 'Remove account for ' + student.name);
      remove.addEventListener('click', () => {
        const sure = window.confirm('Remove ' + student.name + ' (' + student.id + ')?\n'
          + 'This also takes them off their class roster and cannot be undone.');
        if (!sure) return;
        SPStore.removeStudent(student.id);
        revealed.delete(student.id);
        render();
        adminStatus(statusBox, student.name + ' was removed.', 'ok');
      });

      actions.append(reset, remove);
      row.append(actions);

      studentBody.append(row);
    });

    updateSummary(students, classes);
  }

  if (searchInput) {
    searchInput.addEventListener('input', render);
  }

  if (addForm) {
    addForm.addEventListener('submit', event => {
      event.preventDefault();

      const result = SPStore.addStudent({
        id: newId.value,
        name: newName.value,
        password: newPass.value,
        classId: newClass.value
      });

      if (!result.ok) {
        adminStatus(statusBox, result.message, 'error');
        if (!newId.value.trim()) newId.focus();
        else if (!newName.value.trim()) newName.focus();
        else newPass.focus();
        return;
      }

      const added = newId.value.trim();
      addForm.reset();
      renderClassPicker(SPStore.classes());
      render();
      adminStatus(statusBox, 'Student ' + added + ' added.', 'ok');
      newId.focus();
    });
  }

  renderClassPicker(SPStore.classes());
  render();
}
