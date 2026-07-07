// Cloudflare Pages Function: POST /api/send
// Proxies the request to the Resend API so the API key stays server-side.
//
// Required environment variable (set in Cloudflare dashboard, as a Secret):
//   RESEND_API_KEY   - your Resend API key (starts with "re_")
// Optional:
//   ACCESS_PASSWORD  - if set, the page must send a matching password,
//                      otherwise anyone with the URL could send mail.

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

// Split "a@x.com, b@y.com" into ["a@x.com", "b@y.com"]; passthrough arrays.
function toList(value) {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    const arr = value.map((s) => String(s).trim()).filter(Boolean);
    return arr.length ? arr : undefined;
  }
  const arr = String(value)
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return arr.length ? arr : undefined;
}

export async function onRequestPost({ request, env }) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    return json(
      { error: "服务端未配置 RESEND_API_KEY，请在 Cloudflare 项目的环境变量中设置。" },
      500,
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "请求体不是合法的 JSON。" }, 400);
  }

  // Optional shared-password gate to stop strangers from using your quota.
  if (env.ACCESS_PASSWORD) {
    if (String(body.password || "") !== String(env.ACCESS_PASSWORD)) {
      return json({ error: "访问密码错误。" }, 401);
    }
  }

  const from = (body.from || "").trim();
  const to = toList(body.to);
  const subject = (body.subject || "").trim();

  if (!from) return json({ error: "缺少发件人 (from)。" }, 400);
  if (!to) return json({ error: "缺少收件人 (to)。" }, 400);
  if (!subject) return json({ error: "缺少主题 (subject)。" }, 400);

  const html = (body.html || "").trim();
  const text = (body.text || "").trim();
  if (!html && !text) {
    return json({ error: "邮件正文不能为空（HTML 或纯文本至少填一项）。" }, 400);
  }

  const payload = { from, to, subject };
  if (html) payload.html = html;
  if (text) payload.text = text;

  const cc = toList(body.cc);
  const bcc = toList(body.bcc);
  const replyTo = toList(body.reply_to);
  if (cc) payload.cc = cc;
  if (bcc) payload.bcc = bcc;
  if (replyTo) payload.reply_to = replyTo;

  let resendRes;
  try {
    resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return json({ error: "请求 Resend 失败：" + err.message }, 502);
  }

  const data = await resendRes.json().catch(() => ({}));
  if (!resendRes.ok) {
    const msg = data?.message || data?.error || "Resend 返回错误。";
    return json({ error: msg, status: resendRes.status, detail: data }, resendRes.status);
  }

  return json({ id: data.id || null, ok: true });
}

// Any other method gets a clear 405.
export async function onRequestGet() {
  return json({ error: "仅支持 POST。" }, 405);
}
