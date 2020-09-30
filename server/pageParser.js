const SnippetLoader = require('./snippetLoader');
const DomLoader = require("./domLoader");
let logger = require("./logger")(module);

module.exports = class PageParser {

  constructor(aeternity, contextInfo = null) {
    this.contextInfo = contextInfo;
    if (contextInfo) logger = require("./logger")(module, contextInfo);
    this.snippetLoader = new SnippetLoader();
    this.aeternity = aeternity;
  }

  async getAddressFromPage(expectedAddress, originalUrl) {
    let matched, followUrl;
    let {url} = await new DomLoader(this.contextInfo).getHTMLfromURL(originalUrl);

    try {
      followUrl = await this.getFollowUrl(url);

      if (followUrl && followUrl !== url) {
        url = followUrl;
        logger.info("following to url", url);
      }
    } catch (e) {
      logger.warn("error get follow url", e.message);
    }

    try {
      let {result, snippets} = await this.getResultAndSnippetDomSelector(url);
      matched = await this.matchAddress(expectedAddress, result, snippets);
    } catch (e) {
      logger.warn("parse error with dom selector", e.message);
    }

    if (matched) {
      logger.info("matched", url, matched);
      return matched;
    } else {
      logger.info("trying fallback to original url", url);
      try {
        let {result, snippets} = await this.getResultAndSnippet(url);
        return this.matchAddress(expectedAddress, result, snippets);
      } catch (e) {
        logger.warn("parse error", e.message);
      }
    }

    return null;
  }

  async getFollowUrl(originalUrl) {
    const {url, domSelector, prependUrl} = this.snippetLoader.getFollowForUrl(originalUrl);
    if (url && domSelector) {
      const followResult = await new DomLoader(this.contextInfo).getHTMLfromURL(url, domSelector);
      return followResult && followResult.href ? prependUrl + followResult.href : originalUrl;
    }
  }

  async getResultAndSnippet(url) {
    const result = await new DomLoader(this.contextInfo).getHTMLfromURL(url);
    if (result.error) throw Error(result.error);

    const snippets = this.snippetLoader.getSnippetForURL(url);
    return {result: result.result, snippets}
  }

  async getResultAndSnippetDomSelector(originalUrl) {
    const {url, domSelector} = this.snippetLoader.getExtractionForUrl(originalUrl);
    if (url !== originalUrl) logger.info("use extracted url", originalUrl, url);
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
