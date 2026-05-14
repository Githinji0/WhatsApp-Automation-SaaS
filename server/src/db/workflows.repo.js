const { pool } = require("./client");

async function createWorkflowDraft({
  userId,
  name,
  recipient,
  message,
  sendDelayMinutes,
  provider = null,
}) {
  const result = await pool.query(
    `
      insert into whatsapp_workflows (
        user_id,
        name,
        recipient,
        message,
        send_delay_minutes,
        provider,
        status
      )
      values ($1, $2, $3, $4, $5, $6, 'draft')
      returning
        id,
        user_id as "userId",
        name,
        recipient,
        message,
        send_delay_minutes as "sendDelayMinutes",
        status,
        provider,
        provider_message_id as "providerMessageId",
        last_error as "lastError",
        scheduled_at as "scheduledAt",
        sent_at as "sentAt",
        created_at as "createdAt",
        updated_at as "updatedAt";
    `,
      [userId, name, recipient, message, sendDelayMinutes, provider]
  );

  return result.rows[0];
}

async function getWorkflowByIdAndUserId({ workflowId, userId }) {
  const result = await pool.query(
    `
      select
        id,
        user_id as "userId",
        name,
        recipient,
        message,
        send_delay_minutes as "sendDelayMinutes",
        status,
        provider,
        provider_message_id as "providerMessageId",
        last_error as "lastError",
        scheduled_at as "scheduledAt",
        sent_at as "sentAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
      from whatsapp_workflows
      where id = $1 and user_id = $2
      limit 1;
    `,
    [workflowId, userId]
  );

  return result.rows[0] || null;
}

async function markWorkflowDispatching({ workflowId, userId }) {
  const result = await pool.query(
    `
      update whatsapp_workflows
      set status = 'sending',
          last_error = null,
          updated_at = now()
      where id = $1 and user_id = $2
      returning
        id,
        user_id as "userId",
        name,
        recipient,
        message,
        send_delay_minutes as "sendDelayMinutes",
        status,
        provider,
        provider_message_id as "providerMessageId",
        last_error as "lastError",
        scheduled_at as "scheduledAt",
        sent_at as "sentAt",
        created_at as "createdAt",
        updated_at as "updatedAt";
    `,
    [workflowId, userId]
  );

  return result.rows[0] || null;
}

async function markWorkflowSent({ workflowId, userId, provider, providerMessageId }) {
  const result = await pool.query(
    `
      update whatsapp_workflows
      set status = 'sent',
          provider = $3,
          provider_message_id = $4,
          last_error = null,
          sent_at = now(),
          updated_at = now()
      where id = $1 and user_id = $2
      returning
        id,
        user_id as "userId",
        name,
        recipient,
        message,
        send_delay_minutes as "sendDelayMinutes",
        status,
        provider,
        provider_message_id as "providerMessageId",
        last_error as "lastError",
        scheduled_at as "scheduledAt",
        sent_at as "sentAt",
        created_at as "createdAt",
        updated_at as "updatedAt";
    `,
    [workflowId, userId, provider, providerMessageId]
  );

  return result.rows[0] || null;
}

async function markWorkflowFailed({ workflowId, userId, errorMessage }) {
  const result = await pool.query(
    `
      update whatsapp_workflows
      set status = 'failed',
          last_error = $3,
          updated_at = now()
      where id = $1 and user_id = $2
      returning
        id,
        user_id as "userId",
        name,
        recipient,
        message,
        send_delay_minutes as "sendDelayMinutes",
        status,
        provider,
        provider_message_id as "providerMessageId",
        last_error as "lastError",
        scheduled_at as "scheduledAt",
        sent_at as "sentAt",
        created_at as "createdAt",
        updated_at as "updatedAt";
    `,
    [workflowId, userId, errorMessage]
  );

  return result.rows[0] || null;
}

module.exports = {
  createWorkflowDraft,
  getWorkflowByIdAndUserId,
  markWorkflowDispatching,
  markWorkflowSent,
  markWorkflowFailed,
};