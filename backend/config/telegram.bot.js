import TelegramBot from "node-telegram-bot-api";
import { User } from "../models/user.models.js";
import { TelegramTemplates } from "../templates/telegram.templates.js";

// Create a single shared instance
export const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
  polling: true,
});
console.log("🤖 Telegram Bot instance polling pool initialized.");

