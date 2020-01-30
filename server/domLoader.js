// load dom from url
const puppeteer = require('puppeteer');

class DomLoader {

  static async loadUrl(url) {
    const browser = await puppeteer.launch();
    try {
      const page = await browser.newPage();
      await page.goto(url, {
        waitUntil: 'networkidle0',
      });
      const html = await page.content();
      await browser.close();
      return html;
    } catch (e) {
      await browser.close();
    }
  }
}
