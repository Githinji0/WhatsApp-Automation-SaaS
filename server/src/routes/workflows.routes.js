const express = require("express");

const { requireAuth } = require("../middleware/auth");
const { upsertUserFromClerk } = require("../db/users.repo");
const {
  createWorkflowDraft,
  getWorkflowByIdAndUserId,
  markWorkflowDispatching,
  markWorkflowFailed,
  markWorkflowSent,
} = require("../db/workflows.repo");
const { sendWhatsAppMessage } = require("../lib/whatsapp-provider");

const router = express.Router();

function parseWorkflowPayload(body) {
  const name = String(body?.name || "").trim();
  const recipient = String(body?.recipient || "").trim();
  const message = String(body?.message || "").trim();
  const sendDelayMinutes = Number.parseInt(body?.sendDelayMinutes ?? "0", 10);

  if (!name) {
    throw new Error("Workflow name is required");
  }

  if (!recipient) {
    throw new Error("Recipient number is required");
  }

  if (!message) {
    throw new Error("WhatsApp message is required");
  }

  if (!Number.isInteger(sendDelayMinutes) || sendDelayMinutes < 0) {
    throw new Error("Send delay must be a non-negative integer");
  }

  return {
    name,
    recipient,
    message,
    sendDelayMinutes,
  };
}

async function loadCurrentUser(req) {
  return upsertUserFromClerk(req.auth);
}

async function dispatchWorkflow({ workflowId, userId, recipient, message, provider }) {
  const dispatchingWorkflow = await markWorkflowDispatching({ workflowId, userId });

  if (!dispatchingWorkflow) {
    throw new Error("Workflow not found");
  }

  try {
    const delivery = await sendWhatsAppMessage({ recipient, message, provider });

    const workflow = await markWorkflowSent({
      workflowId,
      userId,
      provider: delivery.provider,
      providerMessageId: delivery.providerMessageId,
    });

    return {
      workflow,
      delivery,
    };
  } catch (error) {
    await markWorkflowFailed({
      workflowId,
      userId,
      errorMessage: error.message,
    });

    throw error;
  }
}

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const currentUser = await loadCurrentUser(req);
    const workflowPayload = parseWorkflowPayload(req.body);
    const sendNow = Boolean(req.body?.sendNow);
    const provider = String(req.body?.provider || "").trim() || undefined;

    const workflow = await createWorkflowDraft({
      userId: currentUser.id,
      ...workflowPayload,
      provider,
    });

    if (!sendNow) {
      return res.status(201).json({
        workflow,
        delivery: {
          status: "saved",
        },
      });
    }

    const result = await dispatchWorkflow({
      workflowId: workflow.id,
      userId: currentUser.id,
      recipient: workflow.recipient,
      message: workflow.message,
      provider: workflow.provider || provider,
    });

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/:workflowId/send", requireAuth, async (req, res, next) => {
  try {
    const currentUser = await loadCurrentUser(req);
    const workflow = await getWorkflowByIdAndUserId({
      workflowId: req.params.workflowId,
      userId: currentUser.id,
    });

    if (!workflow) {
      return res.status(404).json({
        error: {
          message: "Workflow not found",
          code: "NOT_FOUND",
        },
      });
    }

    const result = await dispatchWorkflow({
      workflowId: workflow.id,
      userId: currentUser.id,
      recipient: workflow.recipient,
      message: workflow.message,
      provider: workflow.provider,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;