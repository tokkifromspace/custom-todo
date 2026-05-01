import type { Project, Task } from "../types";
import { Checkbox } from "./Checkbox";
import { Icon } from "./Icon";

interface Props {
  task: Task;
  onToggle?: (id: string) => void;
  onDelete?: (task: Task) => void;
  showProject?: boolean;
  compact?: boolean;
  projectsById: Record<string, Project>;
}

export function TaskRow({ task, onToggle, onDelete, showProject, compact, projectsById }: Props) {
  const overdue = task.due && task.dueOverdue;
  const isToday = task.due && task.dueToday;
  const project = task.projectId ? projectsById[task.projectId] : null;

  const hasMeta =
    !!task.due || (task.tags && task.tags.length > 0) || !!project || !!task.repeat;

  return (
    <div className={`task-row ${task.done ? "done" : ""}`}>
      <Checkbox
        checked={task.done}
        bucket={task.bucket}
        onClick={() => onToggle?.(task.id)}
      />
      <div className="task-body">
        <div className="ttitle">{task.title}</div>
        {task.notes && !compact && <div className="tnotes">{task.notes}</div>}
        {hasMeta && (
          <div className="tmeta">
            {task.due && (
              <span className={`chip due ${overdue ? "overdue" : ""} ${isToday ? "today" : ""}`}>
                <Icon name="calendar" size={11} />
                {task.due}
              </span>
            )}
            {task.repeat && (
              <span className="chip due">
                <Icon name="repeat" size={11} />
                {task.repeat}
              </span>
            )}
            {showProject && project && (
              <span className="chip proj">
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 2,
                    background: project.color,
                    flexShrink: 0,
                  }}
                />
                {project.name}
              </span>
            )}
            {task.tags?.map((t) => (
              <span key={t} className="chip tag">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="right-actions">
        <span className="icon-btn">
          <Icon name="calendar" size={14} />
        </span>
        <span className="icon-btn">
          <Icon name="tag" size={14} />
        </span>
        <button
          type="button"
          className="icon-btn delete"
          aria-label="Delete task"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(task);
          }}
        >
          <Icon name="trash" size={14} />
        </button>
      </div>
    </div>
  );
}
