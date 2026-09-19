import { sleep } from "../utils/sleep.js";
import { MinHeap } from "../utils/MinHeap.js";

export class Scheduler {
  constructor({ workerCount = 3, defaultInterval = 60000 } = {}) {
    this.workerCount = workerCount;
    this.defaultInterval = defaultInterval;

    this.workers = [];
    this.queue = new MinHeap((job) => job.nextRunAt);

    this.targets = new Map();

    this.isRunning = false;
  }

  addTarget(target) {
    const job = {
      ...target,
      interval: target.interval || this.defaultInterval,
      nextRunAt: Date.now(),
    };

    this.targets.set(target.id, job);

    this.queue.push(job);
  }

  removeTarget(targetId) {
    this.targets.delete(targetId);
  }

  async start(scrapeFn) {
    if (this.isRunning) return; // avoids reruning an already-running scheduler

    this.isRunning = true;
  }

  stop() {
    this.isRunning = false;
  }

  async #worker(scrapeFn) {
    while (this.isRunning) {
      const job = this.#getNextDueJob();

      if (!job) {
        await sleep(300);
        continue;
      }

      try {
        // Log Scraping Message.
        console.log(
          `
          [Scheduler] Scraping Job : ${job.symbol} 
          Job ID ${job.id} is running...
          `
        );
        // Scrape
        await scrapeFn(job);
      } catch (error) {
        // Log Error
        console.error(
          `[Scheduler] Error while scraping job
          ${job.name} | ID: ${job.id} :`,
          error
        );
      }

      // Update nextRunAt only if target Still exists and wasn't removed mid-scrape
      if (this.isRunning & this.targets.has(job.id)) {
        job.nextRunAt = Date.now() + job.interval;
        this.queue.push(job);
      }
    }
  }

  #getNextDueJob() {
    const topJob = this.queue.peek();

    if (topJob && topJob.nextRunAt <= Date.now()) {
      return this.queue.pop();
    }

    return null;
  }
}

