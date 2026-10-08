import { checkPasscode, getSettings } from "../../../../lib/server/settings";
import { sendEmail, emailHtml } from "../../../../lib/server/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  if (!checkPasscode(req)) return Response.json({ error: "Wrong passcode." }, { status: 401 });
  const s = await getSettings();
  const origin = new URL(req.url).origin;
  try {
    await sendEmail({
      to: s.proofreaders,
      subject: "Marketing Hub test email",
      html: emailHtml("Test email", ["If you're reading this, the Marketing Hub can send emails through Zapier.", "The attached PDF is a sample proposal."], { href: `${origin}/proposals`, label: "Open the Marketing Hub" }),
      attachmentUrl: `${origin}/proposal/sample-proposal.pdf`,
      attachmentName: "Sample proposal.pdf",
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
