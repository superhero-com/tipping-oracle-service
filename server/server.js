const Universal = require('@aeternity/aepp-sdk').Universal;
const MemoryAccount = require('@aeternity/aepp-sdk').MemoryAccount;
const Node = require('@aeternity/aepp-sdk').Node;
const Crypto = require('@aeternity/aepp-sdk').Crypto;

const URL = 'https://testnet.aeternity.art/';
let client, oracle;
async function main() {
  client = await Universal({
    nodes: [
      {
        name: 'someNode',
        instance: await Node({url: URL, internalUrl: URL})
      },
    ],
    compilerUrl: URL,
    accounts: [
      MemoryAccount({
        keypair: {
          secretKey: '7c6e602a94f30e4ea7edabe4376314f69ba7eaa2f355ecedb339df847b6f0d80575f81ffb0a297b7725dc671da0b1769b1fc5cbe45385c7b5ad1fc2eaf1d609d',
          publicKey: 'ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk'
        }
      })
    ],
    address: 'ak_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk',
    networkId: 'ae_uat' // or any other networkId your client should connect to
  });
  console.log("Client initialized");

  oracle = await client.getOracleObject('ok_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk');

  oracle.pollQueries( respond, {interval: 1000});
  //await oracle.postQuery('hello');

  //const result = await client.registerOracle("string", "string");
}

async function respond(queries) {
  console.dir(queries);
  let query = Array.isArray(queries) ? queries[0] : queries;
  console.log("Got Query");
  console.dir(query);

  //const queryObject = await client.getQueryObject('ok_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk', query.id);
  const queryObject = await oracle.getQuery(query.id);
  console.log(queryObject)
  console.log("decoded query", String(Crypto.decodeBase64Check(query.query.slice(3))));
  console.log("decoded response", String(Crypto.decodeBase64Check(query.response.slice(3))));
  await oracle.respondToQuery(query.id, "world");
  console.log("Responded");
  client.pollForQueryResponse('ok_fUq2NesPXcYZ1CcqBcGC3StpdnQw3iVxMA3YSeCNAwfN4myQk', query.id,{attempts: 200, interval: 500})
    .then(response => {
      console.log("got response", response)
    });
}

main();

