import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";

export function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  const [signingOut, setSigningOut] = useState(false);

  if (isPending) {
    return <div className="h-9 w-16 shrink-0 animate-pulse rounded-full bg-muted" />;
  }

  if (user && !user.isDevFallback) {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={signingOut}
        onClick={() => {
          setSigningOut(true);
          void signOut().catch(() => setSigningOut(false));
        }}
      >
        {signingOut ? "Signing out…" : "Sign out"}
      </Button>
    );
  }

  return (
    <Button asChild size="sm" variant="ink">
      <Link to="/login">Sign in</Link>
    </Button>
  );
}