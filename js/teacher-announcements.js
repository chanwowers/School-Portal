/* ------------------------------------------------------------------
   teacher-announcements.js — class announcements on
   TeacherAnnouncements.html. Posts are saved per teacher in
   localStorage by js/teacher.js; there is no server delivery.
   ------------------------------------------------------------------ */

const annForm = document.getElementById('annForm');
const annTitle = document.getElementById('annTitle');
const annAudience = document.getElementById('annAudience');
const annBody = document.getElementById('annBody');
const annList = document.getElementById('annList');
const annStatus = document.getElementById('annStatus');
const annCount = document.getElementById('annCount');

if (annForm) {
  const data = tcLoad();
  let highlightId = null;

  // audience choices: every class, plus each section on its own
  const allOption = document.createElement('option');
  allOption.value = 'All my classes';
  allOption.textContent = 'All my classes';
  annAudience.append(allOption);

  TC_CLASSES.forEach(cls => {
    const option = document.createElement('option');
    option.value = cls.section;
    option.textContent = cls.section;
    annAudience.append(option);
  });

  function setStatus(message, kind) {
    annStatus.textContent = message;
    annStatus.className = 'status' + (kind ? ' ' + kind : '');
  }

  function renderList() {
    annList.innerHTML = '';

    if (annCount) {
      annCount.textContent = data.announcements.length + ' posted';
    }

    if (data.announcements.length === 0) {
      annList.append(tcEl('p', 'ann-empty', 'No announcements yet. Post one to your classes.'));
      return;
    }

    data.announcements.forEach(ann => {
      annList.append(tcAnnouncementEl(ann, {
        isNew: ann.id === highlightId,
        onDelete: item => {
          if (!window.confirm('Delete "' + item.title + '"? This cannot be undone.')) return;
          data.announcements = data.announcements.filter(a => a.id !== item.id);
          tcSave(data);
          highlightId = null;
          renderList();
          setStatus('Announcement deleted.', 'ok');
        }
      }));
    });
  }

  annForm.addEventListener('submit', event => {
    event.preventDefault();

    const title = annTitle.value.trim();
    const body = annBody.value.trim();

    [annTitle, annBody].forEach(field => field.removeAttribute('aria-invalid'));

    if (!title) {
      annTitle.setAttribute('aria-invalid', 'true');
      annTitle.focus();
      setStatus('Add a title for the announcement.', 'error');
      return;
    }

    if (!body) {
      annBody.setAttribute('aria-invalid', 'true');
      annBody.focus();
      setStatus('Write the announcement message.', 'error');
      return;
    }

    const announcement = {
      id: 'ann-' + Date.now(),
      title,
      body,
      audience: annAudience.value || 'All my classes',
      when: tcDateLabel(tcTodayISO())
    };

    data.announcements.unshift(announcement);
    tcSave(data);

    highlightId = announcement.id;
    annForm.reset();
    annAudience.value = 'All my classes';
    renderList();
    setStatus('Posted to ' + announcement.audience + '.', 'ok');
    annTitle.focus();
  });

  [annTitle, annBody].forEach(field => {
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') {
        field.removeAttribute('aria-invalid');
        setStatus('');
      }
    });
  });

  renderList();
}
