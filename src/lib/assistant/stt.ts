export async function transcribeAudio(base64Audio: string): Promise<string> {
  const userLang = typeof navigator !== 'undefined' ? (navigator.language || (navigator.languages && navigator.languages[0])) : undefined;

  const res = await fetch("/api/assistant/whisper", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ audio: base64Audio, language: userLang }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || "Failed to transcribe audio");
  }
  return json.text as string;
} 