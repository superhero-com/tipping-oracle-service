const OracleService = require('./oracleService');
const logger = require("./logger")(module);

process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at: Promise', p, 'reason:', reason.stack)
});

const main = async () => {
  const oracleService = new OracleService();
  await oracleService.init();
  await oracleService.register();
  await oracleService.startPolling();
};

main();
