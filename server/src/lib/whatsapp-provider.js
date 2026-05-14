const { env } = require("../config/env");

function normalizeRecipient(recipient) {
  return String(recipient || "").replace(/[^\d]/g, "");
}

function getWhatsAppEngine() {
  const { getWhatsappWebjsEngine } = require("../services/whatsapp-webjs-engine");

  return getWhatsappWebjsEngine();
}

async function sendWhatsAppMessage({ recipient, message, provider: providerOverride }) {
  const provider = providerOverride || env.WHATSAPP_PROVIDER || "mock";

  if (provider === "mock") {
    return {
      provider: "mock",
      providerMessageId: `mock_${Date.now()}`,
    };
  }

  if (provider === "webjs") {
    const engine = await getWhatsAppEngine();
    const result = await engine.sendMessage(recipient, message);

    return {
      provider: "webjs",
      providerMessageId: result?.id?._serialized || result?.id || null,
    };
  }

  if (provider !== "meta") {
    throw new Error("Unsupported WhatsApp provider. Set WHATSAPP_PROVIDER=webjs, meta or mock.");
  }

  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    throw new Error(
      "Missing WhatsApp provider credentials. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID."
    );
  }

  const apiVersion = env.WHATSAPP_API_VERSION || "v21.0";
  const normalizedRecipient = normalizeRecipient(recipient);

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizedRecipient,
        type: "text",
        text: {
          body: message,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WhatsApp provider request failed: ${errorText}`);
  }

  const data = await response.json();

  return {
    provider: "meta",
    providerMessageId: data?.messages?.[0]?.id || null,
  };
}

module.exports = {
  sendWhatsAppMessage,
  getWhatsAppEngine,
};