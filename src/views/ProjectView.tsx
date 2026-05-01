import type { Group, Project, Task } from "../types";
import { Icon } from "../components/Icon";
import { SortableTaskList } from "../components/SortableTaskList";
import { GroupHeader } from "../components/GroupHeader";

interface Props {
  project: Project;
  group: Group | undefined;
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onSetDue: (id: string, due: string | null) => void;
  onReorder: (orderedIds: string[]) => void;
  projectsById: Record<string, Project>;
  onQuickAdd: () => void;
}

export function ProjectView({ project, group, tasks, onToggle, onDelete, onEdit, onSetDue, onReorder, projectsById, onQuickAdd }: Props) {
  const projTasks = tasks.filter((t) => t.projectId === project.id);
  const inFlight = projTasks.filter((t) => !t.done && t.when !== "someday");
  const someday = projTasks.filter((t) => !t.done && t.when === "someday");
  const totalDone = projTasks.filter((t) => t.done).length;
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
          <Icon name="plus" size={12} />Quick add<span className="kbd">^N</span>
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
              <SortableTaskList
                tasks={inFlight}
                onToggle={onToggle}
                onDelete={onDelete}
                onEdit={onEdit}
                onSetDue={onSetDue}
                onReorder={onReorder}
                projectsById={projectsById}
              />
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
              <SortableTaskList
                tasks={someday}
                onToggle={onToggle}
                onDelete={onDelete}
                onEdit={onEdit}
                onSetDue={onSetDue}
                onReorder={onReorder}
                projectsById={projectsById}
              />
            </div>
          </>
        )}

      </div>
    </div>
  );
}
