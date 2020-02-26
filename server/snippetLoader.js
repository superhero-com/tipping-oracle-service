const fs = require("fs");
const path = require("path");

module.exports = class SnippetLoader {

  constructor() {
    const data = fs.readFileSync(path.resolve(__dirname, "../config/regex-snippets.txt"), "utf8");
    this.data = this.parseSnippetFile(data);
  }

  parseSnippetFile(rawData) {
    const rows = rawData.split('\n');
    return rows.map(row => {
      row = row.trim();
      if (row.length === 0) return null;
      const splitRow = row.split(' ');
      return {
        urlRegex: splitRow.shift(),
        domRegex: splitRow.join(' ')
      }
    }).filter(entry => !!entry)
  }

  getSnippetForURL(url) {
    if (!this.data) throw Error("init not done yet");

    const cutUrl = url.replace(/(^\w+:|^)\/\//, ''); // Removes protocol
    return this.data.filter(({urlRegex}) => !!cutUrl.match(urlRegex));
  }
};
