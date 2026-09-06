export const TASK_EMOJIS = [
  "✅",
  "📌",
  "🎯",
  "💪",
  "📚",
  "🧹",
  "🛒",
  "💧",
  "🏃",
  "🧘",
  "🍳",
  "🛏️",
  "✉️",
  "💻",
  "🎨",
  "📞",
  "🧾",
  "🎁",
  "🧳",
  "🐕",
  "☀️",
  "🌙",
  "🧠",
  "🛠️",
  "🎵",
  "📝",
  "🥦",
  "🏡",
  "🌱",
  "🪴",
] as const;

export const CIRCLE_EMOJIS = ["👥", "🏠", "💼", "🎯", "💪", "📚", "🧹", "🎉", "🏡", "⭐"] as const;

export function randomTaskEmoji(): string {
  return TASK_EMOJIS[Math.floor(Math.random() * TASK_EMOJIS.length)] ?? "✅";
}
