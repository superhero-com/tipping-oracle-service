const winston = require('winston');
const path = require('path');

const logger = (module) => {
  const fileName = path.basename(module.id, '.js');
  return winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.colorize(),
      winston.format.printf(msg => {
        const splatMsg = msg[Symbol.for('splat')] ? msg[Symbol.for('splat')].join(" ") : "";
        return `[${msg.timestamp}] (${fileName}) ${msg.level}: ${msg.message} ${splatMsg} `
      })
    ),
    transports: [
      new winston.transports.Console()
    ]
  });
}

module.exports = logger;
