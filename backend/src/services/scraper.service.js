import { shareDetailListener } from "../helpers/puppeteer.listener.js";
import sleep from "../utils/sleep.js";
import { browserManager } from "./browser.service.js";

class Scraper {
  constructor() {}

  async fetchLivePrices(browser, trackerTargets) {
    const results = [];

    for (const target of trackerTargets) {
      await sleep(5000);
      let page;
      try {
        page = await browserManager.newPage();

        // Simultaneous Execution of listener and page.goto
        const [shareDetailApiResponse] = await Promise.all([
          shareDetailListener(page, target.id),
          page.goto(`https://nepalstock.com/company/detail/${target.id}`, {
            waitUntil: "domcontentloaded",
          }),
        ]);

        const data = await shareDetailApiResponse.json();

        results.push(data);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error(`Scraping failed for ${target.symbol}:`, error);
        } else {
          throw new Error(
            `Scraping failed for ${target.symbol}: ${error.message}`
          );
        }
      } finally {
        if (page) await page.close(); // Prevent memory leaks by closing tabs
      }
    }

    return results;
  }
}

export const scraperService = new Scraper();
