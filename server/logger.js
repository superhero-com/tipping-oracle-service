const winston = require('winston');
const path = require('path');

const logger = (module, contextInfo = null) => {
  const fileName = path.basename(module.id, '.js');
  const contextMsg = contextInfo ? `${fileName}, ${contextInfo.substr(contextInfo.length - 5)}` : fileName;

  return winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.colorize(),
      winston.format.printf(msg => {
        const splatMsg = msg[Symbol.for('splat')] ? msg[Symbol.for('splat')].join(" ") : "";
        return `[${msg.timestamp}] (${contextMsg}) ${msg.level}: ${msg.message} ${splatMsg} `
      })
    ),
    transports: [
      new winston.transports.Console()
    ]
  });
}

module.exports = logger;
