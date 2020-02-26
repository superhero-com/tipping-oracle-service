const {Universal, MemoryAccount, Node, Crypto} = require('@aeternity/aepp-sdk');
const Aeternity = require("./aeternity");

module.exports = class OracleService {

  constructor(mockOracleResponse) {
    this.mockOracleResponse = mockOracleResponse;
    this.fundingAmount = 50000000000000;
  }

  init = async (keyPair = null) => {
    this.aeternity = new Aeternity();
    await this.aeternity.init(keyPair);
    await this.aeternity.awaitFunding(this.fundingAmount);

    console.log("Oracle Client initialized");
  };

  register = async (queryFee) => {
    if (!this.aeternity.client) throw "Client not initialized";

    this.oracle = await this.aeternity.client.registerOracle("string", "string", {queryFee: queryFee});
    console.log("Oracle registered");
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
    console.log("Oracle Respond: got query");

    //const queryObject = await this.oracle.getQuery(query.id);
    //console.log(queryObject);
    //console.log("decoded query", String(Crypto.decodeBase64Check(query.query.slice(3))));
    //console.log("decoded response", String(Crypto.decodeBase64Check(query.response.slice(3))));
    //estimate fee 17792000000000
    await this.oracle.respondToQuery(query.id, this.mockOracleResponse, {responseTtl: {type: 'delta', value: 20}});
    this.aeternity.client.pollForQueryResponse(this.oracle.id, query.id, {attempts: 200, interval: 500}).then(response => {
      console.log("Oracle Respond: got response")
    });
  };

  stopPolling = () => {
    if (this.stopPollQueries) this.stopPollQueries();
    console.log("Oracle Polling stopped");
  };
};

