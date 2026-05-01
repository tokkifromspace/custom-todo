import { useEffect, useMemo, useRef, useState } from "react";
import type { Project, Task } from "../types";
import { Icon } from "./Icon";

interface Props {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  projects: Project[];
  projectsById: Record<string, Project>;
  onSelectTask: (task: Task) => void;
  onSelectProject: (project: Project) => void;
}

type Result =
  | { kind: "task"; task: Task }
  | { kind: "project"; project: Project };

const MAX_TASKS = 8;
const MAX_PROJECTS = 5;

export function QuickFindModal({
  open,
  onClose,
  tasks,
  projects,
  projectsById,
  onSelectTask,
  onSelectProject,
}: Props) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results: Result[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const projMatches = projects
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, MAX_PROJECTS)
      .map<Result>((project) => ({ kind: "project", project }));
    const taskMatches = tasks
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.notes ?? "").toLowerCase().includes(q),
      )
      .slice(0, MAX_TASKS)
      .map<Result>((task) => ({ kind: "task", task }));
    return [...projMatches, ...taskMatches];
  }, [query, tasks, projects]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (results.length === 0 ? 0 : Math.min(i + 1, results.length - 1)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const r = results[activeIndex];
        if (!r) return;
        if (r.kind === "task") onSelectTask(r.task);
        else onSelectProject(r.project);
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, results, activeIndex, onClose, onSelectTask, onSelectProject]);

  if (!open) return null;

  const trimmed = query.trim();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="glass-strong quickfind-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="quickfind-input-row">
          <Icon name="search" size={14} style={{ color: "var(--fg-3)" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks and projects…"
            className="quickfind-input"
          />
          <span className="kbd">esc</span>
        </div>
        {results.length > 0 ? (
          <div className="quickfind-results">
            {results.map((r, i) => {
              const active = i === activeIndex;
              if (r.kind === "project") {
                return (
                  <button
                    key={`p-${r.project.id}`}
                    type="button"
                    className={`quickfind-result ${active ? "active" : ""}`}
                    onClick={() => {
                      onSelectProject(r.project);
                      onClose();
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                  >
                    <span
                      className="quickfind-swatch"
                      style={{ background: r.project.color }}
                    />
                    <span className="quickfind-title">{r.project.name}</span>
                    <span className="quickfind-kind">Project</span>
                  </button>
                );
              }
              const proj = r.task.projectId ? projectsById[r.task.projectId] : null;
              return (
                <button
                  key={`t-${r.task.id}`}
                  type="button"
                  className={`quickfind-result ${active ? "active" : ""}`}
                  onClick={() => {
                    onSelectTask(r.task);
                    onClose();
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  <span
                    className="quickfind-bullet"
                    style={{
                      borderColor: r.task.done ? "var(--done)" : "var(--fg-4)",
                      background: r.task.done ? "var(--done)" : "transparent",
                    }}
                  />
                  <span
                    className="quickfind-title"
                    style={{
                      textDecoration: r.task.done ? "line-through" : "none",
                      color: r.task.done ? "var(--fg-3)" : undefined,
                    }}
                  >
                    {r.task.title || "No title"}
                  </span>
                  {proj && (
                    <span className="quickfind-meta">
                      <span
                        className="quickfind-swatch sm"
                        style={{ background: proj.color }}
                      />
                      {proj.name}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : trimmed ? (
          <div className="quickfind-empty">No results for "{trimmed}"</div>
        ) : (
          <div className="quickfind-empty">Type to search</div>
        )}
      </div>
    </div>
  );
}
