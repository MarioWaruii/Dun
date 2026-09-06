import { Link } from "@tanstack/react-router";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";

export function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="size-10 shrink-0 animate-pulse rounded-full bg-muted" />;
  }
  if (user) {
    return (
      <div className="max-w-[48vw] shrink-0 overflow-hidden [&_span]:max-w-24 [&_span]:truncate">
        <UserButton />
      </div>
    );
  }
  return (
    <Button asChild size="sm" variant="ink">
      <Link to="/login">Sign in</Link>
    </Button>
  );
}
