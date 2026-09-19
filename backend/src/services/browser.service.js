import puppeteer from "puppeteer";

export class BrowserManager {
  constructor({ maxPages = 4 }) {
    this.browser = null;
    this.launchPromise = null; // prevents multiple simultaneous launches.

    this.pool = []; // Keeps track of free pages.
    this.maxPages = maxPages;
  }

  async init() {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-http2"],
    });

    browser.on("disconnected", () => {
      console.error("Browser crashed/disconnected. Restarting...");
      this.browser = null;
      this.launchPromise = null;
    });

    this.browser = browser;
    return browser;
  }

  _handleEvents() {
    this.browser.on("disconnected", () => {
      console.error("Browser crashed/disconnected. Restarting...");
      this.browser = null;
      this.launchPromise = null;
    });
  }

  async getBrowser() {
    if (this.browser?.connected) {
      return this.browser;
    }

    if (!this.launchPromise) {
      this.launchPromise = this.init();
      console.log("Promise :", this.launchPromise);
    }

    return this.launchPromise;
  }

  async restart() {
    try {
      if (this.browser) {
        await this.browser.close();
      }
    } catch (err) {
      console.error("Error closing browser:", err);
    }

    this.browser = null;
    this.launchPromise = null;

    return this.getBrowser();
  }

  async newPage() {
    // launchPromise only gets resolved when newPage is created.
    // also it prevents two/multiple simultaneous launches.
    const browser = await this.getBrowser();
    const newPage = await browser.newPage();

    await this._setupPage(newPage);

    return newPage;
  }
  async close() {
    try {
      await this.browser.close();
    } catch (err) {
      throw new Error("browser close error", err);
    } finally {
      this.browser = null;
      this.launchPromise = null;
    }
  }

  async _setupPage(page) {
    await page.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      Origin: "https://nepalstock.com",
      Referrer: "https://nepalstock.com",
    });
  }

  async getPage() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    } else if (this.pool.length == 0) {
      // to complete

      return this.newPage();
    }
  }
}

export const browserManager = new BrowserManager();
