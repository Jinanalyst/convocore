import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { messages, model = "gpt-4o", think = false, deepSearch = false } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Prepends system instructions for think or deep search modes
    const modifiedMessages = [];
    if (think) {
      modifiedMessages.push({ role: "system", content: "Please think step by step before answering." });
    }
    if (deepSearch) {
      modifiedMessages.push({ role: "system", content: "You have access to web search; incorporate relevant search insights into your response." });
    }
    modifiedMessages.push(...messages);
    const completion = await openai.chat.completions.create({
      model,
      messages: modifiedMessages,
    });

    return NextResponse.json({ content: completion.choices[0].message?.content ?? "" });
  } catch (err: any) {
    console.error("/api/assistant/chat error", err);
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
} 