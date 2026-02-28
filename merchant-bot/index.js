require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const { verifyBybit } = require("./bybit");
const { startMonitoring, stopMonitoring } = require("./monitor");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

let sessions = {};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  sessions[chatId] = { step: "api" };
  bot.sendMessage(chatId, "Welcome 👋\nEnter your Bybit API Key:");
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  if (!sessions[chatId]) return;

  if (sessions[chatId].step === "api") {
    sessions[chatId].apiKey = msg.text;
    sessions[chatId].step = "secret";
    return bot.sendMessage(chatId, "Enter your Secret Key:");
  }

  if (sessions[chatId].step === "secret") {
    const valid = await verifyBybit(
      sessions[chatId].apiKey,
      msg.text
    );

    if (valid) {
      sessions[chatId].secretKey = msg.text;
      sessions[chatId].step = null;

      bot.sendMessage(chatId, "✅ API Verified Successfully", {
        reply_markup: {
          keyboard: [
            ["🟢 Start Monitoring"],
            ["🔴 Stop Monitoring"]
          ],
          resize_keyboard: true,
        },
      });
    } else {
      bot.sendMessage(chatId, "❌ Invalid API credentials");
    }
  }
});

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!sessions[chatId]) return;

  if (text === "🟢 Start Monitoring") {
    startMonitoring(bot, chatId, sessions[chatId]);
    bot.sendMessage(chatId, "Monitoring Started 🟢");
  }

  if (text === "🔴 Stop Monitoring") {
    stopMonitoring(chatId);
    bot.sendMessage(chatId, "Monitoring Stopped 🔴");
  }
});
