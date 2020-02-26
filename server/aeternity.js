const { Universal, Node, MemoryAccount } = require('@aeternity/aepp-sdk');

module.exports = class Aeternity {
  constructor () {
    this.init();
  }

  init = async () => {
    if (!this.client) {
      this.client = await Universal({
        nodes: [
          {
            name: 'mainnetNode',
            instance: await Node({
              url: process.env.NODE_URL,
              internalUrl: process.env.NODE_URL,
            }),
          }],
        accounts: [
          MemoryAccount({ keypair: { secretKey: process.env.PRIVATE_KEY, publicKey: process.env.PUBLIC_KEY } }),
        ],
      });
    }
  };

  getAddressFromChainName = async (names) => {
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
