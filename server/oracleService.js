const {Crypto} = require('@aeternity/aepp-sdk');
const Aeternity = require("./aeternity");
const PageParser = require("./pageParser");
const loggerF = require("./logger");
const logger = loggerF(module);

module.exports = class OracleService {

  constructor() {
    this.fundingAmount = 10000000000000000;
    this.ttl = 500;
    this.autoExtend = true;
  }

  init = async (keyPair = null, ttl = 500, autoExtend = true) => {
    this.ttl = ttl;
    this.autoExtend = autoExtend;
    this.aeternity = new Aeternity();
    await this.aeternity.init(keyPair);
    await this.aeternity.awaitFunding(this.fundingAmount);

    logger.debug("oracle client initialized with ttl:", this.ttl, "auto extend:", this.autoExtend);
  };

  register = async (queryFee = 20000000000000) => {
    if (!this.aeternity.client) throw "Client not initialized";

    if (!this.oracle) this.oracle = await this.aeternity.client.getOracleObject(this.aeternity.keypair.publicKey.replace('ak_', 'ok_')).catch(() => null);
    if (!this.oracle) this.oracle = await this.aeternity.client.registerOracle("string", "string", {
      queryFee: queryFee,
      oracleTtl: {type: 'delta', value: this.ttl}
    });

    logger.info("oracle id", this.oracle.id);

    if (this.autoExtend) {
      this.extendIfNeeded();
      this.extendIfNeededInterval = setInterval(() => {
        this.extendIfNeeded();
      }, (this.ttl / 5) * (60 / 3) * 1000); // every ttl/5 blocks
    }
  };

  extendIfNeeded = async () => {
    logger.debug("checking to extend oracle");
    const height = await this.aeternity.client.height();

    if (height > this.oracle.ttl - this.ttl / 5) {
      this.oracle = await this.oracle.extendOracle({type: 'delta', value: this.ttl});
      logger.debug("extended oracle at height:", height, "new ttl:", this.oracle.ttl);
    } else {
      logger.debug("no need to extend oracle at height:", height, "ttl:", this.oracle.ttl);
    }
  };

  startPolling = async () => {
    if (!this.aeternity.client) throw "Client not initialized";

    this.stopPollQueries = await this.oracle.pollQueries(this.respond, {interval: 2000});
    logger.debug("oracle query polling started")
  };

  respond = async (queries) => {
    let query = Array.isArray(queries) ? queries.sort((a, b) => a.ttl - b.ttl)[queries.length - 1] : queries;
    if (!query || query.response !== "or_Xfbg4g==") return; //return early on no or non-empty response;

    const responseLogger = loggerF(module, query.id);

    const queryString = String(Crypto.decodeBase64Check(query.query.slice(3)));
    const queryArgument = queryString.split(";");
    responseLogger.info("oracle got query", queryString);

    const expectedAddress = queryArgument.shift();
    const url = queryArgument.join(";");
    const parseResult = await new PageParser(this.aeternity, query.id).getAddressFromPage(expectedAddress, url);

    if (parseResult) {
      responseLogger.info("oracle will respond", parseResult);
      await this.oracle.respondToQuery(query.id, parseResult, {responseTtl: {type: 'delta', value: 20}});
    } else {
      responseLogger.info("oracle will not respond, no result found in page")
    }

  };

  stopPolling = () => {
    if (this.stopPollQueries) this.stopPollQueries();
    if (this.extendIfNeededInterval) clearInterval(this.extendIfNeededInterval);
    logger.info("oracle query polling stopped");
  };
};

