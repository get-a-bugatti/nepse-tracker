export const TelegramTemplates = {
  alertTriggered(alert) {
    return `
🚨 <b>Price Alert Triggered</b>

📈 Symbol: <b>${alert.symbol}</b>
💰 Current Price: Rs. ${alert.currentPrice}
🎯 Target: ${alert.targetPrice}

Condition: ${alert.condition}

Triggered at:
${new Date().toLocaleString()}
`;
  },

  alertCreated(alert) {
    return `
✅ Alert Created

📈 ${alert.symbol}

Target:
${alert.condition} Rs. ${alert.targetPrice}
`;
  },

  alertDeleted(alert) {
    return `
🗑 Alert Removed

${alert.symbol}

Target:
${alert.condition} Rs. ${alert.targetPrice}
`;
  },

  telegramLinked(username) {
    return `
🎉 Telegram linked successfully!

Welcome ${username}.

You'll now receive instant stock price alerts.
`;
  },

  telegramLinkFailed() {
    return `
❌ Telegram link failed.

 Invalid or expired tracking code. Generate a new link on our dashboard.

 And, Try again.
`;
  },

  testNotification() {
    return `
✅ Test notification

Everything is configured correctly.
`;
  },

  supportMessage() {
    return `
❓ Need help?

Contact our support team 
or,
regenerate your token on the web app.`;
  },
};
