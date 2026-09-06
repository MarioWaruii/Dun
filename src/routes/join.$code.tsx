import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { DunMark } from "@/components/mark";
import { Button } from "@/components/ui/button";
import { SignInGate } from "@/lib/auth/gates";
import { GROK_PROVIDERS, signIn } from "@/lib/auth/client";
import { joinCircle } from "@/lib/tasks/api";

export const Route = createFileRoute("/join/$code")({ component: JoinPage });

function JoinPage() {
  const { code } = Route.useParams();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <Link to="/" className="mb-8 flex items-center gap-3">
        <DunMark className="size-11" />
        <span className="font-display text-2xl font-semibold tracking-tight">Dun</span>
      </Link>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Join a circle</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Invite code <span className="font-medium tracking-[0.2em] text-foreground">{code.toUpperCase()}</span>
      </p>
      <div className="mt-8">
        <SignInGate fallback={<JoinSignIn code={code} />}>
          <JoinOnce code={code} />
        </SignInGate>
      </div>
    </main>
  );
}

function JoinSignIn({ code }: { code: string }) {
  const callbackURL = `/join/${code}`;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">Sign in to accept this invite.</p>
      {GROK_PROVIDERS.map((p) => (
        <Button
          key={p.providerId}
          variant="outline"
          onClick={() => void signIn(p.providerId, { callbackURL })}
        >
          Continue with {p.label}
        </Button>
      ))}
      <Button asChild>
        <Link to="/login">Email sign in</Link>
      </Button>
    </div>
  );
}

function JoinOnce({ code }: { code: string }) {
  const navigate = useNavigate();
  const ran = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void joinCircle({ data: code })
      .then((circle) => navigate({ to: "/circles/$circleId", params: { circleId: circle.id } }))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not join");
      });
  }, [code, navigate]);

  if (error) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-destructive">{error}</p>
        <Button asChild variant="outline">
          <Link to="/">Back to Dun</Link>
        </Button>
      </div>
    );
  }

  return <p className="text-sm text-muted-foreground">Joining…</p>;
}
