const {Universal, MemoryAccount, Node} = require('@aeternity/aepp-sdk');
const fs = require('fs');
const path = require('path');
const ORACLE_SERVICE_CONTRACT = fs.readFileSync(path.join(__dirname, '../contracts/OracleService.aes'), 'utf-8');

const keypair = {
  secretKey: "",
  publicKey: ""
};

const config = {
  url: 'https://testnet.aeternity.io/',
  internalUrl: 'https://testnet.aeternity.io/',
  compilerUrl: 'https://latest.compiler.aepps.com'
};

const getClient = async () => {
  return Universal({
    nodes: [{
      name: 'testnet',
      instance: await Node(config)
    }],
    accounts: [MemoryAccount({keypair: keypair})],
    networkId: 'ae_uat',
    compilerUrl: config.compilerUrl
  });
};

const deploy = async () => {
  const client = await getClient();
  contract = await client.getContractInstance(ORACLE_SERVICE_CONTRACT);

  const init = await contract.methods.init(1, keypair.publicKey);
  console.log(init);
  return init;
};

const getState = async (contractAddress) => {
  const client = await getClient();
  contract = await client.getContractInstance(ORACLE_SERVICE_CONTRACT, {contractAddress});

  const state = await contract.methods.get_state();
  console.log(JSON.stringify(state.decodedResult, null, 2));
};


const addOracle = async (contractAddress, oracleId) => {
  const client = await getClient();
  contract = await client.getContractInstance(ORACLE_SERVICE_CONTRACT, {contractAddress});

  const oracle = await contract.methods.add_oracle(oracleId);
  console.log(oracle);
};

const main = async () => {
  //const init = await deploy();
  //await addOracle(init.result.contractId, "ok_V3qADaNf3rUnPBTY3kNBDZM6sf5m26HeTpZejeTjbYr7HK63h");
  //getState("ct_4J8gn4wp55fKZiJPJAzvfHiMk9eLs8M5XsLVQgLEPnCvNqxiQ")
};

main();

