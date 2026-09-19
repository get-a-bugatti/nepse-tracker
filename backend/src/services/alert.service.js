import { Alert } from "../models/alert.model.js";
import { User } from "../models/user.model.js";
import { telegramService } from "./telegram.service.js";

export async function triggerAlerts({ symbol, lastUpdatedPrice }) {
  try {
    // 1, Fetch Matching alerts
    const alerts = await Alert.find({
      symbol,
      isTriggered: false,
      $or: [
        {
          condition: "ABOVE",
          targetPrice: { $lte: lastUpdatedPrice },
        },
        {
          condition: "BELOW",
          targetPrice: { $gte: lastUpdatedPrice },
        },
      ],
    }).lean();

    if (alerts.length === 0) return;

    const userIds = [...new Set(alerts.map((a) => a.userId.toString()))];

    // 2. Searches only for users with telegram.linked : true. (yet to implement)
    const users = await User.find(
      { _id: { $in: userIds } },
      { telegram: 1 }
    ).lean();

    if (users.length === 0) return;

    // 3. Create a map of users with userId as key.
    const userMap = new Map(users.map((user) => [user._id.toString(), user]));

    // 4. Search through map of users with userId from alerts.
    // Map such that {
    // alert : {} // alertData
    // user: {}  // userdata
    // }

    const alertPayloads = alerts.map((alert) => {
      const user = userMap.get(alert.userId);
      return {
        alert: {
          ...alert,
          currentPrice: lastUpdatedPrice,
        },
        user,
      };
    });

    // 5. Send notification for all alert Payloads
    await Promise.all(
      alertPayloads.map((alertPayload) =>
        telegramService.sendAlertInTelegram(alertPayload)
      )
    );

    // 6. Update alerts to triggered
    await Alert.updateMany(
      {
        _id: { $in: alerts.map((a) => a._id) },
      },
      {
        $set: { isTriggered: true },
      }
    );
  } catch (error) {
    console.error("alertManager failed", error);
    throw new Error("alertManager failed for some reason.");
  }
}
