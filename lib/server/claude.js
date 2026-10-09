// Minimal Claude API client (Messages API).
export const hasClaude = () => !!process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001";

export async function askClaude({ system, content, maxTokens = 2000, model = MODEL }) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content }] }),
  });
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
}

// Pull the first JSON object/array out of a reply.
export function parseJson(text) {
  const m = String(text).match(/[\[{][\s\S]*[\]}]/);
  if (!m) throw new Error("No JSON in reply");
  return JSON.parse(m[0]);
}
