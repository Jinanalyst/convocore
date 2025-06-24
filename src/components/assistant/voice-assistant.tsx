"use client";

import { useRef, useState } from "react";
import { Mic, Loader2 } from "lucide-react";
import { transcribeAudio } from "@/lib/assistant/stt";
import { chatCompletion, ChatMessage } from "@/lib/assistant/nlp";
import { synthesizeSpeech } from "@/lib/assistant/tts";
import { parseCommand } from "@/lib/assistant/command-parser";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

/**
 * Floating voice assistant button that records audio, transcribes via Whisper,
 * detects commands and either executes them or replies using OpenAI & TTS.
 * Visible only for Pro / Premium users.
 */
export function VoiceAssistant() {
  const { user } = useAuth();
  const isAllowed = user && ["pro", "premium"].includes(user.subscriptionTier);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [tooltip, setTooltip] = useState<string | null>(null);

  if (!isAllowed) return null;

  const toggleRecording = async () => {
    if (recording) {
      // Stop
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
      setRecording(false);
      setTooltip(null);
    } else {
      // Start
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        chunksRef.current = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        mediaRecorder.onstop = async () => {
          setProcessing(true);
          try {
            const blob = new Blob(chunksRef.current, { type: "audio/webm" });
            const arrayBuffer = await blob.arrayBuffer();
            const base64Audio = btoa(
              String.fromCharCode(...new Uint8Array(arrayBuffer))
            );

            const text = await transcribeAudio(base64Audio);
            await handleTranscript(text);
          } catch (err) {
            console.error(err);
            alert("Voice processing failed. Please try again.");
          } finally {
            setProcessing(false);
          }
        };
        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setRecording(true);
        setTooltip("Listening...");
      } catch (err) {
        console.error("Could not access microphone", err);
        alert("Microphone permission denied or not available.");
      }
    }
  };

  const handleTranscript = async (text: string) => {
    if (!text) return;
    console.log("🗣️ Transcript:", text);
    setTooltip(`Heard: ${text}`);

    const command = parseCommand(text);
    if (command.action !== "none") {
      executeCommand(command);
      return;
    }

    // Conversational reply
    try {
      const history: ChatMessage[] = [
        { role: "system", content: "You are Convocore AI Assistant." },
        { role: "user", content: text },
      ];
      const reply = await chatCompletion(history);
      console.log("🤖 Reply:", reply);
      setTooltip(reply);

      // Speak back
      const audioB64 = await synthesizeSpeech(reply);
      const audio = new Audio(`data:audio/mpeg;base64,${audioB64}`);
      audio.play();
    } catch (err) {
      console.error(err);
    }
  };

  const executeCommand = (cmd: ReturnType<typeof parseCommand>) => {
    switch (cmd.action) {
      case "call": {
        window.location.href = `tel:${cmd.number}`;
        break;
      }
      case "search": {
        const url = `https://www.google.com/search?q=${encodeURIComponent(cmd.query)}`;
        window.open(url, "_blank");
        break;
      }
      case "read": {
        window.open(cmd.url, "_blank");
        break;
      }
      default:
        break;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={toggleRecording}
        disabled={processing}
        className={cn(
          "h-20 w-20 md:h-14 md:w-14 rounded-full flex items-center justify-center shadow-lg transition-all focus:outline-none active:scale-95",
          recording ? "bg-red-500 text-white" : "bg-blue-500 text-white hover:bg-blue-600",
          processing && "opacity-60 cursor-not-allowed",
          "before:content-[''] before:absolute before:inset-0 before:-m-2 before:rounded-full before:bg-transparent"
        )}
        title={tooltip || (recording ? "Stop recording" : "Start voice assistant")}
        style={{ touchAction: 'manipulation' }}
      >
        {processing ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </button>
    </div>
  );
} 