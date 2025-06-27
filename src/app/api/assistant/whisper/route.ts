import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs"; // ensure Node runtime for buffer/file ops

export async function POST(req: Request) {
  try {
    const { audio } = await req.json(); // base64 string

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    if (!audio) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }

    const buffer = Buffer.from(audio, "base64");

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const transcription = await openai.audio.transcriptions.create({
      file: await OpenAI.toFile(buffer, "speech.webm"),
      model: "whisper-1",
    });

    return NextResponse.json({ text: transcription.text });
  } catch (err: any) {
    console.error("/api/assistant/whisper error", err);
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
} 