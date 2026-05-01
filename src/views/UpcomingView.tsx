import { useState } from "react";
import type { Project, Task } from "../types";
import { Icon } from "../components/Icon";
import { TaskRow } from "../components/TaskRow";
import { toIsoDate, todayIso } from "../data/helpers";

interface Props {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onSetDue: (id: string, due: string | null) => void;
  recentlyCompleted: Set<string>;
  projectsById: Record<string, Project>;
  onQuickAdd: () => void;
}

interface DayCell {
  date: number;
  iso: string;
  outOfMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

export function UpcomingView({ tasks, onToggle, onDelete, onEdit, onSetDue, recentlyCompleted, projectsById, onQuickAdd }: Props) {
  const today = new Date();
  const todayKey = todayIso();

  const [anchor, setAnchor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const byDay: Record<string, Task[]> = {};
  for (const t of tasks) {
    if (t.done || !t.due) continue;
    (byDay[t.due] = byDay[t.due] || []).push(t);
  }

  // Calendar grid: Sunday on or before the 1st through Saturday on or after the last
  const start = new Date(anchor);
  start.setDate(1 - anchor.getDay());

  const lastOfMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const end = new Date(lastOfMonth);
  end.setDate(lastOfMonth.getDate() + (6 - lastOfMonth.getDay()));
  const cellCount = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;

  const days: DayCell[] = Array.from({ length: cellCount }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = toIsoDate(d);
    return {
      date: d.getDate(),
      iso,
      outOfMonth: d.getMonth() !== anchor.getMonth(),
      isToday: iso === todayKey,
      tasks: byDay[iso] ?? [],
    };
  });

  const monthLabel = anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const todayLabel = today.toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" });

  const goPrev = () => setAnchor((a) => new Date(a.getFullYear(), a.getMonth() - 1, 1));
  const goNext = () => setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + 1, 1));
  const goToday = () => setAnchor(new Date(today.getFullYear(), today.getMonth(), 1));
  const isCurrentMonth =
    anchor.getFullYear() === today.getFullYear() && anchor.getMonth() === today.getMonth();

  const todayTasks = tasks.filter(
    (t) => t.bucket === "today" && (!t.done || recentlyCompleted.has(t.id)),
  );

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
          <span>· {monthLabel}</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
          <button type="button" className="icon-btn" title="Previous month" onClick={goPrev}>
            <Icon name="chev" size={12} style={{ transform: "rotate(180deg)" }} />
          </button>
          <button
            type="button"
            className="btn"
            style={{ background: "transparent" }}
            title="Jump to today"
            onClick={goToday}
            disabled={isCurrentMonth}
          >
            Today
          </button>
          <button type="button" className="icon-btn" title="Next month" onClick={goNext}>
            <Icon name="chev" size={12} />
          </button>
        </div>
        <button className="btn" onClick={onQuickAdd}>
          <Icon name="plus" size={12} />Quick add<span className="kbd">^N</span>
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
          {days.map((d) => (
            <div
              key={d.iso}
              style={{
                background: d.isToday
                  ? "oklch(0.78 0.12 60 / 0.14)"
                  : d.outOfMonth
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
                  fontWeight: d.isToday ? 700 : 500,
                  color: d.outOfMonth ? "var(--fg-4)" : d.isToday ? "var(--warm)" : "var(--fg-2)",
                  fontVariantNumeric: "tabular-nums",
                  marginBottom: 1,
                }}
              >
                {d.isToday ? (
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
              {d.tasks.slice(0, 3).map((t) => {
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
              {d.tasks.length > 3 && (
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
            <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600 }}>{todayLabel}</span>
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
              <TaskRow key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onSetDue={onSetDue} showProject compact projectsById={projectsById} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
