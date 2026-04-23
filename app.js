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

const KEYS = { tasks: 'gtd_tasks', projects: 'gtd_projects', weekNotes: 'gtd_week_notes', todayPlan: 'gtd_today' };

const Store = {
  tasks()     { return JSON.parse(localStorage.getItem(KEYS.tasks)    || '[]'); },
  projects()  { return JSON.parse(localStorage.getItem(KEYS.projects) || '[]'); },
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
  selectedDay: null,   // 'YYYY-MM-DD' when a specific day cell is clicked
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

    // Week number cell — click selects the whole week
    const wCell = document.createElement('div');
    wCell.className = 'week-num-cell';
    wCell.innerHTML = `<span class="week-num-label">W${wNum}</span>`;
    wCell.addEventListener('click', e => {
      e.stopPropagation();
      selectWeek(wNum, wYear);
    });
    row.appendChild(wCell);

    // Day cells
    days.forEach(day => {
      const dk = `${day.getFullYear()}-${String(day.getMonth()+1).padStart(2,'0')}-${String(day.getDate()).padStart(2,'0')}`;
      const isOther = day.getMonth() !== calMonth;
      const isToday = dk === todayKey;
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;

      const isDaySelected = dk === state.selectedDay;
      const cell = document.createElement('div');
      cell.className = `day-cell${isOther ? ' other-month' : ''}${isToday ? ' today' : ''}${isWeekend ? ' weekend' : ''}${isDaySelected ? ' day-selected' : ''}`;
      cell.addEventListener('click', e => {
        e.stopPropagation();
        selectDay(dk, wNum, wYear);
      });

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
          chip.addEventListener('click', () => {
            // No stopPropagation — let click bubble to day cell so day gets selected too
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

    // Row background click — do nothing (wCell handles week, day cells handle day)
    grid.appendChild(row);
  });
}

// ===== Select Week / Day =====

function selectWeek(week, year) {
  state.selectedWeek = week;
  state.selectedWeekYear = year;
  state.selectedDay = null;
  state.activeView = 'week';
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  renderCalendar();
  renderRightPanel();
  renderWeekTracker();
}

function selectDay(dayKey, weekNum, weekYear) {
  state.selectedDay = dayKey;
  state.selectedWeek = weekNum;
  state.selectedWeekYear = weekYear;
  state.activeView = 'week';
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  renderCalendar();
  renderRightPanel();
  renderWeekTracker();
}

// ===== Right Panel Router =====

function renderRightPanel() {
  const dayView    = document.getElementById('dayView');
  const todayView  = document.getElementById('todayView');
  const inboxView  = document.getElementById('inboxView');
  const weekView   = document.getElementById('weekView');
  const titleEl    = document.querySelector('.week-panel-title');
  const datesEl    = document.querySelector('.week-panel-dates');
  const generateBtn= document.getElementById('generateNoteBtn');

  [dayView, todayView, inboxView, weekView].forEach(el => el.classList.add('hidden'));
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

  if (task.day) {
    const d = new Date(task.day + 'T00:00:00');
    const dayTag = document.createElement('span');
    dayTag.className = 'day-pinned-chip';
    dayTag.textContent = d.toLocaleDateString('en-US', { month:'short', day:'numeric' });
    meta.appendChild(dayTag);
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

function openTaskModal(taskId, prefillDay = null) {
  state.editingTaskId = taskId;
  const modal = document.getElementById('taskModalOverlay');
  const titleEl = document.getElementById('taskModalTitle');
  const deleteBtn = document.getElementById('deleteTaskBtn');

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
    document.getElementById('fTaskProject').value = '';
    document.getElementById('fTaskWeek').value = state.selectedWeek || isoWeek(new Date());
    document.getElementById('fTaskYear').value = state.selectedWeekYear || isoWeekYear(new Date());
    document.getElementById('fTaskDay').value = prefillDay || state.selectedDay || '';
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

  const rawDay = document.getElementById('fTaskDay').value;
  const taskData = {
    title,
    category: document.getElementById('fTaskCategory').value,
    priority: document.getElementById('fTaskPriority').value,
    status: document.getElementById('fTaskStatus').value,
    project: document.getElementById('fTaskProject').value,
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
  const now = new Date();
  state.selectedWeek = isoWeek(now);
  state.selectedWeekYear = isoWeekYear(now);
  state.activeView = 'week';
  // set the week nav item active by default
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  renderAll();
}

init();
