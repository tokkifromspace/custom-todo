import { Icon } from "./Icon";
import type { IconName } from "../types";

type Kind = "today" | "evening" | "upcoming" | "anytime" | "someday" | "default";

interface Props {
  kind?: Kind;
  label: string;
  count?: string;
  time?: string;
}

export function GroupHeader({ kind = "default", label, count, time }: Props) {
  const icon: IconName =
    kind === "today" ? "sun" :
    kind === "evening" ? "moon" :
    kind === "upcoming" ? "calendar" :
    kind === "anytime" ? "list" :
    kind === "someday" ? "drop" : "list";
  return (
    <div className={`group-h ${kind}`}>
      <span className="glyph"><Icon name={icon} size={14} /></span>
      <span className="label">{label}</span>
      {time && <span className="meta">{time}</span>}
      {count != null && <span className="meta">{count}</span>}
    </div>
  );
}
