/* ------------------------------------------------------------------
   teacher-classes.js — renders the sections (classes) the teacher
   manages on TeacherClasses.html. Section and student data comes from
   js/teacher.js (demo records).
   ------------------------------------------------------------------ */

const classGrid = document.getElementById('classGrid');

if (classGrid) {
  if (TC_CLASSES.length === 0) {
    classGrid.append(tcEl('p', 'empty-cell',
      'No sections are assigned to you yet. Ask the administrator to assign your classes.'));
  }

  TC_CLASSES.forEach(cls => {
    const card = tcEl('article', 'class-card');

    const top = tcEl('div', 'class-top');
    const heading = tcEl('div');
    // the section is the heading: it is what the teacher manages and what
    // the Registrar posts, with the subject taught in it underneath
    heading.append(tcEl('h2', 'class-section', cls.section));
    heading.append(tcEl('p', 'class-subject', cls.subject));
    top.append(heading);
    top.append(tcEl('span', 'class-count', cls.students.length + ' students'));
    card.append(top);

    const meta = tcEl('p', 'class-meta');
    meta.append(tcEl('span', '', cls.days + ' · ' + cls.time));
    meta.append(tcEl('span', '', cls.room));
    card.append(meta);

    const actions = tcEl('div', 'class-actions');

    const attendance = tcEl('a', 'btn btn-sage btn-sm', 'Take attendance');
    attendance.href = 'TeacherAttendance.html?class=' + encodeURIComponent(cls.id);

    const grades = tcEl('a', 'btn btn-ghost btn-sm', 'Open grade book');
    grades.href = 'TeacherGrades.html?class=' + encodeURIComponent(cls.id);

    actions.append(attendance, grades);
    card.append(actions);

    // roster stays collapsed until the teacher opens it
    const roster = tcEl('details', 'roster');
    const summary = tcEl('summary', '', 'Students (' + cls.students.length + ')');
    roster.append(summary);

    const scroll = tcEl('div', 'table-scroll');
    const table = tcEl('table');

    const thead = tcEl('thead');
    const headRow = tcEl('tr');
    const thName = tcEl('th', '', 'Student');
    thName.scope = 'col';
    const thId = tcEl('th', '', 'Student ID');
    thId.scope = 'col';
    headRow.append(thName, thId);
    thead.append(headRow);

    const tbody = tcEl('tbody');
    cls.students.forEach(student => {
      const row = tcEl('tr');
      row.append(tcEl('td', '', student.name), tcEl('td', 'id', student.id));
      tbody.append(row);
    });

    table.append(thead, tbody);
    scroll.append(table);
    roster.append(scroll);
    card.append(roster);

    classGrid.append(card);
  });

  const classCount = document.getElementById('classCount');
  if (classCount) {
    const total = TC_CLASSES.reduce((sum, c) => sum + c.students.length, 0);
    classCount.textContent = TC_CLASSES.length
      + (TC_CLASSES.length === 1 ? ' section · ' : ' sections · ')
      + total + (total === 1 ? ' student' : ' students');
  }
}
