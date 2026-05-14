const express = require("express");

const { requireAuth } = require("../middleware/auth");
const { generateReplySuggestion } = require("../lib/openrouter");

const router = express.Router();

router.post("/reply", requireAuth, async (req, res, next) => {
  try {
    const contactName = String(req.body?.contactName || "").trim();
    const lastMessage = String(req.body?.lastMessage || "").trim();
    const context = String(req.body?.context || "").trim();

    if (!lastMessage) {
      return res.status(400).json({
        error: {
          message: "lastMessage is required",
          code: "BAD_REQUEST",
        },
      });
    }

    const result = await generateReplySuggestion({
      contactName,
      lastMessage,
      context,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;