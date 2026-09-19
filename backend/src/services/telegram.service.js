import TelegramBot from "node-telegram-bot-api";
import { User } from "../models/user.model.js";
import { userRepository } from "../repositories/user.repository.js";
import { TelegramTemplates } from "../templates/telegram.templates.js";

class TelegramService {
  constructor() {
    this.bot = null;
  }

  init() {
    if (this.bot) return;

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error("[TelegramService] Token missing");

    this.bot = new TelegramBot(token, { polling: true });

    this._registerErrorListeners();
    this._registerCommands();
    console.log("✅ Telegram bot initialized and listening for commands.");
  }

  _registerErrorListeners() {
    this.bot.on("polling_error", (error) => {
      if (error.code === "EFATAL" || error.code === "ETIMEDOUT") {
        console.warn(
          "[TelegramService] Transient network glitch, reconnecting..."
        );
        return;
      }

      if (error.response?.statusCode === 409) {
        console.error(
          "[TelegramService] FATAL: 409 Conflict. Multiple instances running with same token!"
        );
        process.exit(1);
      }

      console.error("[TelegramService] Polling Error:", error.message);
    });

    this.bot.on("error", (error) => {
      console.error("[TelegramService] General Bot Error:", error);
    });
  }

  _registerCommands() {
    // Matches both "/start" and deep-linked "/start <token>"
    this.bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
      try {
        await this._handleStart(msg, match ? match[1] : null);
      } catch (err) {
        console.error("[TelegramService] Error in /start command:", err);
        await this.sendMessage(
          msg.chat.id,
          "⚠️ Something went wrong processing your request."
        );
      }
    });

    this.bot.onText(/\/help/, async (msg) => {
      try {
        await this._handleHelp(msg);
      } catch (err) {
        console.error("[TelegramService] Error in /help command:", err);
      }
    });
  }

  async _handleStart(msg, tokenFromUrl) {
    const chatId = msg.chat.id;

    if (!tokenFromUrl) {
      return this.sendMessage(
        chatId,
        "Welcome! Please link your account through our platform web application."
      );
    }

    const user = await User.findOne({
      telegramLinkToken: tokenFromUrl,
      telegramLinkExpiry: { $gte: new Date() },
    });

    if (!user) {
      return this.sendMessage(
        chatId,
        "❌ Verification link invalid or expired. Please generate a new link from the web portal."
      );
    }

    user.telegram = user.telegram || {};
    user.telegram.chatId = chatId.toString();
    user.telegram.username = msg.from.username || "NoHandle";
    user.telegram.linked = true;

    user.telegramLinkToken = null;
    user.telegramLinkExpiry = null;

    if (user.onboarding) {
      user.onboarding.telegramCompleted = true;
    }

    await user.save();

    return this.sendMessage(
      chatId,
      `🎉 Account successfully linked! Welcome aboard, <b>${
        user.username || "User"
      }</b>.`
    );
  }

  async _handleHelp(msg) {
    const helpText = TelegramTemplates.supportMessage();
    return this.sendMessage(msg.chat.id, helpText);
  }

  async sendMessage(chatId, message, options = {}) {
    try {
      return await this.bot.sendMessage(chatId, message, {
        parse_mode: "HTML",
        ...options,
      });
    } catch (error) {
      await this._handleApiError(error, chatId);
    }
  }

  async _handleApiError(error, chatId) {
    const statusCode = error.response?.statusCode;
    const description = error.response?.body?.description || error.message;

    switch (statusCode) {
      case 403:
        console.warn(
          `[TelegramService] User blocked bot for chatId ${chatId}. Marking unlinked.`
        );
        await userRepository.updateUser({
          searchQuery: { "telegram.chatId": chatId },
          updateQuery: { $set: { "telegram.linked": false } },
        });
        break;

      case 429:
        const retryAfter = error.response?.body?.parameters?.retry_after || 5;
        console.warn(
          `[TelegramService] Rate limited! Wait time: ${retryAfter}s.`
        );
        break;

      case 400:
        console.error(
          `[TelegramService] Bad Request for ${chatId}:`,
          description
        );
        break;

      default:
        console.error(
          `[TelegramService] Unhandled API Error for ${chatId}:`,
          description
        );
        throw error;
    }
  }

  async sendAlertInTelegram({ alert, user }) {
    try {
      await bot.sendMessage(
        user.telegram.chatId,
        TelegramTemplates.alertTriggered(alert)
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export const telegramService = new TelegramService();
