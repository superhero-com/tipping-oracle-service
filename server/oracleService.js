const {Universal, MemoryAccount, Node, Crypto} = require('@aeternity/aepp-sdk');

module.exports = class OracleService {
    config = {
        url: 'http://localhost:3001/',
        internalUrl: 'http://localhost:3001/',
        compilerUrl: 'http://localhost:3080'
    };

    client;
    oracle;
    mockOracleResponse;

    constructor(mockOracleResponse) {
        this.mockOracleResponse = mockOracleResponse;
    }

    init = async (keyPair) => {
        this.client = await Universal({
            nodes: [{
                name: 'devnetNode',
                instance: await Node(this.config)
            }],
            accounts: [MemoryAccount({
                keypair: keyPair
            })],
            networkId: 'ae_devnet',
            compilerUrl: this.config.compilerUrl
        });

        console.log("Oracle Client initialized");
    };

    register = async (queryFee) => {
        if (!this.client) throw "Client not initialized";

        this.oracle = await this.client.registerOracle("string", "string", {queryFee: queryFee});
        console.log("Oracle registered");
    };

    startPolling = async () => {
        if (!this.client) throw "Client not initialized";

        if (!this.oracle) this.oracle = await this.client.getOracleObject('ok_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk');
        this.oracle.pollQueries(this.respond, {interval: 2000});
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
        await this.oracle.respondToQuery(query.id, this.mockOracleResponse);
        console.log("Oracle Respond: Responded");
        this.client.pollForQueryResponse(this.oracle.id, query.id, {attempts: 200, interval: 500}).then(response => {
            console.log("Oracle Respond: got response")
        });
    };

    stopPolling = () => {
        console.log("Oracle Polling stopped");
        process.exit(0);
    };
};

