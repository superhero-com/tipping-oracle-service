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
  http.createServer( (req, res) => {
    oracleService.isRunning().then(result => {
      res.writeHead(result ? 200 : 500);
      res.end(result ? "OK" : "NOT RUNNING");
    }).catch(e => {
      logger.error(e);
      res.writeHead(500);
      res.end(e);
    });
  }).listen(3000);
};

main();
