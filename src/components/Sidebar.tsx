import { Fragment, useEffect, useRef, useState } from "react";
import type { Counts, Group, Project, View } from "../types";
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

interface Props {
  view: View;
  onNavigate: (v: View) => void;
  groups: Group[];
  projects: Project[];
  counts: Counts;
  onAddProject: (groupId: string, name: string) => void;
}

export function Sidebar({ view, onNavigate, groups, projects, counts, onAddProject }: Props) {
  const [openInput, setOpenInput] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (openInput && inputRef.current) inputRef.current.focus();
  }, [openInput]);

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
      <div className="side-search">
        <Icon name="search" size={13} />
        <span style={{ flex: 1 }}>Quick find</span>
        <span className="kbd">⌘K</span>
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
          {projectsByGroup(g.id).map((p) => (
            <div
              key={p.id}
              className={`nav-project ${isProject(p.id) ? "active" : ""}`}
              onClick={() => onNavigate({ type: "project", id: p.id })}
            >
              <ProjectSwatch color={p.color} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.name}
              </span>
              {counts.byProject[p.id] > 0 && <span className="count">{counts.byProject[p.id]}</span>}
            </div>
          ))}
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
        <Icon name="settings" size={13} />
        <span>Logbook · Trash</span>
      </div>
    </div>
  );
}
