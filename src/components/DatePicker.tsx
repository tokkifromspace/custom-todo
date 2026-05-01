import {
  useState, useRef, useEffect, useId, useLayoutEffect,
  useCallback, useMemo,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import "./datepicker.css";

/* ---- date utils ---- */
const MS_DAY = 86400000;
const MONTHS_LONG = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];
const DOW_SHORT_SUN = ["S","M","T","W","T","F","S"];

const startOfDay  = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const isSameDay   = (a: Date | null, b: Date | null) =>
  !!a && !!b && a.getFullYear()===b.getFullYear() &&
  a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
const addDays     = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
const addMonths   = (d: Date, n: number) => {
  const x = new Date(d), day = x.getDate();
  x.setDate(1); x.setMonth(x.getMonth()+n);
  const last = new Date(x.getFullYear(), x.getMonth()+1, 0).getDate();
  x.setDate(Math.min(day, last));
  return x;
};
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

function buildMonthGrid(viewDate: Date, weekStart = 0): Date[] {
  const first = startOfMonth(viewDate);
  const leading = (first.getDay() - weekStart + 7) % 7;
  const start = addDays(first, -leading);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

function formatTrigger(d: Date | null): string | null {
  if (!d) return null;
  const today = startOfDay(new Date());
  const diff = Math.round((startOfDay(d).getTime() - today.getTime()) / MS_DAY);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  const sameYear = d.getFullYear() === today.getFullYear();
  return d.toLocaleDateString(undefined, {
    month: "short", day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

const formatFooter = (d: Date | null) =>
  d ? d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    : "No date";

/* ---- props ---- */
export interface DatePickerTriggerApi {
  open: boolean;
  ref: Ref<HTMLButtonElement>;
  onClick: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
  disabled: boolean;
  hasValue: boolean;
  label: string | null;
}

type Props = {
  value: Date | null;
  onChange: (d: Date | null) => void;
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  variant?: "filled" | "ghost";
  full?: boolean;
  disabled?: boolean;
  weekStart?: 0 | 1;
  minDate?: Date | null;
  maxDate?: Date | null;
  ariaLabel?: string;
  showClearInTrigger?: boolean;
  renderTrigger?: (api: DatePickerTriggerApi) => ReactNode;
};

export function DatePicker({
  value, onChange,
  placeholder = "Set date",
  size = "md", variant = "filled",
  full = false, disabled = false,
  weekStart = 0,
  minDate = null, maxDate = null,
  ariaLabel,
  showClearInTrigger = true,
  renderTrigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [viewDate, setViewDate] = useState(() => startOfMonth(value ?? new Date()));
  const [activeDate, setActiveDate] = useState(() => startOfDay(value ?? new Date()));
  const [popStyle, setPopStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const today = useMemo(() => startOfDay(new Date()), [open]);

  useEffect(() => {
    if (open) {
      const base = value ?? new Date();
      setViewDate(startOfMonth(base));
      setActiveDate(startOfDay(base));
    }
  }, [open]);

  const openCal  = useCallback(() => { if (!disabled) { setClosing(false); setOpen(true); } }, [disabled]);
  const closeCal = useCallback((focusTrigger = true) => {
    setClosing(true);
    // Wait for the cal-pop-out animation (100ms) to finish before unmounting,
    // otherwise the popup vanishes mid-fade and the backdrop-filter layer is
    // ripped out, which the compositor renders as a brief flash.
    setTimeout(() => {
      setOpen(false); setClosing(false);
      if (focusTrigger) triggerRef.current?.focus();
    }, 110);
  }, []);

  const isDisabledDay = (d: Date) => {
    if (minDate && d < startOfDay(minDate)) return true;
    if (maxDate && d > startOfDay(maxDate)) return true;
    return false;
  };

  const commit = useCallback((d: Date) => {
    if (isDisabledDay(d)) return;
    onChange(startOfDay(d));
    closeCal();
  }, [onChange, closeCal, minDate, maxDate]);

  // outside click / scroll / resize
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      closeCal(false);
    };
    const onScroll = (e: Event) => {
      if (popRef.current?.contains(e.target as Node)) return;
      closeCal(false);
    };
    const onResize = () => closeCal(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, closeCal]);

  // position + flip
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const margin = 6, popH = 360, popW = 264;
    const below = window.innerHeight - r.bottom - margin - 8;
    const above = r.top - margin - 8;
    const flipUp = below < popH && above > below;
    let left = r.left;
    if (left + popW > window.innerWidth - 8) left = window.innerWidth - popW - 8;
    if (left < 8) left = 8;
    setPopStyle({
      "--pop-origin": flipUp ? "bottom left" : "top left",
      top: flipUp ? `${r.top - margin}px` : `${r.bottom + margin}px`,
      left: `${left}px`,
      transform: flipUp ? "translateY(-100%)" : "none",
    } as React.CSSProperties);
  }, [open]);

  useEffect(() => { if (open && !closing) popRef.current?.focus(); }, [open, closing]);

  const onTriggerKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (["ArrowDown","ArrowUp","Enter"," "].includes(e.key)) {
      e.preventDefault(); openCal();
    }
  };

  const onCalKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") { e.preventDefault(); closeCal(); return; }
    if (e.key === "Tab")    { e.preventDefault(); closeCal(); return; }
    let next = activeDate;
    if      (e.key === "ArrowLeft")  next = addDays(activeDate, -1);
    else if (e.key === "ArrowRight") next = addDays(activeDate, 1);
    else if (e.key === "ArrowUp")    next = addDays(activeDate, -7);
    else if (e.key === "ArrowDown")  next = addDays(activeDate, 7);
    else if (e.key === "PageUp")     next = addMonths(activeDate, e.shiftKey ? -12 : -1);
    else if (e.key === "PageDown")   next = addMonths(activeDate, e.shiftKey ? 12 : 1);
    else if (e.key === "Home")       next = addDays(activeDate, -((activeDate.getDay() - weekStart + 7) % 7));
    else if (e.key === "End")        next = addDays(activeDate, 6 - ((activeDate.getDay() - weekStart + 7) % 7));
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); commit(activeDate); return; }
    else if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); onChange(null); closeCal(); return; }
    else return;
    e.preventDefault();
    setActiveDate(next);
    if (next.getMonth() !== viewDate.getMonth() || next.getFullYear() !== viewDate.getFullYear()) {
      setViewDate(startOfMonth(next));
    }
  };

  const cells = useMemo(() => buildMonthGrid(viewDate, weekStart), [viewDate, weekStart]);
  const dowOrdered = useMemo(() => {
    const arr = [...DOW_SHORT_SUN];
    return [...arr.slice(weekStart), ...arr.slice(0, weekStart)];
  }, [weekStart]);

  const triggerLabel = formatTrigger(value);
  const handleTriggerClick = () => (open ? closeCal() : openCal());

  return (
    <div
      className={`select${full ? " full" : ""}`}
      data-size={size}
      data-variant={variant}
      data-datepicker-id={id}
    >
      {renderTrigger ? (
        renderTrigger({
          open,
          ref: triggerRef,
          onClick: handleTriggerClick,
          onKeyDown: onTriggerKey,
          disabled,
          hasValue: !!value,
          label: triggerLabel,
        })
      ) : (
        <button
          ref={triggerRef}
          type="button"
          className="select-trigger"
          data-open={open}
          data-has-value={!!value}
          data-disabled={disabled}
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={ariaLabel}
          onClick={handleTriggerClick}
          onKeyDown={onTriggerKey}
        >
          <span className="leading" aria-hidden>
            <CalendarGlyph />
          </span>
          <span className={`label${value ? "" : " placeholder"}`}>
            {value ? triggerLabel : placeholder}
          </span>
          {value && showClearInTrigger && !disabled && (
            <span
              className="clear" role="button" aria-label="Clear date"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onChange(null); }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                   stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M2 2L8 8M8 2L2 8"/>
              </svg>
            </span>
          )}
        </button>
      )}

      {open && createPortal(
        <div
          ref={popRef}
          className="cal-pop"
          role="dialog"
          tabIndex={-1}
          data-closing={closing}
          aria-label="Choose date"
          style={popStyle}
          onKeyDown={onCalKey}
        >
          {/* header */}
          <div className="cal-head">
            <button type="button" className="cal-nav-btn" aria-label="Previous month"
              onMouseDown={(e) => { e.preventDefault(); setViewDate(addMonths(viewDate, -1)); }}>
              <Chev dir="left" />
            </button>
            <div className="cal-title">
              {MONTHS_LONG[viewDate.getMonth()]}
              <span className="year">{viewDate.getFullYear()}</span>
            </div>
            <button type="button" className="cal-nav-btn" aria-label="Next month"
              onMouseDown={(e) => { e.preventDefault(); setViewDate(addMonths(viewDate, 1)); }}>
              <Chev dir="right" />
            </button>
          </div>

          {/* day-of-week */}
          <div className="cal-dow" aria-hidden>
            {dowOrdered.map((d, i) => {
              const realDow = (i + weekStart) % 7;
              const isWknd = realDow === 0 || realDow === 6;
              return <span key={i} className={isWknd ? "weekend" : ""}>{d}</span>;
            })}
          </div>

          {/* grid */}
          <div className="cal-grid" role="grid">
            {cells.map((d) => {
              const inMonth = d.getMonth() === viewDate.getMonth();
              const dow = d.getDay();
              const isWknd = dow === 0 || dow === 6;
              const isToday = isSameDay(d, today);
              const isSel = isSameDay(d, value);
              const isAct = isSameDay(d, activeDate);
              const dis = isDisabledDay(d);
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  className="cal-day"
                  role="gridcell"
                  aria-label={d.toDateString()}
                  aria-selected={isSel}
                  data-other-month={!inMonth}
                  data-weekend={isWknd}
                  data-today={isToday}
                  data-selected={isSel}
                  data-active={isAct}
                  data-disabled={dis}
                  disabled={dis}
                  onMouseDown={(e) => { e.preventDefault(); commit(d); }}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          {/* footer */}
          <div className="cal-foot">
            <span className={`selected-text${value ? "" : " empty"}`}>
              {formatFooter(value)}
            </span>
            {value && (
              <button type="button" className="cal-foot-btn danger"
                onMouseDown={(e) => { e.preventDefault(); onChange(null); closeCal(); }}>
                Clear
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function CalendarGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
         stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="10" height="9" rx="1.5"/>
      <path d="M2 6h10"/>
      <path d="M5 2v2M9 2v2"/>
    </svg>
  );
}
function Chev({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
         stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {dir === "left"
        ? <path d="M7.5 3L4.5 6L7.5 9"/>
        : <path d="M4.5 3L7.5 6L4.5 9"/>}
    </svg>
  );
}
