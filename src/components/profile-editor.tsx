import { useEffect, useState } from "react";
import { ProfileForm, type ProfileDraft } from "@/components/profile-form";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useProfileStore } from "@/lib/profile/store";

export function ProfileEditor({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const profile = useProfileStore();
  const [draft, setDraft] = useState<ProfileDraft>({
    username: profile.username,
    gender: profile.gender,
    customAvatar: profile.customAvatar,
  });

  useEffect(() => {
    if (!open) return;
    setDraft({
      username: profile.username,
      gender: profile.gender,
      customAvatar: profile.customAvatar,
    });
  }, [open, profile.username, profile.gender, profile.customAvatar]);

  function save() {
    profile.update(draft);
    onOpenChange(false);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="flex flex-col gap-5 overflow-y-auto px-5 pb-5 pt-4">
          <div>
            <DrawerTitle>Your profile</DrawerTitle>
            <DrawerDescription className="mt-1">Shown at the top of Dun. Change it whenever you like.</DrawerDescription>
          </div>
          <ProfileForm value={draft} onChange={setDraft} />
          <Button onClick={save}>Save</Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
