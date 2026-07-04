/**
 * Sol System Census · "Ask the Professor" Worker
 *
 * POC chat backend for the embeddable widget (public/widget.js, served by
 * the [assets] binding at /widget.js). Answers questions in a Neil
 * deGrasse Tyson-style voice, grounded in whichever body is currently
 * selected in the catalog UI (or general Solar System Q&A if none is).
 *
 * No RAG/Vectorize, no KV sessions, no streaming — see README.md for why
 * this POC intentionally cuts that scope versus a fuller reference
 * implementation.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const SYSTEM_PROMPT = `You are "the Professor" — an astrophysicist with the enthusiastic, witty, plain-language style of Neil deGrasse Tyson. You answer questions about the Solar System for visitors of a catalog site called Sol System Census. Be accessible and fun, but accurate. If the user is asking about something outside the Solar System catalog, you may still answer in character, but say so if you're speculating beyond the given data.`;

function respond(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function buildSystemPrompt(selectedBody) {
  if (!selectedBody) return SYSTEM_PROMPT;
  const { name, type, tldr, mass, diameter, orbit, discovered } = selectedBody;
  return (
    `${SYSTEM_PROMPT}\n\nThe user is currently viewing this body from the catalog:\n` +
    `Name: ${name}\nType: ${type}\nSummary: ${tldr}\nMass: ${mass}\n` +
    `Diameter: ${diameter}\nOrbit: ${orbit}\nDiscovered: ${discovered}\n` +
    `Prefer grounding your answer in this data when relevant, but you can range wider if asked.`
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname !== "/api/ask") {
      return respond(404, { error: "Not found" });
    }

    if (request.method !== "POST") {
      return respond(405, { error: "Method not allowed" });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return respond(400, { error: "Invalid JSON body" });
    }

    const { question, selectedBody } = body || {};
    if (!question || typeof question !== "string" || !question.trim()) {
      return respond(400, { error: 'Missing "question" string' });
    }
    if (question.length > 1000) {
      return respond(400, { error: "Question too long (max 1000 chars)" });
    }

    const messages = [
      { role: "system", content: buildSystemPrompt(selectedBody) },
      { role: "user", content: question.trim() },
    ];

    try {
      // "@cf/meta/llama-3.1-8b-instruct" was deprecated 2026-05-30; this is
      // its direct successor. Fallback if it has quota/availability issues
      // on your account: "@cf/mistral/mistral-7b-instruct-v0.1"
      const aiResult = await env.AI.run("@cf/meta/llama-3.1-8b-instruct-fast", {
        messages,
        max_tokens: 512,
      });
      return respond(200, { answer: aiResult.response || "" });
    } catch (e) {
      return respond(502, { error: `AI request failed: ${e.message}` });
    }
  },
};
