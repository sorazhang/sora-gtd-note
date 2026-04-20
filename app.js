// ===== Utilities =====

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function isoWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const w1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - w1) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7);
}

function isoWeekYear(date) {
  const d = new Date(date);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  return d.getFullYear();
}

function weekMonday(week, year) {
  const jan4 = new Date(year, 0, 4);
  const day4 = (jan4.getDay() + 6) % 7;
  const mon = new Date(jan4);
  mon.setDate(jan4.getDate() - day4 + (week - 1) * 7);
  return mon;
}

function weekRange(week, year) {
  const mon = weekMonday(week, year);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { start: mon, end: sun };
}

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun',
                      'Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDateShort(d) {
  return `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function todayStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
}

// ===== Storage =====

const KEYS = { tasks: 'gtd_tasks', projects: 'gtd_projects', weekNotes: 'gtd_week_notes' };

const Store = {
  tasks() { return JSON.parse(localStorage.getItem(KEYS.tasks) || '[]'); },
  projects() { return JSON.parse(localStorage.getItem(KEYS.projects) || '[]'); },
  weekNotes() { return JSON.parse(localStorage.getItem(KEYS.weekNotes) || '{}'); },
  saveTasks(t) { localStorage.setItem(KEYS.tasks, JSON.stringify(t)); },
  saveProjects(p) { localStorage.setItem(KEYS.projects, JSON.stringify(p)); },
  saveWeekNotes(n) { localStorage.setItem(KEYS.weekNotes, JSON.stringify(n)); },
};

// ===== Seed Data =====

function seedData() {
  if (Store.tasks().length > 0) return;

  const today = new Date();
  const cw = isoWeek(today);
  const cy = isoWeekYear(today);

  const projects = [
    { id: 'p1', name: 'Obsidian Setup', type: 'personal', status: 'active', description: 'Configure Obsidian vault and plugins' },
    { id: 'p2', name: 'Q2 Planning', type: 'work', status: 'active', description: 'Quarterly planning and roadmap' },
    { id: 'p3', name: 'Home Renovation', type: 'personal', status: 'on-hold', description: 'Kitchen and living room updates' },
  ];

  const tasks = [
    // Current week — personal
    { id: uid(), title: 'Review GTD weekly workflow', category: 'personal', priority: 'high', status: 'next', project: 'p1', week: cw, year: cy, context: '@computer', notes: 'Align with new calendar system', completedAt: null, createdAt: new Date().toISOString() },
    { id: uid(), title: 'Configure Obsidian daily notes template', category: 'personal', priority: 'medium', status: 'next', project: 'p1', week: cw, year: cy, context: '@computer', notes: '', completedAt: null, createdAt: new Date().toISOString() },
    { id: uid(), title: 'Book dentist appointment', category: 'personal', priority: 'low', status: 'inbox', project: '', week: cw, year: cy, context: '@phone', notes: '', completedAt: null, createdAt: new Date().toISOString() },
    // Current week — work
    { id: uid(), title: 'Prepare Q2 OKR presentation', category: 'work', priority: 'high', status: 'next', project: 'p2', week: cw, year: cy, context: '@office', notes: 'Due Friday', completedAt: null, createdAt: new Date().toISOString() },
    { id: uid(), title: 'Review team PR backlog', category: 'work', priority: 'medium', status: 'next', project: 'p2', week: cw, year: cy, context: '@computer', notes: '', completedAt: null, createdAt: new Date().toISOString() },
    { id: uid(), title: 'Follow up with design team on mockups', category: 'work', priority: 'medium', status: 'waiting', project: 'p2', week: cw, year: cy, context: '@office', notes: 'Waiting on Sarah', completedAt: null, createdAt: new Date().toISOString() },
    // Week 12 — for tracking
    { id: uid(), title: 'Set up GTD system foundations', category: 'personal', priority: 'high', status: 'done', project: 'p1', week: 12, year: cy, context: '@computer', notes: 'Chose Obsidian as PKM', completedAt: new Date('2026-03-18').toISOString(), createdAt: new Date('2026-03-16').toISOString() },
    { id: uid(), title: 'Read "Getting Things Done" chapters 1-5', category: 'personal', priority: 'medium', status: 'done', project: 'p1', week: 12, year: cy, context: '@home', notes: '', completedAt: new Date('2026-03-20').toISOString(), createdAt: new Date('2026-03-16').toISOString() },
    { id: uid(), title: 'Sprint 12 planning session', category: 'work', priority: 'high', status: 'done', project: 'p2', week: 12, year: cy, context: '@office', notes: 'Capacity at 80%', completedAt: new Date('2026-03-17').toISOString(), createdAt: new Date('2026-03-16').toISOString() },
    { id: uid(), title: 'Architecture review for new API', category: 'work', priority: 'high', status: 'done', project: 'p2', week: 12, year: cy, context: '@office', notes: 'REST vs GraphQL decision', completedAt: new Date('2026-03-19').toISOString(), createdAt: new Date('2026-03-16').toISOString() },
    // Next week
    { id: uid(), title: 'Write weekly review note', category: 'personal', priority: 'medium', status: 'someday', project: 'p1', week: cw + 1, year: cy, context: '@computer', notes: '', completedAt: null, createdAt: new Date().toISOString() },
    { id: uid(), title: 'Monthly 1:1 with manager', category: 'work', priority: 'high', status: 'next', project: 'p2', week: cw + 1, year: cy, context: '@office', notes: '', completedAt: null, createdAt: new Date().toISOString() },
  ];

  const weekNotes = {
    [`${cy}-W12`]: `## Week 12 Review\n\nGood progress on GTD setup. Committed to Obsidian as the primary note-taking tool.\n\n### Wins\n- Completed architecture review ahead of schedule\n- Started reading GTD book — lots of actionable insights\n\n### Learnings\n- Need to block time on Fridays for weekly review\n\n### Next Week Focus\n- Q2 planning kick-off\n- Continue GTD setup`,
  };

  Store.saveProjects(projects);
  Store.saveTasks(tasks);
  Store.saveWeekNotes(weekNotes);
}

// ===== App State =====

const today = new Date();
let state = {
  calMonth: today.getMonth(),
  calYear: today.getFullYear(),
  selectedWeek: isoWeek(today),
  selectedWeekYear: isoWeekYear(today),
  activeView: 'inbox',
  activeTab: 'all',
  editingTaskId: null,
};

// ===== Render: Header =====

function renderHeader() {
  const now = new Date();
  document.getElementById('currentWeekNum').textContent = isoWeek(now);
  document.getElementById('currentYear').textContent = isoWeekYear(now);
  document.getElementById('currentDate').textContent =
    now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// ===== Render: Sidebar =====

function renderSidebar() {
  const tasks = Store.tasks();
  const countByStatus = s => tasks.filter(t => t.status === s).length;

  const inboxEl = document.getElementById('inboxCount');
  const nextEl = document.getElementById('nextCount');
  const waitingEl = document.getElementById('waitingCount');

  inboxEl.textContent = countByStatus('inbox') || '';
  nextEl.textContent = countByStatus('next') || '';
  waitingEl.textContent = countByStatus('waiting') || '';

  renderProjects();
  renderWeekTracker();
}

function renderProjects() {
  const projects = Store.projects();
  const el = document.getElementById('projectsList');
  if (projects.length === 0) {
    el.innerHTML = '<div style="color:#4a5568;font-size:11px;padding:4px 8px;">No projects yet</div>';
    return;
  }
  el.innerHTML = projects.map(p => `
    <button class="project-item" data-project-id="${p.id}">
      <span class="project-dot ${p.type}"></span>
      <span class="project-name">${escHtml(p.name)}</span>
      ${p.status !== 'active' ? `<span class="project-status-badge">${p.status}</span>` : ''}
    </button>
  `).join('');

  el.querySelectorAll('.project-item').forEach(btn => {
    btn.addEventListener('click', () => {
      // filter calendar to project tasks — highlight sidebar item
      btn.classList.toggle('active');
    });
  });
}

function renderWeekTracker() {
  const tasks = Store.tasks();
  const now = new Date();
  const cw = isoWeek(now);
  const cy = isoWeekYear(now);

  // Show surrounding weeks (cw-4 to cw+4)
  const weeks = [];
  for (let w = Math.max(1, cw - 4); w <= Math.min(53, cw + 4); w++) {
    weeks.push(w);
  }

  const el = document.getElementById('weekTracker');
  el.innerHTML = weeks.map(w => {
    const weekTasks = tasks.filter(t => t.week === w && t.year === cy);
    const done = weekTasks.filter(t => t.status === 'done').length;
    const total = weekTasks.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const isCurrent = w === cw;
    return `
      <button class="week-tracker-item ${isCurrent ? 'current-week' : ''}"
              data-week="${w}" data-year="${cy}">
        <span class="week-tracker-num">W${w}</span>
        <span class="week-tracker-bar">
          <span class="week-tracker-fill" style="width:${pct}%"></span>
        </span>
        <span class="week-tracker-pct">${total > 0 ? pct + '%' : '—'}</span>
      </button>`;
  }).join('');

  el.querySelectorAll('.week-tracker-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const w = parseInt(btn.dataset.week);
      const y = parseInt(btn.dataset.year);
      selectWeek(w, y);
    });
  });
}

// ===== Render: Calendar =====

function renderCalendar() {
  const { calMonth, calYear } = state;
  document.getElementById('calendarTitle').textContent = `${MONTHS[calMonth]} ${calYear}`;

  const now = new Date();
  const todayKey = todayStr();
  const tasks = Store.tasks();

  // Build a map: date string -> tasks
  const tasksByDate = {};
  tasks.forEach(t => {
    if (!t.week || !t.year) return;
    const { start, end } = weekRange(t.week, t.year);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      if (!tasksByDate[k]) tasksByDate[k] = [];
      tasksByDate[k].push(t);
    }
  });

  const firstDay = new Date(calYear, calMonth, 1);
  const firstDayOfWeek = (firstDay.getDay() + 6) % 7; // 0=Mon
  const firstMonday = new Date(firstDay);
  firstMonday.setDate(firstDay.getDate() - firstDayOfWeek);

  const weeks = [];
  let cursor = new Date(firstMonday);
  while (cursor.getMonth() <= calMonth && cursor.getFullYear() <= calYear
         || cursor < firstDay) {
    if (cursor.getMonth() > calMonth && cursor.getFullYear() >= calYear) break;
    const weekStart = new Date(cursor);
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push({ weekStart, days });
    if (cursor.getMonth() > calMonth || cursor.getFullYear() > calYear) break;
  }

  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  weeks.forEach(({ weekStart, days }) => {
    const wNum = isoWeek(weekStart);
    const wYear = isoWeekYear(weekStart);
    const isCurrentWeek = wNum === isoWeek(now) && wYear === isoWeekYear(now);
    const isSelected = wNum === state.selectedWeek && wYear === state.selectedWeekYear;

    const row = document.createElement('div');
    row.className = `week-row${isCurrentWeek ? ' current-week-row' : ''}${isSelected ? ' selected' : ''}`;
    row.dataset.week = wNum;
    row.dataset.year = wYear;

    // Week number cell
    const wCell = document.createElement('div');
    wCell.className = 'week-num-cell';
    wCell.innerHTML = `<span class="week-num-label">W${wNum}</span>`;
    row.appendChild(wCell);

    // Day cells
    days.forEach(day => {
      const dk = `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;
      const isOther = day.getMonth() !== calMonth;
      const isToday = dk === todayKey;
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;

      const cell = document.createElement('div');
      cell.className = `day-cell${isOther ? ' other-month' : ''}${isToday ? ' today' : ''}${isWeekend ? ' weekend' : ''}`;

      const numEl = document.createElement('div');
      numEl.className = 'day-number';
      numEl.textContent = day.getDate();
      cell.appendChild(numEl);

      const dayTasks = (tasksByDate[dk] || []).slice(0, 3);
      if (dayTasks.length > 0) {
        const tasksEl = document.createElement('div');
        tasksEl.className = 'day-tasks';
        dayTasks.forEach(t => {
          const chip = document.createElement('div');
          chip.className = `day-task-chip ${t.category}${t.status === 'done' ? ' done' : ''}`;
          chip.textContent = t.title;
          chip.title = t.title;
          chip.addEventListener('click', e => {
            e.stopPropagation();
            openTaskModal(t.id);
          });
          tasksEl.appendChild(chip);
        });
        const all = (tasksByDate[dk] || []);
        if (all.length > 3) {
          const more = document.createElement('div');
          more.className = 'day-more';
          more.textContent = `+${all.length - 3} more`;
          tasksEl.appendChild(more);
        }
        cell.appendChild(tasksEl);
      }

      row.appendChild(cell);
    });

    row.addEventListener('click', () => selectWeek(wNum, wYear));
    grid.appendChild(row);
  });
}

// ===== Select Week =====

function selectWeek(week, year) {
  state.selectedWeek = week;
  state.selectedWeekYear = year;
  renderCalendar();
  renderWeekPanel();
  renderWeekTracker();
}

// ===== Render: Week Panel =====

function renderWeekPanel() {
  const { selectedWeek: w, selectedWeekYear: y } = state;
  const { start, end } = weekRange(w, y);

  document.getElementById('weekPanelTitle').textContent = `Week ${w}`;
  document.getElementById('weekPanelDates').textContent =
    `${formatDateShort(start)} – ${formatDateShort(end)}, ${y}`;

  const notes = Store.weekNotes();
  document.getElementById('weekNotesTextarea').value = notes[`${y}-W${w}`] || '';

  renderWeekTasks();
}

function renderWeekTasks() {
  const { selectedWeek: w, selectedWeekYear: y, activeTab } = state;
  const tasks = Store.tasks().filter(t => t.week === w && t.year === y);

  const filtered = activeTab === 'all' ? tasks
    : tasks.filter(t => t.category === activeTab);

  const container = document.getElementById('weekTasksContainer');
  container.innerHTML = '';

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No tasks for this week. Add one!';
    container.appendChild(empty);
  } else {
    const active = filtered.filter(t => t.status !== 'done');
    const done = filtered.filter(t => t.status === 'done');

    if (active.length > 0) {
      if (activeTab === 'all') {
        renderTaskGroup(container, 'Active', active);
      } else {
        active.forEach(t => container.appendChild(buildTaskCard(t)));
      }
    }
    if (done.length > 0) {
      const doneTitle = document.createElement('div');
      doneTitle.className = 'section-group-title';
      doneTitle.textContent = `Completed (${done.length})`;
      container.appendChild(doneTitle);
      done.forEach(t => container.appendChild(buildTaskCard(t)));
    }
  }

  // Add task button
  const addBtn = document.createElement('button');
  addBtn.className = 'task-card-add';
  addBtn.innerHTML = '<span>+</span> Add task to this week';
  addBtn.addEventListener('click', () => openTaskModal(null));
  container.appendChild(addBtn);
}

function renderTaskGroup(container, title, tasks) {
  const personal = tasks.filter(t => t.category === 'personal');
  const work = tasks.filter(t => t.category === 'work');

  if (personal.length > 0) {
    const h = document.createElement('div');
    h.className = 'section-group-title';
    h.innerHTML = '<span style="color:var(--personal)">■</span> Personal';
    container.appendChild(h);
    personal.forEach(t => container.appendChild(buildTaskCard(t)));
  }
  if (work.length > 0) {
    const h = document.createElement('div');
    h.className = 'section-group-title';
    h.innerHTML = '<span style="color:var(--work)">■</span> Work';
    container.appendChild(h);
    work.forEach(t => container.appendChild(buildTaskCard(t)));
  }
}

function buildTaskCard(task) {
  const card = document.createElement('div');
  card.className = `task-card ${task.category}${task.status === 'done' ? ' done-card' : ''}`;

  const checkEl = document.createElement('div');
  checkEl.className = `task-check${task.status === 'done' ? ' checked' : ''}`;
  checkEl.addEventListener('click', e => {
    e.stopPropagation();
    toggleTaskDone(task.id);
  });

  const body = document.createElement('div');
  body.className = 'task-card-body';

  const titleEl = document.createElement('div');
  titleEl.className = 'task-card-title';
  titleEl.textContent = task.title;

  const meta = document.createElement('div');
  meta.className = 'task-card-meta';

  const priorityTag = document.createElement('span');
  priorityTag.className = `task-tag priority-${task.priority}`;
  priorityTag.textContent = task.priority;
  meta.appendChild(priorityTag);

  if (task.status !== 'done' && task.status !== 'next') {
    const statusTag = document.createElement('span');
    statusTag.className = 'task-tag status';
    statusTag.textContent = task.status;
    meta.appendChild(statusTag);
  }

  if (task.context) {
    const ctxTag = document.createElement('span');
    ctxTag.className = 'task-tag context';
    ctxTag.textContent = task.context;
    meta.appendChild(ctxTag);
  }

  if (task.project) {
    const projects = Store.projects();
    const proj = projects.find(p => p.id === task.project);
    if (proj) {
      const projTag = document.createElement('span');
      projTag.className = 'task-tag status';
      projTag.textContent = proj.name;
      meta.appendChild(projTag);
    }
  }

  body.appendChild(titleEl);
  body.appendChild(meta);
  card.appendChild(checkEl);
  card.appendChild(body);
  card.addEventListener('click', () => openTaskModal(task.id));
  return card;
}

// ===== Task Toggle Done =====

function toggleTaskDone(id) {
  const tasks = Store.tasks();
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  if (task.status === 'done') {
    task.status = 'next';
    task.completedAt = null;
  } else {
    task.status = 'done';
    task.completedAt = new Date().toISOString();
  }
  Store.saveTasks(tasks);
  renderAll();
}

// ===== Task Modal =====

function openTaskModal(taskId) {
  state.editingTaskId = taskId;
  const modal = document.getElementById('taskModalOverlay');
  const titleEl = document.getElementById('taskModalTitle');
  const deleteBtn = document.getElementById('deleteTaskBtn');

  // Populate project dropdown
  populateProjectDropdown('fTaskProject');

  if (taskId) {
    const task = Store.tasks().find(t => t.id === taskId);
    if (!task) return;
    titleEl.textContent = 'Edit Task';
    deleteBtn.classList.remove('hidden');
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('fTaskTitle').value = task.title;
    document.getElementById('fTaskCategory').value = task.category;
    document.getElementById('fTaskPriority').value = task.priority;
    document.getElementById('fTaskStatus').value = task.status;
    document.getElementById('fTaskProject').value = task.project || '';
    document.getElementById('fTaskWeek').value = task.week || '';
    document.getElementById('fTaskYear').value = task.year || '';
    document.getElementById('fTaskContext').value = task.context || '';
    document.getElementById('fTaskNotes').value = task.notes || '';
  } else {
    titleEl.textContent = 'Add Task';
    deleteBtn.classList.add('hidden');
    document.getElementById('editTaskId').value = '';
    document.getElementById('fTaskTitle').value = '';
    document.getElementById('fTaskCategory').value = 'personal';
    document.getElementById('fTaskPriority').value = 'medium';
    document.getElementById('fTaskStatus').value = 'next';
    document.getElementById('fTaskProject').value = '';
    document.getElementById('fTaskWeek').value = state.selectedWeek || isoWeek(new Date());
    document.getElementById('fTaskYear').value = state.selectedWeekYear || isoWeekYear(new Date());
    document.getElementById('fTaskContext').value = '';
    document.getElementById('fTaskNotes').value = '';
  }

  modal.classList.remove('hidden');
  document.getElementById('fTaskTitle').focus();
}

function closeTaskModal() {
  document.getElementById('taskModalOverlay').classList.add('hidden');
  state.editingTaskId = null;
}

function saveTask() {
  const title = document.getElementById('fTaskTitle').value.trim();
  if (!title) { document.getElementById('fTaskTitle').focus(); return; }

  const id = document.getElementById('editTaskId').value;
  const tasks = Store.tasks();

  const taskData = {
    title,
    category: document.getElementById('fTaskCategory').value,
    priority: document.getElementById('fTaskPriority').value,
    status: document.getElementById('fTaskStatus').value,
    project: document.getElementById('fTaskProject').value,
    week: parseInt(document.getElementById('fTaskWeek').value) || isoWeek(new Date()),
    year: parseInt(document.getElementById('fTaskYear').value) || isoWeekYear(new Date()),
    context: document.getElementById('fTaskContext').value.trim(),
    notes: document.getElementById('fTaskNotes').value.trim(),
  };

  if (id) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx >= 0) {
      tasks[idx] = { ...tasks[idx], ...taskData };
    }
  } else {
    tasks.push({ id: uid(), ...taskData, completedAt: null, createdAt: new Date().toISOString() });
  }

  Store.saveTasks(tasks);
  closeTaskModal();
  renderAll();
}

function deleteTask() {
  const id = document.getElementById('editTaskId').value;
  if (!id) return;
  const tasks = Store.tasks().filter(t => t.id !== id);
  Store.saveTasks(tasks);
  closeTaskModal();
  renderAll();
}

function populateProjectDropdown(selectId) {
  const select = document.getElementById(selectId);
  const current = select.value;
  const projects = Store.projects();
  select.innerHTML = '<option value="">No Project</option>' +
    projects.map(p => `<option value="${p.id}">${escHtml(p.name)}</option>`).join('');
  select.value = current;
}

// ===== Project Modal =====

function openProjectModal() {
  document.getElementById('fProjectName').value = '';
  document.getElementById('fProjectType').value = 'personal';
  document.getElementById('fProjectStatus').value = 'active';
  document.getElementById('fProjectDesc').value = '';
  document.getElementById('projectModalOverlay').classList.remove('hidden');
  document.getElementById('fProjectName').focus();
}

function closeProjectModal() {
  document.getElementById('projectModalOverlay').classList.add('hidden');
}

function saveProject() {
  const name = document.getElementById('fProjectName').value.trim();
  if (!name) { document.getElementById('fProjectName').focus(); return; }

  const projects = Store.projects();
  projects.push({
    id: uid(),
    name,
    type: document.getElementById('fProjectType').value,
    status: document.getElementById('fProjectStatus').value,
    description: document.getElementById('fProjectDesc').value.trim(),
  });
  Store.saveProjects(projects);
  closeProjectModal();
  renderSidebar();
}

// ===== Obsidian Export =====

function generateObsidianNote(week, year) {
  const { start, end } = weekRange(week, year);
  const tasks = Store.tasks().filter(t => t.week === week && t.year === year);
  const projects = Store.projects();
  const notes = Store.weekNotes()[`${year}-W${week}`] || '';

  const getProject = id => projects.find(p => p.id === id);

  const completed = tasks.filter(t => t.status === 'done');
  const personal = tasks.filter(t => t.category === 'personal' && t.status !== 'done');
  const work = tasks.filter(t => t.category === 'work' && t.status !== 'done');

  const taskLine = t => {
    const proj = t.project ? getProject(t.project) : null;
    const ctx = t.context ? ` \`${t.context}\`` : '';
    const projLabel = proj ? ` [[${proj.name}]]` : '';
    return `- [${t.status === 'done' ? 'x' : ' '}] ${t.title}${projLabel}${ctx}${t.priority === 'high' ? ' 🔴' : t.priority === 'medium' ? ' 🟡' : ''}`;
  };

  const formatDate = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  let md = `---
tags: [gtd, weekly-review, ${year}-W${String(week).padStart(2,'0')}]
week: ${week}
year: ${year}
date: ${formatDate(new Date())}
date-range: "${formatDate(start)} → ${formatDate(end)}"
---

# Week ${week} Review · ${formatDateShort(start)} – ${formatDateShort(end)}, ${year}

`;

  if (notes) {
    md += `## Notes\n\n${notes}\n\n`;
  }

  if (personal.length > 0) {
    md += `## Personal Tasks\n\n${personal.map(taskLine).join('\n')}\n\n`;
  }

  if (work.length > 0) {
    md += `## Work Tasks\n\n${work.map(taskLine).join('\n')}\n\n`;
  }

  if (completed.length > 0) {
    md += `## Completed\n\n${completed.map(taskLine).join('\n')}\n\n`;
  }

  // Project status
  const weekProjects = [...new Set(tasks.filter(t => t.project).map(t => t.project))];
  if (weekProjects.length > 0) {
    md += `## Project Status\n\n`;
    weekProjects.forEach(pid => {
      const proj = getProject(pid);
      if (!proj) return;
      const total = tasks.filter(t => t.project === pid).length;
      const done = tasks.filter(t => t.project === pid && t.status === 'done').length;
      md += `- [[${proj.name}]] — ${done}/${total} tasks (${proj.status})\n`;
    });
    md += '\n';
  }

  md += `---\n*Generated by GTD Note System on ${new Date().toLocaleString()}*\n`;
  return md;
}

function openObsidianModal(week, year) {
  const note = generateObsidianNote(week, year);
  document.getElementById('obsidianFilename').value =
    `${year}-W${String(week).padStart(2,'0')}-weekly-review.md`;
  document.getElementById('notePreview').textContent = note;
  document.getElementById('obsidianModalOverlay').classList.remove('hidden');
}

function closeObsidianModal() {
  document.getElementById('obsidianModalOverlay').classList.add('hidden');
}

// ===== Save Week Notes =====

function saveWeekNotes() {
  const { selectedWeek: w, selectedWeekYear: y } = state;
  const notes = Store.weekNotes();
  const val = document.getElementById('weekNotesTextarea').value;
  if (val.trim()) {
    notes[`${y}-W${w}`] = val;
  } else {
    delete notes[`${y}-W${w}`];
  }
  Store.saveWeekNotes(notes);
  const btn = document.getElementById('saveNotesBtn');
  btn.textContent = 'Saved ✓';
  setTimeout(() => btn.textContent = 'Save', 1500);
}

// ===== Export All =====

function exportAll() {
  const tasks = Store.tasks();
  const projects = Store.projects();
  const notes = Store.weekNotes();
  const data = JSON.stringify({ tasks, projects, weekNotes: notes }, null, 2);
  downloadFile('gtd-export.json', data, 'application/json');
}

// ===== Helpers =====

function downloadFile(name, content, type = 'text/markdown') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===== Render All =====

function renderAll() {
  renderHeader();
  renderSidebar();
  renderCalendar();
  renderWeekPanel();
}

// ===== Event Listeners =====

function bindEvents() {
  // Header
  document.getElementById('quickAddBtn').addEventListener('click', () => openTaskModal(null));
  document.getElementById('exportAllBtn').addEventListener('click', exportAll);

  // Calendar nav
  document.getElementById('prevMonth').addEventListener('click', () => {
    state.calMonth--;
    if (state.calMonth < 0) { state.calMonth = 11; state.calYear--; }
    renderCalendar();
  });
  document.getElementById('nextMonth').addEventListener('click', () => {
    state.calMonth++;
    if (state.calMonth > 11) { state.calMonth = 0; state.calYear++; }
    renderCalendar();
  });
  document.getElementById('todayBtn').addEventListener('click', () => {
    const now = new Date();
    state.calMonth = now.getMonth();
    state.calYear = now.getFullYear();
    selectWeek(isoWeek(now), isoWeekYear(now));
  });

  // Sidebar nav
  document.getElementById('addProjectBtn').addEventListener('click', openProjectModal);
  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeView = btn.dataset.view;
    });
  });

  // Week panel tabs
  document.querySelectorAll('.tab[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.activeTab = tab.dataset.tab;
      renderWeekTasks();
    });
  });

  // Week notes
  document.getElementById('saveNotesBtn').addEventListener('click', saveWeekNotes);
  document.getElementById('generateNoteBtn').addEventListener('click', () => {
    openObsidianModal(state.selectedWeek, state.selectedWeekYear);
  });

  // Task modal
  document.getElementById('taskModalClose').addEventListener('click', closeTaskModal);
  document.getElementById('taskModalCancel').addEventListener('click', closeTaskModal);
  document.getElementById('taskModalSave').addEventListener('click', saveTask);
  document.getElementById('deleteTaskBtn').addEventListener('click', deleteTask);
  document.getElementById('taskModalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeTaskModal();
  });

  // Project modal
  document.getElementById('projectModalClose').addEventListener('click', closeProjectModal);
  document.getElementById('projectModalCancel').addEventListener('click', closeProjectModal);
  document.getElementById('projectModalSave').addEventListener('click', saveProject);
  document.getElementById('projectModalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeProjectModal();
  });

  // Obsidian modal
  document.getElementById('obsidianModalClose').addEventListener('click', closeObsidianModal);
  document.getElementById('obsidianModalCancel').addEventListener('click', closeObsidianModal);
  document.getElementById('obsidianModalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeObsidianModal();
  });
  document.getElementById('copyNoteBtn').addEventListener('click', () => {
    const text = document.getElementById('notePreview').textContent;
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById('copyNoteBtn');
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = 'Copy', 1500);
    });
  });
  document.getElementById('downloadNoteBtn').addEventListener('click', () => {
    const filename = document.getElementById('obsidianFilename').value || 'weekly-review.md';
    const text = document.getElementById('notePreview').textContent;
    downloadFile(filename, text);
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeTaskModal();
      closeProjectModal();
      closeObsidianModal();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
      e.preventDefault();
      openTaskModal(null);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      const taskModal = document.getElementById('taskModalOverlay');
      if (!taskModal.classList.contains('hidden')) { saveTask(); return; }
      saveWeekNotes();
    }
  });
}

// ===== Init =====

function init() {
  seedData();
  bindEvents();
  // Select current week on load
  const now = new Date();
  state.selectedWeek = isoWeek(now);
  state.selectedWeekYear = isoWeekYear(now);
  renderAll();
}

init();
