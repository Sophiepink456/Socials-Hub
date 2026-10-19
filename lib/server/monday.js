// Talking to monday.com for the Marketing Request Form.
// The API token: MONDAY_API_TOKEN in Vercel if set, otherwise the one saved on the Settings page
// (kept in the hub's private storage, never sent back to a browser).
import crypto from "node:crypto";
import { saveJson, loadLatestJson, hasStore } from "./store";
import { BOARD_ID, GROUP_ID, COLUMNS, itemName } from "../request";

const API = "https://api.monday.com/v2";
const VERSION = "2024-10";

export async function mondayToken() {
  if (process.env.MONDAY_API_TOKEN) return process.env.MONDAY_API_TOKEN;
  if (!hasStore()) return "";
  const s = await loadLatestJson("secrets/monday").catch(() => null);
  return (s && s.token) || "";
}

async function gql(query, variables, token) {
  const t = token || (await mondayToken());
  if (!t) throw new Error("The hub isn’t connected to monday.com yet.");
  const r = await fetch(API, {
    method: "POST",
    headers: { Authorization: t, "Content-Type": "application/json", "API-Version": VERSION },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.errors || j.error_message) {
    const why = (j.errors && j.errors[0] && j.errors[0].message) || j.error_message || `HTTP ${r.status}`;
    throw new Error(`monday.com said: ${why}`);
  }
  return j.data;
}

// Check a token works (and can see the board) before saving it.
export async function checkToken(token) {
  const d = await gql(`query ($b: [ID!]) { me { name email } boards(ids: $b) { id name } }`, { b: [String(BOARD_ID)] }, token);
  if (!d.boards || !d.boards.length) throw new Error("That token can’t see the Marketing & Design WIP board.");
  return { name: d.me && d.me.name, board: d.boards[0].name };
}

export async function saveToken(token) {
  const t = String(token || "").trim();
  const who = await checkToken(t);
  await saveJson("secrets/monday", { token: t, by: who.name, savedAt: new Date().toISOString() });
  return who;
}

export async function mondayStatus() {
  if (process.env.MONDAY_API_TOKEN) return { connected: true, by: "Vercel setting" };
  if (!hasStore()) return { connected: false };
  const s = await loadLatestJson("secrets/monday").catch(() => null);
  return s && s.token ? { connected: true, by: s.by || "", savedAt: s.savedAt } : { connected: false };
}

// The board's date-and-time columns are in UTC.
const utc = (dt) => ({ date: dt.toISOString().slice(0, 10), time: dt.toISOString().slice(11, 19) });

export async function createRequestItem(d) {
  const cols = {
    [COLUMNS.name]: d.name,
    [COLUMNS.email]: { email: d.email, text: d.email },
    [COLUMNS.requestedOn]: utc(new Date()),
    [COLUMNS.deadline]: { date: d.deadline },
    [COLUMNS.client]: d.client,
    [COLUMNS.requesting]: { labels: d.requesting },
    [COLUMNS.content]: { text: d.content },
  };
  if (d.brand.length) cols[COLUMNS.brand] = { labels: d.brand };
  const data = await gql(
    `mutation ($b: ID!, $g: String!, $n: String!, $c: JSON!) { create_item(board_id: $b, group_id: $g, item_name: $n, column_values: $c, create_labels_if_missing: true) { id url } }`,
    { b: String(BOARD_ID), g: GROUP_ID, n: itemName(d), c: JSON.stringify(cols) },
  );
  return data.create_item;
}

// Files are added one at a time after the item exists. Only items this hub has just made can take
// files: the browser gets a signed ticket for each one.
const secret = () => process.env.SITE_GATE_SECRET || process.env.BLOB_READ_WRITE_TOKEN || process.env.SETTINGS_PASSCODE || "local-dev-only";
export const fileTicket = (itemId) => {
  const exp = Date.now() + 30 * 60000;
  return `${exp}.${crypto.createHmac("sha256", secret()).update(`req:${itemId}:${exp}`).digest("base64url")}`;
};
export function checkTicket(itemId, ticket) {
  const [exp, sig] = String(ticket || "").split(".");
  if (!exp || !sig || !(Number(exp) > Date.now())) return false;
  const want = crypto.createHmac("sha256", secret()).update(`req:${itemId}:${exp}`).digest("base64url");
  return want.length === sig.length && crypto.timingSafeEqual(Buffer.from(want), Buffer.from(sig));
}

export async function addFile(itemId, file) {
  const t = await mondayToken();
  if (!t) throw new Error("The hub isn’t connected to monday.com yet.");
  const fd = new FormData();
  fd.append("query", `mutation ($file: File!) { add_file_to_column (item_id: ${Number(itemId)}, column_id: "${COLUMNS.files}", file: $file) { id } }`);
  fd.append("variables[file]", file, file.name || "file");
  const r = await fetch(`${API}/file`, { method: "POST", headers: { Authorization: t, "API-Version": VERSION }, body: fd });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.errors || j.error_message) throw new Error((j.errors && j.errors[0] && j.errors[0].message) || j.error_message || `HTTP ${r.status}`);
  return j.data && j.data.add_file_to_column;
}
