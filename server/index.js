const OracleService = require('./oracleService');
const logger = require("./logger")(module);
const http = require('http');

process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at: Promise', p, 'reason:', reason.stack)
});

const main = async () => {
  const oracleService = new OracleService();
  await oracleService.init();
  await oracleService.register();
  await oracleService.startPolling();

  // Healthcheck
  http.createServer( (request, response) => {
    oracleService.isRunning().then(result => {
      response.writeHead(result ? 200 : 500);
    }).catch(e => {
      logger.error(e);
      response.writeHead(500);
    }).finally(() => {
      response.end();
    });
  }).listen(3000);
};

main();
