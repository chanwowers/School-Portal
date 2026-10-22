/* ------------------------------------------------------------------
   store.js — shared demo data for the Teacher and Admin portals.

   When the portal is served by XAMPP, MySQL is the shared copy: js/sync.js
   loads api/store.php into localStorage at the start of every page, and
   save() below pushes each change back to the database. Opened straight
   from disk (file://), or with Apache/MySQL stopped, localStorage alone
   keeps the demo working.

   DEMO ONLY: account passwords are kept in plain text so the administrator
   can view them, as requested for this prototype. A real school portal
   must hash passwords on the server and never send them back to the
   browser.

   Local key: sp_portal_store_v1
   Shape:
     {
       version: 1,
       admin:    { id, name, password },
       teachers: [{ id, name, password }],
       students: [{ id, name, password, sectionId }],
       classes:  [{ id, section, subject, room, time, days,
                    teacherId, studentIds: [] }]
     }
   ------------------------------------------------------------------ */

const SPStore = (function () {
  const KEY = 'sp_portal_store_v1';

  const ADMIN = {
    id: 'ADMIN-0001',
    name: 'School Administrator',
    password: 'admin123'
  };

  const TEACHERS = [
    { id: 'EMP-00231', name: 'Ms. C. Bautista', password: 'teacher123' },
    { id: 'EMP-00312', name: 'Mr. A. Villanueva', password: 'teacher123' }
  ];

  // same demo sections the teacher portal previously shipped, plus the
  // teacher each one belongs to. Students are seeded from these rosters.
  const CLASSES = [
    {
      id: 'math7-rizal',
      section: 'Grade 7 – Rizal',
      subject: 'Mathematics 7',
      room: 'Room 201',
      time: '7:30 – 8:30 AM',
      days: 'Mon–Fri',
      teacherId: 'EMP-00231',
      students: [
        { id: '2026-0701', name: 'Aguilar, Maria Sofia' },
        { id: '2026-0702', name: 'Bautista, John Paul' },
        { id: '2026-0703', name: 'Cruz, Angela Mae' },
        { id: '2026-0704', name: 'Dela Cruz, Rafael' },
        { id: '2026-0705', name: 'Garcia, Nicole Anne' },
        { id: '2026-0706', name: 'Hernandez, Miguel' },
        { id: '2026-0707', name: 'Iglesia, Bea Kristine' },
        { id: '2026-0708', name: 'Javier, Luis Antonio' },
        { id: '2026-0709', name: 'Mendoza, Patricia' },
        { id: '2026-0710', name: 'Navarro, Daniel' },
        { id: '2026-0711', name: 'Ocampo, Jasmine' },
        { id: '2026-0712', name: 'Reyes, Carlo Miguel' }
      ]
    },
    {
      id: 'math8-bonifacio',
      section: 'Grade 8 – Bonifacio',
      subject: 'Mathematics 8',
      room: 'Room 204',
      time: '9:30 – 10:30 AM',
      days: 'Mon–Fri',
      teacherId: 'EMP-00231',
      students: [
        { id: '2026-0801', name: 'Aquino, Bianca' },
        { id: '2026-0802', name: 'Bernardo, Joshua' },
        { id: '2026-0803', name: 'Castillo, Andrea' },
        { id: '2026-0804', name: 'Domingo, Mark Angelo' },
        { id: '2026-0805', name: 'Espinosa, Carla' },
        { id: '2026-0806', name: 'Fernandez, Paolo' },
        { id: '2026-0807', name: 'Gonzales, Rhea' },
        { id: '2026-0808', name: 'Lim, Kevin' },
        { id: '2026-0809', name: 'Manalo, Sophia' },
        { id: '2026-0810', name: 'Ortega, Gabriel' }
      ]
    },
    {
      id: 'math9-mabini',
      section: 'Grade 9 – Mabini',
      subject: 'Mathematics 9',
      room: 'Room 302',
      time: '1:00 – 2:00 PM',
      days: 'Mon–Fri',
      teacherId: 'EMP-00231',
      students: [
        { id: '2026-0901', name: 'Abad, Isabella' },
        { id: '2026-0902', name: 'Buenaventura, Nathan' },
        { id: '2026-0903', name: 'Cortez, Camille' },
        { id: '2026-0904', name: 'Dizon, Adrian' },
        { id: '2026-0905', name: 'Evangelista, Kyla' },
        { id: '2026-0906', name: 'Flores, Rafael' },
        { id: '2026-0907', name: 'Gutierrez, Marielle' },
        { id: '2026-0908', name: 'Herrera, Lorenzo' },
        { id: '2026-0909', name: 'Ignacio, Zoe' },
        { id: '2026-0910', name: 'Jimenez, Paolo' }
      ]
    }
  ];

  function seed() {
    const students = [];

    const classes = CLASSES.map(cls => {
      const studentIds = cls.students.map(student => {
        students.push({
          id: student.id,
          name: student.name,
          password: 'student123',
          sectionId: cls.id
        });
        return student.id;
      });

      return {
        id: cls.id,
        section: cls.section,
        subject: cls.subject,
        room: cls.room,
        time: cls.time,
        days: cls.days,
        teacherId: cls.teacherId,
        studentIds
      };
    });

    return {
      version: 1,
      admin: { ...ADMIN },
      teachers: TEACHERS.map(teacher => ({ ...teacher })),
      students,
      classes
    };
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) { /* storage blocked — edits last until reload */ }

    // XAMPP/MySQL copy (js/sync.js). Synchronous on purpose so a change is
    // in the database before the next page load reads it back.
    if (window.SPSync && typeof window.SPSync.push === 'function') {
      window.SPSync.push('api/store.php', data);
    }

    return data;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && Array.isArray(data.students) && Array.isArray(data.classes)) {
          return data;
        }
      }
    } catch (e) { /* unreadable — reseed below */ }

    return save(seed());
  }

  function currentUserId() {
    try {
      return (sessionStorage.getItem('sp_user_id')
           || sessionStorage.getItem('sp_student_id') || '').trim();
    } catch (e) {
      return '';
    }
  }

  function studentOf(data, studentId) {
    return data.students.find(student => student.id === studentId) || null;
  }

  function resolveClass(data, cls) {
    return {
      id: cls.id,
      section: cls.section,
      subject: cls.subject,
      room: cls.room,
      time: cls.time,
      days: cls.days,
      teacherId: cls.teacherId,
      students: cls.studentIds
        .map(id => studentOf(data, id))
        .filter(Boolean)
        .map(student => ({ id: student.id, name: student.name }))
    };
  }

  function assignStudent(studentId, classId) {
    const data = load();
    const student = studentOf(data, studentId);
    if (!student) return false;

    const target = classId
      ? data.classes.find(cls => cls.id === classId) || null
      : null;
    if (classId && !target) return false;

    // one classroom per student in this demo — moving removes them
    // from whichever roster they were on before
    data.classes.forEach(cls => {
      cls.studentIds = cls.studentIds.filter(id => id !== studentId);
    });

    if (target) target.studentIds.push(studentId);
    student.sectionId = target ? target.id : '';

    save(data);
    return true;
  }

  function assignTeacher(classId, teacherId) {
    const data = load();
    const target = data.classes.find(cls => cls.id === classId);
    if (!target) return false;

    const teacher = data.teachers.find(
      item => item.id.toUpperCase() === String(teacherId || '').toUpperCase()
    );
    if (teacherId && !teacher) return false;

    target.teacherId = teacher ? teacher.id : '';
    save(data);
    return true;
  }

  function addStudent(record) {
    const data = load();
    const id = String(record.id || '').trim();
    const name = String(record.name || '').trim();
    const password = String(record.password || '');

    if (!id || !name || password.length < 6) {
      return { ok: false, message: 'Enter an ID, a full name and a password of at least 6 characters.' };
    }
    if (studentOf(data, id)) {
      return { ok: false, message: 'That student ID is already on file.' };
    }

    data.students.push({ id, name, password, sectionId: '' });
    save(data);

    if (record.classId) assignStudent(id, record.classId);
    return { ok: true };
  }

  function removeStudent(studentId) {
    const data = load();
    data.students = data.students.filter(student => student.id !== studentId);
    data.classes.forEach(cls => {
      cls.studentIds = cls.studentIds.filter(id => id !== studentId);
    });
    save(data);
    return true;
  }

  function setPassword(studentId, password) {
    const data = load();
    const student = studentOf(data, studentId);
    if (!student) return false;
    student.password = password;
    save(data);
    return true;
  }

  /* ---------- student sign-in and record ---------- */
  /* The student portal reads everything from the same records the
     administrator edits on AdminStudents.html / AdminClasses.html, so an
     account the admin creates (or moves to another section) works there
     without a separate copy of the data. */

  function findStudent(data, studentId) {
    const wanted = String(studentId || '').trim().toUpperCase();
    if (!wanted) return null;
    return data.students.find(student => student.id.toUpperCase() === wanted) || null;
  }

  function loginStudent(studentId, password) {
    const data = load();
    const student = findStudent(data, studentId);

    if (!student) {
      return {
        ok: false,
        message: 'No student account found for that ID. Ask the administrator to create one.'
      };
    }
    if (student.password !== password) {
      return { ok: false, message: 'Incorrect password for that Student ID.' };
    }
    return { ok: true, student };
  }

  function loginTeacher(teacherId, password) {
    const data = load();
    const wanted = String(teacherId || '').trim().toUpperCase();
    const teacher = data.teachers.find(item => item.id.toUpperCase() === wanted);
    if (!teacher) {
      return {
        ok: false,
        message: 'No teacher account found for that Employee ID. Ask the administrator to create one.'
      };
    }
    if (teacher.password !== password) {
      return { ok: false, message: 'Incorrect password for that Employee ID.' };
    }
    return { ok: true, teacher };
  }

  /* Everything the student portal needs in one call: the account, the
     classroom it was placed in, and that classroom's teacher. */
  function recordForStudent(studentId) {
    const data = load();
    const student = findStudent(data, studentId) || studentOf(data, studentId);
    if (!student) return null;

    const cls = data.classes.find(item => item.studentIds.includes(student.id)) || null;
    const teacher = cls
      ? data.teachers.find(item => item.id === cls.teacherId) || null
      : null;

    return {
      student: {
        id: student.id,
        name: student.name,
        sectionId: student.sectionId || ''
      },
      class: cls ? resolveClass(data, cls) : null,
      teacher: teacher ? { id: teacher.id, name: teacher.name } : null
    };
  }

  return {
    load,
    save,
    currentUserId,
    admin: () => load().admin,
    teachers: () => load().teachers,
    students: () => load().students,
    classes: () => load().classes,
    teacherById(id) {
      const wanted = String(id || '').toUpperCase();
      return load().teachers.find(teacher => teacher.id.toUpperCase() === wanted) || null;
    },
    studentById: id => studentOf(load(), id),
    allClasses() {
      const data = load();
      return data.classes.map(cls => resolveClass(data, cls));
    },
    classesForTeacher(teacherId) {
      const wanted = String(teacherId || '').toUpperCase();
      const data = load();
      return data.classes
        .filter(cls => String(cls.teacherId || '').toUpperCase() === wanted)
        .map(cls => resolveClass(data, cls));
    },
    assignStudent,
    assignTeacher,
    addStudent,
    removeStudent,
    setPassword,
    loginStudent,
    loginTeacher,
    recordForStudent
  };
})();
