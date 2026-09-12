import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

console.log("Gmail user:", process.env.GMAIL_USER);
console.log("Client ID loaded:", !!process.env.GOOGLE_CLIENT_ID);
console.log("Client secret loaded:", !!process.env.GOOGLE_CLIENT_SECRET);
console.log("Refresh token loaded:", !!process.env.GOOGLE_REFRESH_TOKEN);

// ─────────────────────────────────────────────
// 1. Get a fresh Google access token
// ─────────────────────────────────────────────

const tokenResponse = await fetch(
  "https://oauth2.googleapis.com/token",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  }
);

const tokenData = await tokenResponse.json();

if (!tokenResponse.ok) {
  console.log("❌ Google token request failed");
  console.log("Status:", tokenResponse.status);
  console.log("Response:", tokenData);
  process.exit(1);
}

console.log("\n✅ Google access token obtained");
console.log("Scope:", tokenData.scope);
console.log("Expires in:", tokenData.expires_in);

// ─────────────────────────────────────────────
// 2. Check which Gmail account owns the token
// ─────────────────────────────────────────────

const gmailResponse = await fetch(
  "https://gmail.googleapis.com/gmail/v1/users/me/profile",
  {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  }
);

const gmailData = await gmailResponse.json();

console.log("\n🔎 Gmail account associated with token:");
console.log("Email:", gmailData.emailAddress);

if (!gmailResponse.ok) {
  console.log("❌ Gmail API rejected the token");
  console.log("Response:", gmailData);
  process.exit(1);
}

if (
  gmailData.emailAddress?.toLowerCase() !==
  process.env.GMAIL_USER?.toLowerCase()
) {
  console.log("\n❌ ACCOUNT MISMATCH");
  console.log("OAuth token belongs to:", gmailData.emailAddress);
  console.log("GMAIL_USER is:", process.env.GMAIL_USER);
  process.exit(1);
}

console.log("\n✅ Gmail account matches GMAIL_USER");

// ─────────────────────────────────────────────
// 3. Create Nodemailer transporter
// ─────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.GMAIL_USER,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
});

// ─────────────────────────────────────────────
// 4. Test Gmail SMTP
// ─────────────────────────────────────────────

try {
  console.log("\nChecking Gmail SMTP...\n");

  await transporter.verify();

  console.log("✅ Gmail SMTP OAuth authentication SUCCESS");

  // ─────────────────────────────────────────
  // 5. Send test email
  // ─────────────────────────────────────────

  const info = await transporter.sendMail({
    from: `"InterviewIQ.AI" <${process.env.GMAIL_USER}>`,
    to: process.env.GMAIL_USER,
    subject: "InterviewIQ Gmail OAuth Test",
    text: "This is a test email from InterviewIQ.AI using Gmail OAuth2.",
  });

  console.log("✅ EMAIL SENT SUCCESSFULLY");
  console.log("Message ID:", info.messageId);
} catch (error) {
  console.log("❌ Gmail email test FAILED");
  console.log("Code:", error.code);
  console.log("Command:", error.command);
  console.log("Response Code:", error.responseCode);
  console.log("Response:", error.response);
  console.log("Message:", error.message);
}