/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */
const {Universal, MemoryAccount, Node, Crypto} = require('@aeternity/aepp-sdk');
const Oracle = require('../server/oracleService.js');
const util = require('../server/util');

const ORACLE_SERVICE_CONTRACT_PATH = utils.readFileRelative('./contracts/OracleService.aes', 'utf-8');

const config = {
    url: 'http://localhost:3001/',
    internalUrl: 'http://localhost:3001/',
    compilerUrl: 'http://localhost:3080'
};

describe('Oracle Service Contract', () => {
    let contract, oracleServices;
    let numberOfOracles = 4;
    let firstOracleTtl = 20;

    before(async () => {
        client = await Universal({
            nodes: [{
                name: 'devnetNode',
                instance: await Node(config)
            }],
            accounts: [MemoryAccount({keypair: wallets[0]})],
            networkId: 'ae_devnet',
            compilerUrl: config.compilerUrl
        });

        const initializeOracleService = async (i, client) => {
            const keyPair = Crypto.generateKeyPair();
            await client.spend(10000000000000000, keyPair.publicKey);
            const oracleService = new Oracle();
            await oracleService.init(keyPair, i === numberOfOracles ? firstOracleTtl : 500, i !== numberOfOracles);
            await oracleService.register();
            await oracleService.startPolling();
            return oracleService;
        };

        // start required oracles plus one
        oracleServices = await util.range(1, numberOfOracles).asyncMap((i) => initializeOracleService(i, client));
    });

    after(async () => {
        oracleServices.map(oracleService => oracleService.stopPolling());
    });

    it('Deploying Oracle Service Contract', async () => {
        contract = await client.getContractInstance(ORACLE_SERVICE_CONTRACT_PATH);
        const init = await contract.methods.init(numberOfOracles - 1, wallets[0].publicKey);
        assert.equal(init.result.returnType, 'ok');
    });

    it('Oracle Service Contract: Add Oracles', async () => {
        await oracleServices.asyncMap(async (oracleService) => {
            const addOracle = await contract.methods.add_oracle(oracleService.oracle.id);
            assert.equal(addOracle.result.returnType, 'ok');
        });
    });

    it('Oracle Service: Await Expiry of first Oracle', async () => {
        await client.awaitHeight(oracleServices[oracleServices.length -1].oracle.ttl + 1);
    });

    it('Oracle Service Contract: Estimate Query Fee', async () => {
        const queryFee = await contract.methods.estimate_query_fee();
        assert.equal(queryFee.decodedResult, 20000000000000 * (numberOfOracles - 1));
    });

    it('Oracle Service Contract: Query Oracle', async () => {
        const queryFee = await contract.methods.estimate_query_fee();
        const queryOracle = await contract.methods.query_oracle("http://localhost:3001/sample-site.txt", wallets[0].publicKey, {amount: queryFee.decodedResult});
        assert.equal(queryOracle.result.returnType, 'ok');
        await new Promise((resolve) => setTimeout(() => resolve(), 2000));
    });

    it('Oracle Service Contract: Check Claim', async () => {
        const checkClaim = await contract.methods.check_persist_claim("http://localhost:3001/sample-site.txt", wallets[0].publicKey, false);
        assert.deepEqual(checkClaim.decodedResult, {success: true, percentage: 100, account: wallets[0].publicKey});
    });

    it('Oracle Service Contract: Check Claim with other Account', async () => {
        const checkClaim = await contract.methods.check_persist_claim("http://localhost:3001/sample-site.txt", wallets[1].publicKey, false).catch(e => e);
        assert.include(checkClaim.decodedError, "MORE_ORACLE_ANSWERS_REQUIRED");
    });

    it('Oracle Service Contract: Delete Oracle', async () => {
        const deleteOracle = await contract.methods.remove_oracle(1);
        assert.equal(deleteOracle.result.returnType, 'ok');

        const state = (await contract.methods.get_state()).decodedResult;
        assert.lengthOf(state.trusted_oracles, numberOfOracles - 1);

        const queryFee = await contract.methods.estimate_query_fee().catch(e => e);
        assert.include(queryFee.decodedError, "MORE_ORACLES_REQUIRED");
    });

    it('Oracle Service Contract: Set minimum amount of Oracles', async () => {
        const deleteOracle = await contract.methods.set_minimum_amount_of_oracles(numberOfOracles - 2);
        assert.equal(deleteOracle.result.returnType, 'ok');

        const queryFee = await contract.methods.estimate_query_fee();
        const queryOracle = await contract.methods.query_oracle("http://localhost:3001/sample-site.txt", wallets[0].publicKey, {amount: queryFee.decodedResult});
        assert.equal(queryOracle.result.returnType, 'ok');
    });
});
