function formatLog(level, event, data = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...data,
  });
}

const logger = {
  info(event, data) {
    process.stdout.write(`${formatLog("info", event, data)}\n`);
  },
  warn(event, data) {
    process.stdout.write(`${formatLog("warn", event, data)}\n`);
  },
  error(event, data) {
    process.stderr.write(`${formatLog("error", event, data)}\n`);
  },
};

module.exports = {
  logger,
};
