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
    let contract, oracleService;

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

        oracleService = await initializeOracleService(client, wallets[0].publicKey);
    });

    after(async () => {
        oracleService.stopPolling();
    });

    it('Deploying Oracle Service Contract', async () => {
        contract = await client.getContractInstance(ORACLE_SERVICE_CONTRACT_PATH);
        const init = await contract.methods.init();
        assert.equal(init.result.returnType, 'ok');
    })

});
