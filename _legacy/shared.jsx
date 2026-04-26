// Shared UI primitives. Globals from icons.jsx: Icon

const TrafficLights = () => (
  <div className="titlebar">
    <span className="dot r"></span>
    <span className="dot y"></span>
    <span className="dot g"></span>
  </div>
);

const Checkbox = ({ checked, bucket, onClick }) => (
  <div
    className={`checkbox ${checked ? "checked" : ""} ${bucket === "evening" ? "evening-bucket" : ""} ${bucket === "today" ? "warm-bucket" : ""}`}
    onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}
  >
    <Icon name="check" size={12} />
  </div>
);

const ProjectSwatch = ({ color }) => (
  <span className="swatch" style={{ background: color }} />
);

const TaskRow = ({ task, onToggle, showProject, compact, projectsById }) => {
  const overdue = task.due && task.dueOverdue;
  const isToday = task.due && task.dueToday;
  const project = task.projectId ? projectsById?.[task.projectId] : null;
  return (
    <div className={`task-row ${task.done ? "done" : ""}`}>
      <Checkbox checked={task.done} bucket={task.bucket} onClick={() => onToggle && onToggle(task.id)} />
      <div className="task-body">
        <div className="ttitle">{task.title}</div>
        {task.notes && !compact && <div className="tnotes">{task.notes}</div>}
        {(task.due || task.tags?.length || project || task.repeat) && (
          <div className="tmeta">
            {task.due && (
              <span className={`chip due ${overdue ? "overdue" : ""} ${isToday ? "today" : ""}`}>
                <Icon name="calendar" size={11} />
                {task.due}
              </span>
            )}
            {task.repeat && <span className="chip due"><Icon name="repeat" size={11} />{task.repeat}</span>}
            {showProject && project && (
              <span className="chip proj">
                <span style={{ width: 7, height: 7, borderRadius: 2, background: project.color, flexShrink: 0 }}></span>
                {project.name}
              </span>
            )}
            {task.tags?.map((t) => (
              <span key={t} className="chip tag">{t}</span>
            ))}
          </div>
        )}
      </div>
      <div className="right-actions">
        <span className="icon-btn"><Icon name="calendar" size={14} /></span>
        <span className="icon-btn"><Icon name="tag" size={14} /></span>
        <span className="icon-btn"><Icon name="more" size={14} /></span>
      </div>
    </div>
  );
};

const GroupHeader = ({ kind, label, count, time }) => {
  const icon = kind === "today" ? "sun" : kind === "evening" ? "moon" : kind === "someday" ? "drop" : "list";
  return (
    <div className={`group-h ${kind}`}>
      <span className="glyph"><Icon name={icon} size={14} /></span>
      <span className="label">{label}</span>
      {time && <span className="meta">{time}</span>}
      {count != null && <span className="meta">{count}</span>}
    </div>
  );
};

// ─── Sidebar ─────────────────────────────────────────
const Sidebar = ({ view, onNavigate, groups, projects, counts, onAddProject }) => {
  const [openInput, setOpenInput] = React.useState(null); // group id or null
  const [draftName, setDraftName] = React.useState("");
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (openInput && inputRef.current) inputRef.current.focus();
  }, [openInput]);

  const closeInput = () => { setOpenInput(null); setDraftName(""); };
  const commit = () => {
    const name = draftName.trim();
    if (name) onAddProject && onAddProject(openInput, name);
    closeInput();
  };
  const onKeyDown = (e) => {
    if (e.key === "Escape") closeInput();
    if (e.key === "Enter") commit();
  };

  const isProject = (id) => view.type === "project" && view.id === id;
  const projectsByGroup = (gid) => projects.filter((p) => p.groupId === gid);

  return (
    <div className="sidebar">
      <TrafficLights />
      <div className="side-search">
        <Icon name="search" size={13} />
        <span style={{ flex: 1 }}>Quick find</span>
        <span className="kbd">⌘K</span>
      </div>

      <div className="nav">
        <div className={`nav-item ${view.type === "inbox" ? "active" : ""}`} onClick={() => onNavigate({ type: "inbox" })}>
          <span className="glyph" style={{ color: "var(--accent)" }}><Icon name="inbox" size={14} /></span>
          <span>Inbox</span>
          {counts.inbox > 0 && <span className="count">{counts.inbox}</span>}
        </div>
        <div className={`nav-item ${view.type === "today" ? "active" : ""}`} onClick={() => onNavigate({ type: "today" })}>
          <span className="glyph warm"><Icon name="sun" size={14} /></span>
          <span>Today</span>
          {counts.today > 0 && <span className="count">{counts.today}</span>}
        </div>
        <div className={`nav-item ${view.type === "upcoming" ? "active" : ""}`} onClick={() => onNavigate({ type: "upcoming" })}>
          <span className="glyph evening"><Icon name="calendar" size={14} /></span>
          <span>Upcoming</span>
          {counts.upcoming > 0 && <span className="count">{counts.upcoming}</span>}
        </div>
        <div className={`nav-item ${view.type === "anytime" ? "active" : ""}`} onClick={() => onNavigate({ type: "anytime" })}>
          <span className="glyph" style={{ color: "var(--fg-3)" }}><Icon name="list" size={14} /></span>
          <span>Anytime</span>
          {counts.anytime > 0 && <span className="count">{counts.anytime}</span>}
        </div>
        <div className={`nav-item ${view.type === "someday" ? "active" : ""}`} onClick={() => onNavigate({ type: "someday" })}>
          <span className="glyph" style={{ color: "var(--someday)" }}><Icon name="drop" size={14} /></span>
          <span>Someday</span>
          {counts.someday > 0 && <span className="count">{counts.someday}</span>}
        </div>
      </div>

      {groups.map((g) => (
        <React.Fragment key={g.id}>
          <div className="nav-section">
            <span>{g.name}</span>
            <span
              className="kbd"
              onClick={() => setOpenInput(g.id)}
              style={{ background: "transparent", color: "var(--fg-4)", cursor: "default", userSelect: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-4)")}
            >+</span>
          </div>
          {projectsByGroup(g.id).map((p) => (
            <div
              key={p.id}
              className={`nav-project ${isProject(p.id) ? "active" : ""}`}
              onClick={() => onNavigate({ type: "project", id: p.id })}
            >
              <ProjectSwatch color={p.color} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
              {counts.byProject[p.id] > 0 && <span className="count">{counts.byProject[p.id]}</span>}
            </div>
          ))}
          {openInput === g.id && (
            <div className="nav-project" style={{ background: "var(--bg-hover)" }}>
              <ProjectSwatch color={g.color} />
              <input
                ref={inputRef}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={onKeyDown}
                onBlur={commit}
                placeholder="New project name"
                style={{
                  flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent",
                  fontSize: 13, fontFamily: "inherit", color: "var(--fg)", padding: 0,
                }}
              />
              <span className="kbd" style={{ background: "transparent", color: "var(--fg-4)", fontSize: 9.5 }}>↵</span>
            </div>
          )}
        </React.Fragment>
      ))}

      <div className="side-footer">
        <Icon name="settings" size={13} />
        <span>Logbook · Trash</span>
      </div>
    </div>
  );
};

// ─── New task modal ────────────────────────────────
const NewTaskModal = ({ open, onClose, onSubmit, projects, defaultProjectId }) => {
  const [title, setTitle] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [when, setWhen] = React.useState("today");
  const [showDeadline, setShowDeadline] = React.useState(false);
  const [deadline, setDeadline] = React.useState(null);
  const [projectId, setProjectId] = React.useState(defaultProjectId ?? null);
  const [tags, setTags] = React.useState([]);
  const [tagDraft, setTagDraft] = React.useState("");
  const [tagOpen, setTagOpen] = React.useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = React.useState(false);
  const titleRef = React.useRef(null);
  const tagInputRef = React.useRef(null);
  const projectMenuRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      setTitle(""); setNotes(""); setWhen("today");
      setShowDeadline(false); setDeadline(null);
      setProjectId(defaultProjectId ?? null);
      setTags([]); setTagDraft(""); setTagOpen(false); setProjectMenuOpen(false);
      setTimeout(() => titleRef.current?.focus(), 30);
    }
  }, [open, defaultProjectId]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose && onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  React.useEffect(() => {
    if (!projectMenuOpen) return;
    const onDoc = (e) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target)) setProjectMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [projectMenuOpen]);

  if (!open) return null;

  const suggestions = ["tokens", "focus", "design", "research", "blocked"];
  const remainingSuggestions = suggestions.filter(
    (s) => !tags.includes(s) && s.toLowerCase().includes(tagDraft.toLowerCase())
  );
  const addTag = (t) => {
    const v = (t || "").trim();
    if (!v || tags.includes(v)) return;
    setTags([...tags, v]);
    setTagDraft("");
  };
  const removeTag = (t) => setTags(tags.filter((x) => x !== t));

  const submit = () => {
    if (!title.trim()) { onClose && onClose(); return; }
    onSubmit && onSubmit({
      title: title.trim(),
      notes: notes.trim() || undefined,
      when,
      bucket: when === "today" ? "today" : when === "evening" ? "evening" : null,
      due: when === "today" ? "Today" : when === "tomorrow" ? "Tomorrow" : (deadline || undefined),
      dueToday: when === "today",
      projectId: projectId || undefined,
      tags: tags.length ? tags : undefined,
    });
    onClose && onClose();
  };

  const project = projectId ? projects.find((p) => p.id === projectId) : null;

  const buckets = [
    { v: "today",    l: "Today",    c: "var(--warm)",    icon: "sun" },
    { v: "evening",  l: "Evening",  c: "var(--evening)", icon: "moon" },
    { v: "tomorrow", l: "Tomorrow", c: "var(--accent)",  icon: "calendar" },
    { v: "anytime",  l: "Anytime",  c: "var(--fg-3)",    icon: "list" },
    { v: "someday",  l: "Someday",  c: "var(--someday)", icon: "drop" },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute", inset: 0, zIndex: 200,
        background: "oklch(0 0 0 / 0.22)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-strong"
        style={{ width: 540, borderRadius: 18, overflow: "visible", boxShadow: "var(--shadow-lg)" }}
      >
        <div style={{ padding: "20px 22px 12px" }}>
          <input
            ref={titleRef}
            placeholder="What needs doing?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ all: "unset", width: "100%", fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, letterSpacing: "-0.025em", color: "var(--fg)" }}
          />
          <textarea
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            style={{ all: "unset", display: "block", width: "100%", marginTop: 6, fontSize: 13, color: "var(--fg-2)", lineHeight: 1.45, resize: "none" }}
          />
        </div>

        <div style={{ padding: "8px 18px 14px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--fg-4)", marginBottom: 8 }}>When</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, marginBottom: 12 }}>
            {buckets.map((b) => {
              const on = when === b.v;
              return (
                <div
                  key={b.v}
                  onClick={() => setWhen(b.v)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                    padding: "10px 4px", borderRadius: 10, cursor: "default",
                    background: on ? "oklch(0.78 0.12 60 / 0.16)" : "oklch(0.4 0.01 80 / 0.04)",
                  }}
                >
                  <span style={{ color: b.c }}><Icon name={b.icon} size={15} /></span>
                  <span style={{ fontSize: 11.5, fontWeight: on ? 600 : 500, color: on ? "var(--fg)" : "var(--fg-2)" }}>{b.l}</span>
                </div>
              );
            })}
          </div>

          {!showDeadline ? (
            <button
              type="button"
              onClick={() => setShowDeadline(true)}
              style={{ all: "unset", display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, fontSize: 12, color: "var(--fg-3)", cursor: "default", background: "var(--bg-hover)" }}
            >
              <Icon name="calendar" size={12} />
              <span>Add deadline</span>
            </button>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11.5, color: "var(--fg-3)", fontWeight: 500 }}>Deadline · April 2026</span>
                <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <span className="icon-btn" style={{ width: 22, height: 22 }}><Icon name="chev" size={11} style={{ transform: "rotate(180deg)" }} /></span>
                  <span className="icon-btn" style={{ width: 22, height: 22 }}><Icon name="chev" size={11} /></span>
                  <span className="icon-btn" style={{ width: 22, height: 22, marginLeft: 4 }} onClick={() => { setShowDeadline(false); setDeadline(null); }} title="Remove deadline"><Icon name="x" size={11} /></span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, fontSize: 10.5, color: "var(--fg-4)", marginBottom: 4 }}>
                {["S","M","T","W","T","F","S"].map((d,i) => <div key={i} style={{ textAlign: "center", padding: "2px 0" }}>{d}</div>)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, fontSize: 11.5, color: "var(--fg-2)", fontVariantNumeric: "tabular-nums" }}>
                {Array.from({ length: 35 }).map((_, i) => {
                  const d = i - 2;
                  const valid = d > 0 && d <= 30;
                  const today = d === 26;
                  const picked = deadline && deadline === `Apr ${d}`;
                  return (
                    <div
                      key={i}
                      onClick={() => valid && setDeadline(`Apr ${d}`)}
                      style={{
                        height: 26, display: "flex", alignItems: "center", justifyContent: "center",
                        borderRadius: 6,
                        color: !valid ? "var(--fg-4)" : today ? "white" : picked ? "var(--accent)" : "var(--fg-2)",
                        background: today ? "var(--warm)" : picked ? "var(--accent-soft)" : "transparent",
                        fontWeight: today || picked ? 600 : 400,
                        cursor: valid ? "default" : "default",
                      }}
                    >{valid ? d : (d <= 0 ? 30 + d : d - 30)}</div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div style={{ padding: "12px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div ref={projectMenuRef} style={{ position: "relative" }}>
            <div
              onClick={() => setProjectMenuOpen((o) => !o)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, background: "var(--bg-hover)", cursor: "default" }}
            >
              {project
                ? <span style={{ width: 10, height: 10, borderRadius: 3, background: project.color, flexShrink: 0 }} />
                : <Icon name="folder" size={13} style={{ color: "var(--fg-3)" }} />}
              <span style={{ fontSize: 12.5, color: project ? "var(--fg)" : "var(--fg-3)", fontWeight: 500 }}>{project ? project.name : "No project"}</span>
            </div>
            {projectMenuOpen && (
              <div className="glass-strong" style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, width: 240, padding: 4, borderRadius: 8, zIndex: 5, boxShadow: "var(--shadow-md)", maxHeight: 240, overflowY: "auto" }}>
                <div
                  onClick={() => { setProjectId(null); setProjectMenuOpen(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 5, fontSize: 12, color: "var(--fg-2)", cursor: "default" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Icon name="inbox" size={11} style={{ color: "var(--fg-4)" }} />
                  No project (Inbox)
                </div>
                {projects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => { setProjectId(p.id); setProjectMenuOpen(false); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 5, fontSize: 12, color: "var(--fg-2)", cursor: "default" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: p.color, flexShrink: 0 }} />
                    {p.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ position: "relative", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, padding: "6px 10px", borderRadius: 8, background: "var(--bg-hover)", minHeight: 30 }}>
            <Icon name="tag" size={13} style={{ color: tags.length ? "var(--accent)" : "var(--fg-3)", flexShrink: 0 }} />
            {tags.map((t) => (
              <span key={t} className="chip" style={{ background: "oklch(1 0 0 / 0.6)", color: "var(--fg-2)", fontWeight: 500, fontSize: 11.5, paddingRight: 4 }}>
                {t}
                <span
                  onClick={() => removeTag(t)}
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 14, height: 14, borderRadius: 7, color: "var(--fg-4)", cursor: "default" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "oklch(0 0 0 / 0.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Icon name="x" size={9} />
                </span>
              </span>
            ))}
            {tagOpen ? (
              <input
                ref={tagInputRef}
                autoFocus
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addTag(tagDraft); }
                  else if (e.key === "Escape") { setTagOpen(false); setTagDraft(""); }
                  else if (e.key === "Backspace" && !tagDraft && tags.length) { removeTag(tags[tags.length - 1]); }
                }}
                onBlur={() => { if (tagDraft) addTag(tagDraft); setTimeout(() => setTagOpen(false), 120); }}
                placeholder="Add tag…"
                style={{ all: "unset", flex: 1, minWidth: 60, fontSize: 12.5, color: "var(--fg)" }}
              />
            ) : (
              <span
                onClick={() => setTagOpen(true)}
                style={{ fontSize: 12.5, color: "var(--fg-3)", cursor: "default", flex: 1 }}
              >
                {tags.length ? "" : "Add tag"}
              </span>
            )}
            {tagOpen && remainingSuggestions.length > 0 && (
              <div className="glass-strong" style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, padding: 4, borderRadius: 8, zIndex: 5, boxShadow: "var(--shadow-md)" }}>
                {remainingSuggestions.slice(0, 4).map((s) => (
                  <div
                    key={s}
                    onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: 5, fontSize: 12, color: "var(--fg-2)", cursor: "default" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <Icon name="tag" size={10} style={{ color: "var(--fg-4)" }} />
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <span className="icon-btn"><Icon name="bell" size={14} /></span>
          <span className="icon-btn"><Icon name="repeat" size={14} /></span>
          <span className="icon-btn"><Icon name="attachment" size={14} /></span>
          <span className="icon-btn"><Icon name="flag" size={14} /></span>
          <span style={{ flex: 1 }}></span>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={submit}>Add task<span className="kbd" style={{ background: "oklch(1 0 0 / 0.2)", color: "white" }}>⌘↵</span></button>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, {
  TrafficLights, Checkbox, ProjectSwatch, TaskRow, GroupHeader, Sidebar, NewTaskModal,
});
