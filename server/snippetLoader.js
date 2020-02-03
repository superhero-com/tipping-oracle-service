// load snippet from git

const axios = require('axios');

class Snippet {
  constructor(url) {
    this.url = url;
    this.data = null;
  }

  async init() {
    if (this.data) return;
    const {data} = await axios.get(this.url);
    this.data = this.parse(data);
  }

  parse(rawData) {
    const rows = rawData.split('\n');
    return rows.map(row => {
      row = row.trim();
      if(row.length === 0) return null;
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
    const result = this.data.find(({urlRegex}) => !!cutUrl.match(urlRegex));
    if (result) {
      console.info("Found regex", result);
      return result
    } else {
      console.info("Could not find matching regex");
      return null;
    }
  }
}