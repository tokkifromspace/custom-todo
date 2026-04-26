// Inline SVG icon set. 16x16 viewBox, currentColor stroke.
const Icon = ({ name, size = 16, style }) => {
  const props = {
    width: size, height: size, viewBox: "0 0 16 16",
    fill: "none", stroke: "currentColor",
    strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round",
    style,
  };
  switch (name) {
    case "star":
      return <svg {...props}><path d="M8 2.5l1.7 3.5 3.8.55-2.75 2.7.65 3.8L8 11.25 4.6 13.05l.65-3.8L2.5 6.55l3.8-.55L8 2.5z"/></svg>;
    case "sun":
      return <svg {...props}><circle cx="8" cy="8" r="2.8"/><path d="M8 1.5v1.5M8 13v1.5M2.5 8H1M15 8h-1.5M3.7 3.7l1 1M11.3 11.3l1 1M3.7 12.3l1-1M11.3 4.7l1-1"/></svg>;
    case "moon":
      return <svg {...props}><path d="M13.5 9.5A5.5 5.5 0 117 3a4.4 4.4 0 006.5 6.5z"/></svg>;
    case "calendar":
      return <svg {...props}><rect x="2" y="3" width="12" height="11" rx="1.6"/><path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3"/></svg>;
    case "clock":
      return <svg {...props}><circle cx="8" cy="8" r="6"/><path d="M8 4.5V8l2.2 1.6"/></svg>;
    case "inbox":
      return <svg {...props}><path d="M2 8.5l1.7-5A1 1 0 014.6 3h6.8a1 1 0 01.95.7L14 8.5"/><path d="M2 8.5h3.5l.7 1.5h3.6l.7-1.5H14v3.4a1 1 0 01-1 1H3a1 1 0 01-1-1V8.5z"/></svg>;
    case "search":
      return <svg {...props}><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>;
    case "plus":
      return <svg {...props}><path d="M8 3v10M3 8h10"/></svg>;
    case "tag":
      return <svg {...props}><path d="M2 2h5l7 7-5 5-7-7V2z"/><circle cx="5" cy="5" r="0.6" fill="currentColor"/></svg>;
    case "flag":
      return <svg {...props}><path d="M3.5 14V2.5h6.5l-1 2.2 1 2.3H3.5"/></svg>;
    case "more":
      return <svg {...props}><circle cx="3.5" cy="8" r="1" fill="currentColor"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="12.5" cy="8" r="1" fill="currentColor"/></svg>;
    case "chev":
      return <svg {...props}><path d="M6 4l4 4-4 4"/></svg>;
    case "chev-d":
      return <svg {...props}><path d="M4 6l4 4 4-4"/></svg>;
    case "check":
      return <svg {...props}><path d="M3.5 8.5L6.5 11.5 12.5 4.5"/></svg>;
    case "x":
      return <svg {...props}><path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/></svg>;
    case "folder":
      return <svg {...props}><path d="M2 4.5a1 1 0 011-1h3l1.2 1.5h5.8a1 1 0 011 1V12a1 1 0 01-1 1H3a1 1 0 01-1-1V4.5z"/></svg>;
    case "list":
      return <svg {...props}><path d="M2.5 4h11M2.5 8h11M2.5 12h11"/></svg>;
    case "filter":
      return <svg {...props}><path d="M2.5 3.5h11l-4 5v4l-3 1.5v-5.5l-4-5z"/></svg>;
    case "settings":
      return <svg {...props}><circle cx="8" cy="8" r="2"/><path d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4M12.6 12.6l-1.4-1.4M4.8 4.8L3.4 3.4"/></svg>;
    case "bell":
      return <svg {...props}><path d="M3.5 11.5h9l-1-1.5v-3a3.5 3.5 0 10-7 0v3l-1 1.5zM6.5 13a1.5 1.5 0 003 0"/></svg>;
    case "repeat":
      return <svg {...props}><path d="M3 6.5L1.5 5l1.5-1.5M1.5 5h9.5a2.5 2.5 0 012.5 2.5v0M13 9.5L14.5 11l-1.5 1.5M14.5 11H5a2.5 2.5 0 01-2.5-2.5"/></svg>;
    case "attachment":
      return <svg {...props}><path d="M11 4.5L6 9.5a2 2 0 102.8 2.8L13 8a3.5 3.5 0 10-5-5L4 7"/></svg>;
    case "drop":
      return <svg {...props}><path d="M8 2c2.5 3 4 5 4 7a4 4 0 11-8 0c0-2 1.5-4 4-7z"/></svg>;
    default:
      return <svg {...props}><circle cx="8" cy="8" r="3"/></svg>;
  }
};

window.Icon = Icon;
