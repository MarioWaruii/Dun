import { Share, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstall } from "@/hooks/use-install";

export function InstallApp() {
  const { showBanner, ios, canPrompt, install, dismiss } = useInstall();
  if (!showBanner) return null;

  const action = canPrompt ? "Install" : ios ? "Add to Home Screen" : "Install";

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-card">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-leaf-soft text-primary-foreground">
          <Smartphone className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">Use Dun like an app</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {ios
              ? "Add it to your Home Screen. It opens full-screen, like Notes or Reminders."
              : "Install it on your phone. It opens full-screen, with your logo on the home screen."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void install()}>
              {ios ? <Share className="size-3.5" /> : null}
              {action}
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              Not now
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="grid size-11 shrink-0 place-items-center text-muted-foreground"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
