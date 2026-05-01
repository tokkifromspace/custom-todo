import type { Group, Project, Task } from "../types";
import { Icon } from "../components/Icon";
import { SortableTaskList } from "../components/SortableTaskList";
import { GroupHeader } from "../components/GroupHeader";
import { isUpcoming, todayIso } from "../data/helpers";

interface Props {
  project: Project;
  group: Group | undefined;
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

export function ProjectView({ project, group, tasks, onToggle, onDelete, onEdit, onSetDue, onReorder, recentlyCompleted, projectsById, onQuickAdd }: Props) {
  const projTasks = tasks.filter((t) => t.projectId === project.id);
  const visible = (t: Task) => !t.done || recentlyCompleted.has(t.id);
  const todayKey = todayIso();
  const todaySection: Task[] = [];
  const upcoming: Task[] = [];
  const anytime: Task[] = [];
  const someday: Task[] = [];
  for (const t of projTasks) {
    if (!visible(t)) continue;
    if (t.bucket === "today" || t.bucket === "evening") todaySection.push(t);
    else if (t.when === "someday") someday.push(t);
    else if (isUpcoming(t.due, todayKey)) upcoming.push(t);
    else anytime.push(t);
  }
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

        {todaySection.length > 0 && (
          <>
            <GroupHeader
              kind="today"
              label="Today"
              count={`${todaySection.length} task${todaySection.length === 1 ? "" : "s"}`}
            />
            <div className="tasks">
              <SortableTaskList
                tasks={todaySection}
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

        {upcoming.length > 0 && (
          <>
            <GroupHeader
              kind="upcoming"
              label="Upcoming"
              count={`${upcoming.length} task${upcoming.length === 1 ? "" : "s"}`}
            />
            <div className="tasks">
              <SortableTaskList
                tasks={upcoming}
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

        {anytime.length > 0 && (
          <>
            <GroupHeader
              kind="anytime"
              label="Anytime"
              count={`${anytime.length} task${anytime.length === 1 ? "" : "s"}`}
            />
            <div className="tasks">
              <SortableTaskList
                tasks={anytime}
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
