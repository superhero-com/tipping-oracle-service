const assert = require('chai').assert
const PageParser = require('../server/pageParser');
const Aeternity = require('../server/aeternity');

describe('Page Parser', () => {
  let pageParser;

  before(async () => {
    const aeternity = new Aeternity();
    await aeternity.init(null,  'https://mainnet.aeternity.io/');
    pageParser = new PageParser(aeternity);
  });


  it('Parse YouTube Channel', async () => {
    const expectedAddress = "ak_y87WkN4C4QevzjTuEYHg6XLqiWx3rjfYDFLBmZiqiro5mkRag";
    const url = "https://www.youtube.com/channel/UC6G24k1W0qOXxEBY-3irj5w";

    const result = await pageParser.getAddressFromPage(expectedAddress, url);
    assert.equal(result, expectedAddress);
  });

  // not working as tweet doesn't exist any more
  it.skip('Follow BitLy, Parse Tweet to Profile', async () => {
    const expectedAddress = "ak_y87WkN4C4QevzjTuEYHg6XLqiWx3rjfYDFLBmZiqiro5mkRag";
    const url = "https://bit.ly/2Glxfg2"; //"https://twitter.com/thepiwo/status/1252636937699106816";

    const result = await pageParser.getAddressFromPage(expectedAddress, url);
    assert.equal(result, expectedAddress);
  });

  // not working as youtube ToS must be accepted first
  it.skip('Follow YouTube Short-URL, Parse Video to Channel', async () => {
    const expectedAddress = "ak_y87WkN4C4QevzjTuEYHg6XLqiWx3rjfYDFLBmZiqiro5mkRag";
    const url = "https://youtu.be/HwBrVku303M"; // https://www.youtube.com/watch?v=HwBrVku303M

    const result = await pageParser.getAddressFromPage(expectedAddress, url);
    assert.equal(result, expectedAddress);
  });

  it('Follow Superhero Tip, Extract Original Creator', async () => {
    const expectedAddress = "ak_2oBEG11B2GZSWVdVUQy1CYEvgWCfeizEGzjDaQB1YFv4owMcbd";
    const url = "https://superhero.com/tip/1375_v1";

    const result = await pageParser.getAddressFromPage(expectedAddress, url);
    assert.equal(result, expectedAddress);
  });

  it('Follow Superhero Comment, Extract Original Creator', async () => {
    const expectedAddress = "ak_2bP6pT5bKSkUpibFWAiv8hdgTgS854mhe3EAZh2i3hEyCY3Zno";
    const url = "https://superhero.com/tip/1375_v1/comment/497";

    const result = await pageParser.getAddressFromPage(expectedAddress, url);
    assert.equal(result, expectedAddress);
  });

  it('Follow Superhero Tip, Extract Original Creator no Follow', async () => {
    const expectedAddress = "ak_rRVV9aDnmmLriPePDSvfTUvepZtR2rbYk2Mx4GCqGLcc1DMAq";
    const url = "https://superhero.com/tip/2169_v1";

    const result = await pageParser.getAddressFromPage(expectedAddress, url);
    assert.equal(result, expectedAddress);
  });

  it('Follow Superhero Comment, Extract Original Creator no Follow', async () => {
    const expectedAddress = "ak_rRVV9aDnmmLriPePDSvfTUvepZtR2rbYk2Mx4GCqGLcc1DMAq";
    const url = "https://superhero.com/tip/2170_v1";

    const result = await pageParser.getAddressFromPage(expectedAddress, url);
    assert.equal(result, expectedAddress);
  });

});
