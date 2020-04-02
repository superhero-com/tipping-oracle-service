const fs = require("fs");
const path = require("path");

module.exports = class SnippetLoader {

  constructor() {
    const snippets = fs.readFileSync(path.resolve(__dirname, "../config/regex-snippets.txt"), "utf8");
    this.snippets = this.parseSnippetFile(snippets);

    const extractors = fs.readFileSync(path.resolve(__dirname, "../config/regex-url-extractors.txt"), "utf8");
    this.extractors = this.parseUrlExtractorsFile(extractors);
  }

  parseUrlExtractorsFile(rawData) {
    const rows = rawData.split('\n');
    return rows.map(row => {
      row = row.trim();
      if (row.startsWith("#")) return null;
      if (row.length === 0) return null;
      return row;
    }).filter(entry => !!entry)
  }

  getExtractionForUrl(url) {
    const extractor = this.extractors.find(extractor => url.match(extractor));
    if (!extractor) return url;

    const matchedUrl = url.match(extractor);
    if (matchedUrl.groups && matchedUrl.groups.url) return matchedUrl.groups.url;
    else return url;
  }

  parseSnippetFile(rawData) {
    const rows = rawData.split('\n');
    return rows.map(row => {
      row = row.trim();
      if (row.startsWith("#")) return null;
      if (row.length === 0) return null;
      const splitRow = row.split(' ');
      return {
        urlRegex: splitRow.shift(),
        domRegex: splitRow.join(' ')
      }
    }).filter(entry => !!entry)
  }

  getSnippetForURL(url) {
    if (!this.snippets) throw Error("snippets init not done yet");

    const cutUrl = url.replace(/(^\w+:|^)\/\//, ''); // Removes protocol
    return this.snippets.filter(({urlRegex}) => !!cutUrl.match(urlRegex));
  }
};
