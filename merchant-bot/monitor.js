const axios = require("axios");
const crypto = require("crypto");

let intervals = {};

function sign(secret, payload) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function startMonitoring(bot, chatId, session) {
  if (intervals[chatId]) return;

  intervals[chatId] = setInterval(async () => {
    const timestamp = Date.now().toString();
    const recvWindow = "5000";
    const payload = timestamp + session.apiKey + recvWindow;
    const signature = sign(session.secretKey, payload);

    try {
      const res = await axios.get(
        "https://api.bybit.com/v5/p2p/order/list",
        {
          headers: {
            "X-BAPI-API-KEY": session.apiKey,
            "X-BAPI-SIGN": signature,
            "X-BAPI-TIMESTAMP": timestamp,
            "X-BAPI-RECV-WINDOW": recvWindow,
          },
        }
      );

      const orders = res.data.result?.items || [];

      if (orders.length > 0) {
        const order = orders[0];

        bot.sendMessage(
          chatId,
          `🚨 New Order\nAmount: ${order.amount}\nOrder ID: ${order.id}`
        );
      }
    } catch (err) {
      console.log("Monitor error");
    }
  }, 10000);
}

function stopMonitoring(chatId) {
  if (intervals[chatId]) {
    clearInterval(intervals[chatId]);
    delete intervals[chatId];
  }
}

module.exports = { startMonitoring, stopMonitoring };
