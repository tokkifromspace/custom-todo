import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Project, Task } from "../types";
import { TaskRow } from "./TaskRow";

interface SortableRowProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onSetDue: (id: string, due: string | null) => void;
  projectsById: Record<string, Project>;
  showProject?: boolean;
  compact?: boolean;
}

function SortableTaskRow(props: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.task.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: "relative",
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskRow {...props} />
    </div>
  );
}

interface Props {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onSetDue: (id: string, due: string | null) => void;
  onReorder?: (orderedIds: string[]) => void;
  projectsById: Record<string, Project>;
  showProject?: boolean;
  compact?: boolean;
}

export function SortableTaskList({
  tasks,
  onToggle,
  onDelete,
  onEdit,
  onSetDue,
  onReorder,
  projectsById,
  showProject,
  compact,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  if (!onReorder) {
    return (
      <>
        {tasks.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={onEdit}
            onSetDue={onSetDue}
            projectsById={projectsById}
            showProject={showProject}
            compact={compact}
          />
        ))}
      </>
    );
  }

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(tasks, oldIndex, newIndex);
    onReorder(reordered.map((t) => t.id));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map((t) => (
          <SortableTaskRow
            key={t.id}
            task={t}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={onEdit}
            onSetDue={onSetDue}
            projectsById={projectsById}
            showProject={showProject}
            compact={compact}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
