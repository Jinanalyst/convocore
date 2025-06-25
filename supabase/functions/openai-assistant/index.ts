import { serve } from "https://deno.land/std/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")
const ASSISTANT_ID = Deno.env.get("ASSISTANT_ID")

serve(async (req) => {
  // This is needed if you're deploying functions from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, threadId } = await req.json()
    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const openai = {
        baseURL: "https://api.openai.com/v1",
        headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
            "OpenAI-Beta": "assistants=v2",
        }
    }

    // Step 1: Create a new thread if no threadId is provided
    let currentThreadId = threadId
    if (!currentThreadId) {
      const threadRes = await fetch(`${openai.baseURL}/threads`, {
        method: "POST",
        headers: openai.headers,
      })
      const thread = await threadRes.json()
      currentThreadId = thread.id
    }

    // Step 2: Add the user's message to the thread
    await fetch(`${openai.baseURL}/threads/${currentThreadId}/messages`, {
      method: "POST",
      headers: openai.headers,
      body: JSON.stringify({
        role: "user",
        content: message
      })
    })

    // Step 3: Create a run to process the thread
    const runRes = await fetch(`${openai.baseURL}/threads/${currentThreadId}/runs`, {
      method: "POST",
      headers: openai.headers,
      body: JSON.stringify({ assistant_id: ASSISTANT_ID })
    })
    const run = await runRes.json()

    // Step 4: Poll for the run to complete
    let status = run.status
    while (["queued", "in_progress"].includes(status)) {
      await new Promise(resolve => setTimeout(resolve, 1000)) // Wait for 1 second
      const statusRes = await fetch(`${openai.baseURL}/threads/${currentThreadId}/runs/${run.id}`, {
        headers: openai.headers
      })
      const statusData = await statusRes.json()
      status = statusData.status
    }
    
    if (["failed", "expired", "cancelled"].includes(status)) {
        const failedRun = await fetch(`${openai.baseURL}/threads/${currentThreadId}/runs/${run.id}`, {
            headers: openai.headers
        });
        const runData = await failedRun.json();
        console.error("Run failed", runData.last_error);
        return new Response(JSON.stringify({ error: `Run failed with status: ${status}`, details: runData.last_error }), { 
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
    }

    // Step 5: Retrieve the messages from the thread
    const msgRes = await fetch(`${openai.baseURL}/threads/${currentThreadId}/messages`, {
      headers: openai.headers
    })
    const messages = await msgRes.json()
    const latestMessage = messages.data[0]?.content?.[0]?.text?.value || "No response."

    return new Response(JSON.stringify({ reply: latestMessage, threadId: currentThreadId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
}) 