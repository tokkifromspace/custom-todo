import { Fragment, useEffect, useRef, useState } from "react";
import type { Counts, Group, Project, View } from "../types";
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
import { Icon } from "./Icon";

const TrafficLights = () => (
  <div className="titlebar">
    <span className="dot r" />
    <span className="dot y" />
    <span className="dot g" />
  </div>
);

const ProjectSwatch = ({ color }: { color: string }) => (
  <span className="swatch" style={{ background: color }} />
);

interface SortableNavProjectProps {
  project: Project;
  active: boolean;
  count: number;
  onNavigate: () => void;
  onDelete: () => void;
}
function SortableNavProject({ project, active, count, onNavigate, onDelete }: SortableNavProjectProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`nav-project ${active ? "active" : ""}`}
      onClick={onNavigate}
    >
      <ProjectSwatch color={project.color} />
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {project.name}
      </span>
      {count > 0 && <span className="count">{count}</span>}
      <button
        type="button"
        className="nav-project-delete"
        aria-label={`Delete ${project.name}`}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Icon name="x" size={11} />
      </button>
    </div>
  );
}

interface Props {
  view: View;
  onNavigate: (v: View) => void;
  groups: Group[];
  projects: Project[];
  counts: Counts;
  onAddProject: (groupId: string, name: string) => void | Promise<void>;
  onDeleteProject: (id: string) => void | Promise<void>;
  onReorderProjects: (orderedIds: string[]) => void | Promise<void>;
  onQuickFind?: () => void;
  onChangePassword?: () => void;
  onSignOut?: () => void;
}

export function Sidebar({ view, onNavigate, groups, projects, counts, onAddProject, onDeleteProject, onReorderProjects, onQuickFind, onChangePassword, onSignOut }: Props) {
  const [openInput, setOpenInput] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  useEffect(() => {
    if (openInput && inputRef.current) inputRef.current.focus();
  }, [openInput]);

  useEffect(() => {
    if (!settingsOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSettingsOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [settingsOpen]);

  const closeInput = () => {
    setOpenInput(null);
    setDraftName("");
  };
  const commit = () => {
    const name = draftName.trim();
    if (name && openInput) onAddProject(openInput, name);
    closeInput();
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") closeInput();
    if (e.key === "Enter") commit();
  };

  const isProject = (id: string) => view.type === "project" && view.id === id;
  const projectsByGroup = (gid: string) => projects.filter((p) => p.groupId === gid);

  return (
    <div className="sidebar">
      <TrafficLights />
      <div
        className="side-search"
        onClick={onQuickFind}
        style={{ cursor: onQuickFind ? "default" : undefined }}
      >
        <Icon name="search" size={13} />
        <span style={{ flex: 1 }}>Quick find</span>
        <span className="kbd">^K</span>
      </div>

      <div className="nav">
        <div
          className={`nav-item ${view.type === "inbox" ? "active" : ""}`}
          onClick={() => onNavigate({ type: "inbox" })}
        >
          <span className="glyph" style={{ color: "var(--accent)" }}>
            <Icon name="inbox" size={14} />
          </span>
          <span>Inbox</span>
          {counts.inbox > 0 && <span className="count">{counts.inbox}</span>}
        </div>
        <div
          className={`nav-item ${view.type === "today" ? "active" : ""}`}
          onClick={() => onNavigate({ type: "today" })}
        >
          <span className="glyph warm">
            <Icon name="sun" size={14} />
          </span>
          <span>Today</span>
          {counts.today > 0 && <span className="count">{counts.today}</span>}
        </div>
        <div
          className={`nav-item ${view.type === "upcoming" ? "active" : ""}`}
          onClick={() => onNavigate({ type: "upcoming" })}
        >
          <span className="glyph evening">
            <Icon name="calendar" size={14} />
          </span>
          <span>Upcoming</span>
          {counts.upcoming > 0 && <span className="count">{counts.upcoming}</span>}
        </div>
        <div
          className={`nav-item ${view.type === "anytime" ? "active" : ""}`}
          onClick={() => onNavigate({ type: "anytime" })}
        >
          <span className="glyph" style={{ color: "var(--fg-3)" }}>
            <Icon name="list" size={14} />
          </span>
          <span>Anytime</span>
          {counts.anytime > 0 && <span className="count">{counts.anytime}</span>}
        </div>
        <div
          className={`nav-item ${view.type === "someday" ? "active" : ""}`}
          onClick={() => onNavigate({ type: "someday" })}
        >
          <span className="glyph" style={{ color: "var(--someday)" }}>
            <Icon name="drop" size={14} />
          </span>
          <span>Someday</span>
          {counts.someday > 0 && <span className="count">{counts.someday}</span>}
        </div>
      </div>

      {groups.map((g) => (
        <Fragment key={g.id}>
          <div className="nav-section">
            <span>{g.name}</span>
            <span
              className="kbd"
              onClick={() => setOpenInput(g.id)}
              style={{ background: "transparent", color: "var(--fg-4)", cursor: "default", userSelect: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-4)")}
            >
              +
            </span>
          </div>
          {(() => {
            const groupProjects = projectsByGroup(g.id);
            if (groupProjects.length === 0) return null;
            const handleDragEnd = (e: DragEndEvent) => {
              const { active, over } = e;
              if (!over || active.id === over.id) return;
              const oldIdx = groupProjects.findIndex((p) => p.id === active.id);
              const newIdx = groupProjects.findIndex((p) => p.id === over.id);
              if (oldIdx < 0 || newIdx < 0) return;
              const reordered = arrayMove(groupProjects, oldIdx, newIdx);
              void onReorderProjects(reordered.map((p) => p.id));
            };
            return (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={groupProjects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                  {groupProjects.map((p) => (
                    <SortableNavProject
                      key={p.id}
                      project={p}
                      active={isProject(p.id)}
                      count={counts.byProject[p.id] ?? 0}
                      onNavigate={() => onNavigate({ type: "project", id: p.id })}
                      onDelete={() => {
                        if (window.confirm(`Delete "${p.name}"? Its tasks will become unassigned.`)) {
                          void onDeleteProject(p.id);
                        }
                      }}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            );
          })()}
          {openInput === g.id && (
            <div className="nav-project" style={{ background: "var(--bg-hover)" }}>
              <ProjectSwatch color={g.color} />
              <input
                ref={inputRef}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={onKeyDown}
                onBlur={commit}
                placeholder="New project name"
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: 13,
                  fontFamily: "inherit",
                  color: "var(--fg)",
                  padding: 0,
                }}
              />
              <span className="kbd" style={{ background: "transparent", color: "var(--fg-4)", fontSize: 9.5 }}>
                ↵
              </span>
            </div>
          )}
        </Fragment>
      ))}

      <div className="side-footer">
        <div ref={settingsRef} style={{ position: "relative" }}>
          <button
            type="button"
            className="settings-trigger"
            aria-label="Settings"
            onClick={() => setSettingsOpen((o) => !o)}
          >
            <Icon name="settings" size={13} />
          </button>
          {settingsOpen && (
            <div className="settings-menu glass-strong">
              {onChangePassword && (
                <button
                  type="button"
                  className="settings-menu-item"
                  onClick={() => {
                    setSettingsOpen(false);
                    onChangePassword();
                  }}
                >
                  Change password
                </button>
              )}
              {onSignOut && (
                <button
                  type="button"
                  className="settings-menu-item"
                  onClick={() => {
                    setSettingsOpen(false);
                    onSignOut();
                  }}
                >
                  Sign out
                </button>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          className={`logbook-link ${view.type === "logbook" ? "active" : ""}`}
          onClick={() => onNavigate({ type: "logbook" })}
        >
          <Icon name="archive" size={12} style={{ color: "var(--done)" }} />
          <span>Logbook</span>
        </button>
      </div>
    </div>
  );
}
