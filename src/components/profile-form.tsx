import { Camera } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readAvatarFile } from "@/lib/profile/read-avatar";
import { avatarSrc } from "@/lib/profile/store";
import { GENDER_OPTIONS, type Gender } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

export type ProfileDraft = {
  username: string;
  gender: Gender;
  customAvatar: string | null;
};

export function ProfileForm({
  value,
  onChange,
}: {
  value: ProfileDraft;
  onChange: (next: ProfileDraft) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const src = avatarSrc(value);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const data = await readAvatarFile(file);
      onChange({ ...value, customAvatar: data });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not use that photo");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="relative"
          aria-label="Choose a profile photo"
        >
          <UserAvatar src={src} username={value.username} className="size-24" />
          <span className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full bg-ink text-ink-foreground shadow-card">
            <Camera className="size-3.5" />
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
        <p className="text-xs text-muted-foreground">PNG or JPG, under 5 MB</p>
        {value.customAvatar ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onChange({ ...value, customAvatar: null })}
          >
            Use default photo
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="dun-username">Username</Label>
        <Input
          id="dun-username"
          value={value.username}
          maxLength={24}
          autoComplete="nickname"
          placeholder="user"
          className="rounded-full"
          onChange={(e) => onChange({ ...value, username: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Gender</p>
        <div className="grid grid-cols-3 gap-1 rounded-full bg-muted p-1">
          {GENDER_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange({ ...value, gender: option.id })}
              className={cn(
                "h-10 rounded-full text-sm font-medium transition-colors duration-150",
                value.gender === option.id ? "bg-card text-foreground shadow-card" : "text-muted-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
