const SnippetLoader = require('./snippetLoader');
const DomLoader = require("./domLoader");
const Aeternity = require("./aeternity");
const logger = require("./logger")(module);

module.exports = class PageParser {

  constructor(aeternity = null) {
    this.snippetLoader = new SnippetLoader();
    this.aeternity = aeternity ? aeternity : new Aeternity();
  }

  async getAddressFromPage(expectedAddress, originalUrl) {
    let matched;
    try {
      let {result, snippets} = await this.getResultAndSnippetDomSelector(originalUrl);
      matched = await this.matchAddress(expectedAddress, result, snippets);
    } catch (e) {
      logger.error("fallbackOriginal:", e);
    }

    if (matched) {
      logger.info("matched", originalUrl, matched);
      return matched;
    } else {
      let {result, snippets} = await this.getResultAndSnippet(originalUrl);
      const fallbackOriginal = await this.matchAddress(expectedAddress, result, snippets);
      logger.info("fallbackOriginal", originalUrl, fallbackOriginal);
      return fallbackOriginal;
    }
  }

  async getResultAndSnippet(url){
    const {result} = await DomLoader.getHTMLfromURL(url);
    if (!result) throw Error("html result loading failed");

    const snippets = this.snippetLoader.getSnippetForURL(url);
    return {result, snippets}
  }

  async getResultAndSnippetDomSelector(originalUrl){
    const {url, domSelector} = this.snippetLoader.getExtractionForUrl(originalUrl);
    if(url !== originalUrl) logger.info("extractionForUrl", originalUrl, url);
    const {result} = await DomLoader.getHTMLfromURL(url, domSelector);
    if (!result) throw Error("selector result loading failed");

    const snippets = this.snippetLoader.getSnippetForURL(url);
    return {result, snippets}
  }

  async matchAddress(expectedAddress, result, snippets) {
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
