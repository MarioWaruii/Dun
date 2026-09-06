import { cn } from "@/lib/utils";

export function DunMark({ className }: { className?: string }) {
  return (
    <img
      src="/dun-logo.png"
      alt=""
      width={88}
      height={88}
      draggable={false}
      className={cn(
        "shrink-0 rounded-full bg-card object-contain shadow-card ring-1 ring-border",
        className,
      )}
    />
  );
}
