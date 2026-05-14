const express = require("express");

const { requireAuth } = require("../middleware/auth");
const { upsertUserFromClerk } = require("../db/users.repo");

const router = express.Router();

router.get("/me", requireAuth, (req, res) => {
  res.status(200).json({
    user: req.auth,
  });
});

router.post("/sync-user", requireAuth, async (req, res, next) => {
  try {
    const user = await upsertUserFromClerk(req.auth);

    res.status(200).json({
      user,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/session", requireAuth, async (req, res) => {
  const user = await upsertUserFromClerk(req.auth);

  res.status(200).json({
    user,
    auth: req.auth,
  });
});

module.exports = router;