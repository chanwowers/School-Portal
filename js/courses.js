/* ------------------------------------------------------------------
   courses.js — course list for Courses.html.

   The class list is NOT hard-coded: it is built from the signed-in
   student's record in js/store.js, which the administrator edits. A
   student who has not been placed in a section sees an empty state
   instead of a sample list.

   Assessments are left EMPTY on purpose: teachers will add assessments
   from the Teacher Portal once that side is connected. This page already
   knows how to render assessments (type, status, due date and score), so
   once real records are available they will appear without changing the
   layout.
   ------------------------------------------------------------------ */

const SP_COURSES = (function () {
  const record = typeof SP_STUDENT_RECORD !== 'undefined' ? SP_STUDENT_RECORD : null;
  if (!record || !record.class) return [];

  const cls = record.class;
  const code = cls.subject.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() || 'SUBJ';

  return [{
    code,
    name: cls.subject,
    teacher: record.teacher ? record.teacher.name : 'Teacher not assigned yet',
    room: cls.room,
    schedule: cls.days + ', ' + cls.time,
    assessments: []
  }];
})();

const SP_COURSE_RECORD = typeof SP_STUDENT_RECORD !== 'undefined' ? SP_STUDENT_RECORD : null;

function spCourseEmptyMessage() {
  return SP_COURSE_RECORD
    ? 'You are not assigned to a classroom yet. Ask the administrator to place you in a section.'
    : 'No student account is signed in. Sign in with the account the administrator created for you.';
}

const TYPE_LABELS = {
  quiz: 'Quiz',
  assignment: 'Assignment',
  project: 'Project',
  performance: 'Performance Task',
  exam: 'Exam'
};

const STATUS_LABELS = {
  pending: 'To do',
  submitted: 'Submitted',
  graded: 'Graded'
};

const TONES = ['', 'sage', 'gold', 'plum'];

const courseList = document.getElementById('courseList');

if (courseList) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let filter = 'all';

  function dateAt(offset) {
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
  }

  function shortDate(date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function dateText(assessment) {
    if (assessment.status === 'pending') {
      if (assessment.offset === 0) return 'Due today';
      if (assessment.offset === 1) return 'Due tomorrow';
      return 'Due ' + shortDate(dateAt(assessment.offset));
    }

    const done = assessment.done == null ? assessment.offset : assessment.done;
    return shortDate(dateAt(done));
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function assessmentEl(assessment) {
    const item = el('article', 'assess');
    const body = el('div', 'assess-main');

    const top = el('div', 'assess-top');
    top.append(el('span', 'assess-type type-' + assessment.kind, TYPE_LABELS[assessment.kind]));
    top.append(el('h3', 'assess-title', assessment.title));

    body.append(top);
    body.append(el('p', 'assess-desc', assessment.description));

    const side = el('div', 'assess-side');
    side.append(el('span', 'assess-status ' + assessment.status, STATUS_LABELS[assessment.status]));
    side.append(el('span', 'assess-date', dateText(assessment)));

    if (assessment.status === 'graded' && assessment.score != null) {
      const score = el('span', 'assess-score');
      score.append(document.createTextNode(String(assessment.score)));
      score.append(el('span', 'assess-points', ' / ' + (assessment.points || 100)));
      side.append(score);
    }

    item.append(body, side);
    return item;
  }

  function courseCard(course, index) {
    const visible = course.assessments.filter(
      a => filter === 'all' || a.status === filter
    );

    const card = el('article', 'course-card' + (visible.length === 0 ? ' is-empty' : ''));
    const head = el('header', 'course-head');

    const tone = TONES[index % TONES.length];
    const mark = el('span', 'course-mark' + (tone ? ' tone-' + tone : ''), course.code);

    const title = el('div', 'course-title');
    title.append(el('h2', '', course.name));
    title.append(el('p', 'course-teacher', course.teacher));

    const meta = el('p', 'course-meta');
    meta.append(el('span', '', course.schedule));
    meta.append(el('span', '', course.room));
    title.append(meta);

    let countText;
    if (course.assessments.length === 0) {
      countText = 'No assessments yet';
    } else if (visible.length === course.assessments.length) {
      countText = visible.length + (visible.length === 1 ? ' assessment' : ' assessments');
    } else {
      countText = visible.length + ' of ' + course.assessments.length + ' assessments';
    }

    head.append(mark, title, el('span', 'course-count', countText));
    card.append(head);

    if (visible.length > 0) {
      const list = el('div', 'assess-list');
      visible.forEach(a => list.append(assessmentEl(a)));
      card.append(list);
    }

    return card;
  }

  function render() {
    courseList.innerHTML = '';

    let shown = 0;

    SP_COURSES.forEach((course, index) => {
      if (filter !== 'all' && !course.assessments.some(a => a.status === filter)) return;
      courseList.append(courseCard(course, index));
      shown += course.assessments.filter(a => filter === 'all' || a.status === filter).length;
    });

    if (shown === 0 && SP_COURSES.some(course => course.assessments.length > 0)) {
      courseList.append(el('p', 'course-empty', 'No assessments match this filter.'));
    }

    if (SP_COURSES.length === 0) {
      courseList.append(el('p', 'course-empty', spCourseEmptyMessage()));
    }

    if (courseStatus) {
      const noun = 'assessment' + (shown === 1 ? '' : 's');

      if (SP_COURSES.length === 0) {
        courseStatus.textContent = '';
      } else if (shown === 0) {
        courseStatus.textContent = 'No assessments posted yet.';
      } else if (filter === 'all') {
        courseStatus.textContent = 'Showing all ' + shown + ' assessments across '
          + SP_COURSES.length + ' subjects.';
      } else if (filter === 'pending') {
        courseStatus.textContent = 'Showing ' + shown + ' ' + noun + ' to do.';
      } else {
        courseStatus.textContent = 'Showing ' + shown + ' ' + filter + ' ' + noun + '.';
      }
    }
  }

  // headline figures
  const all = SP_COURSES.reduce((sum, course) => sum.concat(course.assessments), []);
  const dueThisWeek = all.filter(
    a => a.status === 'pending' && a.offset >= 0 && a.offset <= 7
  ).length;
  const completed = all.filter(a => a.status !== 'pending').length;

  const statSubjects = document.getElementById('statSubjects');
  const statAssessments = document.getElementById('statAssessments');
  const statDue = document.getElementById('statDue');
  const statCompleted = document.getElementById('statCompleted');
  const courseStatus = document.getElementById('courseStatus');
  const courseToolbar = document.getElementById('courseToolbar');
  const courseNote = document.getElementById('courseNote');
  const courseHead = document.getElementById('courseHead');

  if (statSubjects) statSubjects.textContent = String(SP_COURSES.length);
  if (statAssessments) statAssessments.textContent = String(all.length);
  if (statDue) statDue.textContent = String(dueThisWeek);
  if (statCompleted) statCompleted.textContent = String(completed);

  if (courseHead) {
    courseHead.textContent = SP_COURSE_RECORD && SP_COURSE_RECORD.class
      ? SP_COURSE_RECORD.class.section + ' · ' + SP_COURSE_RECORD.class.subject
      : 'School Year 2026–2027 · Second Quarter';
  }

  // nothing to filter or explain until teachers post assessments
  if (courseToolbar) courseToolbar.hidden = all.length === 0;
  if (courseNote) {
    if (SP_COURSES.length === 0) {
      courseNote.textContent = spCourseEmptyMessage();
      courseNote.hidden = false;
    } else {
      courseNote.hidden = all.length > 0;
    }
  }

  // filters
  const filterButtons = Array.from(document.querySelectorAll('.filter'));

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filter = button.dataset.filter;

      filterButtons.forEach(other => {
        const active = other === button;
        other.classList.toggle('is-active', active);
        other.setAttribute('aria-pressed', String(active));
      });

      render();
    });
  });

  render();
}
