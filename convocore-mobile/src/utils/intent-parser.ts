export type AssistantCommand =
  | { action: "call"; contactName: string }
  | { action: "calendar_today" }
  | { action: "where_am_i" }
  | { action: "none" };

export function parseCommand(text: string): AssistantCommand {
  const lower = text.toLowerCase();

  if (/^call\s+([\w\s]+)$/.test(lower)) {
    const match = lower.match(/^call\s+([\w\s]+)$/);
    return { action: "call", contactName: match![1].trim() };
  }

  if (/(what'?s|what is)\s+on\s+my\s+calendar\s+(today|for\s+today)/.test(lower)) {
    return { action: "calendar_today" };
  }

  if (/where\s+am\s+i/.test(lower)) {
    return { action: "where_am_i" };
  }

  return { action: "none" };
} 