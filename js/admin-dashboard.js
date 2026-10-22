/* ------------------------------------------------------------------
   admin-dashboard.js — figures and the class overview on
   AdminDashboard.html. Data comes from js/store.js.
   ------------------------------------------------------------------ */

const adminStatStudents = document.getElementById('statStudents');

if (adminStatStudents) {
  const students = SPStore.students();
  const teachers = SPStore.teachers();
  const classes = SPStore.allClasses();

  const placed = new Set();
  classes.forEach(cls => cls.students.forEach(student => placed.add(student.id)));
  const unassigned = students.filter(student => !placed.has(student.id)).length;

  const setText = (id, value) => {
    const node = document.getElementById(id);
    if (node) node.textContent = String(value);
  };

  setText('statStudents', students.length);
  setText('statTeachers', teachers.length);
  setText('statClasses', classes.length);
  setText('statUnassigned', unassigned);

  const tbody = document.getElementById('classTableBody');

  if (tbody) {
    if (classes.length === 0) {
      const row = adminEl('tr');
      const cell = adminEl('td', 'empty-cell', 'No classrooms on file yet.');
      cell.colSpan = 4;
      row.append(cell);
      tbody.append(row);
    } else {
      classes.forEach(cls => {
        const row = adminEl('tr');

        const section = adminEl('td', 'admin-strong', cls.section);
        section.scope = 'row';

        const subject = adminEl('td', '', cls.subject);
        const teacher = adminEl('td', '', adminTeacherName(cls.teacherId));
        const count = adminEl('td', 'admin-num',
          cls.students.length + (cls.students.length === 1 ? ' student' : ' students'));

        row.append(section, subject, teacher, count);
        tbody.append(row);
      });
    }
  }
}
