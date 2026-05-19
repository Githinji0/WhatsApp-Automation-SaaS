const path = require("node:path");
const fs = require("node:fs");
const { execFileSync } = require("node:child_process");

const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

const { env } = require("../config/env");
const { logger } = require("../config/logger");

let engine = null;
let engineInitPromise = null;
let engineState = {
  status: "idle",
  qr: null,
  ready: false,
  lastError: null,
  info: null,
};

const READY_WAIT_TIMEOUT_MS = 30000;
const BROWSER_LOCK_RECOVERY_RETRIES = 3;
const BROWSER_LOCK_RECOVERY_DELAY_MS = 1500;

let reconnectState = {
  attempts: 0,
  lastAttempt: null,
};

function getSessionName() {
  return env.WHATSAPP_WEBJS_SESSION_NAME || "whatsapp-automation";
}

function getDataPath() {
  return path.resolve(process.cwd(), ".whatsapp-webjs");
}

function getSessionPath() {
  return path.join(getDataPath(), `session-${getSessionName()}`);
}

function ensureDataPath() {
  fs.mkdirSync(getDataPath(), { recursive: true });
}

function clearStaleSessionArtifacts() {
  const sessionPath = getSessionPath();
  const staleNames = [
    "SingletonCookie",
    "SingletonLock",
    "SingletonSocket",
    "DevToolsActivePort",
  ];

  for (const name of staleNames) {
    const targetPath = path.join(sessionPath, name);

    try {
      if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { force: true, recursive: true });
      }
    } catch (error) {
      logger.warn("whatsapp.webjs.clear_stale_artifact_failed", {
        path: targetPath,
        message: error?.message,
      });
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function killProcessesUsingSessionPath() {
  const sessionPath = getSessionPath().replace(/'/g, "''");
  const script = [
    `$pattern = '*${sessionPath}*'`,
    "$processes = Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like $pattern }",
    "$processes | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }",
  ].join("; ");

  try {
    execFileSync("powershell.exe", ["-NoProfile", "-Command", script], {
      stdio: "ignore",
    });
  } catch (error) {
    logger.warn("whatsapp.webjs.kill_stale_processes_failed", {
      message: error?.message,
    });
  }
}

async function recoverFromBrowserLock() {
  killProcessesUsingSessionPath();
  clearStaleSessionArtifacts();
  await sleep(BROWSER_LOCK_RECOVERY_DELAY_MS);
}

function isBrowserAlreadyRunningError(error) {
  const message = String(error?.message || "").toLowerCase();

  return (
    message.includes("browser is already running") ||
    message.includes("user data directory is already in use") ||
    message.includes("singletonlock") ||
    message.includes("singletonsocket")
  );
}

function updateState(patch) {
  engineState = {
    ...engineState,
    ...patch,
  };
}

async function destroyEngine() {
  if (engine) {
    try {
      await engine.destroy();
    } catch (e) {
      logger.warn("whatsapp.webjs.destroy_failed", { message: e?.message });
    }
    engine = null;
    updateState({ status: "idle", ready: false });
  }
}

async function reconnectWhatsappWebjs({ maxRetries = 5, backoffBaseMs = 1000 } = {}) {
  reconnectState.attempts = 0;
  reconnectState.lastAttempt = Date.now();

  updateState({ status: "reconnecting", lastError: null });

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    reconnectState.attempts = attempt;
    reconnectState.lastAttempt = Date.now();

    try {
      await destroyEngine();
      await recoverFromBrowserLock();

      engine = createEngine();
      updateState({ status: "starting", lastError: null });

      await engine.initialize();
      try {
        await waitForReady(15000);
      } catch (error) {
        if (!isQrRequiredServiceError(error)) {
          throw error;
        }

        // QR-required is a valid intermediate reconnect state.
        return engine;
      }

      // success
      reconnectState.attempts = attempt;
      updateState({ status: "ready", ready: true, lastError: null });
      return engine;
    } catch (err) {
      lastError = err;
      const message = err?.message || String(err);
      logger.warn("whatsapp.webjs.reconnect_attempt_failed", { attempt, message });
      updateState({ status: "reconnecting", ready: false, lastError: message });

      if (isBrowserAlreadyRunningError(err)) {
        killProcessesUsingSessionPath();
        clearStaleSessionArtifacts();
      }

      const delay = backoffBaseMs * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // All attempts failed
  const finalMessage = lastError?.message || "reconnect failed";
  updateState({ status: "error", ready: false, lastError: finalMessage });
  throw createServiceUnavailableError(
    "WhatsApp WebJS session failed to reconnect. Start or re-authenticate the session, then retry.",
    finalMessage
  );
}

function createServiceUnavailableError(message, details) {
  const error = new Error(message);
  error.statusCode = 503;
  error.code = "SERVICE_UNAVAILABLE";

  if (details) {
    error.details = details;
  }

  return error;
}

function isQrRequiredServiceError(error) {
  return error?.code === "SERVICE_UNAVAILABLE" && error?.details === "qr_required";
}

function isTransientSendError(error) {
  const message = String(error?.message || "").toLowerCase();

  return (
    message.includes("execution context was destroyed") ||
    message.includes("execution context not available") ||
    message.includes("callfunctionon") ||
    message.includes("target closed") ||
    message.includes("protocolerror")
  );
}

function isTransientInitializeError(error) {
  const message = String(error?.message || "").toLowerCase();

  return (
    message.includes("execution context was destroyed") ||
    message.includes("execution context not available") ||
    message.includes("target closed") ||
    message.includes("protocolerror") ||
    message.includes("callfunctionon")
  );
}

async function waitForReady(timeoutMs = READY_WAIT_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (engineState.ready && engine) {
      return engine;
    }

    if (engineState.status === "qr_required") {
      throw createServiceUnavailableError(
        "WhatsApp WebJS session requires QR re-authentication. Scan the QR code or restart the session, then retry.",
        engineState.qr ? "qr_required" : engineState.status
      );
    }

    if (["auth_failure", "disconnected", "error"].includes(engineState.status)) {
      throw createServiceUnavailableError(
        "WhatsApp WebJS session is not ready. Re-authenticate or restart the session, then try again.",
        engineState.lastError || engineState.status
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw createServiceUnavailableError(
    "WhatsApp WebJS session did not become ready in time. Check the session status and try again.",
    engineState.lastError || engineState.status
  );
}

function createEngine() {
  ensureDataPath();

  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: getSessionName(),
      dataPath: getDataPath(),
    }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
    logger.info("whatsapp.webjs.qr", { hasQr: Boolean(qr) });
    updateState({
      status: "qr_required",
      qr,
      ready: false,
      lastError: null,
    });
  });

  client.on("authenticated", () => {
    logger.info("whatsapp.webjs.authenticated");
    updateState({
      status: "authenticated",
      qr: null,
      lastError: null,
    });
  });

  client.on("ready", () => {
    logger.info("whatsapp.webjs.ready");
    updateState({
      status: "ready",
      ready: true,
      qr: null,
      lastError: null,
      info: {
        sessionName: getSessionName(),
      },
    });
  });

  client.on("auth_failure", (message) => {
    logger.warn("whatsapp.webjs.auth_failure", { message });
    updateState({
      status: "auth_failure",
      ready: false,
      lastError: message,
    });
  });

  client.on("disconnected", (reason) => {
    logger.warn("whatsapp.webjs.disconnected", { reason });
    updateState({
      status: "disconnected",
      ready: false,
      lastError: reason,
    });
  });

  return client;
}

async function getWhatsappWebjsEngine() {
  if (engine && engineState.ready) {
    return engine;
  }

  if (!engineInitPromise) {
    engineInitPromise = (async () => {
      if (!engine) {
        engine = createEngine();
      }

      updateState({ status: "starting", lastError: null });

      try {
        await engine.initialize();
      } catch (error) {
        logger.warn("whatsapp.webjs.initialize_failed", {
          message: error?.message,
          stack: error?.stack,
        });

        if (isBrowserAlreadyRunningError(error)) {
          logger.warn("whatsapp.webjs.initialize_stale_browser", {
            message: error.message,
          });

          await destroyEngine();
          let retryError = error;

          for (let attempt = 1; attempt <= BROWSER_LOCK_RECOVERY_RETRIES; attempt++) {
            await recoverFromBrowserLock();

            try {
              engine = createEngine();
              await engine.initialize();
              break;
            } catch (innerError) {
              retryError = innerError;

              if (!isBrowserAlreadyRunningError(innerError) || attempt === BROWSER_LOCK_RECOVERY_RETRIES) {
                updateState({
                  status: "error",
                  ready: false,
                  lastError: innerError.message,
                });

                engine = null;

                throw createServiceUnavailableError(
                  "WhatsApp WebJS session failed to initialize. Start or re-authenticate the session, then retry.",
                  innerError.message
                );
              }
            }
          }
        } else if (isTransientInitializeError(error)) {
          logger.warn("whatsapp.webjs.initialize_retryable", {
            message: error.message,
          });

          await destroyEngine();
          await recoverFromBrowserLock();

          try {
            engine = createEngine();
            await engine.initialize();
          } catch (retryError) {
            updateState({
              status: "error",
              ready: false,
              lastError: retryError.message,
            });

            engine = null;

            throw createServiceUnavailableError(
              "WhatsApp WebJS session failed to initialize. Start or re-authenticate the session, then retry.",
              retryError.message
            );
          }
        } else {
          updateState({
            status: "error",
            ready: false,
            lastError: error.message,
          });

          engine = null;

          throw createServiceUnavailableError(
            "WhatsApp WebJS session failed to initialize. Start or re-authenticate the session, then retry.",
            error.message
          );
        }
      }

      return engine;
    })().finally(() => {
      engineInitPromise = null;
    });
  }

  await engineInitPromise;
  await waitForReady();

  return engine;
}

async function sendMessage(recipient, message) {
  const digits = String(recipient || "").replace(/[^\d]/g, "");

  if (!digits) {
    const error = new Error("recipient must include at least one digit");
    error.statusCode = 400;
    error.code = "BAD_REQUEST";
    throw error;
  }

  const client = await getWhatsappWebjsEngine();
  const numberId = `${digits}@c.us`;

  if (typeof client.isRegisteredUser === "function") {
    const isRegisteredUser = await client.isRegisteredUser(numberId);

    if (!isRegisteredUser) {
      const error = new Error("Recipient number is not registered on WhatsApp");
      error.statusCode = 400;
      error.code = "BAD_REQUEST";
      throw error;
    }
  }

  try {
    return await client.sendMessage(numberId, message);
  } catch (error) {
    if (!isTransientSendError(error)) {
      throw error;
    }

    logger.warn("whatsapp.webjs.send.retry", {
      recipient: digits,
      error: error.message,
    });

    try {
      return await client.sendMessage(numberId, message);
    } catch (retryError) {
      throw createServiceUnavailableError(
        "WhatsApp WebJS send failed after retry. Reconnect the session and try again.",
        retryError.message
      );
    }
  }
}

function getWhatsappWebjsStatus() {
  return engineState;
}

function ensureWhatsappWebjsSessionStarted() {
  if (engine || engineInitPromise) {
    return;
  }

  void getWhatsappWebjsEngine().catch((error) => {
    if (isQrRequiredServiceError(error)) {
      return;
    }

    logger.warn("whatsapp.webjs.ensure_started_failed", {
      message: error?.message,
      details: error?.details,
    });
  });
}

module.exports = {
  getWhatsappWebjsEngine,
  sendMessage,
  getWhatsappWebjsStatus,
  reconnectWhatsappWebjs,
  ensureWhatsappWebjsSessionStarted,
};