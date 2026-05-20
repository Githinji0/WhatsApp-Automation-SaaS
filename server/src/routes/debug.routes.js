const express = require("express");

const { env } = require("../config/env");
const { sendMessage, reconnectWhatsappWebjs, getWhatsappWebjsStatus } = require("../services/whatsapp-webjs-engine");

const router = express.Router();

router.get("/ping", (req, res) => {
  const origin = req.headers.origin || null;
  const hasAuth = !!req.headers.authorization;

  res.status(200).json({
    ok: true,
    origin,
    hasAuth,
    headers: {
      // echo only safe, non-sensitive header meta
      "user-agent": req.headers["user-agent"] || null,
    },
  });
});

// Development-only route to inspect Clerk env values
router.get("/clerk", (req, res) => {
  if (env.NODE_ENV !== "development") {
    return res.status(403).json({ error: { message: "Not allowed", code: "FORBIDDEN" } });
  }

  return res.json({
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || null,
    clerkIssuer: process.env.CLERK_ISSUER_URL || null,
    clerkJwksUrl: process.env.CLERK_JWKS_URL || null,
  });
});

// Development-only route to exercise whatsapp send without auth
router.post("/whatsapp/send-test", async (req, res, next) => {
  if (env.NODE_ENV !== "development") {
    return res.status(403).json({ error: { message: "Not allowed", code: "FORBIDDEN" } });
  }

  try {
    const recipient = String(req.body?.recipient || "").trim();
    const message = String(req.body?.message || "").trim();

    if (!recipient || !message) {
      return res.status(400).json({ error: { message: "recipient and message are required", code: "BAD_REQUEST" } });
    }

    const result = await sendMessage(recipient, message);

    return res.status(200).json({ delivery: { provider: "webjs", providerMessageId: result?.id?._serialized || result?.id || null } });
  } catch (error) {
    next(error);
  }
});

// Development-only: trigger reconnect without auth
router.post("/whatsapp/reconnect-dev", async (req, res, next) => {
  if (env.NODE_ENV !== "development") {
    return res.status(403).json({ error: { message: "Not allowed", code: "FORBIDDEN" } });
  }

  try {
    await reconnectWhatsappWebjs();
    return res.status(202).json({ message: "Reconnect triggered", whatsapp: getWhatsappWebjsStatus() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
