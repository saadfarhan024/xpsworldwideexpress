type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

export async function sendEmail(message: EmailMessage) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Configure RESEND_API_KEY and EMAIL_FROM to send account emails.");
    }
    console.info(`[development email] To: ${message.to}\nSubject: ${message.subject}\n\n${message.text}`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [message.to],
      subject: message.subject,
      text: message.text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Account email delivery failed:", response.status, detail);
    throw new Error("Could not deliver account email.");
  }
}

export function appUrl(path: string) {
  const origin = process.env.APP_URL ?? (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");
  if (!origin) throw new Error("Set APP_URL to the public application origin.");
  return new URL(path, origin).toString();
}

export async function sendVerificationEmail(params: {
  to: string;
  contactName: string;
  token: string;
}) {
  const verificationUrl = appUrl(`/verify-email?token=${encodeURIComponent(params.token)}`);
  await sendEmail({
    to: params.to,
    subject: "Verify your XPS Worldwide Express account",
    text: `Hello ${params.contactName},\n\nConfirm your email address to submit your XPS business account for review:\n\n${verificationUrl}\n\nThis link expires in 24 hours.\n\nIf you did not receive this earlier or the link expired, request a new one at ${appUrl("/resend-verification")}.`,
  });
}

export async function sendPasswordResetEmail(params: { to: string; token: string }) {
  const resetUrl = appUrl(`/reset-password?token=${encodeURIComponent(params.token)}`);
  await sendEmail({
    to: params.to,
    subject: "Reset your XPS Worldwide Express password",
    text: `Use this one-time link to reset your password:\n\n${resetUrl}\n\nThis link expires in one hour. If you did not request a password reset, you can ignore this email.`,
  });
}

export async function sendApplicationDecisionEmail(params: {
  to: string;
  contactName: string;
  companyName: string;
  approved: boolean;
  reason?: string;
}) {
  if (params.approved) {
    await sendEmail({
      to: params.to,
      subject: "Your XPS business account has been approved",
      text: `Hello ${params.contactName},\n\nGood news — the XPS Worldwide Express application for ${params.companyName} has been approved.\n\nYou can sign in here:\n${appUrl("/login")}\n\nWelcome to XPS.`,
    });
    return;
  }

  const reasonLine = params.reason ? `\n\nReason: ${params.reason}` : "";
  await sendEmail({
    to: params.to,
    subject: "Update on your XPS business account application",
    text: `Hello ${params.contactName},\n\nThe XPS Worldwide Express application for ${params.companyName} was not approved at this time.${reasonLine}\n\nIf you have questions, contact XPS support.`,
  });
}

export async function sendPickupUpdateEmail(params: {
  to: string;
  contactName: string;
  pickupId: string;
  status: string;
  scheduleDetails?: string;
  note?: string;
}) {
  const noteLine = params.note ? `\n\nNotes from XPS Operations: ${params.note}` : "";
  const scheduleLine = params.scheduleDetails ? `\nSchedule: ${params.scheduleDetails}` : "";
  await sendEmail({
    to: params.to,
    subject: `XPS Pickup Request Update (${params.status})`,
    text: `Hello ${params.contactName},\n\nYour pickup request (#${params.pickupId.slice(-6).toUpperCase()}) status has been updated to: ${params.status}.${scheduleLine}${noteLine}\n\nYou can review your pickup requests in the portal:\n${appUrl("/account/pickups")}\n\nThank you for choosing XPS Worldwide Express.`,
  });
}

export async function sendTicketReplyEmail(params: {
  to: string;
  contactName: string;
  ticketSubject: string;
  ticketId: string;
  replySnippet: string;
}) {
  await sendEmail({
    to: params.to,
    subject: `[Ticket #${params.ticketId.slice(-6).toUpperCase()}] New response: ${params.ticketSubject}`,
    text: `Hello ${params.contactName},\n\nXPS Support has posted a response to your ticket "${params.ticketSubject}":\n\n"${params.replySnippet}"\n\nYou can view and reply to the ticket in your portal:\n${appUrl(`/account/tickets/${params.ticketId}`)}\n\nBest regards,\nXPS Support Team`,
  });
}
