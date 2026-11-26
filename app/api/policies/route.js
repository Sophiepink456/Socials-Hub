// External Policies folder (Commercial Hub). Files live in the hub's private storage under
// policies/external/, never in the code (the GitHub repo is public).
// Anyone signed in to the hub can list them; adding and removing needs the Marketing Team Access passcode.
import { listFiles, putFile, removeFiles, hasStore } from "../../../lib/server/store";
import { checkPasscode } from "../../../lib/server/settings";
import { POLICY_DIR, cleanPolicyName, policyType } from "../../../lib/policies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = () => Response.json({ error: "File storage isn't set up." }, { status: 503 });
const deny = () => Response.json({ error: "Wrong Marketing Team Access passcode." }, { status: 401 });

export async function GET() {
  if (!hasStore()) return noStore();
  const files = (await listFiles(POLICY_DIR + "/"))
    .filter((f) => f.pathname.slice(POLICY_DIR.length + 1).indexOf("/") === -1 && policyType(f.pathname))
    .map((f) => ({ name: f.pathname.slice(POLICY_DIR.length + 1), size: f.size, uploadedAt: f.uploadedAt }))
    .sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
  return Response.json({ files }, { headers: { "Cache-Control": "no-store" } });
}

// One file per request (keeps each upload well under Vercel's request size limit).
export async function POST(req) {
  if (!hasStore()) return noStore();
  if (!checkPasscode(req)) return deny();
  const form = await req.formData().catch(() => null);
  const file = form && form.get("file");
  if (!file || typeof file === "string") return Response.json({ error: "No file was sent." }, { status: 400 });
  const name = cleanPolicyName(file.name);
  const type = name && policyType(name);
  if (!type) return Response.json({ error: `${file.name}: only PDF and Word files can be added.` }, { status: 400 });
  if (file.size > 4 * 1024 * 1024) return Response.json({ error: `${file.name} is over 4MB.` }, { status: 400 });
  await putFile(`${POLICY_DIR}/${name}`, Buffer.from(await file.arrayBuffer()), type);
  return Response.json({ ok: true, name });
}

export async function DELETE(req) {
  if (!hasStore()) return noStore();
  if (!checkPasscode(req)) return deny();
  const name = cleanPolicyName(new URL(req.url).searchParams.get("name") || "");
  if (!name || !policyType(name)) return Response.json({ error: "Unknown file." }, { status: 400 });
  await removeFiles([`${POLICY_DIR}/${name}`]);
  return Response.json({ ok: true });
}
