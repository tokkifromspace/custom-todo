import type { Project, Task } from "../types";
import { Icon } from "../components/Icon";
import { TaskRow } from "../components/TaskRow";
import { GroupHeader } from "../components/GroupHeader";

interface Props {
  tasks: Task[];
  onToggle: (id: string) => void;
  projectsById: Record<string, Project>;
  onQuickAdd: () => void;
}

export function TodayView({ tasks, onToggle, projectsById, onQuickAdd }: Props) {
  const today = tasks.filter((t) => t.bucket === "today");
  const evening = tasks.filter((t) => t.bucket === "evening");
  const remaining = today.filter((t) => !t.done).length;
  const eveningCount = evening.filter((t) => !t.done).length;

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
            <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 4 }}>Saturday · April 26</div>
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
              {today.map((t) => (
                <TaskRow key={t.id} task={t} onToggle={onToggle} showProject projectsById={projectsById} />
              ))}
            </div>
          </>
        )}

        {evening.length > 0 && (
          <>
            <GroupHeader kind="evening" label="This Evening" />
            <div className="tasks">
              {evening.map((t) => (
                <TaskRow key={t.id} task={t} onToggle={onToggle} showProject projectsById={projectsById} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
