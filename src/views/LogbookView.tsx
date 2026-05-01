import { useMemo, useState } from "react";
import type { Project, Task } from "../types";
import { Icon } from "../components/Icon";

interface Props {
  tasks: Task[];
  projectsById: Record<string, Project>;
  onUncomplete: (id: string) => void;
}

type Variant = "list" | "timeline";

interface MonthGroup {
  date: Date;
  items: Task[];
}

const MONTH_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getCompletedAt(task: Task): Date | null {
  if (!task.updatedAt) return null;
  const d = new Date(task.updatedAt);
  return Number.isNaN(d.getTime()) ? null : d;
}

function groupByMonth(items: Task[]): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();
  for (const t of items) {
    const d = getCompletedAt(t);
    if (!d) continue;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    let g = groups.get(key);
    if (!g) {
      g = { date: new Date(d.getFullYear(), d.getMonth(), 1), items: [] };
      groups.set(key, g);
    }
    g.items.push(t);
  }
  for (const g of groups.values()) {
    g.items.sort((a, b) => {
      const da = getCompletedAt(a)?.getTime() ?? 0;
      const db = getCompletedAt(b)?.getTime() ?? 0;
      return db - da;
    });
  }
  return [...groups.values()].sort((a, b) => b.date.getTime() - a.date.getTime());
}

function monthLabel(d: Date): string {
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  return sameYear ? MONTH_LONG[d.getMonth()] : `${MONTH_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

function dayLabel(d: Date): string {
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}

function timeLabel(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

interface RowProps {
  task: Task;
  project: Project | null;
  expanded: boolean;
  variant: Variant;
  onToggleExpand: (id: string) => void;
  onUncomplete: (id: string) => void;
}

function LogTaskRow({ task, project, expanded, variant, onToggleExpand, onUncomplete }: RowProps) {
  const hasNotes = !!task.notes;
  const completedAt = getCompletedAt(task);
  const tagsList = task.tags ?? [];
  const hasMeta = !!project || tagsList.length > 0;
  return (
    <div
      className="log-row"
      onClick={() => hasNotes && onToggleExpand(task.id)}
    >
      <div
        className="log-check"
        onClick={(e) => {
          e.stopPropagation();
          onUncomplete(task.id);
        }}
        title="Mark as not done"
        role="button"
        aria-label={`Mark "${task.title}" as not done`}
      >
        <Icon name="check" size={11} />
      </div>

      <div className="log-body">
        <div className="log-title-row">
          <span className="log-title">{task.title || "Untitled"}</span>
          {hasNotes && (
            <span className="log-note-glyph" title="Has notes">
              <Icon name="comment" size={11} />
            </span>
          )}
        </div>

        {hasMeta && (
          <div className="log-meta">
            {project && (
              <span className="log-chip log-proj">
                <span className="log-swatch" style={{ background: project.color }} />
                {project.name}
              </span>
            )}
            {tagsList.map((t) => (
              <span key={t} className="log-chip log-tag">{t}</span>
            ))}
          </div>
        )}

        {hasNotes && expanded && (
          <div className="log-notes-expanded">{task.notes}</div>
        )}
      </div>

      <div className="log-time">
        {completedAt
          ? variant === "timeline" ? timeLabel(completedAt) : dayLabel(completedAt)
          : ""}
      </div>
    </div>
  );
}

export function LogbookView({ tasks, projectsById, onUncomplete }: Props) {
  const [variant, setVariant] = useState<Variant>("list");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const completed = useMemo(
    () => tasks.filter((t) => t.done && getCompletedAt(t)),
    [tasks],
  );
  const months = useMemo(() => groupByMonth(completed), [completed]);

  const toggleExpand = (id: string) => {
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="main">
      <div className="toolbar glass">
        <div style={{ width: 4 }} />
        <div className="breadcrumb">
          <Icon name="archive" size={13} style={{ color: "var(--done)" }} />
          <b>Logbook</b>
        </div>
        <div style={{ flex: 1 }} />
        <div className="log-variant-toggle" role="tablist" aria-label="Logbook layout">
          <button
            type="button"
            role="tab"
            aria-pressed={variant === "list"}
            onClick={() => setVariant("list")}
          >
            List
          </button>
          <button
            type="button"
            role="tab"
            aria-pressed={variant === "timeline"}
            onClick={() => setVariant("timeline")}
          >
            Timeline
          </button>
        </div>
        <span className="icon-btn" title="Filter"><Icon name="filter" size={14} /></span>
        <span className="icon-btn" title="More"><Icon name="more" size={14} /></span>
      </div>

      <div className="content" data-logbook-variant={variant}>
        <div className="page-h">
          <div>
            <div className="title" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: "var(--done)" }}>
                <Icon name="archive" size={26} />
              </span>
              Logbook
            </div>
            <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 4 }}>
              {completed.length} completed · grouped by month
            </div>
          </div>
        </div>

        <div className="log-stream">
          {months.map((g, gi) => (
            <section key={gi} className="log-month">
              <div className="log-month-h">
                <div className="log-month-label">{monthLabel(g.date)}</div>
                <div style={{ flex: 1 }} />
                <div className="log-month-count">{g.items.length}</div>
              </div>
              <div className="log-list">
                {g.items.map((t) => (
                  <LogTaskRow
                    key={t.id}
                    task={t}
                    project={t.projectId ? projectsById[t.projectId] ?? null : null}
                    variant={variant}
                    expanded={expanded.has(t.id)}
                    onToggleExpand={toggleExpand}
                    onUncomplete={onUncomplete}
                  />
                ))}
              </div>
            </section>
          ))}

          {completed.length === 0 && (
            <div className="log-empty">
              <div className="log-empty-glyph"><Icon name="archive" size={32} /></div>
              <div className="log-empty-title">Logbook is empty</div>
              <div className="log-empty-sub">Completed tasks will land here, organized by month.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
