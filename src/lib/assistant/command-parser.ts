export type AssistantCommand =
  | { action: "call"; number: string }
  | { action: "search"; query: string }
  | { action: "read"; url: string }
  | { action: "none" };

export function parseCommand(text: string): AssistantCommand {
  const lower = text.trim().toLowerCase();

  // Call phone number or contact by name
  const callMatch = lower.match(/^call\s+(.*)$/);
  if (callMatch) {
    // Basic sanitization: keep digits, +, spaces
    const target = callMatch[1].trim();
    const digits = target.replace(/[^0-9+]/g, "");
    return { action: "call", number: digits || target };
  }

  // Search web
  const searchMatch = lower.match(/^(search|google)\s+(.*)$/);
  if (searchMatch) {
    return { action: "search", query: searchMatch[2].trim() };
  }

  // Read URL
  const readMatch = lower.match(/^(read|open)\s+(https?:\/\/[^\s]+)$/);
  if (readMatch) {
    return { action: "read", url: readMatch[2] };
  }

  return { action: "none" };
} 