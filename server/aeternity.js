const {Universal, Node, MemoryAccount, Crypto} = require('@aeternity/aepp-sdk');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');
const BigNumber = require("bignumber.js");

const util = require("./util");

const config = {
  url: 'http://localhost:3001/',
  internalUrl: 'http://localhost:3001/',
  compilerUrl: 'http://localhost:3080'
};

module.exports = class Aeternity {

  init = async (keyPair) => {
    if (!this.client) {
      this.keypair = this.getKeyPair(keyPair);
      this.client = await Universal({
        nodes: [
          {
            name: 'mainnetNode',
            instance: await Node({
              url: process.env.NODE_URL || config.url,
              internalUrl: process.env.NODE_URL || config.internalUrl,
            }),
          }],
        accounts: [MemoryAccount({keypair: this.keypair})],
      });
    }
  };

  getKeyPair = (defaultKeyPair) => {
    if (defaultKeyPair) return defaultKeyPair;

    const keypairFile = path.resolve(__dirname, "../.data/keypair.json");
    const persisted = fs.existsSync(keypairFile);
    if (persisted) {
      return JSON.parse(fs.readFileSync(keypairFile), "utf-8");
    } else {
      const keypair = Crypto.generateKeyPair();
      fs.writeFileSync(keypairFile, JSON.stringify(keypair), "utf-8");
      return keypair;
    }
  };

  awaitFunding = async (fundingAmount) => {
    if (!this.client) throw "Client not initialized";

    if (new BigNumber(await this.client.getBalance(this.keypair.publicKey)).isLessThan(fundingAmount)) {
      qrcode.generate(this.keypair.publicKey, {small: true});
      console.log("Fund Oracle Service Wallet", this.keypair.publicKey, util.atomsToAe(fundingAmount).toFixed(), "AE");
      await new Promise(resolve => {
        const interval = setInterval(async () => {
          if (new BigNumber(await this.client.getBalance(this.keypair.publicKey)).isGreaterThanOrEqualTo(fundingAmount)) {
            console.log("received funding");
            resolve(true);
            clearInterval(interval);
          }
        }, 1000);
      });
    }
  };

  getAddressFromChainName = async (names) => {
    if (!this.client) throw "Client not initialized";

    return (await Promise.all(names.map(async n => {
      try {
        const queryResult = await this.client.aensQuery(n);
        return queryResult.pointers.length > 0 ? queryResult.pointers[0].id : null;
      } catch (err) {
        if (err.message.includes('failed with 404: Name not found')) {
          return null;
        } else throw new Error(err);
      }

    }))).filter(value => !!value);
  };
};