const { env } = require("../config/env");

function buildOpenRouterHeaders() {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error("Missing OpenRouter API key. Set OPENROUTER_API_KEY.");
  }

  return {
    Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": env.OPENROUTER_SITE_URL || "http://localhost:3000",
    "X-Title": env.OPENROUTER_APP_NAME || "WhatsApp Automation SaaS",
  };
}

async function generateReplySuggestion({ contactName, lastMessage, context }) {
  const model = env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: buildOpenRouterHeaders(),
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "You write concise, helpful WhatsApp replies for a business automation app. Return only the reply text.",
        },
        {
          role: "user",
          content: [
            `Contact: ${contactName || "Unknown"}`,
            `Last message: ${lastMessage || ""}`,
            `Context: ${context || ""}`,
            "Write a short, natural reply that feels human.",
          ].join("\n"),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter request failed: ${errorText}`);
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content?.trim();

  return {
    model,
    reply: reply || "Thanks for reaching out. How can I help?",
    raw: data,
  };
}

module.exports = {
  generateReplySuggestion,
};