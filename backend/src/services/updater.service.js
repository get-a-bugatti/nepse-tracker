// Updates Database based on fetched data.
// Input : results [ array of { security, price } ]

import { TargetShare } from "../models/targetShare.model.js";

export async function updater(results) {
  if (!results.length) return;

  const operations = results.map((data) => {
    return {
      updateOne: {
        filter: {
          symbol: data.security.symbol,
        },
        update: {
          $set: {
            lastUpdatedPrice: data.securityDailyTradeDto.lastTradedPrice,
            lastUpdatedAt: data.securityDailyTradeDto.lastUpdatedDateTime,
            lastCheckedAt: new Date(),
          },
          $setOnInsert: {
            symbol: data.security.symbol,
            securityId: data.security.id,
          },
        },
        upsert: true,
      },
    };
  });

  await TargetShare.bulkWrite(operations);
}
