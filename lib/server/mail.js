// Emails go out through the "Marketing Hub emails" Zap (Webhooks by Zapier →
// Outlook/Gmail Send Email). The Zap maps: to, cc, subject, body_html,
// body_text, attachment_url, attachment_name.
export async function sendEmail({ to, cc = "", subject, html, text, attachmentUrl = "", attachmentName = "" }) {
  const hook = process.env.ZAPIER_HOOK_URL;
  if (!hook && process.env.LOCAL_MAIL_LOG) {
    (await import("node:fs")).appendFileSync(process.env.LOCAL_MAIL_LOG, JSON.stringify({ to, cc, subject, html, attachmentUrl }) + "\n");
    return;
  }
  if (!hook) throw new Error("ZAPIER_HOOK_URL is not set");
  const res = await fetch(hook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: Array.isArray(to) ? to.join(", ") : to,
      cc: Array.isArray(cc) ? cc.join(", ") : cc,
      subject,
      body_html: html,
      body_text: text || htmlToText(html),
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
    }),
  });
  if (!res.ok) throw new Error(`Zapier returned ${res.status}`);
}

// A simple branded email body.
export function emailHtml(title, paragraphs, button) {
  const p = paragraphs.map((t) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.5;color:#1c2024">${t}</p>`).join("");
  // The button, plus the full link written out underneath so it still works in plain-text
  // emails or mail apps that hide buttons.
  const b = button
    ? `<p style="margin:22px 0 8px"><a href="${button.href}" style="background:#93bf20;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:8px;display:inline-block">${button.label}</a></p>
<p style="margin:0 0 14px;font-size:13px;line-height:1.5;color:#5b6168">Or copy this link into your browser:<br><a href="${button.href}" style="color:#5b8a00;word-break:break-all">${button.href}</a></p>`
    : "";
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px">
<h2 style="font-size:20px;margin:0 0 16px;color:#161616">${title}<span style="color:#93bf20">.</span></h2>${p}${b}
<p style="margin:24px 0 0;font-size:12px;color:#8a9097">Sent by the Elevation Marketing Hub</p></div>`;
}

export const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Plain-text version of an email: keeps every link as "label: https://…".
export function htmlToText(html) {
  return String(html)
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (m, href, label) => {
      const l = label.replace(/<[^>]+>/g, "").trim();
      return l && l !== href ? `${l}: ${href}` : href;
    })
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h[1-6]|div)>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}
