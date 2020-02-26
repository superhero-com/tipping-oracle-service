// load dom from url
const puppeteer = require('puppeteer');

module.exports = class DomLoader {

  static async getHTMLfromURL(url) {
    let result = await DomLoader.runBrowser(url);
    if (result.error) result = await DomLoader.runBrowser(url);
    return result;
  }

  static async runBrowser(url) {
    const browser = await puppeteer.launch(process.env.NODE_ENV === 'test' ? {} : {
      executablePath: '/usr/bin/chromium-browser',
      args: ['--disable-dev-shm-usage'],
    });
    try {
      const page = await browser.newPage();
      await page.goto(url, {
        waitUntil: 'networkidle2',
      });
      if (
        (new URL(url)).hostname === 'www.weibo.com' &&
        (new URL(page.url())).hostname === 'passport.weibo.com'
      ) {
        await page.waitForNavigation({waitUntil: 'networkidle2', timeout: 45 * 1000});
      }

      if (
        (new URL(url)).hostname === 'www.weibo.com' &&
        page.url().includes('login.php')
      ) {
        throw new Error('Got caught on login.php')
      }
      const html = await page.content();
      await browser.close();
      return {html, url: page.url()};
    } catch (e) {
      console.error(`Error while crawling ${url}: ${e.message}`);
      await browser.close();
      return {
        html: null,
        url: null,
        error: e.message,
      };
    }
  }
};
