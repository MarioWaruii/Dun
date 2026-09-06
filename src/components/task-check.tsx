import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function TaskCheck({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      aria-label={checked ? `Mark “${label}” as not done` : `Mark “${label}” as done`}
      className="grid size-11 place-items-center"
    >
      <span
        className={cn(
          "grid size-7 place-items-center rounded-full border-2 transition-[background-color,border-color,transform] duration-200 ease-out",
          checked
            ? "scale-100 border-primary bg-primary text-primary-foreground"
            : "border-ink/70 bg-card text-transparent hover:border-primary",
        )}
      >
        <Check
          className={cn(
            "size-3.5 stroke-[3] transition-[opacity,transform,filter] duration-200",
            checked ? "scale-100 opacity-100" : "scale-[0.25] opacity-0 blur-[2px]",
          )}
        />
      </span>
    </button>
  );
}
