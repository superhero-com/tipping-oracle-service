// load dom from url
const puppeteer = require('puppeteer');
const logger = require("./logger")(module);

module.exports = class DomLoader {

  static async getHTMLfromURL(url, selector = null) {
    let result = await DomLoader.runBrowser(url, selector);
    if (result.error) result = await DomLoader.runBrowser(url, selector);
    return result;
  }

  static async runBrowser(url, selector) {
    const browser = await puppeteer.launch(process.env.NODE_ENV === 'test' ? {} : {
      executablePath: '/usr/bin/chromium-browser',
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
    try {
      const page = await browser.newPage();
      await page.goto(url, {
        waitUntil: 'networkidle2',
      }).catch(e => {
        logger.info("trying wait until load after:", e.message);
        return page.goto(url, {
          waitUntil: 'load',
        })
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

      let selected = selector ? await page.$eval(selector, e => e.innerText) : null;

      await browser.close();
      return {result: selected ? selected : html, url: page.url()};
    } catch (e) {
      logger.error(`Error while crawling ${url}: ${e.message}`);
      await browser.close();
      return {
        html: null,
        url: null,
        error: e.message,
      };
    }
  }
};
