// Integrated To-do app. State-owning root + all views.
// Globals: Icon, Sidebar, TaskRow, GroupHeader, NewTaskModal

const initialGroups = [
  { id: "work",     name: "Work",     color: "oklch(0.62 0.13 205)" },
  { id: "personal", name: "Personal", color: "oklch(0.62 0.13 305)" },
];

const initialProjects = [
  { id: "design",    groupId: "work",     name: "Marq · Design refresh", color: "oklch(0.62 0.13 215)" },
  { id: "okr",       groupId: "work",     name: "Q2 OKR planning",       color: "oklch(0.6 0.11 195)" },
  { id: "brand",     groupId: "work",     name: "Brand audit",           color: "oklch(0.65 0.10 230)" },
  { id: "apartment", groupId: "personal", name: "Apartment",             color: "oklch(0.62 0.13 305)" },
  { id: "cooking",   groupId: "personal", name: "Cooking",               color: "oklch(0.6 0.13 320)" },
  { id: "reading",   groupId: "personal", name: "Reading list",          color: "oklch(0.6 0.11 290)" },
];

const initialTasks = [
  // Today bucket
  { id: 1, title: "Review hi-fi mocks for filter rail", bucket: "today", when: "today",
    notes: "Compare A/B with marketing on accent intensity",
    projectId: "design", due: "Today", dueToday: true, tags: ["focus"], done: false },
  { id: 2, title: "Send Q2 OKR draft to Mira", bucket: "today", when: "today",
    projectId: "okr", due: "Today", dueToday: true, done: false },
  { id: 3, title: "Sync with engineering on token migration", bucket: "today", when: "today",
    projectId: "design", done: true },
  { id: 4, title: "Lunch with Hana", bucket: "today", when: "today",
    due: "12:30", repeat: "Weekly", done: false },
  { id: 5, title: "Submit expenses for March", bucket: "today", when: "today",
    due: "Apr 30", tags: ["admin"], done: false },
  // Evening bucket
  { id: 6, title: "Reading: Pattern Language ch.7", bucket: "evening", when: "evening",
    projectId: "reading", done: false },
  { id: 7, title: "Water plants on balcony", bucket: "evening", when: "evening",
    repeat: "Every 3 days", done: false },
  { id: 8, title: "Reply to Jun about apartment viewing", bucket: "evening", when: "evening",
    projectId: "apartment", done: false },
  // Marq Design refresh — In Flight (upcoming)
  { id: 9,  title: "Define new accent token scale", when: "tomorrow", projectId: "design",
    notes: "Pull samples from Linear, Things, and Bear; cross-check oklch chroma",
    due: "Apr 28", tags: ["tokens"], done: false },
  { id: 10, title: "Audit shadow / depth tokens", when: "tomorrow", projectId: "design",
    due: "Apr 28", done: false },
  { id: 11, title: "Spec liquid-glass surface variants", when: "tomorrow", projectId: "design",
    due: "Apr 29", tags: ["spec"], done: false },
  { id: 12, title: "Pair with Inkyu on icon stroke widths", when: "tomorrow", projectId: "design",
    due: "Apr 30", repeat: "Weekly", done: false },
  // Marq Design — Someday
  { id: 13, title: "Try woodgrain texture as nav backing", when: "someday", projectId: "design",
    tags: ["explore"], done: false },
  { id: 14, title: "Investigate variable font for display", when: "someday", projectId: "design",
    done: false },
  // Marq Design — Logbook
  { id: 15, title: "Kickoff doc + scope", when: "today", projectId: "design", done: true },
  { id: 16, title: "Stakeholder interviews (4)", when: "today", projectId: "design", done: true },
  { id: 17, title: "Competitive teardown deck", when: "today", projectId: "design", done: true },
  // Inbox
  { id: 18, title: "Shortcut for quickly creating recurring tasks", when: "inbox", done: false },
  { id: 19, title: "Find cafe for next 1:1 with Mira", when: "inbox", done: false },
  { id: 20, title: "Draft trip itinerary for Jeju", when: "inbox", done: false },
  // Anytime
  { id: 21, title: "Read draft from team retrospective", when: "anytime", projectId: "okr", done: false },
  { id: 22, title: "Try the new ramen place", when: "anytime", projectId: "cooking", done: false },
  // Someday
  { id: 23, title: "Plan a weekend in Busan", when: "someday", projectId: "apartment", done: false },
  { id: 24, title: "Learn how to make handmade pasta", when: "someday", projectId: "cooking", done: false },
  // Brand audit project
  { id: 25, title: "Compile brand voice samples", when: "tomorrow", projectId: "brand",
    due: "Apr 29", done: false },
  // Apartment project
  { id: 26, title: "Sign lease addendum", when: "tomorrow", projectId: "apartment",
    due: "May 2", done: false },
];

// ─── helpers ────────────────────────────────────────
const dayFromDue = (due) => {
  if (!due) return null;
  if (due === "Today") return 26;
  if (due === "Tomorrow") return 27;
  const m = /^Apr\s+(\d{1,2})$/.exec(due);
  if (m) return parseInt(m[1], 10);
  return null;
};

const computeCounts = (tasks) => {
  const counts = {
    inbox: 0, today: 0, upcoming: 0, anytime: 0, someday: 0, byProject: {},
  };
  for (const t of tasks) {
    if (t.done) continue;
    if (!t.projectId && t.when === "inbox") counts.inbox++;
    if (t.bucket === "today" || t.bucket === "evening") counts.today++;
    if (dayFromDue(t.due) != null && dayFromDue(t.due) > 26) counts.upcoming++;
    if (t.when === "anytime") counts.anytime++;
    if (t.when === "someday") counts.someday++;
    if (t.projectId) counts.byProject[t.projectId] = (counts.byProject[t.projectId] || 0) + 1;
  }
  return counts;
};

// ─── views ──────────────────────────────────────────

const TodayView = ({ tasks, onToggle, projectsById, onQuickAdd }) => {
  const today = tasks.filter((t) => t.bucket === "today");
  const evening = tasks.filter((t) => t.bucket === "evening");
  const remaining = today.filter((t) => !t.done).length;
  const eveningCount = evening.filter((t) => !t.done).length;

  return (
    <div className="main">
      <div className="toolbar glass">
        <div style={{ width: 4 }}></div>
        <div className="breadcrumb"><Icon name="sun" size={13} style={{ color: "var(--warm)" }} /><b>Today</b></div>
        <div style={{ flex: 1 }}></div>
        <span className="icon-btn" title="Filter"><Icon name="filter" size={14} /></span>
        <span className="icon-btn" title="More"><Icon name="more" size={14} /></span>
        <button className="btn" onClick={onQuickAdd}><Icon name="plus" size={12} />Quick add<span className="kbd">⌘N</span></button>
      </div>
      <div className="content">
        <div className="page-h">
          <div>
            <div className="title" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: "var(--warm)" }}><Icon name="sun" size={26} /></span>
              Today
            </div>
            <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 4 }}>Saturday · April 26</div>
          </div>
          <div style={{ flex: 1 }}></div>
          {(remaining > 0 || eveningCount > 0) && (
            <div style={{ fontSize: 12, color: "var(--fg-3)", marginBottom: 6 }}>
              {remaining} to do{eveningCount > 0 ? ` · ${eveningCount} this evening` : ""}
            </div>
          )}
        </div>

        {today.length > 0 && (
          <>
            <GroupHeader kind="today" label="Today" />
            <div className="tasks">
              {today.map((t) => <TaskRow key={t.id} task={t} onToggle={onToggle} showProject projectsById={projectsById} />)}
            </div>
          </>
        )}

        {evening.length > 0 && (
          <>
            <GroupHeader kind="evening" label="This Evening" />
            <div className="tasks">
              {evening.map((t) => <TaskRow key={t.id} task={t} onToggle={onToggle} showProject projectsById={projectsById} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const ProjectView = ({ project, group, tasks, onToggle, projectsById, onQuickAdd }) => {
  const projTasks = tasks.filter((t) => t.projectId === project.id);
  const inFlight = projTasks.filter((t) => !t.done && t.when !== "someday");
  const someday = projTasks.filter((t) => !t.done && t.when === "someday");
  const logbook = projTasks.filter((t) => t.done);
  const totalDone = logbook.length;
  const total = projTasks.length;

  return (
    <div className="main">
      <div className="toolbar glass">
        <div className="breadcrumb">
          {group && <span>{group.name}</span>}
          {group && <Icon name="chev" size={11} />}
          <b>{project.name}</b>
        </div>
        <div style={{ flex: 1 }}></div>
        <span className="icon-btn"><Icon name="filter" size={14} /></span>
        <span className="icon-btn"><Icon name="more" size={14} /></span>
        <button className="btn" onClick={onQuickAdd}><Icon name="plus" size={12} />Quick add<span className="kbd">⌘N</span></button>
      </div>

      <div className="content">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 28 }}>
          <div style={{ flex: 1, paddingTop: 4 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600, letterSpacing: "-0.025em" }}>{project.name}</div>
            <div style={{ display: "flex", gap: 14, marginTop: 12, fontSize: 12, color: "var(--fg-3)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="calendar" size={12} />Through May 30</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Icon name="check" size={12} />{totalDone} of {total} done</span>
            </div>
          </div>
        </div>

        {inFlight.length > 0 && (
          <>
            <GroupHeader kind="today" label="In Flight" count={`${inFlight.length} task${inFlight.length === 1 ? "" : "s"}`} />
            <div className="tasks">{inFlight.map((t) => <TaskRow key={t.id} task={t} onToggle={onToggle} projectsById={projectsById} />)}</div>
          </>
        )}

        {someday.length > 0 && (
          <>
            <GroupHeader kind="someday" label="Someday" count={`${someday.length} task${someday.length === 1 ? "" : "s"}`} />
            <div className="tasks">{someday.map((t) => <TaskRow key={t.id} task={t} onToggle={onToggle} projectsById={projectsById} />)}</div>
          </>
        )}

        {logbook.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--fg-4)", padding: "8px 8px" }}>Logbook · {logbook.length} done</div>
            <div className="tasks">{logbook.map((t) => <TaskRow key={t.id} task={t} onToggle={onToggle} projectsById={projectsById} />)}</div>
          </div>
        )}
      </div>
    </div>
  );
};

const UpcomingView = ({ tasks, onToggle, projectsById, onQuickAdd }) => {
  // Build day → tasks mapping for April 2026
  const byDay = {};
  for (const t of tasks) {
    if (t.done) continue;
    const d = dayFromDue(t.due);
    if (d == null) continue;
    (byDay[d] = byDay[d] || []).push(t);
  }

  // April 2026: starts on Wednesday (assume layout has 2 leading mute cells)
  const days = Array.from({ length: 35 }).map((_, i) => {
    const date = i - 2;
    const valid = date > 0 && date <= 30;
    if (!valid) return { date: date <= 0 ? 30 + date : date - 30, mute: true };
    return {
      date,
      today: date === 26,
      tasks: byDay[date] || [],
    };
  });

  const todayTasks = tasks.filter((t) => t.bucket === "today" && !t.done);

  return (
    <div className="main" style={{ display: "grid", gridTemplateRows: todayTasks.length > 0 ? "auto 1fr auto" : "auto 1fr", overflow: "hidden" }}>
      <div className="toolbar glass">
        <div className="breadcrumb"><b>Upcoming</b><span>· April 2026</span></div>
        <div style={{ flex: 1 }}></div>
        <div className="seg">
          <span className="seg-item active">Month</span>
          <span className="seg-item">Week</span>
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          <span className="icon-btn" title="Previous month"><Icon name="chev" size={12} style={{ transform: "rotate(180deg)" }} /></span>
          <span className="btn" style={{ background: "transparent" }} title="Jump to today">Today</span>
          <span className="icon-btn" title="Next month"><Icon name="chev" size={12} /></span>
        </div>
        <button className="btn" onClick={onQuickAdd}><Icon name="plus" size={12} />Quick add<span className="kbd">⌘N</span></button>
      </div>

      <div style={{ padding: "14px 22px 10px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "0 0 8px" }}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
            <div key={d} style={{ fontSize: 10.5, fontWeight: 600, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{d}</div>
          ))}
        </div>

        <div className="glass" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "1fr", gap: 1, background: "oklch(0.4 0.01 80 / 0.06)", borderRadius: "var(--r-md)", padding: 1, flex: 1, overflow: "hidden" }}>
          {days.map((d, i) => (
            <div key={i} style={{
              background: d.today ? "oklch(0.78 0.12 60 / 0.14)" : d.mute ? "oklch(1 0 0 / 0.35)" : "var(--bg-glass)",
              padding: "6px 8px 8px", display: "flex", flexDirection: "column", gap: 3, minHeight: 0, position: "relative",
            }}>
              <div style={{
                fontSize: 11, fontWeight: d.today ? 700 : 500,
                color: d.mute ? "var(--fg-4)" : d.today ? "var(--warm)" : "var(--fg-2)",
                fontVariantNumeric: "tabular-nums", marginBottom: 1,
              }}>
                {d.today
                  ? <span style={{ display: "inline-flex", width: 18, height: 18, borderRadius: 999, background: "var(--warm)", color: "white", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700 }}>{d.date}</span>
                  : d.date}
              </div>
              {d.tasks?.slice(0, 3).map((t) => {
                const proj = t.projectId ? projectsById[t.projectId] : null;
                const color = proj ? proj.color : "oklch(0.6 0.04 80)";
                return (
                  <div
                    key={t.id}
                    title={t.title}
                    style={{ fontSize: 10.5, padding: "2px 6px", borderRadius: 3, background: color, color: "white", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.005em" }}
                  >
                    {t.title}
                  </div>
                );
              })}
              {d.tasks && d.tasks.length > 3 && (
                <div style={{ fontSize: 10, color: "var(--fg-4)", fontWeight: 500, paddingLeft: 2 }}>+{d.tasks.length - 3} more</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {todayTasks.length > 0 && (
        <div className="glass-strong" style={{ padding: "10px 22px 16px", maxHeight: 180, overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600 }}>Sat, April 26</span>
            <span style={{ fontSize: 11, color: "var(--fg-4)" }}>Today · {todayTasks.length} task{todayTasks.length === 1 ? "" : "s"}</span>
            <span style={{ flex: 1 }}></span>
            <span className="icon-btn" onClick={onQuickAdd}><Icon name="plus" size={13} /></span>
          </div>
          <div className="tasks">
            {todayTasks.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={onToggle} showProject compact projectsById={projectsById} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ListView = ({ title, glyph, glyphColor, subtitle, tasks, onToggle, projectsById, onQuickAdd }) => (
  <div className="main">
    <div className="toolbar glass">
      <div style={{ width: 4 }}></div>
      <div className="breadcrumb">
        <Icon name={glyph} size={13} style={{ color: glyphColor }} />
        <b>{title}</b>
      </div>
      <div style={{ flex: 1 }}></div>
      <span className="icon-btn" title="Filter"><Icon name="filter" size={14} /></span>
      <span className="icon-btn" title="More"><Icon name="more" size={14} /></span>
      <button className="btn" onClick={onQuickAdd}><Icon name="plus" size={12} />Quick add<span className="kbd">⌘N</span></button>
    </div>
    <div className="content">
      <div className="page-h">
        <div>
          <div className="title" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: glyphColor }}><Icon name={glyph} size={26} /></span>
            {title}
          </div>
          {subtitle && <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 4 }}>{subtitle}</div>}
        </div>
      </div>

      {tasks.length > 0 && (
        <div className="tasks">
          {tasks.map((t) => <TaskRow key={t.id} task={t} onToggle={onToggle} showProject projectsById={projectsById} />)}
        </div>
      )}
    </div>
  </div>
);

// ─── App root ───────────────────────────────────────
function App() {
  const [view, setView] = React.useState({ type: "today" });
  const [tasks, setTasks] = React.useState(initialTasks);
  const [projects, setProjects] = React.useState(initialProjects);
  const [groups] = React.useState(initialGroups);
  const [quickAdd, setQuickAdd] = React.useState(false);
  const nextId = React.useRef(100);

  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setQuickAdd(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const projectsById = React.useMemo(() => {
    const m = {};
    for (const p of projects) m[p.id] = p;
    return m;
  }, [projects]);

  const groupsById = React.useMemo(() => {
    const m = {};
    for (const g of groups) m[g.id] = g;
    return m;
  }, [groups]);

  const counts = React.useMemo(() => computeCounts(tasks), [tasks]);

  const toggleTask = (id) => {
    setTasks((ts) => ts.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  };

  const addTask = (payload) => {
    const id = nextId.current++;
    setTasks((ts) => [{ id, done: false, ...payload }, ...ts]);
    // Navigate to the destination view if it makes sense
    if (payload.bucket === "today" || payload.bucket === "evening") {
      setView({ type: "today" });
    } else if (payload.when === "someday") {
      // stay where the user was; or go to someday
    }
  };

  const addProject = (groupId, name) => {
    const g = groupsById[groupId];
    const id = `proj-${nextId.current++}`;
    const color = g?.color || "var(--accent)";
    const newProject = { id, groupId, name, color };
    setProjects((ps) => [...ps, newProject]);
    setView({ type: "project", id });
  };

  const defaultProjectId = view.type === "project" ? view.id : null;

  // Render current view
  let pane = null;
  if (view.type === "today") {
    pane = <TodayView tasks={tasks} onToggle={toggleTask} projectsById={projectsById} onQuickAdd={() => setQuickAdd(true)} />;
  } else if (view.type === "project") {
    const project = projectsById[view.id];
    if (project) {
      const group = groupsById[project.groupId];
      pane = <ProjectView project={project} group={group} tasks={tasks} onToggle={toggleTask} projectsById={projectsById} onQuickAdd={() => setQuickAdd(true)} />;
    }
  } else if (view.type === "upcoming") {
    pane = <UpcomingView tasks={tasks} onToggle={toggleTask} projectsById={projectsById} onQuickAdd={() => setQuickAdd(true)} />;
  } else if (view.type === "inbox") {
    const list = tasks.filter((t) => t.when === "inbox" && !t.done);
    pane = <ListView title="Inbox" glyph="inbox" glyphColor="var(--accent)" subtitle="Unsorted · drop in any thought" tasks={list} onToggle={toggleTask} projectsById={projectsById} onQuickAdd={() => setQuickAdd(true)} />;
  } else if (view.type === "anytime") {
    const list = tasks.filter((t) => t.when === "anytime" && !t.done);
    pane = <ListView title="Anytime" glyph="list" glyphColor="var(--fg-3)" subtitle="No specific time — pick when ready" tasks={list} onToggle={toggleTask} projectsById={projectsById} onQuickAdd={() => setQuickAdd(true)} />;
  } else if (view.type === "someday") {
    const list = tasks.filter((t) => t.when === "someday" && !t.done);
    pane = <ListView title="Someday" glyph="drop" glyphColor="var(--someday)" subtitle="Maybe later — out of mind, not lost" tasks={list} onToggle={toggleTask} projectsById={projectsById} onQuickAdd={() => setQuickAdd(true)} />;
  }

  const meshClass = view.type === "today" || view.type === "inbox" ? "mesh-warm" : "mesh-cool";

  return (
    <div className={`app ${meshClass}`} data-theme="light" data-density="comfortable" style={{ position: "relative" }}>
      <Sidebar
        view={view}
        onNavigate={setView}
        groups={groups}
        projects={projects}
        counts={counts}
        onAddProject={addProject}
      />
      {pane}
      <NewTaskModal
        open={quickAdd}
        onClose={() => setQuickAdd(false)}
        onSubmit={addTask}
        projects={projects}
        defaultProjectId={defaultProjectId}
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
