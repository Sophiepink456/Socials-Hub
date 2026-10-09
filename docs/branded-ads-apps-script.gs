// Elevation Marketing Hub: branded ads feed.
// Lists every image in the branded ads Drive folder (and its subfolders) and
// hands over a file when the hub asks for one. Only files inside this folder
// can be fetched.
//
// Set up once: script.google.com → New project → paste this in → Deploy →
// New deployment → type "Web app" → Execute as "Me" → Who has access "Anyone"
// → Deploy → copy the Web app URL into the hub's Settings page.

const FOLDER_ID = '1Ce24eeFbgsTshUHsWSi5t56BgCDrULv9';

function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    const files = listAll_();
    if (p.id) {
      const hit = files.find(function (f) { return f.id === p.id; });
      if (!hit) return json_({ error: 'That file is not in the branded ads folder.' });
      const blob = DriveApp.getFileById(p.id).getBlob();
      return json_({ name: hit.name, mimeType: blob.getContentType(), data: Utilities.base64Encode(blob.getBytes()) });
    }
    return json_({ files: files });
  } catch (err) {
    return json_({ error: String(err && err.message || err) });
  }
}

function listAll_() {
  const out = [];
  (function walk(folder, path) {
    const it = folder.getFiles();
    while (it.hasNext()) {
      const f = it.next();
      if (String(f.getMimeType()).indexOf('image/') !== 0) continue;
      out.push({ id: f.getId(), name: f.getName(), mimeType: f.getMimeType(), updated: f.getLastUpdated().toISOString(), size: f.getSize(), path: path });
    }
    const sub = folder.getFolders();
    while (sub.hasNext()) { const s = sub.next(); walk(s, path.concat([s.getName()])); }
  })(DriveApp.getFolderById(FOLDER_ID), []);
  return out;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
