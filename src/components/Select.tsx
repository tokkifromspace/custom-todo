import {
  useState, useRef, useEffect, useId, useLayoutEffect, useCallback,
  type ReactNode, type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import "./select.css";

export type SelectOption = {
  value: string;
  label: string;
  hint?: string;
  icon?: ReactNode;
  disabled?: boolean;
};
export type SelectItem =
  | SelectOption
  | { divider: true }
  | { section: string };

type Props = {
  value: string | null;
  onChange: (value: string) => void;
  options: SelectItem[];
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  variant?: "filled" | "ghost";
  full?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  renderValue?: (option: SelectOption) => ReactNode;
};

export function Select({
  value, onChange, options,
  placeholder = "Select…",
  size = "md", variant = "filled",
  full = false, disabled = false,
  ariaLabel, renderValue,
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [closing, setClosing] = useState(false);
  const [popStyle, setPopStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const typeBuf = useRef({ s: "", t: 0 });

  const flat = options.filter(
    (o): o is SelectOption => !("divider" in o) && !("section" in o)
  );
  const selected = flat.find(o => o.value === value);

  const openMenu = useCallback(() => {
    if (disabled) return;
    setClosing(false);
    setOpen(true);
    setActiveIdx(Math.max(0, selected ? flat.indexOf(selected) : 0));
  }, [disabled, selected, flat]);

  const closeMenu = useCallback((focusTrigger = true) => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
      if (focusTrigger) triggerRef.current?.focus();
    }, 90);
  }, []);

  const commit = useCallback((opt?: SelectOption) => {
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    closeMenu();
  }, [onChange, closeMenu]);

  // outside click / scroll / resize
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      closeMenu(false);
    };
    const onScroll = (e: Event) => {
      if (popRef.current?.contains(e.target as Node)) return;
      closeMenu(false);
    };
    const onResize = () => closeMenu(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, closeMenu]);

  // position + flip
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const margin = 6, desired = 360;
    const below = window.innerHeight - r.bottom - margin - 8;
    const above = r.top - margin - 8;
    const flipUp = below < 200 && above > below;
    const maxH = Math.min(desired, flipUp ? above : below);
    setPopStyle({
      "--pop-origin": flipUp ? "bottom left" : "top left",
      "--pop-min-w": `${r.width}px`,
      "--pop-max-h": `${maxH}px`,
      top: flipUp ? `${r.top - margin}px` : `${r.bottom + margin}px`,
      left: `${r.left}px`,
      transform: flipUp ? "translateY(-100%)" : "none",
    } as React.CSSProperties);
  }, [open]);

  // active scrollIntoView
  useEffect(() => {
    if (!open || activeIdx < 0) return;
    popRef.current
      ?.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIdx, open]);

  // focus menu on open
  useEffect(() => {
    if (open && !closing) popRef.current?.focus();
  }, [open, closing]);

  const move = (delta: number) => {
    setActiveIdx(prev => {
      let next = prev;
      const n = flat.length;
      for (let i = 0; i < n; i++) {
        next = (next + delta + n) % n;
        if (!flat[next].disabled) return next;
      }
      return prev;
    });
  };

  const onTriggerKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (["ArrowDown","ArrowUp","Enter"," "].includes(e.key)) {
      e.preventDefault();
      openMenu();
    }
  };

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case "Escape": e.preventDefault(); closeMenu(); return;
      case "Tab":    e.preventDefault(); closeMenu(); return;
      case "ArrowDown": e.preventDefault(); move(1); return;
      case "ArrowUp":   e.preventDefault(); move(-1); return;
      case "Home": e.preventDefault(); setActiveIdx(0); return;
      case "End":  e.preventDefault(); setActiveIdx(flat.length - 1); return;
      case "Enter":
      case " ":
        e.preventDefault();
        commit(flat[activeIdx]);
        return;
    }
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
      const buf = typeBuf.current;
      const now = performance.now();
      buf.s = (now - buf.t > 600 ? "" : buf.s) + e.key.toLowerCase();
      buf.t = now;
      const start = (activeIdx + 1) % flat.length;
      for (let i = 0; i < flat.length; i++) {
        const idx = (start + i) % flat.length;
        if (!flat[idx].disabled && flat[idx].label.toLowerCase().startsWith(buf.s)) {
          setActiveIdx(idx);
          return;
        }
      }
    }
  };

  let optIdx = -1;

  return (
    <div className={`select${full ? " full" : ""}`} data-size={size} data-variant={variant}>
      <button
        ref={triggerRef}
        type="button"
        className="select-trigger"
        data-open={open}
        data-disabled={disabled}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${id}-list` : undefined}
        aria-label={ariaLabel}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={onTriggerKey}
      >
        <span className={`label${selected ? "" : " placeholder"}`}>
          {selected ? (renderValue ? renderValue(selected) : selected.label) : placeholder}
        </span>
        <svg className="chev" viewBox="0 0 12 12" fill="none" stroke="currentColor"
             strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 4.5L6 7.5L9 4.5"/>
        </svg>
      </button>

      {open && createPortal(
        <div
          ref={popRef}
          id={`${id}-list`}
          className="select-pop"
          role="listbox"
          tabIndex={-1}
          data-closing={closing}
          aria-activedescendant={
            activeIdx >= 0 ? `${id}-opt-${activeIdx}` : undefined
          }
          style={popStyle}
          onKeyDown={onMenuKey}
        >
          {options.map((o, i) => {
            if ("divider" in o) return <div key={`d-${i}`} className="select-divider" role="separator" />;
            if ("section" in o) return <div key={`s-${i}`} className="select-section">{o.section}</div>;
            optIdx++;
            const idx = optIdx;
            const isSel = o.value === value;
            const isAct = idx === activeIdx;
            return (
              <div
                key={o.value}
                id={`${id}-opt-${idx}`}
                data-idx={idx}
                className="select-option"
                role="option"
                aria-selected={isSel}
                data-selected={isSel}
                data-active={isAct}
                data-disabled={!!o.disabled}
                onMouseEnter={() => !o.disabled && setActiveIdx(idx)}
                onMouseDown={(e) => { e.preventDefault(); commit(o); }}
              >
                <svg className="opt-check" viewBox="0 0 12 12" fill="none" stroke="currentColor"
                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2.5 6.5L5 9L9.5 3.5"/>
                </svg>
                {o.icon && <span className="opt-icon">{o.icon}</span>}
                <span className="opt-label">{o.label}</span>
                {o.hint && <span className="opt-hint">{o.hint}</span>}
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}
