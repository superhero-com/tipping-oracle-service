const {Crypto} = require('@aeternity/aepp-sdk');
const Aeternity = require("./aeternity");
const PageParser = require("./pageParser");

module.exports = class OracleService {

  constructor() {
    this.fundingAmount = 50000000000000;
  }

  init = async (keyPair = null) => {
    this.aeternity = new Aeternity();
    await this.aeternity.init(keyPair);
    await this.aeternity.awaitFunding(this.fundingAmount);

    this.pageParser = new PageParser(this.aeternity);

    console.log("Oracle Client initialized");
  };

  register = async (queryFee = 20000000000000) => {
    if (!this.aeternity.client) throw "Client not initialized";

    this.oracle = await this.aeternity.client.registerOracle("string", "string", {queryFee: queryFee});
    console.log("Oracle registered", this.oracle.id);
  };

  startPolling = async () => {
    if (!this.aeternity.client) throw "Client not initialized";

    //if (!this.oracle) this.oracle = await this.aeternity.client.getOracleObject('ok_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk');
    this.stopPollQueries = await this.oracle.pollQueries(this.respond, {interval: 2000});
    console.log("Oracle Polling started")
  };

  respond = async (queries) => {
    let query = Array.isArray(queries) ? queries.sort((a, b) => a.ttl - b.ttl)[queries.length - 1] : queries;
    if (!query) return;

    const queryArgument = String(Crypto.decodeBase64Check(query.query.slice(3)));
    const parseResult = await this.pageParser.getAddressesFromPage(queryArgument);
    console.log("Oracle Respond: got query", queryArgument);
    console.log("Oracle Respond: will respond", parseResult[0]);

    await this.oracle.respondToQuery(query.id, parseResult[0], {responseTtl: {type: 'delta', value: 20}});
  };

  stopPolling = () => {
    if (this.stopPollQueries) this.stopPollQueries();
    console.log("Oracle Polling stopped");
  };
};

