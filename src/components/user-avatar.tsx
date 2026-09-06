import { cn } from "@/lib/utils";

export function UserAvatar({
  src,
  username,
  className,
}: {
  src: string;
  username: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt=""
      width={88}
      height={88}
      draggable={false}
      className={cn("shrink-0 rounded-full bg-muted object-cover ring-1 ring-border", className)}
      title={username}
    />
  );
}
