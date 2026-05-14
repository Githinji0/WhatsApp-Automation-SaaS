const path = require("node:path");
const fs = require("node:fs");

const { Client, LocalAuth } = require("whatsapp-web.js");

const { env } = require("../config/env");
const { logger } = require("../config/logger");

let engine = null;
let engineState = {
  status: "idle",
  qr: null,
  ready: false,
  lastError: null,
  info: null,
};

function getSessionName() {
  return env.WHATSAPP_WEBJS_SESSION_NAME || "whatsapp-automation";
}

function getDataPath() {
  return path.resolve(process.cwd(), ".whatsapp-webjs");
}

function ensureDataPath() {
  fs.mkdirSync(getDataPath(), { recursive: true });
}

function updateState(patch) {
  engineState = {
    ...engineState,
    ...patch,
  };
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
  if (engine) {
    return engine;
  }

  engine = createEngine();
  updateState({ status: "starting", lastError: null });
  await engine.initialize();

  return engine;
}

async function sendMessage(recipient, message) {
  const client = await getWhatsappWebjsEngine();
  const numberId = `${String(recipient || "").replace(/[^\d]/g, "")}@c.us`;

  return client.sendMessage(numberId, message);
}

function getWhatsappWebjsStatus() {
  return engineState;
}

module.exports = {
  getWhatsappWebjsEngine,
  sendMessage,
  getWhatsappWebjsStatus,
};