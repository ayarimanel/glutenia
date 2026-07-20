const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const BATCH_SIZE = 100;

function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) {
    out.push(array.slice(i, i + size));
  }
  return out;
}

async function sendExpoPush(tokens, { title, body, data } = {}) {
  const validTokens = [...new Set(tokens)].filter(
    (token) => typeof token === "string" && token.startsWith("ExponentPushToken")
  );
  if (!validTokens.length) return;

  const messages = validTokens.map((to) => ({ to, title, body, data, sound: "default" }));

  for (const batch of chunk(messages, BATCH_SIZE)) {
    try {
      await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(batch),
      });
    } catch (error) {
      console.error("[pushService] sendExpoPush error:", error.message);
    }
  }
}

module.exports = { sendExpoPush };
