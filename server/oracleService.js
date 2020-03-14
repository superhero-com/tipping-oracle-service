const {Crypto} = require('@aeternity/aepp-sdk');
const Aeternity = require("./aeternity");
const PageParser = require("./pageParser");

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
    this.pageParser = new PageParser(this.aeternity);

    console.log("Oracle Client initialized ttl:", this.ttl, "auto extend:", this.autoExtend);
  };

  register = async (queryFee = 20000000000000) => {
    if (!this.aeternity.client) throw "Client not initialized";

    if (!this.oracle) this.oracle = await this.aeternity.client.getOracleObject(this.aeternity.keypair.publicKey.replace('ak_', 'ok_')).catch(() => null);
    if (!this.oracle) this.oracle = await this.aeternity.client.registerOracle("string", "string", {
      queryFee: queryFee,
      oracleTtl: {type: 'delta', value: this.ttl}
    });

    if (this.autoExtend) {
      this.extendIfNeeded();
      this.extendIfNeededInterval = setInterval(() => {
        this.extendIfNeeded();
      }, (this.ttl / 5) * 3 * 60 * 1000); // every ttl/5 blocks
    }
    console.log("Oracle Id", this.oracle.id);
  };

  extendIfNeeded = async () => {
    const height = await this.aeternity.client.height();

    if (height > this.oracle.ttl - this.ttl / 5) {
      this.oracle = await this.oracle.extendOracle({type: 'delta', value: this.ttl});
      console.log("Extended Oracle at height:", height, "new ttl:", this.oracle.ttl);
    }
  };

  startPolling = async () => {
    if (!this.aeternity.client) throw "Client not initialized";

    this.stopPollQueries = await this.oracle.pollQueries(this.respond, {interval: 2000});
    console.log("Oracle Polling started")
  };

  respond = async (queries) => {
    let query = Array.isArray(queries) ? queries.sort((a, b) => a.ttl - b.ttl)[queries.length - 1] : queries;
    if (!query) return;

    const queryArgument = String(Crypto.decodeBase64Check(query.query.slice(3))).split(";");
    console.log("Oracle Respond: got query", JSON.stringify(queryArgument));

    const expectedAddress = queryArgument.shift();
    const url = queryArgument.join(";");
    const parseResult = await this.pageParser.getAddressFromPage(expectedAddress, url);

    if (parseResult) {
      console.log("Oracle Respond: will respond", parseResult);
      await this.oracle.respondToQuery(query.id, parseResult, {responseTtl: {type: 'delta', value: 20}});
    } else {
      console.log("Oracle will not respond, no result found in page")
    }

  };

  stopPolling = () => {
    if (this.stopPollQueries) this.stopPollQueries();
    if (this.extendIfNeededInterval) clearInterval(this.extendIfNeededInterval);
    console.log("Oracle Polling stopped");
  };
};

