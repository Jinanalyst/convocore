export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function chatCompletion(messages: ChatMessage[], model: string = "gpt-4o"): Promise<string> {
  const res = await fetch("/api/assistant/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages, model }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || "Failed to get AI response");
  }
  return json.content as string;
} 