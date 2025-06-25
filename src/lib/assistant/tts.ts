export async function synthesizeSpeech(text: string, voice: string = "Rachel"): Promise<string> {
  const res = await fetch("/api/assistant/tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, voice }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || "Failed to synthesize speech");
  }
  // json.audio is base64 string
  return json.audio as string;
} 