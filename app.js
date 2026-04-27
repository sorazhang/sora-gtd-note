// ===== Utilities =====

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

const EFFORT_MINS = { '10min':10,'20min':20,'60min':60,'90min':90,'120min':120 };

function calcRemainEffort(effort, progress) {
  const mins = EFFORT_MINS[effort];
  if (!mins || progress == null) return '';
  const remain = Math.round(mins * (1 - progress / 100));
  if (remain <= 0) return '0 min';
  return remain >= 60 ? `${Math.round(remain/60*10)/10}h` : `${remain} min`;
}

function generateTaskId(projectId) {
  const projects = Store.projects();
  const tasks = Store.tasks();
  const proj = projects.find(p => p.id === projectId);
  const prefix = proj
    ? proj.name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'TSK'
    : 'TSK';
  const existing = tasks.filter(t => t.taskId && t.taskId.startsWith(prefix + '-'));
  const nums = existing.map(t => parseInt(t.taskId.split('-').pop(), 10)).filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
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

const KEYS = { tasks: 'gtd_tasks', projects: 'gtd_projects', weekNotes: 'gtd_week_notes', todayPlan: 'gtd_today' };

const Store = {
  allTasks()     { return JSON.parse(localStorage.getItem(KEYS.tasks)    || '[]'); },
  allProjects()  { return JSON.parse(localStorage.getItem(KEYS.projects) || '[]'); },
  tasks()        { return Store.allTasks().filter(t => !t.archived); },
  projects()     { return Store.allProjects().filter(p => !p.archived); },
  archivedTasks()    { return Store.allTasks().filter(t =>  t.archived); },
  archivedProjects() { return Store.allProjects().filter(p =>  p.archived); },
  weekNotes() { return JSON.parse(localStorage.getItem(KEYS.weekNotes)|| '{}'); },
  saveTasks(t)     { localStorage.setItem(KEYS.tasks,    JSON.stringify(t)); },
  saveProjects(p)  { localStorage.setItem(KEYS.projects, JSON.stringify(p)); },
  saveWeekNotes(n) { localStorage.setItem(KEYS.weekNotes,JSON.stringify(n)); },
  todayPlan() {
    const raw = JSON.parse(localStorage.getItem(KEYS.todayPlan) || 'null');
    const key = todayDateKey();
    if (!raw || raw.date !== key) return { date: key, taskIds: [] };
    return raw;
  },
  saveTodayPlan(p) { localStorage.setItem(KEYS.todayPlan, JSON.stringify(p)); },
};

function todayDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

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
  selectedDay: null,       // 'YYYY-MM-DD' when a specific day cell is clicked
  selectedProjectId: null, // project id when project view is active
  projectViewMode: 'list', // 'list' | 'gantt'
  weekViewMode: 'list',    // 'list' | 'gantt'
  activeView: 'week',
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

  renderTSTSection();
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

  // Build tree: roots first, then children indented
  const roots    = projects.filter(p => !p.parentId);
  const children = projects.filter(p =>  p.parentId);

  el.innerHTML = '';

  function addItem(p, depth) {
    const btn = document.createElement('button');
    btn.className = 'project-item';
    btn.dataset.projectId = p.id;
    if (depth > 0) btn.classList.add('project-child');
    btn.style.paddingLeft = `${8 + depth * 14}px`;
    btn.innerHTML = `
      ${depth > 0 ? '<span class="project-tree-line">↳</span>' : ''}
      <span class="project-dot ${p.type}"></span>
      <span class="project-name">${escHtml(p.name)}</span>
      ${p.status !== 'active' ? `<span class="project-status-badge">${p.status}</span>` : ''}
    `;
    btn.addEventListener('click', () => selectProject(p.id));
    el.appendChild(btn);

    // Recursively add children of this project
    children.filter(c => c.parentId === p.id).forEach(c => addItem(c, depth + 1));
  }

  roots.forEach(p => addItem(p, 0));

  // Orphans (parent was deleted)
  const renderedIds = new Set([...roots, ...children].map(p => p.id));
  projects.filter(p => !renderedIds.has(p.id)).forEach(p => addItem(p, 0));
}

function selectProject(id) {
  state.selectedProjectId = id;
  state.activeView = 'project';
  state.selectedDay = null;
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.project-item').forEach(b => {
    b.classList.toggle('active', b.dataset.projectId === id);
  });
  renderRightPanel();
}

function renderTSTSection() {
  const el = document.getElementById('tstSection');
  if (!el) return;

  const tasks   = Store.tasks();
  const sw      = state.selectedWeek;
  const sy      = state.selectedWeekYear;
  const { start, end } = weekRange(sw, sy);
  const todayDk = todayDateKey();
  const now     = new Date();
  const cwNum   = isoWeek(now);
  const cyNum   = isoWeekYear(now);

  // WST: week-level tasks (no specific day pinned) for selected week
  const wstCount = tasks.filter(t => t.week === sw && t.year === sy && !t.day && t.status !== 'done').length;

  // Build 7 day items with DST counts
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d  = new Date(start);
    d.setDate(start.getDate() + i);
    const dk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const dstCount = tasks.filter(t => t.day === dk && t.status !== 'done').length;
    days.push({ d, dk, dstCount });
  }

  const isCurrentWeek = sw === cwNum && sy === cyNum;
  const isWSTActive   = state.activeView === 'week' && !state.selectedDay && state.selectedWeek === sw;

  el.innerHTML = `
    <div class="tst-separator"></div>
    <button class="tst-wst-btn${isWSTActive ? ' active' : ''}" id="tstWSTBtn">
      <span class="nav-icon">📅</span>
      <span class="tst-wst-label">W${sw} · Week Tasks${isCurrentWeek ? ' ●' : ''}</span>
      ${wstCount > 0 ? `<span class="nav-badge">${wstCount}</span>` : ''}
    </button>
    <div class="tst-week-nav-row">
      <button class="tst-nav-btn" id="tstPrev">‹</button>
      <span class="tst-week-range">${formatDateShort(start)} – ${formatDateShort(end)}</span>
      <button class="tst-nav-btn" id="tstNext">›</button>
    </div>
    ${days.map(({ d, dk, dstCount }) => {
      const isToday    = dk === todayDk;
      const isSelected = dk === state.selectedDay;
      const dow  = d.toLocaleDateString('en-US', { weekday: 'short' });
      const date = `${d.toLocaleDateString('en-US', { month: 'short' })} ${d.getDate()}`;
      return `<button class="tst-day-item${isToday ? ' tst-today' : ''}${isSelected ? ' active' : ''}" data-dk="${dk}">
        <span class="tst-dow">${dow}</span>
        <span class="tst-date">${date}</span>
        ${dstCount > 0 ? `<span class="nav-badge">${dstCount}</span>` : ''}
      </button>`;
    }).join('')}
    <div class="tst-separator"></div>`;

  el.querySelector('#tstWSTBtn').addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    selectWeek(sw, sy);
  });
  el.querySelector('#tstPrev').addEventListener('click', e => { e.stopPropagation(); navigateTSTWeek(-1); });
  el.querySelector('#tstNext').addEventListener('click', e => { e.stopPropagation(); navigateTSTWeek(1); });
  el.querySelectorAll('.tst-day-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      selectDay(btn.dataset.dk, sw, sy);
    });
  });
}

function navigateTSTWeek(delta) {
  let w = state.selectedWeek + delta;
  let y = state.selectedWeekYear;
  if (w < 1)  { y--; w = 52; }
  if (w > 52) { y++; w = 1;  }
  state.selectedWeek = w;
  state.selectedWeekYear = y;
  state.selectedDay = null;
  // Scroll calendar to the correct month
  const { start } = weekRange(w, y);
  state.calMonth = start.getMonth();
  state.calYear  = start.getFullYear();
  renderAll();
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

// ===== Render: Calendar (removed) =====

function renderCalendar() {
  // calendar view removed
}

// ===== Select Week / Day =====

function selectWeek(week, year) {
  state.selectedWeek = week;
  state.selectedWeekYear = year;
  state.selectedDay = null;
  state.activeView = 'week';
  state.selectedProjectId = null;
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.project-item').forEach(b => b.classList.remove('active'));
  renderCalendar();
  renderRightPanel();
  renderSidebar();
}

function selectDay(dayKey, weekNum, weekYear) {
  state.selectedDay = dayKey;
  state.selectedWeek = weekNum;
  state.selectedWeekYear = weekYear;
  state.activeView = 'week';
  state.selectedProjectId = null;
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.project-item').forEach(b => b.classList.remove('active'));
  renderCalendar();
  renderRightPanel();
  renderSidebar();
}

// ===== Render: Project View =====

function renderProjectView() {
  const el = document.getElementById('projectView');
  const projects = Store.projects();
  const proj = projects.find(p => p.id === state.selectedProjectId);
  if (!proj) { el.innerHTML = '<div class="empty-state">Project not found.</div>'; return; }

  const parent   = proj.parentId ? projects.find(p => p.id === proj.parentId) : null;
  const children = projects.filter(p => p.parentId === proj.id);
  const tasks    = Store.tasks();
  const linked   = tasks.filter(t => t.project === proj.id);
  const isGantt  = state.projectViewMode === 'gantt';

  // Build breadcrumb trail (walk up the tree)
  const breadcrumb = [];
  let cur = parent;
  while (cur) {
    breadcrumb.unshift(cur);
    cur = cur.parentId ? projects.find(p => p.id === cur.parentId) : null;
  }

  el.innerHTML = `
    ${breadcrumb.length > 0 ? `
      <div class="proj-breadcrumb">
        ${breadcrumb.map(p => `<span class="proj-crumb" data-id="${p.id}">${escHtml(p.name)}</span>`).join('<span class="proj-crumb-sep">›</span>')}
        <span class="proj-crumb-sep">›</span>
        <span class="proj-crumb current">${escHtml(proj.name)}</span>
      </div>` : ''}
    <div class="proj-notes-section">
      <div class="proj-notes-header">
        <span class="proj-notes-label">Project Notes</span>
        <div style="display:flex;gap:6px;align-items:center">
          <button class="save-notes-btn" id="projEditBtn">Edit</button>
          <button class="save-notes-btn" id="projNotesSaveBtn">Save</button>
        </div>
      </div>
      <textarea class="proj-notes-textarea" id="projNotesTextarea"
        placeholder="Vision, goals, sequence, key reminders…">${escHtml(proj.notes || proj.description || '')}</textarea>
    </div>
    ${children.length > 0 ? `
      <div class="proj-sub-section">
        <div class="proj-sub-header">
          <span class="proj-notes-label">Sub-projects / Deliverables</span>
          <button class="btn-add-task-proj" id="projAddChildBtn">+ Sub-project</button>
        </div>
        <div class="proj-sub-list">
          ${children.map(c => {
            const childTasks  = tasks.filter(t => t.project === c.id);
            const done        = childTasks.filter(t => t.status === 'done').length;
            const pct         = childTasks.length ? Math.round(done / childTasks.length * 100) : 0;
            return `<div class="proj-sub-item" data-id="${c.id}">
              <span class="project-dot ${c.type}"></span>
              <span class="proj-sub-name">${escHtml(c.name)}</span>
              ${c.status !== 'active' ? `<span class="project-status-badge">${c.status}</span>` : ''}
              <span class="proj-sub-tasks">${childTasks.length} tasks</span>
              ${childTasks.length > 0 ? `
                <span class="proj-sub-pct">${pct}%</span>
                <div class="progress-bar-mini"><div class="progress-bar-fill" style="width:${pct}%"></div></div>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>` : `
      <div class="proj-sub-section proj-sub-empty">
        <button class="btn-add-task-proj" id="projAddChildBtn">+ Add Sub-project</button>
      </div>`}
    <div class="proj-tasks-section">
      <div class="proj-tasks-header">
        <span>Tasks <span class="proj-task-count">${linked.length}</span></span>
        <div class="proj-view-toggle">
          <button class="proj-toggle-btn${!isGantt ? ' active' : ''}" id="projListBtn">List</button>
          <button class="proj-toggle-btn${isGantt ? ' active' : ''}" id="projGanttBtn">Gantt</button>
        </div>
        <button class="btn-add-task-proj" id="projAddTaskBtn">+ Task</button>
      </div>
      <div class="proj-tasks-scroll" id="projTasksScroll"></div>
    </div>
  `;

  document.getElementById('projNotesSaveBtn').addEventListener('click', saveProjectNotes);
  document.getElementById('projEditBtn').addEventListener('click', () => openProjectModal(proj.id));
  document.getElementById('projAddTaskBtn').addEventListener('click', () => openTaskModal(null, { project: proj.id }));
  document.getElementById('projAddChildBtn').addEventListener('click', () => {
    openProjectModal(null);
    // Pre-select this project as parent after modal opens
    setTimeout(() => { document.getElementById('fProjectParent').value = proj.id; }, 0);
  });
  document.getElementById('projListBtn').addEventListener('click', () => {
    state.projectViewMode = 'list'; renderProjectView();
  });
  document.getElementById('projGanttBtn').addEventListener('click', () => {
    state.projectViewMode = 'gantt'; renderProjectView();
  });
  el.querySelectorAll('.proj-crumb[data-id]').forEach(c => {
    c.addEventListener('click', () => selectProject(c.dataset.id));
  });
  el.querySelectorAll('.proj-sub-item[data-id]').forEach(item => {
    item.addEventListener('click', () => selectProject(item.dataset.id));
  });

  if (isGantt) {
    renderProjectGantt(linked, el.querySelector('#projTasksScroll'));
  } else {
    renderProjectList(linked, el.querySelector('#projTasksScroll'));
  }
}

function renderProjectList(linked, scroll) {
  const active = linked.filter(t => t.status !== 'done');
  const done   = linked.filter(t => t.status === 'done');

  if (linked.length === 0) {
    scroll.innerHTML = '<div class="empty-state" style="padding:24px">No tasks linked to this project yet.</div>';
    return;
  }

  const now = new Date();
  const currentWeek = isoWeek(now);
  const currentYear = isoWeekYear(now);

  const weekMap = new Map();
  active.forEach(t => {
    const key = t.week && t.year ? `${t.year}-W${String(t.week).padStart(2,'0')}` : 'no-week';
    if (!weekMap.has(key)) weekMap.set(key, { week: t.week, year: t.year, tasks: [] });
    weekMap.get(key).tasks.push(t);
  });

  const sorted = [...weekMap.entries()].sort(([a], [b]) => {
    if (a === 'no-week') return 1;
    if (b === 'no-week') return -1;
    return a < b ? -1 : 1;
  });

  sorted.forEach(([, { week, year, tasks: weekTasks }]) => {
    const header = document.createElement('div');
    header.className = 'proj-week-header';
    if (week && year) {
      const { start, end } = weekRange(week, year);
      const isCurrent = week === currentWeek && year === currentYear;
      header.innerHTML = `
        <span class="proj-week-label${isCurrent ? ' current' : ''}">W${week} · ${formatDateShort(start)}–${formatDateShort(end)}</span>
        <span class="proj-week-count">${weekTasks.length}</span>`;
    } else {
      header.innerHTML = `<span class="proj-week-label">No week assigned</span>`;
    }
    scroll.appendChild(header);
    weekTasks.forEach(t => scroll.appendChild(buildTaskCard(t)));
  });

  if (done.length > 0) {
    const doneHeader = document.createElement('div');
    doneHeader.className = 'proj-week-header done-header';
    doneHeader.innerHTML = `<span class="proj-week-label">Completed</span><span class="proj-week-count">${done.length}</span>`;
    scroll.appendChild(doneHeader);
    done.forEach(t => scroll.appendChild(buildTaskCard(t)));
  }
}

function renderProjectGantt(linked, scroll) {
  const withWeek = linked.filter(t => t.week && t.year);
  if (withWeek.length === 0) {
    scroll.innerHTML = '<div class="empty-state" style="padding:24px">Assign weeks to tasks to see the Gantt chart.</div>';
    return;
  }

  // Compute week range
  const toOrd = t => t.year * 53 + t.week;
  const minOrd = Math.min(...withWeek.map(toOrd));
  const maxOrd = Math.max(...withWeek.map(toOrd));
  // Pad 1 week on each side, show at least 6 columns
  const pad = 1;
  const allWeeks = [];
  for (let ord = minOrd - pad; ord <= maxOrd + pad; ord++) {
    const y = Math.floor((ord - 1) / 53) || withWeek[0].year;
    const w = ((ord - 1) % 53) + 1;
    allWeeks.push({ week: w, year: y, ord });
  }
  // Ensure at least 6 columns
  while (allWeeks.length < 6) allWeeks.push({ week: allWeeks[allWeeks.length-1].week + 1, year: allWeeks[allWeeks.length-1].year, ord: allWeeks[allWeeks.length-1].ord + 1 });

  const now = new Date();
  const currOrd = isoWeekYear(now) * 53 + isoWeek(now);

  const COL_W = 72; // px per week column
  const LABEL_W = 160;
  const totalW = LABEL_W + allWeeks.length * COL_W;

  // Header row
  const header = document.createElement('div');
  header.className = 'gantt-header';
  header.style.width = totalW + 'px';
  header.innerHTML = `<div class="gantt-label-col"></div>` +
    allWeeks.map(({ week, year, ord }) => {
      const isCurr = ord === currOrd;
      return `<div class="gantt-week-col${isCurr ? ' gantt-current' : ''}" style="width:${COL_W}px">
        <span class="gantt-week-num">W${week}</span>
        <span class="gantt-week-yr">${year}</span>
      </div>`;
    }).join('');
  scroll.appendChild(header);

  // Task rows — sorted by week asc, done at bottom
  const active = withWeek.filter(t => t.status !== 'done').sort((a,b) => toOrd(a) - toOrd(b));
  const done   = withWeek.filter(t => t.status === 'done').sort((a,b) => toOrd(a) - toOrd(b));
  const noWeek = linked.filter(t => !t.week || !t.year);

  [...active, ...done, ...noWeek].forEach(task => {
    const row = document.createElement('div');
    row.className = 'gantt-row';
    row.style.width = totalW + 'px';
    row.addEventListener('click', () => openTaskModal(task.id));

    const label = document.createElement('div');
    label.className = 'gantt-label-col';
    label.title = task.title;
    label.innerHTML = `
      <span class="gantt-task-dot ${task.category}${task.status === 'done' ? ' done' : ''}"></span>
      <span class="gantt-task-name${task.status === 'done' ? ' done' : ''}">${escHtml(task.title)}</span>
      ${task.taskId ? `<span class="gantt-task-id">${escHtml(task.taskId)}</span>` : ''}
    `;
    row.appendChild(label);

    // Week cells
    allWeeks.forEach(({ week, year, ord }) => {
      const cell = document.createElement('div');
      cell.className = `gantt-cell${ord === currOrd ? ' gantt-current' : ''}`;
      cell.style.width = COL_W + 'px';

      if (task.week === week && task.year === year) {
        const effort = task.effort;
        const progress = task.progress || 0;
        const barClass = task.status === 'done' ? 'done'
          : task.category === 'work' ? 'work' : 'personal';
        const effortLabel = effort && effort !== 'TBD' ? effort : '';
        const remain = calcRemainEffort(effort, progress);
        const bar = document.createElement('div');
        bar.className = `gantt-bar ${barClass}`;
        bar.title = `${task.title}${effortLabel ? ' · ' + effortLabel : ''}${progress ? ' · ' + progress + '%' : ''}${remain ? ' · ' + remain + ' left' : ''}`;
        if (progress > 0 && progress < 100) {
          bar.innerHTML = `<div class="gantt-bar-done" style="width:${progress}%"></div><span class="gantt-bar-label">${progress}%</span>`;
        } else {
          bar.textContent = effortLabel;
        }
        cell.appendChild(bar);
      }
      row.appendChild(cell);
    });

    scroll.appendChild(row);
  });
}

function saveProjectNotes() {
  const text = document.getElementById('projNotesTextarea').value;
  const projects = Store.projects();
  const idx = projects.findIndex(p => p.id === state.selectedProjectId);
  if (idx === -1) return;
  projects[idx].notes = text;
  Store.saveProjects(projects);
  const btn = document.getElementById('projNotesSaveBtn');
  btn.textContent = 'Saved ✓';
  setTimeout(() => { if (btn) btn.textContent = 'Save'; }, 1200);
}

// ===== Archive View =====

function renderArchiveView() {
  const el = document.getElementById('archiveView');
  el.innerHTML = '';

  const archivedProjects = Store.archivedProjects();
  const archivedTasks    = Store.archivedTasks();

  if (archivedProjects.length === 0 && archivedTasks.length === 0) {
    el.innerHTML = '<div class="empty-state" style="padding:40px;flex-direction:column;gap:8px"><div style="font-size:28px">🗄</div><div>Archive is empty</div><div style="font-size:11px;color:var(--text-3)">Archived projects and tasks appear here</div></div>';
    return;
  }

  const scroll = document.createElement('div');
  scroll.className = 'archive-scroll';
  el.appendChild(scroll);

  // --- Archived Projects ---
  if (archivedProjects.length > 0) {
    const projSection = document.createElement('div');
    projSection.className = 'archive-section';
    projSection.innerHTML = `<div class="archive-section-title">Projects (${archivedProjects.length})</div>`;

    archivedProjects.forEach(proj => {
      const row = document.createElement('div');
      row.className = 'archive-row';
      row.innerHTML = `
        <span class="project-dot ${proj.type}"></span>
        <div class="archive-row-info">
          <span class="archive-row-name">${escHtml(proj.name)}</span>
          <span class="archive-row-meta">${proj.type} · ${proj.status}</span>
        </div>
        <div class="archive-row-actions">
          <button class="archive-btn restore" data-id="${proj.id}" data-type="project">Restore</button>
          <button class="archive-btn destroy" data-id="${proj.id}" data-type="project">Delete forever</button>
        </div>`;
      projSection.appendChild(row);
    });
    scroll.appendChild(projSection);
  }

  // --- Archived Tasks ---
  if (archivedTasks.length > 0) {
    const taskSection = document.createElement('div');
    taskSection.className = 'archive-section';
    taskSection.innerHTML = `<div class="archive-section-title">Tasks (${archivedTasks.length})</div>`;

    const allProjects = Store.allProjects();
    archivedTasks.forEach(task => {
      const proj = task.project ? allProjects.find(p => p.id === task.project) : null;
      const row = document.createElement('div');
      row.className = 'archive-row';
      row.innerHTML = `
        <span class="archive-task-dot ${task.category}"></span>
        <div class="archive-row-info">
          <span class="archive-row-name">${escHtml(task.title)}</span>
          <span class="archive-row-meta">
            ${task.category} · ${task.status}
            ${proj ? `· <em>${escHtml(proj.name)}</em>` : ''}
            ${task.taskId ? `· <code>${escHtml(task.taskId)}</code>` : ''}
          </span>
        </div>
        <div class="archive-row-actions">
          <button class="archive-btn restore" data-id="${task.id}" data-type="task">Restore</button>
          <button class="archive-btn destroy" data-id="${task.id}" data-type="task">Delete forever</button>
        </div>`;
      taskSection.appendChild(row);
    });
    scroll.appendChild(taskSection);
  }

  // Wire buttons
  scroll.querySelectorAll('.archive-btn.restore').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.type === 'task') {
        const tasks = Store.allTasks().map(t => t.id === btn.dataset.id ? { ...t, archived: false } : t);
        Store.saveTasks(tasks);
      } else {
        const projects = Store.allProjects().map(p => p.id === btn.dataset.id ? { ...p, archived: false } : p);
        Store.saveProjects(projects);
      }
      renderArchiveView();
      renderSidebar();
    });
  });

  scroll.querySelectorAll('.archive-btn.destroy').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Permanently delete this item? This cannot be undone.')) return;
      if (btn.dataset.type === 'task') {
        Store.saveTasks(Store.allTasks().filter(t => t.id !== btn.dataset.id));
      } else {
        Store.saveProjects(Store.allProjects().filter(p => p.id !== btn.dataset.id));
      }
      renderArchiveView();
      renderSidebar();
    });
  });
}

// ===== Visual Board =====

function renderBoardView() {
  const el       = document.getElementById('boardView');
  const projects = Store.projects();
  const tasks    = Store.tasks();

  el.innerHTML = '';

  const roots      = projects.filter(p => !p.parentId);
  const standalone = tasks.filter(t => !t.project);

  if (roots.length === 0 && standalone.length === 0) {
    el.innerHTML = '<div class="empty-state" style="padding:40px">No projects or tasks yet. Create a project to get started.</div>';
    return;
  }

  const scroll = document.createElement('div');
  scroll.className = 'board-scroll';
  el.appendChild(scroll);

  roots.forEach(root => {
    scroll.appendChild(buildBoardProjectCard(root, projects, tasks, 0));
  });

  // Standalone tasks column
  const active = standalone.filter(t => t.status !== 'done');
  const done   = standalone.filter(t => t.status === 'done');
  if (standalone.length > 0) {
    const card = document.createElement('div');
    card.className = 'board-card board-standalone';
    card.innerHTML = `
      <div class="board-card-top">
        <div class="board-card-header">
          <div class="board-card-icon">◈</div>
          <div class="board-card-meta">
            <div class="board-card-title">Standalone Tasks</div>
            <div class="board-card-sub">${active.length} active · ${done.length} done</div>
          </div>
        </div>
      </div>
      <div class="board-task-list">
        ${active.map(t => buildBoardTaskHtml(t)).join('')}
        ${done.length > 0 ? `<div class="board-done-label">Completed (${done.length})</div>${done.map(t => buildBoardTaskHtml(t, true)).join('')}` : ''}
      </div>`;
    card.querySelectorAll('.board-task-row').forEach(row => {
      row.addEventListener('click', () => openTaskModal(row.dataset.id));
    });
    scroll.appendChild(card);
  }
}

function buildBoardProjectCard(proj, allProjects, allTasks, depth) {
  const children   = allProjects.filter(p => p.parentId === proj.id);
  const projTasks  = allTasks.filter(t => t.project === proj.id);
  const active     = projTasks.filter(t => t.status !== 'done');
  const done       = projTasks.filter(t => t.status === 'done');
  const total      = projTasks.length;
  const pct        = total ? Math.round(done.length / total * 100) : 0;
  const notePreview = (proj.notes || proj.description || '').split('\n')[0].slice(0, 80);

  const wrapper = document.createElement('div');
  wrapper.className = `board-card-wrapper depth-${Math.min(depth, 3)}`;

  const card = document.createElement('div');
  card.className = `board-card ${proj.type}${depth > 0 ? ' board-card-child' : ''}`;

  card.innerHTML = `
    <div class="board-card-top">
      <div class="board-card-header" data-proj-id="${proj.id}">
        <span class="board-type-dot ${proj.type}"></span>
        <div class="board-card-meta">
          <div class="board-card-title">${escHtml(proj.name)}</div>
          <div class="board-card-sub">${proj.type} · <span class="board-status-${proj.status}">${proj.status}</span></div>
        </div>
        <button class="board-edit-btn" data-proj-id="${proj.id}">✎</button>
      </div>
      ${notePreview ? `<div class="board-note-preview">${escHtml(notePreview)}</div>` : ''}
      ${total > 0 ? `
        <div class="board-progress-row">
          <div class="board-progress-bar"><div class="board-progress-fill ${proj.type}" style="width:${pct}%"></div></div>
          <span class="board-progress-pct">${pct}% · ${done.length}/${total}</span>
        </div>` : '<div class="board-no-tasks">No tasks yet</div>'}
    </div>
    ${active.length > 0 ? `
    <div class="board-task-list">
      ${active.slice(0, 6).map(t => buildBoardTaskHtml(t)).join('')}
      ${active.length > 6 ? `<div class="board-task-more">+${active.length - 6} more tasks</div>` : ''}
    </div>` : ''}
  `;

  card.querySelector('.board-card-header').addEventListener('click', () => selectProject(proj.id));
  card.querySelector('.board-edit-btn').addEventListener('click', e => {
    e.stopPropagation(); openProjectModal(proj.id);
  });
  card.querySelectorAll('.board-task-row').forEach(row => {
    row.addEventListener('click', e => { e.stopPropagation(); openTaskModal(row.dataset.id); });
  });

  wrapper.appendChild(card);

  // Children nested below
  if (children.length > 0) {
    const childrenWrap = document.createElement('div');
    childrenWrap.className = 'board-children-wrap';
    children.forEach(child => {
      childrenWrap.appendChild(buildBoardProjectCard(child, allProjects, allTasks, depth + 1));
    });
    wrapper.appendChild(childrenWrap);
  }

  return wrapper;
}

function buildBoardTaskHtml(t, isDone = false) {
  const PRIORITY_COLOR = { high: '#ef4444', medium: '#f59e0b', low: '#6ee7b7' };
  const remain = calcRemainEffort(t.effort, t.progress);
  return `<div class="board-task-row${isDone ? ' done' : ''}" data-id="${t.id}">
    <span class="board-task-priority" style="background:${PRIORITY_COLOR[t.priority] || '#e2e8f0'}"></span>
    <span class="board-task-name">${escHtml(t.title)}</span>
    <span class="board-task-badges">
      ${t.effort && t.effort !== 'TBD' ? `<span class="board-task-badge">${t.effort}</span>` : ''}
      ${t.progress > 0 ? `<span class="board-task-badge accent">${t.progress}%</span>` : ''}
      ${remain && !isDone ? `<span class="board-task-badge warn">${remain}</span>` : ''}
      ${t.taskId ? `<span class="board-task-badge mono">${escHtml(t.taskId)}</span>` : ''}
    </span>
  </div>`;
}

// ===== Right Panel Router =====

function renderRightPanel() {
  const dayView     = document.getElementById('dayView');
  const todayView   = document.getElementById('todayView');
  const inboxView   = document.getElementById('inboxView');
  const weekView    = document.getElementById('weekView');
  const projectView = document.getElementById('projectView');
  const boardView   = document.getElementById('boardView');
  const archiveView = document.getElementById('archiveView');
  const titleEl     = document.querySelector('.week-panel-title');
  const datesEl     = document.querySelector('.week-panel-dates');
  const generateBtn = document.getElementById('generateNoteBtn');

  [dayView, todayView, inboxView, weekView, projectView, boardView, archiveView].forEach(el => el.classList.add('hidden'));
  generateBtn.classList.add('hidden');

  if (state.activeView === 'today') {
    todayView.classList.remove('hidden');
    titleEl.textContent = "Today's Focus";
    datesEl.textContent = new Date().toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' });
    renderTodayView();
  } else if (state.activeView === 'inbox') {
    inboxView.classList.remove('hidden');
    titleEl.textContent = 'Inbox Review';
    datesEl.textContent = 'Process and sort your captured tasks';
    renderInboxReview();
  } else if (state.activeView === 'archive') {
    archiveView.classList.remove('hidden');
    titleEl.textContent = 'Archive';
    datesEl.textContent = 'Archived projects and tasks — restore or delete permanently';
    renderArchiveView();
  } else if (state.activeView === 'board') {
    boardView.classList.remove('hidden');
    titleEl.textContent = 'Visual Board';
    datesEl.textContent = 'Project & task relationships';
    renderBoardView();
  } else if (state.activeView === 'project') {
    projectView.classList.remove('hidden');
    const proj = Store.projects().find(p => p.id === state.selectedProjectId);
    if (proj) {
      titleEl.textContent = proj.name;
      const parent = proj.parentId ? Store.projects().find(p => p.id === proj.parentId) : null;
      datesEl.textContent = (parent ? parent.name + ' › ' : '') +
        proj.type.charAt(0).toUpperCase() + proj.type.slice(1) + ' · ' + proj.status;
    }
    renderProjectView();
  } else if (state.selectedDay) {
    dayView.classList.remove('hidden');
    generateBtn.classList.remove('hidden');
    const d = new Date(state.selectedDay + 'T00:00:00');
    titleEl.textContent = d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
    const { start, end } = weekRange(state.selectedWeek, state.selectedWeekYear);
    datesEl.textContent = `Week ${state.selectedWeek} · ${formatDateShort(start)}–${formatDateShort(end)}`;
    renderDayView();
  } else {
    weekView.classList.remove('hidden');
    generateBtn.classList.remove('hidden');
    renderWeekPanel();
  }
}

// ===== Render: Day View =====

function renderDayView() {
  const el = document.getElementById('dayView');
  const { selectedDay: dk, selectedWeek: w, selectedWeekYear: y } = state;
  const tasks    = Store.tasks();
  const notes    = Store.weekNotes();
  const weekKey  = `${y}-W${w}`;

  // Day-pinned tasks (t.day === dk)
  const pinned     = tasks.filter(t => t.day === dk && t.status !== 'done');
  const pinnedDone = tasks.filter(t => t.day === dk && t.status === 'done');

  // Week tasks with no specific day (context)
  const weekActive = tasks.filter(t => t.week === w && t.year === y && !t.day && t.status !== 'done');
  const weekDone   = tasks.filter(t => t.week === w && t.year === y && !t.day && t.status === 'done');

  el.innerHTML = `
    <div class="day-notes-bar">
      <div class="day-notes-head">
        <span class="day-notes-label">Week ${w} Notes</span>
        <button class="save-notes-btn" id="dayNotesSaveBtn">Save</button>
      </div>
      <textarea class="day-notes-ta" id="dayNotesTa"
        placeholder="Week ${w} reflections, blockers, learnings…">${escHtml(notes[weekKey] || '')}</textarea>
    </div>
    <div class="day-tasks-scroll">
      <div>
        <div class="day-section-head">
          <span>📌 Day tasks <span class="day-pinned-chip">${pinned.length + pinnedDone.length}</span></span>
          <button class="today-action-link" id="addPinnedBtn">+ Add</button>
        </div>
        <div id="dayPinnedList" style="margin-top:6px"></div>
      </div>
      <div>
        <div class="day-section-head">
          <span>📋 Week ${w} tasks <span class="day-pinned-chip" style="background:#f0fdf4;color:#166534">${weekActive.length + weekDone.length}</span></span>
          <button class="today-action-link" id="addWeekBtn">+ Add</button>
        </div>
        <div id="dayWeekList" style="margin-top:6px"></div>
      </div>
    </div>`;

  const pinnedList = el.querySelector('#dayPinnedList');
  const weekList   = el.querySelector('#dayWeekList');

  if (pinned.length + pinnedDone.length === 0) {
    pinnedList.innerHTML = '<div class="today-empty">No tasks pinned to this day — use "+ Add" or set a Specific Day in any task</div>';
  }
  [...pinned, ...pinnedDone].forEach(t => pinnedList.appendChild(buildTaskCard(t)));

  if (weekActive.length + weekDone.length === 0) {
    weekList.innerHTML = '<div class="today-empty">No week tasks yet</div>';
  }
  [...weekActive, ...weekDone].forEach(t => weekList.appendChild(buildTaskCard(t)));

  el.querySelector('#dayNotesSaveBtn').addEventListener('click', saveWeekNotes);
  el.querySelector('#addPinnedBtn').addEventListener('click', () => openTaskModal(null, dk));
  el.querySelector('#addWeekBtn').addEventListener('click', () => openTaskModal(null, null));
}

// ===== Today's Focus =====

let focusState = { queue: [], doneIds: [] };

function renderTodayView() {
  const el     = document.getElementById('todayView');
  const plan   = Store.todayPlan();
  const tasks  = Store.tasks();
  const cw     = isoWeek(new Date());
  const cy     = isoWeekYear(new Date());

  // Prune done tasks from queue
  const queueIds = plan.taskIds.filter(id => {
    const t = tasks.find(t => t.id === id);
    return t && t.status !== 'done';
  });
  if (queueIds.length !== plan.taskIds.length) {
    plan.taskIds = queueIds; Store.saveTodayPlan(plan);
  }

  const queueTasks = queueIds.map(id => tasks.find(t => t.id === id)).filter(Boolean);
  const weekTasks  = tasks.filter(t =>
    t.week === cw && t.year === cy && t.status !== 'done' && !queueIds.includes(t.id)
  );
  // Sort week tasks: high first, then by category
  weekTasks.sort((a,b) => {
    const p = { high:0, medium:1, low:2 };
    return (p[a.priority]||1) - (p[b.priority]||1);
  });

  el.innerHTML = `
    <div class="today-plan-header">
      <div>
        <div class="today-plan-date">${new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</div>
        <div class="today-plan-sub">${queueTasks.length} in queue · ${weekTasks.length} remaining this week</div>
      </div>
      <button class="btn-focus-start" id="startFocusBtn" ${queueTasks.length===0?'disabled':''}>▶ Focus</button>
    </div>
    <div class="today-body">
      <div>
        <div class="today-section-title">
          <span>🎯 Focus Queue (${queueTasks.length})</span>
          ${queueTasks.length > 0 ? `<button class="today-action-link danger" id="clearQueueBtn">Clear all</button>` : ''}
        </div>
        ${queueTasks.length === 0
          ? `<div class="today-empty">Add tasks from below to build your focus list</div>`
          : queueTasks.map((t,i) => {
              const proj = t.project ? Store.projects().find(p=>p.id===t.project) : null;
              return `<div class="today-queue-item ${t.category}" style="margin-top:5px">
                <span class="today-queue-num">${i+1}</span>
                <span class="today-queue-title">${escHtml(t.title)}</span>
                <span class="task-tag priority-${t.priority}">${t.priority}</span>
                ${proj ? `<span class="task-tag status" style="max-width:70px;overflow:hidden;text-overflow:ellipsis">${escHtml(proj.name)}</span>` : ''}
                <button class="today-queue-remove" data-remove="${t.id}">×</button>
              </div>`;
            }).join('')
        }
      </div>
      <div>
        <div class="today-section-title">
          <span>📋 Week ${cw} — Pick tasks (${weekTasks.length})</span>
          ${weekTasks.length > 0 ? `<button class="today-action-link" id="addAllBtn">Add all</button>` : ''}
        </div>
        ${weekTasks.length === 0
          ? `<div class="today-empty">All this week's tasks are queued or done ✓</div>`
          : weekTasks.map(t => {
              const proj = t.project ? Store.projects().find(p=>p.id===t.project) : null;
              return `<div class="today-pick-item" style="margin-top:5px">
                <div class="today-pick-info">
                  <span class="today-pick-title">${escHtml(t.title)}</span>
                  <div class="today-pick-meta">
                    <span class="task-tag priority-${t.priority}">${t.priority}</span>
                    ${t.context ? `<span class="task-tag context">${escHtml(t.context)}</span>` : ''}
                    ${proj ? `<span class="task-tag status">${escHtml(proj.name)}</span>` : ''}
                  </div>
                </div>
                <button class="today-add-btn" data-add="${t.id}">+ Queue</button>
              </div>`;
            }).join('')
        }
      </div>
    </div>`;

  el.querySelector('#startFocusBtn')?.addEventListener('click', openFocusMode);
  el.querySelector('#clearQueueBtn')?.addEventListener('click', () => {
    const p = Store.todayPlan(); p.taskIds = []; Store.saveTodayPlan(p);
    renderTodayView();
  });
  el.querySelector('#addAllBtn')?.addEventListener('click', () => {
    const p = Store.todayPlan();
    weekTasks.forEach(t => { if (!p.taskIds.includes(t.id)) p.taskIds.push(t.id); });
    Store.saveTodayPlan(p); renderTodayView();
  });
  el.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = Store.todayPlan();
      p.taskIds = p.taskIds.filter(id => id !== btn.dataset.remove);
      Store.saveTodayPlan(p); renderTodayView();
    });
  });
  el.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = Store.todayPlan();
      if (!p.taskIds.includes(btn.dataset.add)) p.taskIds.push(btn.dataset.add);
      Store.saveTodayPlan(p); renderTodayView();
    });
  });
}

// ===== Focus Mode =====

function openFocusMode() {
  const plan  = Store.todayPlan();
  const tasks = Store.tasks();
  focusState.queue  = plan.taskIds.filter(id => {
    const t = tasks.find(t => t.id === id);
    return t && t.status !== 'done';
  });
  focusState.doneIds = [];
  if (focusState.queue.length === 0) return;
  renderFocusMode(0);
  document.getElementById('focusModeOverlay').classList.remove('hidden');
}

function closeFocusMode() {
  document.getElementById('focusModeOverlay').classList.add('hidden');
  renderAll();
}

function renderFocusMode(index) {
  const overlay  = document.getElementById('focusModeOverlay');
  const allTasks = Store.tasks();
  const projects = Store.projects();

  const active = focusState.queue
    .map(id => allTasks.find(t => t.id === id))
    .filter(t => t && t.status !== 'done');

  if (active.length === 0) {
    overlay.innerHTML = `
      <div class="focus-complete">
        <div class="focus-complete-icon">🎉</div>
        <h2>Session complete!</h2>
        <p>All queued tasks are done — great work.</p>
        <button class="btn-primary" style="margin-top:8px" id="focusDoneExitBtn">Back to planner</button>
      </div>`;
    overlay.querySelector('#focusDoneExitBtn').addEventListener('click', closeFocusMode);
    return;
  }

  const i    = Math.max(0, Math.min(index, active.length - 1));
  const task = active[i];
  const proj = task.project ? projects.find(p => p.id === task.project) : null;

  const related = proj
    ? allTasks.filter(t => t.project === task.project && t.id !== task.id && t.status !== 'done').slice(0, 4)
    : [];

  const dots = active.map((t, di) =>
    `<span class="focus-dot ${di < i ? 'done' : di === i ? 'active' : ''}" title="${escHtml(t.title)}"></span>`
  ).join('');

  overlay.innerHTML = `
    <div class="focus-wrap">
      <div class="focus-topbar">
        <div class="focus-progress">
          ${dots}
          <span class="focus-count">${i+1} / ${active.length}</span>
        </div>
        <button class="focus-exit-btn" id="focusExitBtn">✕ Exit Focus</button>
      </div>

      <div class="focus-card ${task.category}">
        <div class="focus-card-eyebrow">${task.category}${proj ? ' · ' + escHtml(proj.name) : ''}</div>
        <div class="focus-card-title">${escHtml(task.title)}</div>
        <div class="focus-card-chips">
          <span class="task-tag priority-${task.priority}">${task.priority}</span>
          ${task.context ? `<span class="task-tag context">${escHtml(task.context)}</span>` : ''}
          <span class="task-tag status">${task.status}</span>
        </div>
        ${task.notes ? `<div class="focus-card-notes">${escHtml(task.notes)}</div>` : ''}
      </div>

      <div class="focus-actions">
        <button class="focus-btn done" id="focusDoneBtn">✓ Done</button>
        <button class="focus-btn skip" id="focusSkipBtn">→ Skip</button>
        <button class="focus-btn edit" id="focusEditBtn">✎</button>
      </div>

      ${related.length > 0 ? `
        <div class="focus-related">
          <div class="focus-related-label">Related · ${escHtml(proj.name)}</div>
          ${related.map(r => `
            <div class="focus-related-row">
              <span class="focus-related-name">${escHtml(r.title)}</span>
              <button class="focus-related-promote" data-promote="${r.id}">do next →</button>
            </div>`).join('')}
        </div>` : ''}
    </div>`;

  overlay.querySelector('#focusExitBtn').addEventListener('click', closeFocusMode);

  overlay.querySelector('#focusDoneBtn').addEventListener('click', () => {
    toggleTaskDone(task.id);
    focusState.doneIds.push(task.id);
    renderFocusMode(i); // active list shrinks, same index lands on next task
  });

  overlay.querySelector('#focusSkipBtn').addEventListener('click', () => {
    // Move current task to end of queue
    focusState.queue = [...focusState.queue.filter(id => id !== task.id), task.id];
    renderFocusMode(i); // same index, next task is now at position i
  });

  overlay.querySelector('#focusEditBtn').addEventListener('click', () => {
    closeFocusMode();
    openTaskModal(task.id);
  });

  overlay.querySelectorAll('[data-promote]').forEach(btn => {
    btn.addEventListener('click', () => {
      const rid = btn.dataset.promote;
      // Add to queue right after current if not already there
      if (!focusState.queue.includes(rid)) {
        focusState.queue.splice(i + 1, 0, rid);
        // Also add to today plan
        const p = Store.todayPlan();
        if (!p.taskIds.includes(rid)) { p.taskIds.splice(i+1, 0, rid); Store.saveTodayPlan(p); }
      }
      renderFocusMode(i + 1);
    });
  });
}

// ===== Render: Inbox Review =====

function renderInboxReview() {
  const tasks = Store.tasks().filter(t => t.status === 'inbox');
  const now = new Date();
  const cw = isoWeek(now);
  const cy = isoWeekYear(now);

  const summary = document.getElementById('inboxSummary');
  const list = document.getElementById('inboxList');

  summary.innerHTML = tasks.length > 0
    ? `<strong>${tasks.length} task${tasks.length > 1 ? 's' : ''}</strong> waiting to be processed`
    : '';

  if (tasks.length === 0) {
    list.innerHTML = `
      <div class="inbox-all-done">
        <div class="done-icon">✓</div>
        <strong>Inbox zero!</strong>
        All tasks have been processed.
      </div>`;
    return;
  }

  list.innerHTML = '';
  tasks.forEach(task => {
    const card = document.createElement('div');
    card.className = `inbox-card ${task.category}`;
    card.dataset.id = task.id;

    const projects = Store.projects();
    const proj = task.project ? projects.find(p => p.id === task.project) : null;

    card.innerHTML = `
      <div class="inbox-card-top">
        <div class="inbox-card-title">${escHtml(task.title)}</div>
        <button class="inbox-card-edit" title="Edit task" data-action="edit">✎</button>
      </div>
      <div class="inbox-card-meta">
        <span class="task-tag priority-${task.priority}">${task.priority}</span>
        ${task.context ? `<span class="task-tag context">${escHtml(task.context)}</span>` : ''}
        ${proj ? `<span class="task-tag status">${escHtml(proj.name)}</span>` : ''}
        ${task.notes ? `<span class="task-tag status" title="${escHtml(task.notes)}">has notes</span>` : ''}
      </div>
      <div class="inbox-actions">
        <button class="action-btn today" data-action="today">Today</button>
        <button class="action-btn this-week" data-action="this-week">This Week (W${cw})</button>
        <div class="week-picker-wrap">
          <input class="week-picker-input" type="number" min="1" max="53"
            value="${cw + 1}" placeholder="Wk" title="Schedule to week">
          <button class="week-picker-confirm" data-action="schedule">→ Week</button>
        </div>
        <button class="action-btn someday" data-action="someday">Someday</button>
        <button class="action-btn waiting" data-action="waiting">Waiting</button>
        <button class="action-btn delete" data-action="delete">✕</button>
      </div>`;

    // Wire action buttons
    card.querySelector('[data-action="edit"]').addEventListener('click', () => openTaskModal(task.id));
    card.querySelector('[data-action="today"]').addEventListener('click', () =>
      processInboxTask(task.id, 'next', cw, cy));
    card.querySelector('[data-action="this-week"]').addEventListener('click', () =>
      processInboxTask(task.id, 'next', cw, cy));
    card.querySelector('[data-action="someday"]').addEventListener('click', () =>
      processInboxTask(task.id, 'someday', null, null));
    card.querySelector('[data-action="waiting"]').addEventListener('click', () =>
      processInboxTask(task.id, 'waiting', null, null));
    card.querySelector('[data-action="delete"]').addEventListener('click', () => {
      const tasks = Store.tasks().filter(t => t.id !== task.id);
      Store.saveTasks(tasks);
      renderAll();
    });
    card.querySelector('[data-action="schedule"]').addEventListener('click', () => {
      const wInput = card.querySelector('.week-picker-input');
      const wNum = parseInt(wInput.value);
      if (wNum >= 1 && wNum <= 53) processInboxTask(task.id, 'next', wNum, cy);
    });

    list.appendChild(card);
  });
}

function processInboxTask(taskId, newStatus, week, year) {
  const tasks = Store.tasks();
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  task.status = newStatus;
  if (week) task.week = week;
  if (year) task.year = year;
  Store.saveTasks(tasks);
  renderAll();
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

  // Sync toggle button state
  const isGantt = state.weekViewMode === 'gantt';
  document.getElementById('weekListBtn').classList.toggle('active', !isGantt);
  document.getElementById('weekGanttBtn').classList.toggle('active', isGantt);
  document.getElementById('weekListView').classList.toggle('hidden', isGantt);
  document.getElementById('weekGanttView').classList.toggle('hidden', !isGantt);
  // Tab bar only shown in list mode
  document.getElementById('weekTabBar').style.display = isGantt ? 'none' : '';

  if (isGantt) {
    renderWeekGantt();
  } else {
    renderWeekTasks();
  }
}

function renderWeekTasks() {
  const { selectedWeek: w, selectedWeekYear: y, activeTab } = state;
  const tasks = Store.tasks().filter(t => t.week === w && t.year === y);
  const filtered = activeTab === 'all' ? tasks : tasks.filter(t => t.category === activeTab);

  const container = document.getElementById('weekListView');
  container.innerHTML = '';

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No tasks for this week. Add one!';
    container.appendChild(empty);
  } else {
    const active = filtered.filter(t => t.status !== 'done');
    const done   = filtered.filter(t => t.status === 'done');
    if (active.length > 0) {
      if (activeTab === 'all') renderTaskGroup(container, 'Active', active);
      else active.forEach(t => container.appendChild(buildTaskCard(t)));
    }
    if (done.length > 0) {
      const doneTitle = document.createElement('div');
      doneTitle.className = 'section-group-title';
      doneTitle.textContent = `Completed (${done.length})`;
      container.appendChild(doneTitle);
      done.forEach(t => container.appendChild(buildTaskCard(t)));
    }
  }

  const addBtn = document.createElement('button');
  addBtn.className = 'task-card-add';
  addBtn.innerHTML = '<span>+</span> Add task to this week';
  addBtn.addEventListener('click', () => openTaskModal(null));
  container.appendChild(addBtn);
}

function renderWeekGantt() {
  const { selectedWeek: w, selectedWeekYear: y } = state;
  const { start } = weekRange(w, y);
  const el = document.getElementById('weekGanttView');
  el.innerHTML = '';

  // Build the 7 days Mon–Sun
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    days.push({ d, key, label: d.toLocaleDateString('en-US',{weekday:'short'}), date: d.getDate() });
  }

  const allTasks = Store.tasks().filter(t => t.week === w && t.year === y);
  const dst = allTasks.filter(t => t.day); // day-specific
  const wst = allTasks.filter(t => !t.day); // week-level only

  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

  const LABEL_W = 150;
  const COL_W = 80;
  const totalW = LABEL_W + days.length * COL_W;

  // Header
  const header = document.createElement('div');
  header.className = 'gantt-header';
  header.style.width = totalW + 'px';
  header.innerHTML = `<div class="gantt-label-col" style="width:${LABEL_W}px;min-width:${LABEL_W}px"></div>` +
    days.map(({ label, date, key }) => `
      <div class="gantt-week-col${key === todayKey ? ' gantt-current' : ''}" style="width:${COL_W}px">
        <span class="gantt-week-num">${label}</span>
        <span class="gantt-week-yr">${date}</span>
      </div>`).join('');
  el.appendChild(header);

  if (allTasks.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.style.padding = '24px';
    empty.textContent = 'No tasks for this week.';
    el.appendChild(empty);
    return;
  }

  // DST rows — each has a bar on its specific day
  if (dst.length > 0) {
    const secHeader = document.createElement('div');
    secHeader.className = 'wgantt-section-header';
    secHeader.style.width = totalW + 'px';
    secHeader.textContent = `Day Tasks (${dst.length})`;
    el.appendChild(secHeader);

    dst.sort((a, b) => (a.day > b.day ? 1 : -1)).forEach(task => {
      const row = document.createElement('div');
      row.className = 'gantt-row';
      row.style.width = totalW + 'px';
      row.addEventListener('click', () => openTaskModal(task.id));

      const label = buildGanttLabel(task, LABEL_W);
      row.appendChild(label);

      days.forEach(({ key }) => {
        const cell = document.createElement('div');
        cell.className = `gantt-cell${key === todayKey ? ' gantt-current' : ''}`;
        cell.style.width = COL_W + 'px';
        if (task.day === key) {
          cell.appendChild(buildGanttBar(task));
        }
        row.appendChild(cell);
      });
      el.appendChild(row);
    });
  }

  // WST rows — bar spans all 7 days
  if (wst.length > 0) {
    const secHeader = document.createElement('div');
    secHeader.className = 'wgantt-section-header';
    secHeader.style.width = totalW + 'px';
    secHeader.textContent = `Week Tasks (${wst.length})`;
    el.appendChild(secHeader);

    wst.sort((a, b) => (a.priority === 'high' ? -1 : b.priority === 'high' ? 1 : 0)).forEach(task => {
      const row = document.createElement('div');
      row.className = 'gantt-row';
      row.style.width = totalW + 'px';
      row.addEventListener('click', () => openTaskModal(task.id));

      const label = buildGanttLabel(task, LABEL_W);
      row.appendChild(label);

      // Single spanning cell across all 7 days
      const spanCell = document.createElement('div');
      spanCell.style.cssText = `display:flex;align-items:center;width:${COL_W * 7}px;padding:3px 4px;`;
      const bar = buildGanttBar(task, true);
      spanCell.appendChild(bar);
      row.appendChild(spanCell);
      el.appendChild(row);
    });
  }

  // + Add task row
  const addRow = document.createElement('button');
  addRow.className = 'task-card-add';
  addRow.style.cssText = `margin:8px 12px;width:calc(100% - 24px);`;
  addRow.innerHTML = '<span>+</span> Add task to this week';
  addRow.addEventListener('click', () => openTaskModal(null));
  el.appendChild(addRow);
}

function buildGanttLabel(task, width) {
  const label = document.createElement('div');
  label.className = 'gantt-label-col';
  label.style.cssText = `width:${width}px;min-width:${width}px;`;
  label.title = task.title;
  label.innerHTML = `
    <span class="gantt-task-dot ${task.category}${task.status==='done'?' done':''}"></span>
    <span class="gantt-task-name${task.status==='done'?' done':''}">${escHtml(task.title)}</span>
    ${task.taskId ? `<span class="gantt-task-id">${escHtml(task.taskId)}</span>` : ''}`;
  return label;
}

function buildGanttBar(task, spanning = false) {
  const progress = task.progress || 0;
  const effort = task.effort;
  const barClass = task.status === 'done' ? 'done' : task.category === 'work' ? 'work' : 'personal';
  const effortLabel = effort && effort !== 'TBD' ? effort : '';
  const remain = calcRemainEffort(effort, progress);
  const bar = document.createElement('div');
  bar.className = `gantt-bar ${barClass}${spanning ? ' gantt-bar-span' : ''}`;
  bar.title = `${task.title}${effortLabel ? ' · '+effortLabel : ''}${progress ? ' · '+progress+'%' : ''}${remain ? ' · '+remain+' left' : ''}`;
  if (progress > 0 && progress < 100) {
    bar.innerHTML = `<div class="gantt-bar-done" style="width:${progress}%"></div><span class="gantt-bar-label">${spanning ? task.title.slice(0,22) + (task.title.length>22?'…':'') + (effortLabel?' · '+effortLabel:'') : progress+'%'}</span>`;
  } else {
    bar.textContent = spanning ? (task.title.slice(0,28) + (task.title.length>28?'…':'')) + (effortLabel?' · '+effortLabel:'') : effortLabel;
  }
  return bar;
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

  if (task.day) {
    const d = new Date(task.day + 'T00:00:00');
    const dayTag = document.createElement('span');
    dayTag.className = 'day-pinned-chip';
    dayTag.textContent = d.toLocaleDateString('en-US', { month:'short', day:'numeric' });
    meta.appendChild(dayTag);
  }

  if (task.effort && task.effort !== 'TBD') {
    const effortTag = document.createElement('span');
    const cls = { '10min':'min10','20min':'min20','60min':'min60','90min':'min90','120min':'min120' }[task.effort] || 'min60';
    effortTag.className = `effort-badge ${cls}`;
    effortTag.textContent = task.effort;
    meta.appendChild(effortTag);
  }

  if (task.progress > 0) {
    const remain = calcRemainEffort(task.effort, task.progress);
    const progWrap = document.createElement('span');
    progWrap.className = 'progress-inline';
    progWrap.innerHTML = `
      <span class="progress-bar-mini"><span class="progress-bar-fill" style="width:${task.progress}%"></span></span>
      <span class="progress-pct">${task.progress}%</span>
      ${remain ? `<span class="remain-badge">${remain} left</span>` : ''}`;
    meta.appendChild(progWrap);
  }

  if (task.taskId) {
    const idTag = document.createElement('span');
    idTag.className = 'effort-badge tbd';
    idTag.style.fontFamily = 'monospace';
    idTag.textContent = task.taskId;
    meta.appendChild(idTag);
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

function openTaskModal(taskId, defaults = null) {
  const prefillDay = defaults && defaults.day ? defaults.day : (typeof defaults === 'string' ? defaults : null);
  state.editingTaskId = taskId;
  const modal = document.getElementById('taskModalOverlay');
  const titleEl = document.getElementById('taskModalTitle');
  const deleteBtn = document.getElementById('deleteTaskBtn');

  populateProjectDropdown('fTaskProject');

  const projSelect = document.getElementById('fTaskProject');

  if (taskId) {
    const task = Store.tasks().find(t => t.id === taskId);
    if (!task) return;
    titleEl.textContent = 'Edit Task';
    deleteBtn.classList.remove('hidden');
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('fTaskId').value = task.taskId || '';
    document.getElementById('fTaskTitle').value = task.title;
    document.getElementById('fTaskCategory').value = task.category;
    document.getElementById('fTaskPriority').value = task.priority;
    document.getElementById('fTaskStatus').value = task.status;
    document.getElementById('fTaskEffort').value = task.effort || 'TBD';
    document.getElementById('fTaskProgress').value = task.progress ?? 0;
    projSelect.value = task.project || '';
    document.getElementById('fTaskWeek').value = task.week || '';
    document.getElementById('fTaskYear').value = task.year || '';
    document.getElementById('fTaskDay').value = task.day || '';
    document.getElementById('fTaskContext').value = task.context || '';
    document.getElementById('fTaskNotes').value = task.notes || '';
  } else {
    titleEl.textContent = 'Add Task';
    deleteBtn.classList.add('hidden');
    document.getElementById('editTaskId').value = '';
    document.getElementById('fTaskTitle').value = '';
    document.getElementById('fTaskCategory').value = 'work';
    document.getElementById('fTaskPriority').value = 'medium';
    document.getElementById('fTaskStatus').value = 'next';
    document.getElementById('fTaskEffort').value = 'TBD';
    document.getElementById('fTaskProgress').value = 0;
    projSelect.value = (defaults && defaults.project) || '';
    document.getElementById('fTaskWeek').value = state.selectedWeek || isoWeek(new Date());
    document.getElementById('fTaskYear').value = state.selectedWeekYear || isoWeekYear(new Date());
    document.getElementById('fTaskDay').value = prefillDay || state.selectedDay || '';
    document.getElementById('fTaskContext').value = '';
    document.getElementById('fTaskNotes').value = '';
    document.getElementById('fTaskId').value = generateTaskId(projSelect.value);
  }

  function updateRemain() {
    const effort = document.getElementById('fTaskEffort').value;
    const progress = parseInt(document.getElementById('fTaskProgress').value, 10);
    document.getElementById('fTaskRemain').value = calcRemainEffort(effort, progress) || '—';
  }
  updateRemain();
  document.getElementById('fTaskEffort').onchange = updateRemain;
  document.getElementById('fTaskProgress').onchange = updateRemain;

  // Regenerate preview ID when project changes (new tasks only)
  projSelect.onchange = () => {
    if (!taskId) document.getElementById('fTaskId').value = generateTaskId(projSelect.value);
  };

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

  const rawDay = document.getElementById('fTaskDay').value;
  const projectVal = document.getElementById('fTaskProject').value;
  const taskData = {
    title,
    category: document.getElementById('fTaskCategory').value,
    priority: document.getElementById('fTaskPriority').value,
    status: document.getElementById('fTaskStatus').value,
    effort: document.getElementById('fTaskEffort').value,
    progress: parseInt(document.getElementById('fTaskProgress').value, 10) || 0,
    project: projectVal,
    week: parseInt(document.getElementById('fTaskWeek').value) || isoWeek(new Date()),
    year: parseInt(document.getElementById('fTaskYear').value) || isoWeekYear(new Date()),
    day: rawDay || null,
    context: document.getElementById('fTaskContext').value.trim(),
    notes: document.getElementById('fTaskNotes').value.trim(),
  };

  if (id) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx >= 0) {
      tasks[idx] = { ...tasks[idx], ...taskData };
    }
  } else {
    const taskId = document.getElementById('fTaskId').value || generateTaskId(projectVal);
    tasks.push({ id: uid(), taskId, ...taskData, completedAt: null, createdAt: new Date().toISOString() });
  }

  Store.saveTasks(tasks);
  closeTaskModal();
  renderAll();
}

function deleteTask() {
  const id = document.getElementById('editTaskId').value;
  if (!id) return;
  const tasks = Store.allTasks().map(t => t.id === id ? { ...t, archived: true } : t);
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

function openProjectModal(editId = null) {
  const projects = Store.projects();
  const editing  = editId ? projects.find(p => p.id === editId) : null;

  document.getElementById('projectModalTitle').textContent = editing ? 'Edit Project' : 'New Project';
  document.getElementById('editProjectId').value  = editId || '';
  document.getElementById('fProjectName').value   = editing ? editing.name : '';
  document.getElementById('fProjectType').value   = editing ? editing.type : 'personal';
  document.getElementById('fProjectStatus').value = editing ? editing.status : 'active';
  document.getElementById('fProjectDesc').value   = editing ? (editing.notes || editing.description || '') : '';
  document.getElementById('deleteProjectBtn').classList.toggle('hidden', !editing);

  // Populate parent dropdown — exclude self and own descendants to avoid cycles
  const selfAndDescendants = new Set();
  if (editId) {
    const collect = id => {
      selfAndDescendants.add(id);
      projects.filter(p => p.parentId === id).forEach(p => collect(p.id));
    };
    collect(editId);
  }
  const parentSelect = document.getElementById('fProjectParent');
  parentSelect.innerHTML = '<option value="">— None (top-level) —</option>' +
    projects
      .filter(p => !selfAndDescendants.has(p.id))
      .map(p => `<option value="${p.id}"${editing && editing.parentId === p.id ? ' selected' : ''}>${escHtml(p.name)}</option>`)
      .join('');
  if (!editing) parentSelect.value = '';

  document.getElementById('projectModalOverlay').classList.remove('hidden');
  document.getElementById('fProjectName').focus();
}

function closeProjectModal() {
  document.getElementById('projectModalOverlay').classList.add('hidden');
}

function deleteProject() {
  const id = document.getElementById('editProjectId').value;
  if (!id) return;
  // Archive project; unparent children so they become roots
  const projects = Store.allProjects().map(p => {
    if (p.id === id) return { ...p, archived: true };
    if (p.parentId === id) return { ...p, parentId: '' };
    return p;
  });
  Store.saveProjects(projects);
  closeProjectModal();
  if (state.selectedProjectId === id) {
    state.selectedProjectId = null;
    state.activeView = 'week';
  }
  renderSidebar();
  renderRightPanel();
}

function saveProject() {
  const name = document.getElementById('fProjectName').value.trim();
  if (!name) { document.getElementById('fProjectName').focus(); return; }

  const id       = document.getElementById('editProjectId').value;
  const parentId = document.getElementById('fProjectParent').value;
  const projects = Store.projects();

  if (id) {
    const idx = projects.findIndex(p => p.id === id);
    if (idx >= 0) {
      projects[idx] = { ...projects[idx], name, parentId,
        type: document.getElementById('fProjectType').value,
        status: document.getElementById('fProjectStatus').value,
        notes: document.getElementById('fProjectDesc').value.trim(),
      };
    }
  } else {
    projects.push({
      id: uid(), name, parentId,
      type: document.getElementById('fProjectType').value,
      status: document.getElementById('fProjectStatus').value,
      description: document.getElementById('fProjectDesc').value.trim(),
    });
  }
  Store.saveProjects(projects);
  closeProjectModal();
  renderSidebar();
  if (state.activeView === 'project') renderRightPanel();
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
  const { selectedWeek: w, selectedWeekYear: y, selectedDay } = state;
  const notes = Store.weekNotes();
  const taId  = selectedDay ? 'dayNotesTa' : 'weekNotesTextarea';
  const btnId = selectedDay ? 'dayNotesSaveBtn' : 'saveNotesBtn';
  const ta = document.getElementById(taId);
  if (!ta) return;
  const val = ta.value;
  const key = `${y}-W${w}`;
  if (val.trim()) notes[key] = val; else delete notes[key];
  Store.saveWeekNotes(notes);
  const btn = document.getElementById(btnId);
  if (btn) { btn.textContent = 'Saved ✓'; setTimeout(() => btn.textContent = 'Save', 1500); }
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
  renderRightPanel();
}

// ===== Event Listeners =====

function bindEvents() {
  // Header
  document.getElementById('quickAddBtn').addEventListener('click', () => openTaskModal(null));
  document.getElementById('exportAllBtn').addEventListener('click', exportAll);

  // Sidebar nav
  document.getElementById('addProjectBtn').addEventListener('click', openProjectModal);
  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.project-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeView = btn.dataset.view;
      state.selectedProjectId = null;
      renderRightPanel();
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

  // Week List/Gantt toggle
  document.getElementById('weekListBtn').addEventListener('click', () => {
    state.weekViewMode = 'list'; renderWeekPanel();
  });
  document.getElementById('weekGanttBtn').addEventListener('click', () => {
    state.weekViewMode = 'gantt'; renderWeekPanel();
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
  let taskOverlayMousedownOnBg = false;
  document.getElementById('taskModalOverlay').addEventListener('mousedown', e => {
    taskOverlayMousedownOnBg = e.target === e.currentTarget;
  });
  document.getElementById('taskModalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget && taskOverlayMousedownOnBg) closeTaskModal();
  });

  // Project modal
  document.getElementById('projectModalClose').addEventListener('click', closeProjectModal);
  document.getElementById('projectModalCancel').addEventListener('click', closeProjectModal);
  document.getElementById('projectModalSave').addEventListener('click', saveProject);
  document.getElementById('deleteProjectBtn').addEventListener('click', deleteProject);
  let projectOverlayMousedownOnBg = false;
  document.getElementById('projectModalOverlay').addEventListener('mousedown', e => {
    projectOverlayMousedownOnBg = e.target === e.currentTarget;
  });
  document.getElementById('projectModalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget && projectOverlayMousedownOnBg) closeProjectModal();
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
  const now = new Date();
  state.selectedWeek = isoWeek(now);
  state.selectedWeekYear = isoWeekYear(now);
  state.activeView = 'week';
  // set the week nav item active by default
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  renderAll();
}

init();
