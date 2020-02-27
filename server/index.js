const OracleService = require('./oracleService');

const main = async () => {
  const oracleService = new OracleService();
  await oracleService.init();
  await oracleService.register();
  await oracleService.startPolling();
};

main();
