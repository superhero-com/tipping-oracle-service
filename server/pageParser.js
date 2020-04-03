const SnippetLoader = require('./snippetLoader');
const DomLoader = require("./domLoader");
const Aeternity = require("./aeternity");

module.exports = class PageParser {

  constructor(aeternity = null) {
    this.snippetLoader = new SnippetLoader();
    this.aeternity = aeternity ? aeternity : new Aeternity();
  }

  async getAddressFromPage(expectedAddress, originalUrl) {
    const {url, domSelector} = this.snippetLoader.getExtractionForUrl(originalUrl);
    const {result} = await DomLoader.getHTMLfromURL(url, domSelector);
    if (!result) throw Error("html/selector result loading failed");

    const snippets = this.snippetLoader.getSnippetForURL(url);

    const addresses = await snippets.reduce(async (promiseAcc, {domRegex}) => {
      const acc = await promiseAcc;
      const matches = result.match(new RegExp(domRegex, "g"));
      const uniqueMatches = [...new Set(matches)];

      const nameResolvedMatches = matches && domRegex.includes('\.chain') ? await this.aeternity.getAddressFromChainName(uniqueMatches) : uniqueMatches;

      return nameResolvedMatches ? acc.concat(nameResolvedMatches) : acc;
    }, []);

    if (addresses.length) {
      const foundExpectedAddress = addresses.find(address => address === expectedAddress);
      return foundExpectedAddress ? foundExpectedAddress : addresses[0];
    } else {
      return null;
    }
  }
};
