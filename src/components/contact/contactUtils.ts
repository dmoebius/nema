import type { Contact } from "../../types/contact";

export function getInitials(contact: Contact): string {
  const f = contact.firstName?.[0] ?? "";
  const l = contact.lastName?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

const AVATAR_COLORS = [
  "#2d6a4f",
  "#52b788",
  "#1b4332",
  "#b5838d",
  "#6d6875",
  "#457b9d",
  "#1d3557",
  "#e76f51",
  "#264653",
  "#2a9d8f",
  "#e9c46a",
  "#f4a261",
  "#a8dadc",
  "#606c38",
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
