import type { IconName, Project, Task } from "../types";
import { formatDue, formatRepeat, fromIsoDate, isOverdue, toIsoDate } from "../data/helpers";
import { Checkbox } from "./Checkbox";
import { Icon } from "./Icon";
import { DatePicker } from "./DatePicker";

interface Props {
  task: Task;
  onToggle?: (id: string) => void;
  onDelete?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onSetDue?: (id: string, due: string | null) => void;
  showProject?: boolean;
  compact?: boolean;
  projectsById: Record<string, Project>;
}

export function TaskRow({ task, onToggle, onDelete, onEdit, onSetDue, showProject, compact, projectsById }: Props) {
  const dueLabel =
    task.bucket === "today" ? "Today" :
    task.bucket === "evening" ? "This evening" :
    formatDue(task.due);
  const dueIcon: IconName =
    task.bucket === "today" ? "sun" :
    task.bucket === "evening" ? "moon" :
    "calendar";
  const deadlineLabel = formatDue(task.deadline);
  const deadlineOverdue = isOverdue(task.deadline) && !task.done;
  const repeatLabel = formatRepeat(task.repeat);
  const overdue = isOverdue(task.due) && !task.done;
  const project = task.projectId ? projectsById[task.projectId] : null;

  const hasMeta =
    !!dueLabel || !!deadlineLabel || (task.tags && task.tags.length > 0) || !!project || !!repeatLabel;

  return (
    <div className={`task-row ${task.done ? "done" : ""}`}>
      <Checkbox
        variant="task"
        size="sm"
        checked={task.done}
        onChange={() => onToggle?.(task.id)}
        ariaLabel={`Mark "${task.title || "Untitled"}" as ${task.done ? "incomplete" : "complete"}`}
      />
      <div
        className={`task-body ${onEdit ? "editable" : ""}`}
        onClick={onEdit ? () => onEdit(task) : undefined}
      >
        <div className="ttitle">
          {task.title || <span className="ttitle-placeholder">No title</span>}
        </div>
        {task.notes && !compact && <div className="tnotes">{task.notes}</div>}
        {hasMeta && (
          <div className="tmeta">
            {dueLabel && (
              <span className={`chip due ${overdue ? "overdue" : ""}`}>
                <Icon name={dueIcon} size={11} />
                {dueLabel}
              </span>
            )}
            {deadlineLabel && (
              <span className={`chip due ${deadlineOverdue ? "overdue" : ""}`} title="Deadline">
                <Icon name="flag" size={11} />
                {deadlineLabel}
              </span>
            )}
            {repeatLabel && (
              <span className="chip due">
                <Icon name="repeat" size={11} />
                {repeatLabel}
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
        <DatePicker
          value={task.due ? fromIsoDate(task.due) : null}
          onChange={(d) => onSetDue?.(task.id, d ? toIsoDate(d) : null)}
          renderTrigger={({ ref, onClick, onKeyDown, hasValue }) => (
            <button
              ref={ref}
              type="button"
              className={`icon-btn${hasValue ? " has-value" : ""}`}
              aria-label="Set due date"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              onKeyDown={onKeyDown}
            >
              <Icon name="calendar" size={14} />
            </button>
          )}
        />
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
