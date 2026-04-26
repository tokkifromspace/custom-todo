import type { Project, Task } from "../types";
import { Icon } from "../components/Icon";
import { TaskRow } from "../components/TaskRow";
import { dayFromDue } from "../data/helpers";

interface Props {
  tasks: Task[];
  onToggle: (id: number) => void;
  projectsById: Record<string, Project>;
  onQuickAdd: () => void;
}

interface DayCell {
  date: number;
  mute?: boolean;
  today?: boolean;
  tasks?: Task[];
}

export function UpcomingView({ tasks, onToggle, projectsById, onQuickAdd }: Props) {
  const byDay: Record<number, Task[]> = {};
  for (const t of tasks) {
    if (t.done) continue;
    const d = dayFromDue(t.due);
    if (d == null) continue;
    (byDay[d] = byDay[d] || []).push(t);
  }

  const days: DayCell[] = Array.from({ length: 35 }).map((_, i) => {
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
    <div
      className="main"
      style={{
        display: "grid",
        gridTemplateRows: todayTasks.length > 0 ? "auto 1fr auto" : "auto 1fr",
        overflow: "hidden",
      }}
    >
      <div className="toolbar glass">
        <div className="breadcrumb">
          <b>Upcoming</b>
          <span>· April 2026</span>
        </div>
        <div style={{ flex: 1 }} />
        <div className="seg">
          <span className="seg-item active">Month</span>
          <span className="seg-item">Week</span>
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          <span className="icon-btn" title="Previous month">
            <Icon name="chev" size={12} style={{ transform: "rotate(180deg)" }} />
          </span>
          <span className="btn" style={{ background: "transparent" }} title="Jump to today">
            Today
          </span>
          <span className="icon-btn" title="Next month">
            <Icon name="chev" size={12} />
          </span>
        </div>
        <button className="btn" onClick={onQuickAdd}>
          <Icon name="plus" size={12} />Quick add<span className="kbd">⌘N</span>
        </button>
      </div>

      <div style={{ padding: "14px 22px 10px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "0 0 8px" }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: "var(--fg-4)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {d}
            </div>
          ))}
        </div>

        <div
          className="glass"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gridAutoRows: "1fr",
            gap: 1,
            background: "oklch(0.4 0.01 80 / 0.06)",
            borderRadius: "var(--r-md)",
            padding: 1,
            flex: 1,
            overflow: "hidden",
          }}
        >
          {days.map((d, i) => (
            <div
              key={i}
              style={{
                background: d.today
                  ? "oklch(0.78 0.12 60 / 0.14)"
                  : d.mute
                  ? "oklch(1 0 0 / 0.35)"
                  : "var(--bg-glass)",
                padding: "6px 8px 8px",
                display: "flex",
                flexDirection: "column",
                gap: 3,
                minHeight: 0,
                position: "relative",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: d.today ? 700 : 500,
                  color: d.mute ? "var(--fg-4)" : d.today ? "var(--warm)" : "var(--fg-2)",
                  fontVariantNumeric: "tabular-nums",
                  marginBottom: 1,
                }}
              >
                {d.today ? (
                  <span
                    style={{
                      display: "inline-flex",
                      width: 18,
                      height: 18,
                      borderRadius: 999,
                      background: "var(--warm)",
                      color: "white",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10.5,
                      fontWeight: 700,
                    }}
                  >
                    {d.date}
                  </span>
                ) : (
                  d.date
                )}
              </div>
              {d.tasks?.slice(0, 3).map((t) => {
                const proj = t.projectId ? projectsById[t.projectId] : null;
                const color = proj ? proj.color : "oklch(0.6 0.04 80)";
                return (
                  <div
                    key={t.id}
                    title={t.title}
                    style={{
                      fontSize: 10.5,
                      padding: "2px 6px",
                      borderRadius: 3,
                      background: color,
                      color: "white",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      letterSpacing: "-0.005em",
                    }}
                  >
                    {t.title}
                  </div>
                );
              })}
              {d.tasks && d.tasks.length > 3 && (
                <div style={{ fontSize: 10, color: "var(--fg-4)", fontWeight: 500, paddingLeft: 2 }}>
                  +{d.tasks.length - 3} more
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {todayTasks.length > 0 && (
        <div className="glass-strong" style={{ padding: "10px 22px 16px", maxHeight: 180, overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600 }}>Sat, April 26</span>
            <span style={{ fontSize: 11, color: "var(--fg-4)" }}>
              Today · {todayTasks.length} task{todayTasks.length === 1 ? "" : "s"}
            </span>
            <span style={{ flex: 1 }} />
            <span className="icon-btn" onClick={onQuickAdd}>
              <Icon name="plus" size={13} />
            </span>
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
}
