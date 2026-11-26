// Opens or downloads one External Policy. Behind the hub sign-in (middleware), unlike /api/files.
import { readFile } from "../../../../lib/server/store";
import { POLICY_DIR, cleanPolicyName, policyType, policyTitle } from "../../../../lib/policies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const url = new URL(req.url);
  const name = cleanPolicyName(url.searchParams.get("name") || "");
  if (!name || !policyType(name)) return new Response("Not found", { status: 404 });
  const f = await readFile(`${POLICY_DIR}/${name}`).catch(() => null);
  if (!f) return new Response("Not found", { status: 404 });
  const ext = name.split(".").pop().toLowerCase();
  const download = url.searchParams.get("download") === "1" || ext !== "pdf";
  const fileName = `${policyTitle(name)}.${ext}`;
  return new Response(f.stream, {
    headers: {
      "Content-Type": f.contentType || policyType(name),
      ...(f.size ? { "Content-Length": String(f.size) } : {}),
      "Cache-Control": "private, no-store",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${fileName.replace(/"/g, "")}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  });
}
