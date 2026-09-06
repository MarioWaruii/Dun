import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_PROFILE, DEFAULT_USERNAME, PRESET_AVATARS, type Gender, type Profile } from "./types";

type Patch = Partial<Pick<Profile, "username" | "gender" | "customAvatar">>;

type ProfileState = Profile & {
  complete: (patch: Patch) => void;
  skip: () => void;
  update: (patch: Patch) => void;
};

function cleanName(value: string) {
  return value.trim().slice(0, 24) || DEFAULT_USERNAME;
}

function apply(state: Profile, patch: Patch, onboarded: boolean): Profile {
  return {
    username: patch.username !== undefined ? cleanName(patch.username) : state.username,
    gender: patch.gender ?? state.gender,
    customAvatar: patch.customAvatar === undefined ? state.customAvatar : patch.customAvatar,
    onboarded,
  };
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      ...DEFAULT_PROFILE,
      complete: (patch) => set((s) => apply(s, patch, true)),
      skip: () => set({ ...DEFAULT_PROFILE, onboarded: true }),
      update: (patch) => set((s) => apply(s, patch, true)),
    }),
    { name: "dun.profile.v1" },
  ),
);

export function avatarSrc(profile: Pick<Profile, "gender" | "customAvatar">) {
  return profile.customAvatar || PRESET_AVATARS[profile.gender];
}

export function useAvatarSrc() {
  return useProfileStore((s) => avatarSrc(s));
}

export type { Gender, Profile };
