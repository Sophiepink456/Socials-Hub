// Minimal Claude API client (Messages API).
export const hasClaude = () => !!process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001";

// Headers for every Claude request. Keys that aren't tied to a workspace also need the
// workspace id (set ANTHROPIC_WORKSPACE_ID in Vercel).
export function claudeHeaders() {
  const h = { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" };
  if (process.env.ANTHROPIC_WORKSPACE_ID) h["anthropic-workspace-id"] = process.env.ANTHROPIC_WORKSPACE_ID.trim();
  return h;
}

function friendly(status, text) {
  if (/workspace/i.test(text)) {
    let m = text;
    try { m = JSON.parse(text).error.message; } catch {}
    const id = (process.env.ANTHROPIC_WORKSPACE_ID || "").trim();
    return `Claude workspace problem. ${id ? `The hub is sending workspace ID "${id.slice(0, 10)}…" (${id.length} characters).` : "The hub can't see ANTHROPIC_WORKSPACE_ID yet (check it's saved for Production, then redeploy)."} Anthropic says: ${m}`;
  }
  if (status === 401) return "Claude's API key isn't valid. Check ANTHROPIC_API_KEY in Vercel.";
  if (status === 429) return "Claude is busy right now. Try again in a minute.";
  if (/credit/i.test(text)) return "The Claude account has run out of credit.";
  return `Claude couldn't do that this time (${status}). Try again.`;
}

export async function askClaude({ system, content, maxTokens = 4000, model = MODEL, returnMeta = false }) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: claudeHeaders(),
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content }] }),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("Claude API", res.status, t.slice(0, 500));
    throw new Error(friendly(res.status, t));
  }
  const data = await res.json();
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  if (data.stop_reason === "max_tokens") console.warn("Claude reply hit max_tokens", maxTokens, text.length);
  return returnMeta ? { text, truncated: data.stop_reason === "max_tokens" } : text;
}

// Pull the first JSON object/array out of a reply.
export function parseJson(text) {
  const m = String(text).match(/[\[{][\s\S]*[\]}]/);
  if (!m) throw new Error("No JSON in reply");
  return JSON.parse(m[0]);
}
