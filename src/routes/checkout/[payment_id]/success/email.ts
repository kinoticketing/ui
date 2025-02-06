import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);


interface Attachment {
	filename: string;
	content: string;       // base64-encoded file content
	contentType: string;   // e.g. 'image/png'
}

export async function sendTicketEmail({
	to,
	subject,
	html,
	attachments
}: {
	to: string;
	subject: string;
	html: string;
	attachments?: Attachment[];
}) {
	resend.emails.send({
  from: 'onboarding@resend.dev',
  to: to,
  subject: subject,
  html: html,
  attachments: attachments
});
}