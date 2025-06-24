import * as FileSystem from "expo-file-system";
import * as Speech from "expo-speech";
import { Platform } from "react-native";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const BASE = process.env.EXPO_PUBLIC_API_BASE;

export async function chatCompletion(messages: ChatMessage[]) {
  const res = await fetch(`${BASE}/api/assistant/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) throw new Error("Chat completion failed");
  const json = await res.json();
  return json.content as string;
}

export async function transcribeAudio(uri: string): Promise<string> {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) throw new Error("File not found");

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const res = await fetch(`${BASE}/api/assistant/whisper`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audio: base64 }),
  });
  if (!res.ok) throw new Error("STT failed");
  const json = await res.json();
  return json.text as string;
}

export function speak(text: string) {
  // Local TTS fallback
  Speech.speak(text, { language: Platform.OS === "ios" ? "en-US" : "en" });
} 