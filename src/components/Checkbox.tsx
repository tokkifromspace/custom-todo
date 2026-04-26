import type { Bucket } from "../types";
import { Icon } from "./Icon";

interface Props {
  checked: boolean;
  bucket?: Bucket | null;
  onClick?: () => void;
}

export function Checkbox({ checked, bucket, onClick }: Props) {
  return (
    <div
      className={`checkbox ${checked ? "checked" : ""} ${bucket === "evening" ? "evening-bucket" : ""} ${bucket === "today" ? "warm-bucket" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <Icon name="check" size={12} />
    </div>
  );
}
