// Watches for Db Changes on "TargetShares" collection

import { TargetShare } from "../models/targetShare.model.js";
import { triggerAlerts } from "./alert.service.js";
import { socketService } from "../socket/index.js";

class DbWatcher {
  watchTargetShares() {
    const changeStream = TargetShare.watch([], {
      fullDocument: "updateLookup",
    });

    changeStream.on("change", (change) => {
      if (change.operationType !== "update") return;

      console.log(change);

      const updatedFields = change.updateDescription.updatedFields;
      const doc = change.fullDocument;

      // lastCheckedAt updated
      if ("lastCheckedAt" in updatedFields) {
        socketService.sendLastCheckedAt({
          securityId: doc.securityId,
          symbol: doc.symbol,
          lastCheckedAt: doc.lastCheckedAt,
        });
      }

      // price updated
      if (
        "lastUpdatedPrice" in updatedFields ||
        "lastUpdatedAt" in updatedFields
      ) {
        triggerAlerts(doc.symbol, doc.lastUpdatedPrice, doc.lastUpdatedAt);

        // Send to frontend.
        socketService.sendLastUpdatedPrice({
          securityId: doc.securityId,
          symbol: doc.symbol,
          lastUpdatedPrice: doc.lastUpdatedPrice,
          lastUpdatedAt: doc.lastUpdatedAt,
          lastCheckedAt: doc.lastCheckedAt,
        });
      }
    });

    changeStream.on("error", (err) => {
      console.error("Change Stream Error:", err);
    });

    console.log("Watching TargetShare collection...");
  }
}

export const dbWatcher = new DbWatcher();
