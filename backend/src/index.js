import "../config/env.js";
import { connectDb } from "./db/index.js";
import { app } from "./app.js";
import { socketService } from "./socket/index.js";
import http from "http";
import { scraperService } from "./services/scraper.service.js";
import { updater } from "./services/updater.service.js";
import { browserManager } from "./services/browser.service.js";
import { telegramService } from "./services/telegram.service.js";
import { dbWatcher } from "./services/dbWatcher.service.js";
import { Scheduler } from "./services/scheduler.service.js";

const trackerTargets = [
  {
    symbol: "NABIL",
    id: 131,
    targetPrice: 549,
    condition: "ABOVE",
  },
];

async function initStart(browser) {
  const results = await scraperService.fetchLivePrices(browser, trackerTargets);

  await updater(results);
}

connectDb()
  .then(async () => {
    const httpServer = http.createServer(app);

    httpServer.listen(process.env.PORT || 8000, () => {
      console.log(`Server started on port ${process.env.PORT || 8000}`);
    });

    socketService.init(httpServer);

    telegramService.init();

    const browser = await browserManager.getBrowser();

    // ** First initial scrape **
    await initStart(browser);

    // ** Setup Scheduler here **
    const scheduler = new Scheduler();
    scheduler.start(async () => {
      await initStart(browser);
    });

    dbWatcher.watchTargetShares();

    httpServer.on("error", (error) => {
      console.error("Server Error :", error);
      process.exit(1);
    });
  })
  .catch(async (error) => {
    console.error("Startup Error:", error.message);
    try {
      await browserManager.close();
    } catch (cleanupError) {
      console.log(
        "Cleanup Error : Resource cleanup failed during crash.",
        cleanupError.message
      );
    }
    process.exit(1);
  });
