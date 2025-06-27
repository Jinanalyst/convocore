import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { text, voice = "Rachel" } = await req.json();

    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: "Missing ELEVENLABS_API_KEY" }, { status: 500 });
    }

    const elevenUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voice}`;

    const response = await fetch(elevenUrl, {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY as string,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.35,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errTxt = await response.text();
      return NextResponse.json({ error: errTxt }, { status: 500 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    return NextResponse.json({ audio: base64Audio });
  } catch (err: any) {
    console.error("/api/assistant/tts error", err);
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
} 