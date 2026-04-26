import type { Group, Project, Task } from "../types";
import { Icon } from "../components/Icon";
import { TaskRow } from "../components/TaskRow";
import { GroupHeader } from "../components/GroupHeader";

interface Props {
  project: Project;
  group: Group | undefined;
  tasks: Task[];
  onToggle: (id: number) => void;
  projectsById: Record<string, Project>;
  onQuickAdd: () => void;
}

export function ProjectView({ project, group, tasks, onToggle, projectsById, onQuickAdd }: Props) {
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
        <div style={{ flex: 1 }} />
        <span className="icon-btn"><Icon name="filter" size={14} /></span>
        <span className="icon-btn"><Icon name="more" size={14} /></span>
        <button className="btn" onClick={onQuickAdd}>
          <Icon name="plus" size={12} />Quick add<span className="kbd">⌘N</span>
        </button>
      </div>

      <div className="content">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 28 }}>
          <div style={{ flex: 1, paddingTop: 4 }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 26,
                fontWeight: 600,
                letterSpacing: "-0.025em",
              }}
            >
              {project.name}
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: 12, fontSize: 12, color: "var(--fg-3)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="calendar" size={12} />Through May 30
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="check" size={12} />
                {totalDone} of {total} done
              </span>
            </div>
          </div>
        </div>

        {inFlight.length > 0 && (
          <>
            <GroupHeader
              kind="today"
              label="In Flight"
              count={`${inFlight.length} task${inFlight.length === 1 ? "" : "s"}`}
            />
            <div className="tasks">
              {inFlight.map((t) => (
                <TaskRow key={t.id} task={t} onToggle={onToggle} projectsById={projectsById} />
              ))}
            </div>
          </>
        )}

        {someday.length > 0 && (
          <>
            <GroupHeader
              kind="someday"
              label="Someday"
              count={`${someday.length} task${someday.length === 1 ? "" : "s"}`}
            />
            <div className="tasks">
              {someday.map((t) => (
                <TaskRow key={t.id} task={t} onToggle={onToggle} projectsById={projectsById} />
              ))}
            </div>
          </>
        )}

        {logbook.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--fg-4)",
                padding: "8px 8px",
              }}
            >
              Logbook · {logbook.length} done
            </div>
            <div className="tasks">
              {logbook.map((t) => (
                <TaskRow key={t.id} task={t} onToggle={onToggle} projectsById={projectsById} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
