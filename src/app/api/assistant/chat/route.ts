import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { messages, model = "gpt-4o" } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model,
      messages,
    });

    return NextResponse.json({ content: completion.choices[0].message?.content ?? "" });
  } catch (err: any) {
    console.error("/api/assistant/chat error", err);
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
} 