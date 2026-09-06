export type Gender = "male" | "female" | "other";

export type Profile = {
  username: string;
  gender: Gender;
  customAvatar: string | null;
  onboarded: boolean;
};

export const DEFAULT_USERNAME = "user";

export const DEFAULT_PROFILE: Profile = {
  username: DEFAULT_USERNAME,
  gender: "male",
  customAvatar: null,
  onboarded: false,
};

export const GENDER_OPTIONS: { id: Gender; label: string }[] = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "other", label: "Other" },
];

export const PRESET_AVATARS: Record<Gender, string> = {
  male: "/avatars/male.png",
  female: "/avatars/female.png",
  other: "/avatars/other.png",
};

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
