const axios = require("axios");
const crypto = require("crypto");

function sign(secret, payload) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

async function verifyBybit(apiKey, secretKey) {
  const timestamp = Date.now().toString();
  const recvWindow = "5000";
  const query = "accountType=UNIFIED";

  const payload = timestamp + apiKey + recvWindow + query;
  const signature = sign(secretKey, payload);

  try {
    const res = await axios.get(
      "https://api.bybit.com/v5/account/wallet-balance",
      {
        headers: {
          "X-BAPI-API-KEY": apiKey,
          "X-BAPI-SIGN": signature,
          "X-BAPI-TIMESTAMP": timestamp,
          "X-BAPI-RECV-WINDOW": recvWindow,
        },
        params: { accountType: "UNIFIED" },
      }
    );

    return res.data.retCode === 0;
  } catch {
    return false;
  }
}

module.exports = { verifyBybit };
