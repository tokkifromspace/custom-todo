import {
  useEffect, useId, useRef,
  type ChangeEvent, type ReactNode,
} from "react";
import "./checkbox.css";

type Props = {
  checked: boolean;
  onChange: (checked: boolean, e: ChangeEvent<HTMLInputElement>) => void;
  indeterminate?: boolean;
  label?: ReactNode;
  description?: ReactNode;
  variant?: "form" | "task" | "subtask";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  error?: boolean;
  required?: boolean;
  ariaLabel?: string;
  id?: string;
  name?: string;
  value?: string;
};

export function Checkbox({
  checked, onChange,
  indeterminate = false,
  label, description,
  variant = "form",
  size = "md",
  disabled = false,
  error = false,
  required = false,
  ariaLabel, id, name, value,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autoId = useId();
  const inputId = id ?? autoId;

  // mirror indeterminate to native input
  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = !!indeterminate;
  }, [indeterminate, checked]);

  return (
    <label
      className="cb"
      htmlFor={inputId}
      data-variant={variant}
      data-size={size}
      data-checked={!!checked}
      data-indeterminate={!!indeterminate}
      data-disabled={disabled}
      data-error={error}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="checkbox"
        name={name}
        value={value}
        checked={!!checked}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-checked={indeterminate ? "mixed" : !!checked}
        aria-invalid={error || undefined}
        aria-required={required || undefined}
        onChange={(e) => !disabled && onChange(e.target.checked, e)}
      />
      <span className="cb-box" aria-hidden>
        <svg className="cb-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor">
          {indeterminate
            ? <line x1="3.5" y1="8" x2="12.5" y2="8" />
            : <path d="M3.5 8.5L6.5 11.5L12.5 5" />}
        </svg>
      </span>
      {(label || description) && (
        <span className="cb-label-wrap">
          {label && (
            <span className="cb-label">
              {label}
              {required && <span className="cb-required" aria-hidden>*</span>}
            </span>
          )}
          {description && <span className="cb-desc">{description}</span>}
        </span>
      )}
    </label>
  );
}
