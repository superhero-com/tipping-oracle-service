const SnippetLoader = require('./snippetLoader');
const DomLoader = require("./domLoader");
const Aeternity = require("./aeternity");
let logger = require("./logger")(module);

module.exports = class PageParser {

  constructor(aeternity = null, contextInfo = null) {
    this.contextInfo = contextInfo;
    if(contextInfo) logger = require("./logger")(module, contextInfo);
    this.snippetLoader = new SnippetLoader();
    this.aeternity = aeternity ? aeternity : new Aeternity();
  }

  async getAddressFromPage(expectedAddress, originalUrl) {
    let matched;
    try {
      let {result, snippets} = await this.getResultAndSnippetDomSelector(originalUrl);
      matched = await this.matchAddress(expectedAddress, result, snippets);
    } catch (e) {
      logger.warn("parse error with dom selector", e.message);
    }

    if (matched) {
      logger.info("matched", originalUrl, matched);
      return matched;
    } else {
      logger.info("trying fallback to original url", originalUrl);
      try {
        let {result, snippets} = await this.getResultAndSnippet(originalUrl);
        return this.matchAddress(expectedAddress, result, snippets);
      } catch (e) {
        logger.warn("parse error", e.message);
      }
    }

    return null;
  }

  async getResultAndSnippet(url){
    const result = await new DomLoader(this.contextInfo).getHTMLfromURL(url);
    if (result.error) throw Error(result.error);

    const snippets = this.snippetLoader.getSnippetForURL(url);
    return {result: result.result, snippets}
  }

  async getResultAndSnippetDomSelector(originalUrl){
    const {url, domSelector} = this.snippetLoader.getExtractionForUrl(originalUrl);
    if(url !== originalUrl) logger.info("use extracted url", originalUrl, url);
    const result = await new DomLoader(this.contextInfo).getHTMLfromURL(url, domSelector);
    if (result.error) throw Error(result.error);

    const snippets = this.snippetLoader.getSnippetForURL(url);
    return {result: result.result, snippets}
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
