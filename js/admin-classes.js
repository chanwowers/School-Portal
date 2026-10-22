/* ------------------------------------------------------------------
   admin-classes.js — classroom management on AdminClasses.html.

   For each section the administrator can change the assigned teacher
   and add or remove students. A student belongs to one classroom at a
   time, so adding them here takes them off their previous roster.
   Everything is written to js/store.js, which the Teacher pages read.
   ------------------------------------------------------------------ */

const classroomList = document.getElementById('classroomList');

if (classroomList) {
  const statusBox = document.getElementById('classStatus');
  const countLabel = document.getElementById('classCount');

  function render() {
    const classes = SPStore.allClasses();
    const teachers = SPStore.teachers();
    const students = SPStore.students();

    classroomList.innerHTML = '';

    classes.forEach(cls => {
      const card = adminEl('article', 'class-card');

      const top = adminEl('div', 'class-top');
      const heading = adminEl('div');
      heading.append(adminEl('h2', 'class-section', cls.section));
      heading.append(adminEl('p', 'class-subject', cls.subject));
      top.append(heading);
      top.append(adminEl('span', 'class-count',
        cls.students.length + (cls.students.length === 1 ? ' student' : ' students')));
      card.append(top);

      const meta = adminEl('p', 'class-meta');
      meta.append(adminEl('span', '', cls.days + ' · ' + cls.time));
      meta.append(adminEl('span', '', cls.room));
      card.append(meta);

      /* ---------- assigned teacher ---------- */
      const teacherRow = adminEl('div', 'class-teacher');
      const teacherLabel = adminEl('label', '', 'Assigned teacher');
      teacherLabel.htmlFor = 'teacher-' + cls.id;

      const teacherSelect = document.createElement('select');
      teacherSelect.className = 'control';
      teacherSelect.id = 'teacher-' + cls.id;

      const unassigned = document.createElement('option');
      unassigned.value = '';
      unassigned.textContent = '— Unassigned —';
      teacherSelect.append(unassigned);

      teachers.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher.id;
        option.textContent = teacher.name + ' (' + teacher.id + ')';
        if (teacher.id === cls.teacherId) option.selected = true;
        teacherSelect.append(option);
      });

      teacherSelect.addEventListener('change', () => {
        const teacher = SPStore.teacherById(teacherSelect.value);
        SPStore.assignTeacher(cls.id, teacherSelect.value);
        adminStatus(statusBox,
          teacher
            ? cls.section + ' is now handled by ' + teacher.name + '.'
            : cls.section + ' has no assigned teacher.',
          'ok');
        render();
      });

      teacherRow.append(teacherLabel, teacherSelect);
      card.append(teacherRow);

      /* ---------- roster ---------- */
      const roster = adminEl('details', 'roster');
      roster.open = true;
      roster.append(adminEl('summary', '', 'Students (' + cls.students.length + ')'));

      if (cls.students.length === 0) {
        roster.append(adminEl('p', 'roster-empty', 'No students in this section yet.'));
      } else {
        const scroll = adminEl('div', 'table-scroll');
        const table = document.createElement('table');
        const tbody = document.createElement('tbody');

        cls.students.forEach(student => {
          const row = adminEl('tr');
          row.append(adminEl('td', '', student.name));
          row.append(adminEl('td', 'id', student.id));

          const actions = adminEl('td', 'row-actions');
          const remove = adminEl('button', 'btn btn-ghost btn-xs', 'Remove');
          remove.type = 'button';
          remove.setAttribute('aria-label',
            'Remove ' + student.name + ' from ' + cls.section);
          remove.addEventListener('click', () => {
            SPStore.assignStudent(student.id, '');
            render();
            adminStatus(statusBox,
              student.name + ' removed from ' + cls.section + '.', 'ok');
          });
          actions.append(remove);
          row.append(actions);

          tbody.append(row);
        });

        table.append(tbody);
        scroll.append(table);
        roster.append(scroll);
      }

      /* ---------- add a student ---------- */
      const available = students.filter(
        student => !cls.students.some(member => member.id === student.id)
      );

      const addRow = adminEl('div', 'roster-add');
      const picker = document.createElement('select');
      picker.className = 'control';
      picker.setAttribute('aria-label', 'Student to add to ' + cls.section);

      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = available.length
        ? '— Choose a student —'
        : 'No other students available';
      picker.append(placeholder);

      available.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = student.name + ' (' + student.id + ')';
        picker.append(option);
      });

      if (available.length === 0) picker.disabled = true;

      const addBtn = adminEl('button', 'btn btn-sage btn-sm', 'Add to class');
      addBtn.type = 'button';
      addBtn.disabled = available.length === 0;

      addBtn.addEventListener('click', () => {
        if (!picker.value) {
          adminStatus(statusBox, 'Choose a student first.', 'error');
          return;
        }

        const student = students.find(item => item.id === picker.value);
        SPStore.assignStudent(picker.value, cls.id);
        render();
        adminStatus(statusBox,
          (student ? student.name : 'Student') + ' added to ' + cls.section + '.', 'ok');
      });

      addRow.append(picker, addBtn);
      roster.append(addRow);

      card.append(roster);
      classroomList.append(card);
    });

    if (classes.length === 0) {
      classroomList.append(adminEl('p', 'empty-cell', 'No classrooms on file yet.'));
    }

    const placed = new Set();
    classes.forEach(cls => cls.students.forEach(student => placed.add(student.id)));

    if (countLabel) {
      countLabel.textContent = classes.length
        + (classes.length === 1 ? ' classroom · ' : ' classrooms · ')
        + placed.size + (placed.size === 1 ? ' student placed' : ' students placed');
    }
  }

  render();
}
