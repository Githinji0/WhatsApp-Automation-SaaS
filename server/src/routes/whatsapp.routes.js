const express = require("express");

const { requireAuth } = require("../middleware/auth");
const { getWhatsappWebjsStatus, sendMessage } = require("../services/whatsapp-webjs-engine");

const router = express.Router();

router.get("/status", requireAuth, (req, res) => {
  res.status(200).json({
    whatsapp: getWhatsappWebjsStatus(),
  });
});

router.post("/send", requireAuth, async (req, res, next) => {
  try {
    const recipient = String(req.body?.recipient || "").trim();
    const message = String(req.body?.message || "").trim();

    if (!recipient || !message) {
      return res.status(400).json({
        error: {
          message: "recipient and message are required",
          code: "BAD_REQUEST",
        },
      });
    }

    const result = await sendMessage(recipient, message);

    res.status(200).json({
      delivery: {
        provider: "webjs",
        providerMessageId: result?.id?._serialized || result?.id || null,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;