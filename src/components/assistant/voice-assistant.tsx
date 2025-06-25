"use client";

import { useRef, useState } from "react";
import { Mic, Loader2 } from "lucide-react";
import { transcribeAudio } from "@/lib/assistant/stt";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

interface VoiceAssistantProps {
  onSend: (message: string) => void;
}

/**
 * Floating voice assistant button that records audio, transcribes via Whisper,
 * and sends the transcript to the main chat handler.
 * Visible only for Pro / Premium users.
 */
export function VoiceAssistant({ onSend }: VoiceAssistantProps) {
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

    // Pass the transcript to the parent component to handle.
    onSend(text);

    // Command parsing could still happen here, or be moved to the parent
    // const command = parseCommand(text);
    // if (command.action !== "none") {
    //   executeCommand(command);
    //   return;
    // }
  };

  // Command execution can be kept or removed depending on desired functionality
  // const executeCommand = (cmd: ReturnType<typeof parseCommand>) => {
  //   ...
  // };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={toggleRecording}
        disabled={processing}
        className={cn(
          "h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all",
          recording ? "bg-red-500 text-white" : "bg-blue-500 text-white hover:bg-blue-600",
          processing && "opacity-60 cursor-not-allowed"
        )}
        title={tooltip || (recording ? "Stop recording" : "Start voice assistant")}
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