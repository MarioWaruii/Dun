import { useEffect, useState, type ReactNode } from "react";
import { Onboarding } from "@/components/onboarding";
import { SplashScreen } from "@/components/splash-screen";
import { useProfileStore } from "@/lib/profile/store";

const SPLASH_KEY = "dun.splash.seen";

export function AppGate({ children }: { children: ReactNode }) {
  const onboarded = useProfileStore((s) => s.onboarded);
  const [hydrated, setHydrated] = useState(false);
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    const api = useProfileStore.persist;
    const finish = () => setHydrated(true);
    const unsub = api?.onFinishHydration(finish);
    if (!api || api.hasHydrated()) finish();

    const seen = sessionStorage.getItem(SPLASH_KEY) === "1";
    if (seen) {
      setSplash(false);
      return () => unsub?.();
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => {
      sessionStorage.setItem(SPLASH_KEY, "1");
      setSplash(false);
    }, reduced ? 0 : 900);

    return () => {
      unsub?.();
      window.clearTimeout(t);
    };
  }, []);

  if (!hydrated || splash) return <SplashScreen />;
  if (!onboarded) return <Onboarding />;
  return <>{children}</>;
}
