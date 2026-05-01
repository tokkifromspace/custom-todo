import type { Project, Task } from "../types";
import { Icon } from "../components/Icon";
import { SortableTaskList } from "../components/SortableTaskList";
import { GroupHeader } from "../components/GroupHeader";

interface Props {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onSetDue: (id: string, due: string | null) => void;
  onReorder: (orderedIds: string[]) => void;
  recentlyCompleted: Set<string>;
  projectsById: Record<string, Project>;
  onQuickAdd: () => void;
}

export function TodayView({ tasks, onToggle, onDelete, onEdit, onSetDue, onReorder, recentlyCompleted, projectsById, onQuickAdd }: Props) {
  const visible = (t: Task) => !t.done || recentlyCompleted.has(t.id);
  const today = tasks.filter((t) => t.bucket === "today" && visible(t));
  const evening = tasks.filter((t) => t.bucket === "evening" && visible(t));
  const remaining = today.length;
  const eveningCount = evening.length;

  const now = new Date();
  const todayLabel = `${now.toLocaleDateString("en-US", { weekday: "long" })} · ${now.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`;

  return (
    <div className="main">
      <div className="toolbar glass">
        <div style={{ width: 4 }} />
        <div className="breadcrumb">
          <Icon name="sun" size={13} style={{ color: "var(--warm)" }} />
          <b>Today</b>
        </div>
        <div style={{ flex: 1 }} />
        <span className="icon-btn" title="Filter">
          <Icon name="filter" size={14} />
        </span>
        <span className="icon-btn" title="More">
          <Icon name="more" size={14} />
        </span>
        <button className="btn" onClick={onQuickAdd}>
          <Icon name="plus" size={12} />Quick add<span className="kbd">^N</span>
        </button>
      </div>

      <div className="content">
        <div className="page-h">
          <div>
            <div className="title" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: "var(--warm)" }}>
                <Icon name="sun" size={26} />
              </span>
              Today
            </div>
            <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 4 }}>{todayLabel}</div>
          </div>
          <div style={{ flex: 1 }} />
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
              <SortableTaskList
                tasks={today}
                onToggle={onToggle}
                onDelete={onDelete}
                onEdit={onEdit}
                onSetDue={onSetDue}
                onReorder={onReorder}
                projectsById={projectsById}
                showProject
              />
            </div>
          </>
        )}

        {evening.length > 0 && (
          <>
            <GroupHeader kind="evening" label="This Evening" />
            <div className="tasks">
              <SortableTaskList
                tasks={evening}
                onToggle={onToggle}
                onDelete={onDelete}
                onEdit={onEdit}
                onSetDue={onSetDue}
                onReorder={onReorder}
                projectsById={projectsById}
                showProject
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
