import { useCallback, useEffect, useState } from "react";

const DISMISS_KEY = "dun.install.dismissed";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
};

function isStandalone() {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
}

function isIos() {
  const nav = window.navigator;
  return /iphone|ipad|ipod/i.test(nav.userAgent) || (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);
}

export function useInstall() {
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);

  useEffect(() => {
    const installed = isStandalone();
    setStandalone(installed);
    setIos(isIos());
    setHidden(installed || window.localStorage.getItem(DISMISS_KEY) === "1");

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as InstallEvent);
    };
    const onInstalled = () => {
      setHidden(true);
      setStandalone(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setHidden(true);
  }, []);

  const install = useCallback(async () => {
    if (deferred) {
      await deferred.prompt();
      setDeferred(null);
      return;
    }
    if (isIos()) {
      window.location.assign("/?install=1&platform=ios");
    }
  }, [deferred]);

  return {
    standalone,
    ios,
    showBanner: !hidden && !standalone,
    canPrompt: Boolean(deferred),
    install,
    dismiss,
  };
}
