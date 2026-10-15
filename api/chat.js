// Noor Al-Islam — secure OpenAI chat endpoint for Vercel
// Set OPENAI_API_KEY in Vercel Project Settings > Environment Variables.
// Never put the API key in the website HTML or in this repository.

const ALLOWED_ORIGIN = "https://alitahami287-netizen.github.io";
const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_ITEMS = 10;

function send(res, status, body) {
  res.status(status).json(body);
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.headers.origin && req.headers.origin !== ALLOWED_ORIGIN) {
    return send(res, 403, { error: "Origin not allowed." });
  }

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return send(res, 405, { error: "Use POST for chat requests." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return send(res, 503, {
      error: "المساعد يحتاج إلى إعداد مفتاح الخدمة الآمن أولاً."
    });
  }

  const body = req.body || {};
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return send(res, 400, { error: "اكتب سؤالك أولاً." });
  if (message.length > MAX_MESSAGE_LENGTH) {
    return send(res, 413, { error: "السؤال طويل جداً؛ اختصره وحاول مجدداً." });
  }

  const history = Array.isArray(body.history)
    ? body.history.slice(-MAX_HISTORY_ITEMS).filter(
        item =>
          item &&
          (item.role === "user" || item.role === "assistant") &&
          typeof item.content === "string"
      ).map(item => ({
        role: item.role,
        content: item.content.slice(0, MAX_MESSAGE_LENGTH)
      }))
    : [];

  const input = [
    ...history,
    { role: "user", content: message }
  ];

  try {
    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5-mini",
        instructions:
          "You are Noor Al-Islam, a respectful Islamic educational assistant. " +
          "Answer in the language used by the user (Arabic, including Iraqi Arabic, or English). " +
          "Be clear and kind. For Quran verses and hadith, do not invent quotations or sources; " +
          "state uncertainty when you cannot verify a reference. Explain general Islamic knowledge, " +
          "but do not present yourself as a mufti or issue definitive personal fatwas. For personal, " +
          "high-stakes, or disputed religious rulings, recommend consulting a qualified scholar. " +
          "Keep answers suitable for a general audience and do not claim every answer is scholarly verified.",
        input,
        max_output_tokens: 700
      })
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error("OpenAI API request failed:", upstream.status);
      return send(res, 502, {
        error: "تعذّر الحصول على إجابة الآن. تأكد من إعداد خدمة الذكاء الاصطناعي ثم حاول لاحقاً."
      });
    }

    const answer = typeof data.output_text === "string" ? data.output_text.trim() : "";
    if (!answer) {
      return send(res, 502, { error: "لم تصل إجابة نصية. حاول مرة أخرى." });
    }

    return send(res, 200, { answer });
  } catch (error) {
    console.error("Chat endpoint error:", error && error.message);
    return send(res, 500, { error: "حدث خطأ مؤقت. حاول مرة أخرى لاحقاً." });
  }
};
