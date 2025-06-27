import { NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: Request) {
  try {
    const { messages, model = "gpt-4o", think = false, deepSearch = false } = await req.json();

    // Determine which API key is needed based on the model
    let requiredApiKey = '';
    let provider = '';

    if (model.startsWith('gpt-')) {
      requiredApiKey = 'OPENAI_API_KEY';
      provider = 'OpenAI';
    } else if (model.startsWith('claude-')) {
      requiredApiKey = 'ANTHROPIC_API_KEY';
      provider = 'Anthropic';
    } else if (model.includes('deepseek')) {
      requiredApiKey = 'OPENROUTER_API_KEY';
      provider = 'OpenRouter';
    } else {
      requiredApiKey = 'GROQ_API_KEY';
      provider = 'Groq';
    }

    // Check if the required API key is available
    const apiKey = process.env[requiredApiKey];
    if (!apiKey) {
      return NextResponse.json({ 
        error: `Missing ${requiredApiKey}`,
        message: `Please add your ${provider} API key to the .env.local file. See API_KEYS_SETUP.md for instructions.`,
        provider,
        requiredApiKey
      }, { status: 500 });
    }

    // Prepends system instructions for think or deep search modes
    const modifiedMessages = [];
    if (think) {
      modifiedMessages.push({ role: "system", content: "Please think step by step before answering." });
    }
    if (deepSearch) {
      modifiedMessages.push({ role: "system", content: "You have access to web search; incorporate relevant search insights into your response." });
    }
    modifiedMessages.push(...messages);

    let completion;

    if (provider === 'OpenAI') {
      const openai = new OpenAI({ apiKey });
      completion = await openai.chat.completions.create({
        model,
        messages: modifiedMessages,
      });
    } else if (provider === 'Anthropic') {
      const anthropic = new Anthropic({ apiKey });
      const response = await anthropic.messages.create({
        model,
        messages: modifiedMessages,
        max_tokens: 4096,
      });
      // Convert Anthropic response to OpenAI format
      completion = {
        choices: [{
          message: {
            content: response.content[0].type === 'text' ? response.content[0].text : ''
          }
        }]
      };
    } else if (provider === 'OpenRouter') {
      const openrouter = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey,
      });
      completion = await openrouter.chat.completions.create({
        model,
        messages: modifiedMessages,
      });
    } else {
      // For Groq, we'll use the existing ConvoQ service
      return NextResponse.json({ 
        error: "Groq models should use the ConvoQ service instead of the assistant API",
        message: "Please use the regular chat API for Groq models."
      }, { status: 400 });
    }

    return NextResponse.json({ content: completion.choices[0].message?.content ?? "" });
  } catch (err: any) {
    console.error("/api/assistant/chat error", err);
    
    // Provide more specific error messages
    if (err.message?.includes('401')) {
      return NextResponse.json({ 
        error: "Invalid API key",
        message: "Please check your API key in the .env.local file."
      }, { status: 401 });
    } else if (err.message?.includes('429')) {
      return NextResponse.json({ 
        error: "Rate limit exceeded",
        message: "Please try again later or upgrade your plan."
      }, { status: 429 });
    } else if (err.message?.includes('insufficient_quota')) {
      return NextResponse.json({ 
        error: "Insufficient quota",
        message: "Please add credits to your API account."
      }, { status: 402 });
    }
    
    return NextResponse.json({ 
      error: err?.message || "Unknown error",
      message: "An unexpected error occurred. Please try again."
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
} 