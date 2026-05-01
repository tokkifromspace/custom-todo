import type { Task } from "../types";

interface Props {
  pending: Task | null;
  onUndo: () => void;
}

export function UndoToast({ pending, onUndo }: Props) {
  if (!pending) return null;
  const title = pending.title.length > 40 ? pending.title.slice(0, 40) + "…" : pending.title;
  return (
    <div className="undo-toast glass-strong" role="status">
      <span className="undo-toast-text">
        Deleted <b>"{title}"</b>
      </span>
      <button type="button" className="undo-toast-btn" onClick={onUndo}>
        Undo
      </button>
    </div>
  );
}
