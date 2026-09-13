import dotenv from "dotenv";
dotenv.config();

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send interview report email with PDF attachment.
 * @param {object} opts
 * @param {string} opts.toEmail       - recipient email
 * @param {string} opts.candidateName - candidate's name
 * @param {string} opts.role          - role applied for
 * @param {number} opts.finalScore    - final score out of 10
 * @param {string} opts.integrityScore - High | Medium | Low
 * @param {string} opts.pdfBase64     - base64 encoded PDF
 * @param {object} opts.roadmap       - parsed roadmap object (optional)
 */
export const sendReportEmail = async ({
  toEmail,
  candidateName,
  role,
  finalScore,
  integrityScore = "High",
  pdfBase64,
  roadmap,
}) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY is missing. Skipping email.");
    return { skipped: true };
  }

  const verdict =
    finalScore >= 8
      ? "Strong Candidate 🌟"
      : finalScore >= 5
      ? "Needs Improvement 📈"
      : "Keep Practicing 💪";

  const strengthText = roadmap?.strengths?.length
    ? roadmap.strengths
        .slice(0, 2)
        .map((s) => `<li>${s}</li>`)
        .join("")
    : "<li>Keep working on your communication skills</li>";

  const weakText = roadmap?.weakAreas?.length
    ? roadmap.weakAreas
        .slice(0, 2)
        .map((w) => `<li><strong>${w.topic}</strong> — ${w.action}</li>`)
        .join("")
    : "<li>Review your answers and practice more</li>";

  const nextStepsText = roadmap?.nextSteps?.length
    ? roadmap.nextSteps
        .slice(0, 3)
        .map((s, i) => `<li>${i + 1}. ${s}</li>`)
        .join("")
    : "<li>Practice more mock interviews on InterviewIQ.AI</li>";

  const scoreColor =
    finalScore >= 7
      ? "#10b981"
      : finalScore >= 5
      ? "#f59e0b"
      : "#ef4444";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>

<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr>
      <td align="center">

        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#10b981;padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;">
                InterviewIQ.AI
              </h1>
              <p style="color:#d1fae5;margin:6px 0 0;font-size:13px;">
                AI-Powered Mock Interview Platform
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px 40px 0;">
              <h2 style="color:#1f2937;margin:0 0 8px;font-size:20px;">
                Hi ${candidateName}! 👋
              </h2>

              <p style="color:#6b7280;margin:0;font-size:15px;line-height:1.6;">
                Your <strong>${role}</strong> mock interview is complete.
                Here's your performance summary.
                Your full detailed report is attached as a PDF.
              </p>
            </td>
          </tr>

          <!-- Score Card -->
          <tr>
            <td style="padding:24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f9fafb;border-radius:12px;border:1px solid #e5e7eb;">

                <tr>
                  <td style="padding:24px;text-align:center;">

                    <div style="display:inline-block;width:80px;height:80px;
                      border-radius:50%;border:4px solid ${scoreColor};
                      line-height:72px;text-align:center;">

                      <span style="font-size:24px;font-weight:700;color:${scoreColor};">
                        ${finalScore}
                      </span>

                    </div>

                    <p style="color:#6b7280;margin:4px 0 0;font-size:12px;">
                      out of 10
                    </p>

                    <div style="margin-top:12px;">
                      <span style="background:${scoreColor};color:#fff;
                        padding:4px 16px;border-radius:20px;font-size:13px;font-weight:600;">
                        ${verdict}
                      </span>
                    </div>

                    <div style="margin-top:8px;">
                      <span style="
                        background:${
                          integrityScore === "High"
                            ? "#10b981"
                            : integrityScore === "Medium"
                            ? "#f59e0b"
                            : "#ef4444"
                        };
                        color:#fff;
                        padding:3px 12px;
                        border-radius:20px;
                        font-size:11px;">
                        Integrity: ${integrityScore}
                      </span>
                    </div>

                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Strengths -->
          <tr>
            <td style="padding:0 40px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;">

                <tr>
                  <td style="padding:16px 20px;">

                    <p style="color:#065f46;font-weight:700;margin:0 0 8px;font-size:13px;">
                      ✅ YOUR STRENGTHS
                    </p>

                    <ul style="color:#1f2937;margin:0;padding-left:18px;font-size:14px;line-height:1.8;">
                      ${strengthText}
                    </ul>

                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Areas to Improve -->
          <tr>
            <td style="padding:0 40px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#fffbeb;border-radius:10px;border:1px solid #fde68a;">

                <tr>
                  <td style="padding:16px 20px;">

                    <p style="color:#92400e;font-weight:700;margin:0 0 8px;font-size:13px;">
                      📚 AREAS TO IMPROVE
                    </p>

                    <ul style="color:#1f2937;margin:0;padding-left:18px;font-size:14px;line-height:1.8;">
                      ${weakText}
                    </ul>

                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Next Steps -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f5f3ff;border-radius:10px;border:1px solid #ddd6fe;">

                <tr>
                  <td style="padding:16px 20px;">

                    <p style="color:#5b21b6;font-weight:700;margin:0 0 8px;font-size:13px;">
                      🚀 NEXT STEPS
                    </p>

                    <ul style="color:#1f2937;margin:0;padding-left:18px;font-size:14px;line-height:1.8;">
                      ${nextStepsText}
                    </ul>

                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- PDF note -->
          <tr>
            <td style="padding:0 40px 24px;">

              <p style="color:#6b7280;font-size:13px;margin:0;text-align:center;">
                📎 Your complete report with question-wise breakdown,
                snapshots, and improvement roadmap is attached as a PDF.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">

              <p style="color:#9ca3af;font-size:12px;margin:0;">
                InterviewIQ.AI — AI-Powered Interview Practice<br/>
                This email was sent automatically after your interview session.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;

  const filename = `InterviewIQ_Report_${candidateName
    .replace(/\s+/g, "_")}.pdf`;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "InterviewIQ.AI <onboarding@resend.dev>",
    to: [toEmail],
    subject: `Your InterviewIQ Report — ${role} — Score ${finalScore}/10`,
    html,
    attachments: pdfBase64
      ? [
          {
            filename,
            content: pdfBase64,
          },
        ]
      : [],
  });

  if (error) {
    console.error("[Email] Resend failed:", error);
    throw new Error(error.message || "Failed to send email");
  }

  console.log("[Email] Resend email sent successfully:", data?.id);

  return { sent: true, id: data?.id };
};