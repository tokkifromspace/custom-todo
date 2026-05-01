import type { IconName, Project, Task } from "../types";
import { Icon } from "../components/Icon";
import { SortableTaskList } from "../components/SortableTaskList";

interface Props {
  title: string;
  glyph: IconName;
  glyphColor: string;
  subtitle?: string;
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onSetDue: (id: string, due: string | null) => void;
  onReorder: (orderedIds: string[]) => void;
  projectsById: Record<string, Project>;
  onQuickAdd: () => void;
}

export function ListView({ title, glyph, glyphColor, subtitle, tasks, onToggle, onDelete, onEdit, onSetDue, onReorder, projectsById, onQuickAdd }: Props) {
  return (
    <div className="main">
      <div className="toolbar glass">
        <div style={{ width: 4 }} />
        <div className="breadcrumb">
          <Icon name={glyph} size={13} style={{ color: glyphColor }} />
          <b>{title}</b>
        </div>
        <div style={{ flex: 1 }} />
        <span className="icon-btn" title="Filter"><Icon name="filter" size={14} /></span>
        <span className="icon-btn" title="More"><Icon name="more" size={14} /></span>
        <button className="btn" onClick={onQuickAdd}>
          <Icon name="plus" size={12} />Quick add<span className="kbd">^N</span>
        </button>
      </div>
      <div className="content">
        <div className="page-h">
          <div>
            <div className="title" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: glyphColor }}>
                <Icon name={glyph} size={26} />
              </span>
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 4 }}>{subtitle}</div>
            )}
          </div>
        </div>

        {tasks.length > 0 && (
          <div className="tasks">
            <SortableTaskList
              tasks={tasks}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
              onSetDue={onSetDue}
              onReorder={onReorder}
              projectsById={projectsById}
              showProject
            />
          </div>
        )}
      </div>
    </div>
  );
}
