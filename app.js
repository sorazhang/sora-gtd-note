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

const KEYS = { tasks: 'gtd_tasks', projects: 'gtd_projects', weekNotes: 'gtd_week_notes', todayPlan: 'gtd_today', uiState: 'gtd_ui_state' };

// No-op until Firebase initialises — reassigned in initFirebase()
let scheduleSync = () => {};

const Store = {
  allTasks()     { return JSON.parse(localStorage.getItem(KEYS.tasks)    || '[]'); },
  allProjects()  { return JSON.parse(localStorage.getItem(KEYS.projects) || '[]'); },
  tasks()        { return Store.allTasks().filter(t => !t.archived); },
  projects()     { return Store.allProjects().filter(p => !p.archived); },
  archivedTasks()    { return Store.allTasks().filter(t =>  t.archived); },
  archivedProjects() { return Store.allProjects().filter(p =>  p.archived); },
  weekNotes() { return JSON.parse(localStorage.getItem(KEYS.weekNotes)|| '{}'); },
  saveTasks(t)     { localStorage.setItem(KEYS.tasks,    JSON.stringify(t)); scheduleSync(); },
  saveProjects(p)  { localStorage.setItem(KEYS.projects, JSON.stringify(p)); scheduleSync(); },
  saveWeekNotes(n) { localStorage.setItem(KEYS.weekNotes,JSON.stringify(n)); scheduleSync(); },
  todayPlan() {
    const raw = JSON.parse(localStorage.getItem(KEYS.todayPlan) || 'null');
    const key = todayDateKey();
    if (!raw || raw.date !== key) return { date: key, taskIds: [] };
    return raw;
  },
  saveTodayPlan(p) { localStorage.setItem(KEYS.todayPlan, JSON.stringify(p)); },
  loadUIState()    { return JSON.parse(localStorage.getItem(KEYS.uiState) || 'null'); },
  saveUIState(s)   { localStorage.setItem(KEYS.uiState, JSON.stringify(s)); scheduleSync(); },
};

function todayDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ===== Seed Data =====

function seedData() {
  if (localStorage.getItem(KEYS.tasks) !== null) return;

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
  saveUIState();
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
  saveUIState();
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
          <button class="btn-generate" id="projObsidianBtn">📝 Obsidian</button>
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
  document.getElementById('projObsidianBtn').addEventListener('click', () => openProjectObsidianModal(proj.id));
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

// ===== Visual Board (Graph View) =====

let _graphAnim = null; // cancel handle for rAF loop

function renderBoardView() {
  // Cancel any previous animation loop
  if (_graphAnim) { cancelAnimationFrame(_graphAnim); _graphAnim = null; }

  const el = document.getElementById('boardView');
  el.innerHTML = '';
  el.style.background = '#0d0d12';
  el.style.position = 'relative';
  el.style.overflow = 'hidden';

  const projects = Store.projects();
  const tasks    = Store.tasks();

  if (projects.length === 0 && tasks.length === 0) {
    el.style.background = '';
    el.innerHTML = '<div class="empty-state" style="padding:40px">No projects or tasks yet.</div>';
    return;
  }

  // ── Build nodes ──────────────────────────────────────────────────
  const nodes = [], edges = [], nodeMap = {};
  const W = el.clientWidth || 700, H = el.clientHeight || 500;
  const cx = W / 2, cy = H / 2;

  // Project nodes
  projects.forEach(p => {
    const n = {
      id: p.id, type: 'project', label: p.name,
      r: p.parentId ? 10 : 14,
      color: p.type === 'work' ? '#10b981' : '#3b82f6',
      glow:  p.type === 'work' ? '#34d39966' : '#60a5fa66',
      data: p,
      x: cx + (Math.random() - 0.5) * W * 0.6,
      y: cy + (Math.random() - 0.5) * H * 0.6,
      vx: 0, vy: 0, pinned: false,
    };
    nodes.push(n); nodeMap[p.id] = n;
  });

  // Task nodes
  tasks.forEach(t => {
    const hasProj = t.project && nodeMap[t.project];
    const isDelegated = !!t.delegated;
    const n = {
      id: t.id, type: 'task', label: t.title,
      shape: isDelegated ? 'diamond' : 'circle',
      r: t.status === 'done' ? 3.5 : (isDelegated ? 6 : 5),
      color: isDelegated
        ? '#f59e0b'
        : hasProj
          ? (t.category === 'work' ? '#34d399' : '#60a5fa')
          : '#6b7280',
      glow: isDelegated
        ? '#f59e0b44'
        : hasProj
          ? (t.category === 'work' ? '#34d39944' : '#60a5fa44')
          : '#6b728033',
      data: t,
      x: cx + (Math.random() - 0.5) * W * 0.7,
      y: cy + (Math.random() - 0.5) * H * 0.7,
      vx: 0, vy: 0, pinned: false,
    };
    nodes.push(n); nodeMap[t.id] = n;
  });

  // ── Build edges ──────────────────────────────────────────────────
  projects.forEach(p => {
    if (p.parentId && nodeMap[p.parentId])
      edges.push({ a: nodeMap[p.parentId], b: nodeMap[p.id], type: 'parent' });
  });
  tasks.forEach(t => {
    if (t.project && nodeMap[t.project])
      edges.push({ a: nodeMap[t.project], b: nodeMap[t.id], type: 'task' });
  });

  // ── Canvas setup ─────────────────────────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  canvas.style.cssText = 'position:absolute;inset:0;cursor:grab;';
  el.appendChild(canvas);

  // Tooltip
  const tip = document.createElement('div');
  tip.className = 'graph-tooltip hidden';
  el.appendChild(tip);

  // Legend
  const legend = document.createElement('div');
  legend.className = 'graph-legend';
  legend.innerHTML = `
    <span class="gl-dot" style="background:#3b82f6"></span>Personal project
    <span class="gl-dot" style="background:#10b981"></span>Work project
    <span class="gl-dot" style="background:#60a5fa;width:7px;height:7px"></span>Personal task
    <span class="gl-dot" style="background:#34d399;width:7px;height:7px"></span>Work task
    <span class="gl-dot" style="background:#6b7280;width:7px;height:7px"></span>Standalone
    <span class="gl-diamond"></span>Delegated
    <span style="margin-left:10px;color:#555">Scroll: zoom · Drag: pan · Click: open</span>`;
  el.appendChild(legend);

  const ctx = canvas.getContext('2d');
  let transform = { x: 0, y: 0, s: 1 };
  let hovered = null, dragNode = null, panStart = null;
  let alpha = 1.0; // simulation cooling

  // ── Force simulation ─────────────────────────────────────────────
  function tick() {
    if (alpha < 0.001) alpha = 0;

    if (alpha > 0) {
      // Repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          let dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx*dx + dy*dy) || 1;
          const force = (2800 / (dist * dist)) * alpha;
          dx /= dist; dy /= dist;
          if (!a.pinned) { a.vx -= dx*force; a.vy -= dy*force; }
          if (!b.pinned) { b.vx += dx*force; b.vy += dy*force; }
        }
      }

      // Spring along edges
      edges.forEach(({ a, b, type }) => {
        const idealLen = type === 'parent' ? 120 : 70;
        const k = type === 'parent' ? 0.06 : 0.04;
        let dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        const force = (dist - idealLen) * k * alpha;
        dx /= dist; dy /= dist;
        if (!a.pinned) { a.vx += dx*force; a.vy += dy*force; }
        if (!b.pinned) { b.vx -= dx*force; b.vy -= dy*force; }
      });

      // Centre gravity
      nodes.forEach(n => {
        if (n.pinned) return;
        n.vx += (cx - n.x) * 0.008 * alpha;
        n.vy += (cy - n.y) * 0.008 * alpha;
        n.vx *= 0.78; n.vy *= 0.78;
        n.x  += n.vx;  n.y  += n.vy;
      });

      alpha *= 0.97;
    }

    draw();
    _graphAnim = requestAnimationFrame(tick);
  }

  // ── Draw ─────────────────────────────────────────────────────────
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d0d12';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.s, transform.s);

    // Edges
    edges.forEach(({ a, b, type }) => {
      const lit = hovered && (hovered === a || hovered === b ||
        edges.some(e => (e.a === hovered || e.b === hovered) && (e.a === a || e.b === a || e.b === b)));
      const dimmed = hovered && !lit;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = dimmed
        ? 'rgba(80,80,80,0.1)'
        : type === 'parent'
          ? `rgba(160,160,220,${lit ? 0.75 : 0.35})`
          : `rgba(120,120,120,${lit ? 0.55 : 0.18})`;
      ctx.lineWidth = type === 'parent' ? (lit ? 1.5 : 1) : (lit ? 1 : 0.5);
      ctx.stroke();
    });

    // Nodes
    nodes.forEach(n => {
      const isHov = n === hovered;
      const connected = hovered && edges.some(e =>
        (e.a === hovered && e.b === n) || (e.b === hovered && e.a === n));
      const dimmed = hovered && !isHov && !connected;
      ctx.globalAlpha = dimmed ? 0.18 : 1;

      const r = isHov ? n.r * 1.7 : connected ? n.r * 1.25 : n.r;

      // Glow
      if (isHov || connected) {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r + 12);
        g.addColorStop(0, n.glow || n.color + '44');
        g.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 12, 0, Math.PI*2);
        ctx.fillStyle = g;
        ctx.fill();
      }

      // Outer ring for projects
      if (n.type === 'project') {
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 2.5, 0, Math.PI*2);
        ctx.strokeStyle = n.color + (isHov ? 'cc' : '55');
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Node fill — diamond for delegated tasks, circle otherwise
      if (n.shape === 'diamond') {
        ctx.beginPath();
        ctx.moveTo(n.x,     n.y - r * 1.5);
        ctx.lineTo(n.x + r, n.y);
        ctx.lineTo(n.x,     n.y + r * 1.5);
        ctx.lineTo(n.x - r, n.y);
        ctx.closePath();
        ctx.fillStyle = n.color;
        ctx.fill();
        // Amber border
        ctx.strokeStyle = isHov ? '#fbbf24' : '#f59e0b88';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI*2);
        ctx.fillStyle = n.color;
        ctx.fill();
      }

      // White inner dot for projects
      if (n.type === 'project') {
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 0.38, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fill();
      }

      // Progress arc for tasks with progress
      if (n.type === 'task' && n.data.progress > 0) {
        const pct = n.data.progress / 100;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 1, -Math.PI/2, -Math.PI/2 + Math.PI*2*pct);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Label — also show delegatee name on hover
      if (n.type === 'project' || isHov) {
        const fs = n.type === 'project' ? (isHov ? 12 : 11) : 10;
        ctx.font = `${isHov ? 600 : 500} ${fs}px Inter,system-ui,sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const label = n.label.length > 22 ? n.label.slice(0, 20) + '…' : n.label;
        const textY = n.y + r + 5;
        // Text shadow
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillText(label, n.x + 0.5, textY + 0.5);
        ctx.fillStyle = isHov ? '#fff' : (n.type === 'project' ? 'rgba(220,220,220,0.85)' : 'rgba(180,180,180,0.7)');
        ctx.fillText(label, n.x, textY);
        ctx.textBaseline = 'alphabetic';
      }

      ctx.globalAlpha = 1;
    });

    ctx.restore();
  }

  // ── Mouse helpers ─────────────────────────────────────────────────
  function toWorld(ex, ey) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (ex - rect.left - transform.x) / transform.s,
      y: (ey - rect.top  - transform.y) / transform.s,
    };
  }

  function hitNode(wx, wy) {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dx = wx - n.x, dy = wy - n.y;
      if (dx*dx + dy*dy <= (n.r + 6) * (n.r + 6)) return n;
    }
    return null;
  }

  // ── Mouse events ──────────────────────────────────────────────────
  canvas.addEventListener('mousemove', e => {
    const { x, y } = toWorld(e.clientX, e.clientY);
    const n = hitNode(x, y);
    hovered = n;
    canvas.style.cursor = n ? 'pointer' : (dragNode ? 'grabbing' : panStart ? 'grabbing' : 'grab');

    if (n) {
      tip.textContent = n.type === 'project'
        ? `${n.label} · ${n.data.type} · ${n.data.status}`
        : `${n.label}${n.data.delegated ? ' · ⇢ ' + n.data.delegated : ''}${n.data.effort && n.data.effort !== 'TBD' ? ' · ' + n.data.effort : ''}${n.data.progress ? ' · ' + n.data.progress + '%' : ''}`;
      const rect = canvas.getBoundingClientRect();
      tip.style.left = (e.clientX - rect.left + 12) + 'px';
      tip.style.top  = (e.clientY - rect.top  - 28) + 'px';
      tip.classList.remove('hidden');
    } else {
      tip.classList.add('hidden');
    }

    if (dragNode && !dragNode.pinned) {
      dragNode.x = x; dragNode.y = y;
      dragNode.vx = 0; dragNode.vy = 0;
      alpha = Math.max(alpha, 0.1);
    } else if (panStart) {
      transform.x = panStart.tx + (e.clientX - panStart.mx);
      transform.y = panStart.ty + (e.clientY - panStart.my);
    }
  });

  canvas.addEventListener('mousedown', e => {
    const { x, y } = toWorld(e.clientX, e.clientY);
    const n = hitNode(x, y);
    if (n) {
      dragNode = n;
      dragNode.pinned = true;
    } else {
      panStart = { mx: e.clientX, my: e.clientY, tx: transform.x, ty: transform.y };
    }
    canvas.style.cursor = 'grabbing';
  });

  window.addEventListener('mouseup', e => {
    if (dragNode) { dragNode.pinned = false; alpha = Math.max(alpha, 0.05); dragNode = null; }
    panStart = null;
    canvas.style.cursor = 'grab';
  });

  canvas.addEventListener('click', e => {
    if (Math.abs(e.movementX) > 3 || Math.abs(e.movementY) > 3) return;
    const { x, y } = toWorld(e.clientX, e.clientY);
    const n = hitNode(x, y);
    if (!n) return;
    if (n.type === 'project') selectProject(n.id);
    else openTaskModal(n.id);
  });

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.88 : 1.14;
    transform.x = mx - (mx - transform.x) * delta;
    transform.y = my - (my - transform.y) * delta;
    transform.s = Math.max(0.2, Math.min(4, transform.s * delta));
  }, { passive: false });

  tick();
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
  const dayKey   = dk;

  const d = new Date(dk + 'T00:00:00');
  const dayLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  // Day-pinned tasks sorted by dayOrder
  const allPinned = tasks
    .filter(t => t.day === dk)
    .sort((a, b) => (a.dayOrder ?? 999) - (b.dayOrder ?? 999));
  const pinned     = allPinned.filter(t => t.status !== 'done');
  const pinnedDone = allPinned.filter(t => t.status === 'done');

  // Week tasks with no specific day
  const weekActive = tasks.filter(t => t.week === w && t.year === y && !t.day && t.status !== 'done');
  const weekDone   = tasks.filter(t => t.week === w && t.year === y && !t.day && t.status === 'done');

  el.innerHTML = `
    <div class="day-notes-bar">
      <div class="day-notes-head">
        <span class="day-notes-label">${dayLabel} — Notes</span>
        <button class="save-notes-btn" id="dayNotesSaveBtn">Save</button>
      </div>
      <textarea class="day-notes-ta" id="dayNotesTa"
        placeholder="Notes, reflections, or anything for this day…">${escHtml(notes[dayKey] || '')}</textarea>
    </div>
    <div class="day-tasks-scroll">
      <div>
        <div class="day-section-head">
          <span>📌 Day tasks <span class="day-pinned-chip">${allPinned.length}</span></span>
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

  if (allPinned.length === 0) {
    pinnedList.innerHTML = '<div class="today-empty">No tasks pinned to this day — use "+ Add" or set a Specific Day in any task</div>';
  } else {
    // Render active tasks with sequence controls, then done tasks
    const currentId = pinned.length > 0 ? pinned[0].id : null;
    [...pinned, ...pinnedDone].forEach((t, idx) => {
      pinnedList.appendChild(buildDayPinnedCard(t, idx, allPinned, t.id === currentId, dk));
    });
  }

  if (weekActive.length + weekDone.length === 0) {
    weekList.innerHTML = '<div class="today-empty">No week tasks yet</div>';
  }
  [...weekActive, ...weekDone].forEach(t => weekList.appendChild(buildTaskCard(t)));

  el.querySelector('#dayNotesSaveBtn').addEventListener('click', saveDayNotes);
  el.querySelector('#addPinnedBtn').addEventListener('click', () => openTaskModal(null, dk));
  el.querySelector('#addWeekBtn').addEventListener('click', () => openTaskModal(null, null));
}

function buildDayPinnedCard(task, idx, allPinned, isCurrent, dk) {
  const projects = Store.projects();
  const proj = task.project ? projects.find(p => p.id === task.project) : null;
  const isDone = task.status === 'done';
  const seqNum = idx + 1;

  const wrap = document.createElement('div');
  wrap.className = `day-seq-card${isDone ? ' done-card' : ''}${isCurrent ? ' day-seq-current' : ''}`;

  wrap.innerHTML = `
    <div class="day-seq-controls">
      <button class="day-seq-btn up" title="Move up" ${idx === 0 ? 'disabled' : ''}>↑</button>
      <span class="day-seq-num">${isDone ? '✓' : `#${seqNum}`}</span>
      <button class="day-seq-btn dn" title="Move down" ${idx === allPinned.length - 1 ? 'disabled' : ''}>↓</button>
    </div>
    <div class="day-seq-body">
      ${isCurrent ? '<span class="day-seq-oncurrent">▶ On deck</span>' : ''}
      <div class="day-seq-title${isDone ? ' done-text' : ''}">${escHtml(task.title)}</div>
      <div class="day-seq-meta">
        ${proj ? `<span class="task-tag status">${escHtml(proj.name)}</span>` : ''}
        ${task.execStatus ? `<span class="exec-status-badge es-${task.execStatus}">${task.execStatus === 'wip' ? 'WIP' : task.execStatus.charAt(0).toUpperCase() + task.execStatus.slice(1)}</span>` : ''}
        ${task.effort && task.effort !== 'TBD' ? `<span class="effort-badge">${task.effort}</span>` : ''}
        ${task.delegated ? `<span class="task-tag context">⇢ ${escHtml(task.delegated)}</span>` : ''}
      </div>
    </div>
    <div class="day-seq-check${isDone ? ' checked' : ''}"></div>`;

  // Check / uncheck
  wrap.querySelector('.day-seq-check').addEventListener('click', e => {
    e.stopPropagation();
    toggleTaskDone(task.id);
  });

  // Edit on body click
  wrap.querySelector('.day-seq-body').addEventListener('click', () => openTaskModal(task.id));

  // Reorder up
  const upBtn = wrap.querySelector('.day-seq-btn.up');
  if (upBtn && !upBtn.disabled) {
    upBtn.addEventListener('click', e => {
      e.stopPropagation();
      reorderDayTask(task.id, dk, -1);
    });
  }

  // Reorder down
  const dnBtn = wrap.querySelector('.day-seq-btn.dn');
  if (dnBtn && !dnBtn.disabled) {
    dnBtn.addEventListener('click', e => {
      e.stopPropagation();
      reorderDayTask(task.id, dk, +1);
    });
  }

  return wrap;
}

function reorderDayTask(taskId, dk, dir) {
  const allTasks = Store.allTasks();
  // Get day tasks sorted by current dayOrder
  let dayTasks = allTasks
    .filter(t => t.day === dk && !t.archived)
    .sort((a, b) => (a.dayOrder ?? 999) - (b.dayOrder ?? 999));

  const idx = dayTasks.findIndex(t => t.id === taskId);
  const swapIdx = idx + dir;
  if (swapIdx < 0 || swapIdx >= dayTasks.length) return;

  // Swap positions
  [dayTasks[idx].dayOrder, dayTasks[swapIdx].dayOrder] = [swapIdx, idx];

  // Write back updated dayOrder values
  const updated = allTasks.map(t => {
    const dt = dayTasks.find(d => d.id === t.id);
    return dt ? { ...t, dayOrder: dt.dayOrder } : t;
  });
  Store.saveTasks(updated);
  renderDayView();
}

// ===== Today's Focus =====

let focusState = { queue: [], doneIds: [] };
let focusTimer = { interval: null, startedAt: null, accumulated: 0, taskId: null, paused: false };

function formatTimeSpent(minutes) {
  if (!minutes || minutes <= 0) return null;
  const totalSec = Math.round(minutes * 60);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

function parseEffortMs(effort) {
  if (!effort || effort === 'TBD') return null;
  const m = parseInt(effort);
  return isNaN(m) ? null : m * 60000;
}

function formatMs(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

function startFocusTimer(taskId) {
  stopFocusTimer(false);
  const task = Store.tasks().find(t => t.id === taskId);
  focusTimer.taskId     = taskId;
  focusTimer.accumulated = (task && task.timeSpent ? task.timeSpent * 60000 : 0);
  focusTimer.startedAt  = Date.now();
  focusTimer.paused     = false;
  focusTimer.interval   = setInterval(updateTimerDisplay, 1000);
  updateTimerDisplay();
}

function stopFocusTimer(save = true) {
  clearInterval(focusTimer.interval);
  focusTimer.interval = null;
  const sessionMs = focusTimer.startedAt && !focusTimer.paused ? Date.now() - focusTimer.startedAt : 0;
  const totalMs   = focusTimer.accumulated + sessionMs;
  if (save && focusTimer.taskId) {
    const tasks = Store.allTasks();
    const idx = tasks.findIndex(t => t.id === focusTimer.taskId);
    if (idx >= 0) {
      tasks[idx] = { ...tasks[idx], timeSpent: Math.round(totalMs / 6000) / 10 };
      Store.saveTasks(tasks);
    }
  }
  focusTimer.startedAt = null;
  return totalMs;
}

function pauseFocusTimer() {
  if (focusTimer.paused || !focusTimer.startedAt) return;
  clearInterval(focusTimer.interval);
  focusTimer.interval = null;
  focusTimer.accumulated += Date.now() - focusTimer.startedAt;
  focusTimer.startedAt = null;
  focusTimer.paused = true;
  updateTimerDisplay();
}

function resumeFocusTimer() {
  if (!focusTimer.paused) return;
  focusTimer.startedAt = Date.now();
  focusTimer.paused = false;
  focusTimer.interval = setInterval(updateTimerDisplay, 1000);
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const elEl  = document.getElementById('focusTimerElapsed');
  const barEl = document.getElementById('focusTimerBar');
  const btnEl = document.getElementById('focusPauseBtn');
  if (!elEl) return;

  const sessionMs = focusTimer.startedAt ? Date.now() - focusTimer.startedAt : 0;
  const totalMs   = focusTimer.accumulated + sessionMs;
  elEl.textContent = formatMs(totalMs);

  if (btnEl) btnEl.textContent = focusTimer.paused ? '▶' : '⏸';

  if (barEl) {
    const task = Store.tasks().find(t => t.id === focusTimer.taskId);
    const effortMs = task ? parseEffortMs(task.effort) : null;
    if (effortMs) {
      const pct = Math.min(100, totalMs / effortMs * 100);
      barEl.style.width = pct + '%';
      barEl.style.background = pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#6366f1';
    }
  }
}

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
  stopFocusTimer(true);
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

        <div class="focus-timer">
          <div class="focus-timer-row">
            <span class="focus-timer-elapsed" id="focusTimerElapsed">00:00</span>
            ${parseEffortMs(task.effort)
              ? `<span class="focus-timer-sep">/</span><span class="focus-timer-estimate">${formatMs(parseEffortMs(task.effort))}</span>`
              : ''}
            <button class="focus-timer-pause" id="focusPauseBtn" title="Pause / Resume">⏸</button>
          </div>
          ${parseEffortMs(task.effort) ? `
          <div class="focus-timer-track">
            <div class="focus-timer-bar" id="focusTimerBar"></div>
          </div>` : ''}
        </div>
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

  // Start timer for this task (loads existing timeSpent as base)
  startFocusTimer(task.id);

  overlay.querySelector('#focusExitBtn').addEventListener('click', closeFocusMode);

  overlay.querySelector('#focusPauseBtn').addEventListener('click', () => {
    focusTimer.paused ? resumeFocusTimer() : pauseFocusTimer();
  });

  overlay.querySelector('#focusDoneBtn').addEventListener('click', () => {
    stopFocusTimer(true);
    toggleTaskDone(task.id);
    focusState.doneIds.push(task.id);
    renderFocusMode(i);
  });

  overlay.querySelector('#focusSkipBtn').addEventListener('click', () => {
    stopFocusTimer(true);
    focusState.queue = [...focusState.queue.filter(id => id !== task.id), task.id];
    renderFocusMode(i);
  });

  overlay.querySelector('#focusEditBtn').addEventListener('click', () => {
    stopFocusTimer(true);
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
  const mode = state.weekViewMode;
  document.getElementById('weekListBtn').classList.toggle('active',   mode === 'list');
  document.getElementById('weekKanbanBtn').classList.toggle('active', mode === 'kanban');
  document.getElementById('weekGanttBtn').classList.toggle('active',  mode === 'gantt');
  document.getElementById('weekListView').classList.toggle('hidden',   mode !== 'list');
  document.getElementById('weekKanbanView').classList.toggle('hidden', mode !== 'kanban');
  document.getElementById('weekGanttView').classList.toggle('hidden',  mode !== 'gantt');
  // Tab bar hidden in Gantt mode only
  document.getElementById('weekTabBar').style.display = mode === 'gantt' ? 'none' : '';

  if (mode === 'gantt') {
    renderWeekGantt();
  } else if (mode === 'kanban') {
    renderWeekKanban();
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

function renderWeekKanban() {
  const { selectedWeek: w, selectedWeekYear: y, activeTab } = state;
  const tasks = Store.tasks().filter(t => t.week === w && t.year === y);
  const filtered = activeTab === 'all' ? tasks : tasks.filter(t => t.category === activeTab);
  const projects = Store.projects();

  const el = document.getElementById('weekKanbanView');

  const COLS = [
    { id: '',     label: 'No Status', icon: '·',  accent: '#94a3b8' },
    { id: 'todo', label: 'Todo',      icon: '○',  accent: '#3b82f6' },
    { id: 'wip',  label: 'WIP',       icon: '▶',  accent: '#f59e0b' },
    { id: 'done', label: 'Done',      icon: '✓',  accent: '#10b981' },
  ];

  el.innerHTML = `<div class="week-kanban">${COLS.map(col => {
    const colTasks = filtered.filter(t => (t.execStatus || '') === col.id);
    return `
      <div class="kanban-col" data-execstatus="${col.id}">
        <div class="kanban-col-header" style="border-top:3px solid ${col.accent}">
          <span class="kanban-col-title">${col.icon} ${col.label}</span>
          <span class="kanban-col-count" style="background:${col.accent}22;color:${col.accent}">${colTasks.length}</span>
        </div>
        <div class="kanban-col-body" id="kcol-${col.id || 'none'}"></div>
        <button class="kanban-add-btn" data-execstatus="${col.id}">+ Add</button>
      </div>`;
  }).join('')}</div>`;

  COLS.forEach(col => {
    const colTasks = filtered.filter(t => (t.execStatus || '') === col.id);
    const body = el.querySelector(`#kcol-${col.id || 'none'}`);
    if (colTasks.length === 0) {
      body.innerHTML = `<div class="kanban-empty">No tasks</div>`;
    } else {
      colTasks.forEach(t => {
        const proj = t.project ? projects.find(p => p.id === t.project) : null;
        const card = document.createElement('div');
        card.className = `kanban-task-card priority-${t.priority}`;
        card.innerHTML = `
          <div class="kanban-task-title">${escHtml(t.title)}</div>
          ${proj ? `<div class="kanban-task-meta"><span class="kanban-proj-dot ${proj.type}"></span>${escHtml(proj.name)}</div>` : ''}
          <div class="kanban-task-footer">
            ${t.effort && t.effort !== 'TBD' ? `<span class="kanban-chip">${t.effort}</span>` : ''}
            ${t.delegated ? `<span class="kanban-chip delegated">⇢ ${escHtml(t.delegated)}</span>` : ''}
            ${t.context ? `<span class="kanban-chip ctx">${escHtml(t.context)}</span>` : ''}
            ${t.progress > 0 ? `<span class="kanban-chip progress">${t.progress}%</span>` : ''}
          </div>`;
        card.addEventListener('click', () => openTaskModal(t.id));
        body.appendChild(card);
      });
    }
  });

  el.querySelectorAll('.kanban-add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      openTaskModal(null);
      setTimeout(() => { document.getElementById('fTaskExecStatus').value = btn.dataset.execstatus; }, 0);
    });
  });
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

  if (task.execStatus) {
    const esTag = document.createElement('span');
    esTag.className = `exec-status-badge es-${task.execStatus}`;
    esTag.textContent = task.execStatus === 'wip' ? 'WIP' : task.execStatus.charAt(0).toUpperCase() + task.execStatus.slice(1);
    meta.appendChild(esTag);
  }

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

  if (task.timeSpent > 0) {
    const tsTag = document.createElement('span');
    tsTag.className = 'time-spent-badge';
    tsTag.title = 'Time spent in focus mode';
    tsTag.textContent = '⏱ ' + formatTimeSpent(task.timeSpent);
    meta.appendChild(tsTag);
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
    document.getElementById('fTaskExecStatus').value = task.execStatus || '';
    document.getElementById('fTaskDelegated').value = task.delegated || '';
    document.getElementById('fTaskContext').value = task.context || '';
    document.getElementById('fTaskNotes').value = task.notes || '';
    document.getElementById('fTaskTimeSpent').value = formatTimeSpent(task.timeSpent) || '—';
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
    document.getElementById('fTaskExecStatus').value = '';
    document.getElementById('fTaskDelegated').value = '';
    document.getElementById('fTaskContext').value = '';
    document.getElementById('fTaskNotes').value = '';
    document.getElementById('fTaskTimeSpent').value = '—';
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

  // Activity log — show when editing, remove when creating
  const existingLog = document.getElementById('taskActivityLog');
  if (existingLog) existingLog.remove();
  if (taskId) {
    const task = Store.tasks().find(t => t.id === taskId);
    const log = task && task.activityLog && task.activityLog.length ? task.activityLog : null;
    const section = document.createElement('div');
    section.id = 'taskActivityLog';
    section.className = 'activity-log';
    section.innerHTML = `<div class="activity-log-title">Week Change History</div>` + (log
      ? log.slice().reverse().map(e => {
          const d = new Date(e.at);
          const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
          return `<div class="activity-log-entry">
            <span class="activity-log-date">${dateStr}</span>
            <span class="activity-log-desc">W${e.from.week}·${e.from.year} → W${e.to.week}·${e.to.year}</span>
          </div>`;
        }).join('')
      : `<div class="activity-log-empty">No week changes recorded yet.</div>`);
    document.querySelector('#taskModalOverlay .modal-body').appendChild(section);
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
    execStatus: document.getElementById('fTaskExecStatus').value,
    delegated: document.getElementById('fTaskDelegated').value.trim(),
    context: document.getElementById('fTaskContext').value.trim(),
    notes: document.getElementById('fTaskNotes').value.trim(),
  };

  if (id) {
    const idx = tasks.findIndex(t => t.id === id);
    if (idx >= 0) {
      const old = tasks[idx];
      const weekChanged = old.week !== taskData.week || old.year !== taskData.year;
      const log = old.activityLog ? [...old.activityLog] : [];
      if (weekChanged) {
        log.push({
          type: 'week-change',
          from: { week: old.week, year: old.year },
          to:   { week: taskData.week, year: taskData.year },
          at:   new Date().toISOString(),
        });
      }
      tasks[idx] = { ...old, ...taskData, activityLog: log };
    }
  } else {
    const taskId = document.getElementById('fTaskId').value || generateTaskId(projectVal);
    // Assign dayOrder at the end of the day's sequence when pinned to a specific day
    const dayOrder = taskData.day
      ? Store.allTasks().filter(t => t.day === taskData.day && !t.archived).length
      : undefined;
    tasks.push({ id: uid(), taskId, ...taskData, ...(dayOrder !== undefined ? { dayOrder } : {}), completedAt: null, createdAt: new Date().toISOString() });
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
  const projects = Store.allProjects();

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
  if (state.activeView === 'project' || state.activeView === 'board') renderRightPanel();
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

  // Day notes for days within this week that have notes
  const allNotes = Store.weekNotes();
  const { start: ws } = weekRange(week, year);
  const dayNoteEntries = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(ws); d.setDate(ws.getDate() + i);
    const dk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (allNotes[dk]) dayNoteEntries.push({ dk, note: allNotes[dk], d });
  }
  if (dayNoteEntries.length > 0) {
    md += `## Day Notes\n\n`;
    dayNoteEntries.forEach(({ dk, note, d }) => {
      const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      md += `### ${label}\n\n${note}\n\n`;
    });
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

function generateProjectObsidianNote(projId) {
  const projects = Store.projects();
  const proj = projects.find(p => p.id === projId);
  if (!proj) return '';

  const tasks = Store.tasks().filter(t => t.project === projId);
  const children = projects.filter(p => p.parentId === projId);

  // Build ancestor breadcrumb
  const ancestors = [];
  let cur = proj.parentId ? projects.find(p => p.id === proj.parentId) : null;
  while (cur) { ancestors.unshift(cur); cur = cur.parentId ? projects.find(p => p.id === cur.parentId) : null; }

  const slug = proj.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const today = new Date();
  const formatDate = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  const done    = tasks.filter(t => t.status === 'done');
  const active  = tasks.filter(t => t.status !== 'done');
  const pct     = tasks.length ? Math.round(done.length / tasks.length * 100) : 0;

  const taskLine = t => {
    const ctx     = t.context ? ` \`${t.context}\`` : '';
    const effort  = t.effort && t.effort !== 'TBD' ? ` *(${t.effort})*` : '';
    const delegated = t.delegated ? ` ⇢ ${t.delegated}` : '';
    const week    = t.week ? ` W${t.week}` : '';
    return `- [${t.status === 'done' ? 'x' : ' '}] ${t.title}${effort}${delegated}${ctx}${week}${t.priority === 'high' ? ' 🔴' : t.priority === 'medium' ? ' 🟡' : ''}`;
  };

  let md = `---
tags: [gtd, project, ${proj.type}]
project: "${proj.name}"
type: ${proj.type}
status: ${proj.status}
progress: ${pct}%
date: ${formatDate(today)}
${ancestors.length > 0 ? `parent: "[[${ancestors[ancestors.length - 1].name}]]"` : ''}
---

# ${proj.name}

`;

  if (ancestors.length > 0) {
    md += `> ${ancestors.map(a => `[[${a.name}]]`).join(' › ')} › **${proj.name}**\n\n`;
  }

  const notes = proj.notes || proj.description || '';
  if (notes) md += `## Notes\n\n${notes}\n\n`;

  md += `## Progress\n\n${done.length} / ${tasks.length} tasks complete (${pct}%)\n\n`;

  if (children.length > 0) {
    md += `## Sub-projects\n\n`;
    children.forEach(c => {
      const ct = Store.tasks().filter(t => t.project === c.id);
      const cd = ct.filter(t => t.status === 'done').length;
      const cp = ct.length ? Math.round(cd / ct.length * 100) : 0;
      md += `- [[${c.name}]] — ${cd}/${ct.length} tasks (${cp}%) · ${c.status}\n`;
    });
    md += '\n';
  }

  if (active.length > 0) {
    md += `## Open Tasks\n\n${active.map(taskLine).join('\n')}\n\n`;
  }

  if (done.length > 0) {
    md += `## Completed\n\n${done.map(taskLine).join('\n')}\n\n`;
  }

  md += `---\n*Generated by GTD Note System on ${today.toLocaleString()}*\n`;
  return md;
}

function openProjectObsidianModal(projId) {
  const proj = Store.projects().find(p => p.id === projId);
  if (!proj) return;
  const note = generateProjectObsidianNote(projId);
  const slug = proj.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  document.getElementById('obsidianFilename').value = `project-${slug}.md`;
  document.getElementById('notePreview').textContent = note;
  document.getElementById('obsidianModalOverlay').classList.remove('hidden');
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
  const ta = document.getElementById('weekNotesTextarea');
  if (!ta) return;
  const val = ta.value;
  const key = `${y}-W${w}`;
  if (val.trim()) notes[key] = val; else delete notes[key];
  Store.saveWeekNotes(notes);
  const btn = document.getElementById('saveNotesBtn');
  if (btn) { btn.textContent = 'Saved ✓'; setTimeout(() => btn.textContent = 'Save', 1500); }
}

function saveDayNotes() {
  const dk = state.selectedDay;
  if (!dk) return;
  const notes = Store.weekNotes();
  const ta = document.getElementById('dayNotesTa');
  if (!ta) return;
  const val = ta.value;
  if (val.trim()) notes[dk] = val; else delete notes[dk];
  Store.saveWeekNotes(notes);
  const btn = document.getElementById('dayNotesSaveBtn');
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
  document.getElementById('addProjectBtn').addEventListener('click', () => openProjectModal());
  document.querySelectorAll('.nav-item[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.project-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeView = btn.dataset.view;
      state.selectedProjectId = null;
      saveUIState();
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

  // Week List / Kanban / Gantt toggle
  document.getElementById('weekListBtn').addEventListener('click', () => {
    state.weekViewMode = 'list'; renderWeekPanel();
  });
  document.getElementById('weekKanbanBtn').addEventListener('click', () => {
    state.weekViewMode = 'kanban'; renderWeekPanel();
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

function saveUIState() {
  Store.saveUIState({
    activeView: state.activeView,
    selectedProjectId: state.selectedProjectId,
    selectedWeek: state.selectedWeek,
    selectedWeekYear: state.selectedWeekYear,
  });
}

function init() {
  seedData();
  bindEvents();
  const now = new Date();
  state.selectedWeek = isoWeek(now);
  state.selectedWeekYear = isoWeekYear(now);

  // Restore last active view from localStorage
  const saved = Store.loadUIState();
  if (saved) {
    state.activeView = saved.activeView || 'week';
    state.selectedProjectId = saved.selectedProjectId || null;
    if (saved.selectedWeek) state.selectedWeek = saved.selectedWeek;
    if (saved.selectedWeekYear) state.selectedWeekYear = saved.selectedWeekYear;
  } else {
    state.activeView = 'week';
  }

  // Sync nav highlight to restored view
  document.querySelectorAll('.nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.view === state.activeView);
  });

  renderAll();
}

init();

// ===== Firebase Auth & Sync =====

(function initFirebase() {
  const cfg = {
    apiKey:            'AIzaSyA-53Mh_cPFPfjeHgitm2ePwoD33ZKCiqk',
    authDomain:        'sora-gtd-note.firebaseapp.com',
    projectId:         'sora-gtd-note',
    storageBucket:     'sora-gtd-note.firebasestorage.app',
    messagingSenderId: '529931922874',
    appId:             '1:529931922874:web:7c4335fe20380cd8f84183',
  };

  if (typeof firebase === 'undefined') return; // SDK not loaded (offline)
  firebase.initializeApp(cfg);

  const auth = firebase.auth();
  const db   = firebase.firestore();
  db.settings({ experimentalAutoDetectLongPolling: true, merge: true });

  let _fbUser        = null;
  let _syncTimer     = null;
  let _suppressSync  = false;
  const LOCAL_TS_KEY = 'gtd_local_updated_at';

  // Stamp existing local data so it wins over a blank cloud on first sign-in
  if (!localStorage.getItem(LOCAL_TS_KEY) && localStorage.getItem(KEYS.tasks) !== null) {
    localStorage.setItem(LOCAL_TS_KEY, Date.now().toString());
  }

  // Reassign the stub so Store.save* methods trigger real syncs
  scheduleSync = function () {
    if (!_fbUser || _suppressSync) return;
    localStorage.setItem(LOCAL_TS_KEY, Date.now().toString());
    clearTimeout(_syncTimer);
    setSyncLabel('pending');
    _syncTimer = setTimeout(pushToCloud, 1500);
  };

  async function pushToCloud() {
    if (!_fbUser) return;
    setSyncLabel('syncing');
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 20000)
    );
    try {
      await Promise.race([
        db.collection('users').doc(_fbUser.uid).set({
          tasks:     Store.allTasks(),
          projects:  Store.allProjects(),
          weekNotes: Store.weekNotes(),
          uiState:   Store.loadUIState() || {},
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        }),
        timeout,
      ]);
      setSyncLabel('saved');
    } catch (e) {
      console.error('Sync error', e);
      setSyncLabel('error', e.code || e.message);
    }
  }

  async function pullFromCloud() {
    if (!_fbUser) return false;
    try {
      const snap = await db.collection('users').doc(_fbUser.uid).get();
      if (!snap.exists) return false;
      const d = snap.data();

      // Only overwrite local data if cloud is strictly newer
      const cloudTs = d.updatedAt?.toMillis?.() || 0;
      const localTs = parseInt(localStorage.getItem(LOCAL_TS_KEY) || '0', 10);
      if (localTs > cloudTs) {
        // Local is newer — push it up instead of overwriting it
        await pushToCloud();
        return true;
      }

      _suppressSync = true;
      if (d.tasks     !== undefined) Store.saveTasks(d.tasks);
      if (d.projects  !== undefined) Store.saveProjects(d.projects);
      if (d.weekNotes !== undefined) Store.saveWeekNotes(d.weekNotes);
      if (d.uiState   !== undefined) Store.saveUIState(d.uiState);
      _suppressSync = false;
      return true;
    } catch (e) {
      console.error('Pull error', e);
      _suppressSync = false;
      return false;
    }
  }

  function setSyncLabel(status, detail) {
    const el = document.getElementById('syncLabel');
    if (!el) return;
    const map = {
      pending: ['☁ Saving…',  'sync-pending'],
      syncing: ['☁ Syncing…', 'sync-pending'],
      saved:   ['☁ Synced',   'sync-saved'  ],
      error:   ['☁ Error',    'sync-error'  ],
      loading: ['☁ Loading…', 'sync-pending'],
    };
    const [text, cls] = map[status] || ['', ''];
    el.textContent = detail ? `${text}: ${detail}` : text;
    el.className   = `sync-label ${cls}`;
  }

  function renderAuthUI(user) {
    const wrap = document.getElementById('authWrap');
    if (!wrap) return;
    if (user) {
      wrap.innerHTML = `
        <span id="syncLabel" class="sync-label"></span>
        ${user.photoURL
          ? `<img class="auth-avatar" src="${user.photoURL}" title="${escHtml(user.displayName || user.email)}">`
          : `<span class="auth-initials">${(user.displayName || user.email || '?')[0].toUpperCase()}</span>`}
        <button class="btn-secondary btn-sm" id="signOutBtn">Sign out</button>`;
      document.getElementById('signOutBtn').addEventListener('click', () => auth.signOut());
    } else {
      wrap.innerHTML = `<button class="btn-sync" id="signInBtn">☁ Sign in to sync</button><span id="signInError" class="sign-in-error"></span>`;
      document.getElementById('signInBtn').addEventListener('click', () =>
        auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(e => {
          console.error(e);
          const errEl = document.getElementById('signInError');
          if (errEl) errEl.textContent = e.code || e.message;
        })
      );
    }
  }

  auth.onAuthStateChanged(async user => {
    _fbUser = user;
    renderAuthUI(user);
    if (user) {
      setSyncLabel('loading');
      const hadCloudData = await pullFromCloud();
      if (!hadCloudData) {
        // First sign-in on this account — upload local data to cloud
        await pushToCloud();
      } else {
        renderAll();
        setSyncLabel('saved');
      }
    }
  });
})();
