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

const initializeOracleService = async (client, mockOracleResponse) => {
    const keyPair = Crypto.generateKeyPair();
    await client.spend(2000000000000000, keyPair.publicKey);

    const oracleService = new Oracle(mockOracleResponse);
    await oracleService.init(keyPair);
    await oracleService.register(50000);
    await oracleService.startPolling();
    return oracleService;
};

describe('Oracle Service Contract', () => {
    let contract, oracleServices;
    let numberOfOracles = 3;

    before(async () => {
        client = await Universal({
            nodes: [{
                name: 'devnetNode',
                instance: await Node(config)
            }],
            accounts: [MemoryAccount({
                keypair: wallets[0]
            })],
            networkId: 'ae_devnet',
            compilerUrl: config.compilerUrl
        });

        oracleServices = await util.range(1, numberOfOracles).asyncMap(() => initializeOracleService(client, wallets[0].publicKey));
    });

    after(async () => {
        oracleServices.map(oracleService => oracleService.stopPolling());
    });

    it('Deploying Oracle Service Contract', async () => {
        contract = await client.getContractInstance(ORACLE_SERVICE_CONTRACT_PATH);
        const init = await contract.methods.init(numberOfOracles);
        assert.equal(init.result.returnType, 'ok');
    });

    it('Oracle Service Contract: Add Oracles', async () => {
        await oracleServices.asyncMap(async (oracleService) => {
            const addOracle = await contract.methods.add_oracle(oracleService.oracle.id);
            assert.equal(addOracle.result.returnType, 'ok');
        });
    });

    it('Oracle Service Contract: Estimate Query Fee', async () => {
        const queryFee = await contract.methods.estimate_query_fee();
        assert.equal(queryFee.decodedResult, 50000 * numberOfOracles);
    });

    it('Oracle Service Contract: Query Oracle', async () => {
        const queryFee = await contract.methods.estimate_query_fee();
        const queryOracle = await contract.methods.query_oracle("https://example.com", {amount: queryFee.decodedResult});
        assert.deepEqual(queryOracle.decodedResult.map(([id, _]) => id).sort(), oracleServices.map(oracleService => oracleService.oracle.id).sort());
        await new Promise((resolve) => setTimeout(() => resolve(), 2000));
    });

    it('Oracle Service Contract: Check Oracle Answers', async () => {
        const oracleAnswers = await contract.methods.check_oracle_answers("https://example.com");
        assert.equal(oracleAnswers.decodedResult.length, numberOfOracles);
        assert.equal(oracleAnswers.decodedResult.every(x => x), true);
    });

    it('Oracle Service Contract: Check Claim', async () => {
        const checkClaim = await contract.methods.check_claim("https://example.com");
        assert.equal(checkClaim.decodedResult, true);
    });
});
