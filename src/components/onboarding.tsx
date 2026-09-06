import { useState } from "react";
import { DunMark } from "@/components/mark";
import { ProfileForm, type ProfileDraft } from "@/components/profile-form";
import { Button } from "@/components/ui/button";
import { DEFAULT_USERNAME } from "@/lib/profile/types";
import { useProfileStore } from "@/lib/profile/store";

export function Onboarding() {
  const complete = useProfileStore((s) => s.complete);
  const skip = useProfileStore((s) => s.skip);
  const [draft, setDraft] = useState<ProfileDraft>({
    username: "",
    gender: "male",
    customAvatar: null,
  });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <DunMark className="size-9" />
          <span className="font-display text-lg font-semibold tracking-tight">Dun</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => skip()}>
          Skip
        </Button>
      </div>

      <h1 className="mt-8 font-display text-3xl font-semibold tracking-tight">Make it yours</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        A name, a photo, and you’re set. Skip if you’d rather do this later.
      </p>

      <div className="mt-8">
        <ProfileForm value={draft} onChange={setDraft} />
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-8">
        <Button
          onClick={() =>
            complete({
              username: draft.username.trim() || DEFAULT_USERNAME,
              gender: draft.gender,
              customAvatar: draft.customAvatar,
            })
          }
        >
          Continue
        </Button>
        <p className="text-center text-xs text-muted-foreground">You can edit this anytime from your photo.</p>
      </div>
    </main>
  );
}
