export default async (request) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json" }
    });
  }
  const apiKey = Netlify.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "لم يتم إعداد مفتاح الخدمة بعد. يحتاج مالك الموقع إلى ضبط OPENAI_API_KEY في إعدادات Netlify." }), {
      status: 503, headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 30) {
      return new Response(JSON.stringify({ error: "صيغة المحادثة غير صالحة." }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    const messages = body.messages.map((m) => {
      if (!["user", "assistant"].includes(m.role) || typeof m.content !== "string") throw new Error("Invalid message");
      return { role: m.role, content: m.content.slice(0, 6000) };
    });
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: "أنت GPT ULTRA، مساعد عربي واضح ودقيق. أجب بلغة المستخدم، وكن صريحاً عند عدم التأكد. لا تدّعِ تنفيذ أفعال لم تنفذها." },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1200
      })
    });
    const result = await upstream.json();
    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: result.error?.message || "تعذّر على مزوّد الذكاء الاصطناعي معالجة الطلب." }), {
        status: upstream.status, headers: { "Content-Type": "application/json" }
      });
    }
    const reply = result.choices?.[0]?.message?.content;
    return new Response(JSON.stringify({ reply: reply || "لم يصل رد نصّي." }), {
      status: 200, headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message === "Invalid message" ? "رسالة غير صالحة." : "حدث خطأ في الخادم." }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }
};