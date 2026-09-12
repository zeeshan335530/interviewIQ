import React from 'react'
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { motion } from "motion/react"
import { buildStyles, CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import jsPDF from "jspdf"
import axios from "axios"
import { SERVER_URL } from "../config"
import toast from "react-hot-toast"

function Step3Report({ report }) {
  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading Report...</p>
      </div>
    );
  }
  const navigate = useNavigate()
  const [expandedTranscript, setExpandedTranscript] = React.useState(null);
  const [emailSent, setEmailSent] = React.useState(false);
  const [emailSending, setEmailSending] = React.useState(false);

  const {
    finalScore = 0,
    confidence = 0,
    communication = 0,
    correctness = 0,
    delivery = 0,
    roadmap = null,
    questionWiseScore = [],
  } = report;

  const questionScoreData = questionWiseScore.map((score, index) => ({
    name: `Q${index + 1}`,
    score: score.score || 0
  }))

  const skills = [
    { label: "Confidence",    value: confidence },
    { label: "Communication", value: communication },
    { label: "Correctness",   value: correctness },
    { label: "Delivery",      value: delivery },
  ];

  let performanceText = "";
  let shortTagline = "";

  if (finalScore >= 8) {
    performanceText = "Ready for job opportunities.";
    shortTagline = "Excellent clarity and structured responses.";
  } else if (finalScore >= 5) {
    performanceText = "Needs minor improvement before interviews.";
    shortTagline = "Good foundation, refine articulation.";
  } else {
    performanceText = "Significant improvement required.";
    shortTagline = "Work on clarity and confidence.";
  }

  const score = finalScore;
  const percentage = (score / 10) * 100;


  const downloadPDF = async () => {
  const doc = new jsPDF("p", "mm", "a4");

  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();

  const M = 18;
  const CW = PW - M * 2;

  const GREEN = [16, 185, 129];
  const DARK = [31, 41, 55];
  const GRAY = [107, 114, 128];
  const LIGHT = [249, 250, 251];
  const PURPLE = [139, 92, 246];
  const AMBER = [245, 158, 11];
  const RED = [239, 68, 68];
  const BLUE = [59, 130, 246];
  const WHITE = [255, 255, 255];

  const integrityScore = report.integrityScore || "High";
  const snapshots = report.snapshots || [];
  const role = report.role || "Software Developer";
  const mode = report.mode || "Technical";
  const candidateName = report.userName || "Candidate";

  const interviewDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  let y = M;

  // ---------------------------------------------------------
  // Helper: Footer
  // ---------------------------------------------------------
  const addFooter = () => {
    const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;

    doc.setDrawColor(...GRAY);
    doc.setLineWidth(0.3);
    doc.line(M, PH - 14, PW - M, PH - 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);

    doc.text(
      "InterviewIQ.AI - Confidential Report",
      PW / 2,
      PH - 8,
      { align: "center" }
    );

    doc.text(
      `Page ${pageNumber}`,
      PW - M,
      PH - 8,
      { align: "right" }
    );
  };

  // ---------------------------------------------------------
  // Helper: New page
  // ---------------------------------------------------------
  const newPage = () => {
    addFooter();
    doc.addPage();
    y = M;
  };

  // ---------------------------------------------------------
  // Helper: Make sure there is enough space
  // ---------------------------------------------------------
  const checkY = (height = 20) => {
    if (y + height > PH - 22) {
      newPage();
    }
  };

  // ---------------------------------------------------------
  // Helper: Section heading
  // ---------------------------------------------------------
  const sectionHeader = (title, color = GREEN) => {
    checkY(15);

    doc.setFillColor(...color);
    doc.rect(M, y, 3, 10, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...DARK);

    doc.text(title, M + 6, y + 7);

    y += 15;
  };

  // ---------------------------------------------------------
  // Helper: Draw wrapped text
  // ---------------------------------------------------------
  const drawWrappedText = (
    text,
    x,
    startY,
    width,
    fontSize = 8,
    lineHeight = 4.5,
    options = {}
  ) => {
    const safeText = String(text || "");

    doc.setFont("helvetica", options.bold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(...(options.color || DARK));

    const lines = doc.splitTextToSize(safeText, width);

    doc.text(lines, x, startY, {
      align: options.align || "left",
      lineHeightFactor: lineHeight / fontSize,
    });

    return {
      lines,
      height: lines.length * lineHeight,
    };
  };

  // ---------------------------------------------------------
  // Helper: Text box
  // ---------------------------------------------------------
  
const drawTextBox = ({
  title,
  text,
  background,
  titleColor,
  textColor = DARK,
  width = CW,
}) => {
  const padding = 5;
  const titleHeight = 7;
  const lineHeight = 4.5;

  // Clean the text before putting it into the PDF
  const cleanText = String(text || "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const lines = doc.splitTextToSize(
    cleanText,
    width - padding * 2
  );

  // IMPORTANT:
  // lineHeight is actual mm spacing between lines.
  const textHeight = lines.length * lineHeight;

  const boxHeight =
    padding +
    titleHeight +
    3 +
    textHeight +
    padding;

  checkY(boxHeight + 4);

  // Box
  doc.setFillColor(...background);
  doc.roundedRect(
    M,
    y,
    width,
    boxHeight,
    2,
    2,
    "F"
  );

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...titleColor);

  doc.text(
    title,
    M + padding,
    y + padding + 1
  );

  // Text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...textColor);

  // DO NOT use lineHeightFactor here.
  // It was causing the text to overlap.
  doc.text(
    lines,
    M + padding,
    y + padding + titleHeight + 3
  );

  y += boxHeight + 5;
};

  // ---------------------------------------------------------
  // COVER PAGE
  // ---------------------------------------------------------

  doc.setFillColor(...GREEN);
  doc.rect(0, 0, PW, 45, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...WHITE);
  doc.text("InterviewIQ.AI", PW / 2, 18, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    "AI-Powered Mock Interview Platform",
    PW / 2,
    27,
    { align: "center" }
  );

  doc.setFontSize(9);
  doc.text(
    "INTERVIEW PERFORMANCE REPORT",
    PW / 2,
    36,
    { align: "center" }
  );

  // Candidate card
  doc.setFillColor(...LIGHT);
  doc.roundedRect(M, 55, CW, 52, 4, 4, "F");

  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.5);
  doc.roundedRect(M, 55, CW, 52, 4, 4, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...DARK);

  const candidateLines = doc.splitTextToSize(
    candidateName,
    CW - 20
  );

  doc.text(candidateLines, PW / 2, 72, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);

  const details = `Role: ${role} | Mode: ${mode} | Date: ${interviewDate}`;

  const detailLines = doc.splitTextToSize(
    details,
    CW - 20
  );

  doc.text(detailLines, PW / 2, 84, {
    align: "center",
  });

  // Score
  const scoreColor =
    finalScore >= 7
      ? GREEN
      : finalScore >= 5
      ? AMBER
      : RED;

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(4);
  doc.circle(PW / 2, 130, 28, "S");

  doc.setDrawColor(...scoreColor);
  doc.circle(PW / 2, 130, 28, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(...scoreColor);

  doc.text(`${finalScore}`, PW / 2, 133, {
    align: "center",
  });

  doc.setFontSize(10);
  doc.setTextColor(...GRAY);

  doc.text(
    "out of 10",
    PW / 2,
    141,
    { align: "center" }
  );

  const verdict =
    finalScore >= 8
      ? "STRONG CANDIDATE"
      : finalScore >= 5
      ? "NEEDS IMPROVEMENT"
      : "NOT READY";

  doc.setFillColor(...scoreColor);

  doc.roundedRect(
    PW / 2 - 30,
    165,
    60,
    10,
    3,
    3,
    "F"
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...WHITE);

  doc.text(
    verdict,
    PW / 2,
    171.5,
    { align: "center" }
  );

  // Integrity
  const integrityColor =
    integrityScore === "High"
      ? GREEN
      : integrityScore === "Medium"
      ? AMBER
      : RED;

  doc.setFillColor(...integrityColor);

  doc.roundedRect(
    PW / 2 - 22,
    180,
    44,
    9,
    3,
    3,
    "F"
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);

  doc.text(
    `Integrity: ${integrityScore}`,
    PW / 2,
    185.5,
    { align: "center" }
  );

  // Metrics
  const metrics = [
    { label: "Confidence", value: confidence },
    { label: "Communication", value: communication },
    { label: "Correctness", value: correctness },
    { label: "Delivery", value: delivery },
  ];

  const cardW = (CW - 9) / 4;

  metrics.forEach((metric, index) => {
    const cardX = M + index * (cardW + 3);

    const metricColor =
      metric.value >= 7
        ? GREEN
        : metric.value >= 5
        ? AMBER
        : RED;

    doc.setFillColor(...WHITE);
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);

    doc.roundedRect(
      cardX,
      198,
      cardW,
      22,
      2,
      2,
      "FD"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...metricColor);

    doc.text(
      `${metric.value}`,
      cardX + cardW / 2,
      210,
      { align: "center" }
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);

    doc.text(
      metric.label,
      cardX + cardW / 2,
      216,
      { align: "center" }
    );
  });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);

  doc.text(
    performanceText,
    PW / 2,
    232,
    { align: "center" }
  );

  doc.text(
    shortTagline,
    PW / 2,
    239,
    { align: "center" }
  );

  doc.setFillColor(...GREEN);
  doc.rect(0, PH - 18, PW, 18, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);

  doc.text(
    "This report is confidential and generated automatically by InterviewIQ.AI",
    PW / 2,
    PH - 8,
    { align: "center" }
  );

  // ---------------------------------------------------------
  // PAGE 2 - SUMMARY
  // ---------------------------------------------------------

  newPage();

  sectionHeader("PERFORMANCE SUMMARY", GREEN);

  // Score bars
  const drawScoreBar = (label, value, x, width) => {
    checkY(14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...DARK);

    doc.text(label, x, y);

    doc.setFillColor(229, 231, 235);
    doc.roundedRect(
      x,
      y + 2,
      width,
      4,
      1,
      1,
      "F"
    );

    const barColor =
      value >= 7
        ? GREEN
        : value >= 5
        ? AMBER
        : RED;

    doc.setFillColor(...barColor);

    doc.roundedRect(
      x,
      y + 2,
      width * Math.min(value / 10, 1),
      4,
      1,
      1,
      "F"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...barColor);

    doc.text(
      `${value}/10`,
      x + width + 3,
      y + 5
    );
  };

  drawScoreBar(
    "Confidence",
    confidence,
    M,
    CW / 2 - 8
  );

  drawScoreBar(
    "Communication",
    communication,
    M + CW / 2 + 4,
    CW / 2 - 8
  );

  y += 14;

  drawScoreBar(
    "Correctness",
    correctness,
    M,
    CW / 2 - 8
  );

  drawScoreBar(
    "Delivery",
    delivery,
    M + CW / 2 + 4,
    CW / 2 - 8
  );

  y += 18;

  // Question trend
  sectionHeader("QUESTION SCORE TREND", BLUE);

  const chartHeight = 38;
  const count = Math.max(questionWiseScore.length, 1);

  const spacing = CW / count;
  const barWidth = Math.min(10, spacing - 4);

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);

  doc.line(
    M,
    y + chartHeight,
    M + CW,
    y + chartHeight
  );

  questionWiseScore.forEach((question, index) => {
    const scoreValue = question.score || 0;

    const barHeight =
      (scoreValue / 10) * chartHeight;

    const barX =
      M + index * spacing + (spacing - barWidth) / 2;

    const barY =
      y + chartHeight - barHeight;

    const barColor =
      scoreValue >= 7
        ? GREEN
        : scoreValue >= 5
        ? AMBER
        : RED;

    doc.setFillColor(...barColor);

    doc.roundedRect(
      barX,
      barY,
      barWidth,
      Math.max(barHeight, 1),
      1,
      1,
      "F"
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);

    doc.text(
      `Q${index + 1}`,
      barX + barWidth / 2,
      y + chartHeight + 5,
      { align: "center" }
    );

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...barColor);

    doc.text(
      `${scoreValue}`,
      barX + barWidth / 2,
      Math.max(barY - 2, y + 3),
      { align: "center" }
    );
  });

  y += chartHeight + 14;

  // Integrity
  sectionHeader(
    "PROCTORING & INTEGRITY REPORT",
    RED
  );

  doc.setFillColor(...integrityColor);

  doc.roundedRect(
    M,
    y,
    50,
    12,
    3,
    3,
    "F"
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...WHITE);

  doc.text(
    `Integrity: ${integrityScore}`,
    M + 25,
    y + 8,
    { align: "center" }
  );

  const integrityDesc =
    integrityScore === "High"
      ? "No significant violations detected. Interview conducted with high integrity."
      : integrityScore === "Medium"
      ? "Minor violations detected. Review the monitoring log below."
      : "Multiple violations detected. Review the integrity report carefully.";

  const integrityLines = doc.splitTextToSize(
    integrityDesc,
    CW - 60
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...DARK);

  doc.text(
    integrityLines,
    M + 55,
    y + 5
  );

  y += Math.max(
    18,
    integrityLines.length * 4.5 + 8
  );

  // Snapshots
  if (snapshots.length > 0) {
    checkY(60);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...DARK);

    doc.text(
      "Interview Monitoring Snapshots",
      M,
      y
    );

    y += 6;

    const snapW = 42;
    const snapH = 32;
    const snapGap = 4;

    snapshots.slice(0, 4).forEach((snapshot, index) => {
      const snapX =
        M + index * (snapW + snapGap);

      try {
        doc.addImage(
          snapshot.imageData,
          "JPEG",
          snapX,
          y,
          snapW,
          snapH
        );
      } catch {
        doc.setFillColor(229, 231, 235);

        doc.rect(
          snapX,
          y,
          snapW,
          snapH,
          "F"
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...GRAY);

        doc.text(
          "No image",
          snapX + snapW / 2,
          y + snapH / 2,
          { align: "center" }
        );
      }

      doc.setDrawColor(...GRAY);
      doc.rect(
        snapX,
        y,
        snapW,
        snapH,
        "S"
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...GRAY);

      doc.text(
        `Q${snapshot.questionIndex + 1} - ${snapshot.timestamp}`,
        snapX + snapW / 2,
        y + snapH + 4,
        { align: "center" }
      );
    });

    y += snapH + 12;
  }

  // ---------------------------------------------------------
  // QUESTION BREAKDOWN
  // ---------------------------------------------------------

  newPage();

  sectionHeader(
    "DETAILED QUESTION BREAKDOWN",
    GREEN
  );

  questionWiseScore.forEach((question, index) => {
    const qScore = question.score ?? 0;

    const qColor =
      qScore >= 7
        ? GREEN
        : qScore >= 5
        ? AMBER
        : RED;

    // Estimate question height before drawing
    const questionLines = doc.splitTextToSize(
      question.question || "",
      CW - 35
    );

    checkY(
      25 +
      questionLines.length * 5
    );

    // Question number
    doc.setFillColor(...qColor);

    doc.circle(
      M + 5,
      y + 5,
      5,
      "F"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);

    doc.text(
      `Q${index + 1}`,
      M + 5,
      y + 7,
      { align: "center" }
    );

    // Difficulty
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);

    doc.text(
      (question.difficulty || "medium").toUpperCase(),
      M + 14,
      y + 4
    );

    // Score
    doc.setFillColor(...qColor);

    doc.roundedRect(
      PW - M - 20,
      y,
      20,
      8,
      2,
      2,
      "F"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...WHITE);

    doc.text(
      `${qScore}/10`,
      PW - M - 10,
      y + 5.5,
      { align: "center" }
    );

    // Question text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...DARK);

    doc.text(
      questionLines,
      M + 14,
      y + 12
    );

    y += 12 + questionLines.length * 5;

    // Stats
    if (
      question.wpm > 0 ||
      question.fillerCount > 0 ||
      question.deliveryScore > 0
    ) {
      const stats = [];

      if (question.deliveryScore > 0) {
        stats.push(
          `Delivery: ${question.deliveryScore}/10`
        );
      }

      if (question.wpm > 0) {
        stats.push(`${question.wpm} wpm`);
      }

      if (question.fillerCount > 0) {
        stats.push(
          `${question.fillerCount} fillers`
        );
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...GRAY);

      const statsText = stats.join(" | ");

      const statsLines = doc.splitTextToSize(
        statsText,
        CW - 20
      );

      doc.text(
        statsLines,
        M + 14,
        y
      );

      y += statsLines.length * 4 + 4;
    }

    // Answer
    if (
      question.answer &&
      question.answer.trim()
    ) {
      drawTextBox({
        title: "YOUR ANSWER",
        text: question.answer,
        background: [239, 246, 255],
        titleColor: BLUE,
      });
    }

    // Feedback
    if (
      question.feedback &&
      question.feedback.trim()
    ) {
      drawTextBox({
        title: "AI FEEDBACK",
        text: question.feedback,
        background: [240, 253, 244],
        titleColor: GREEN,
      });
    }

    // Ideal answer
    if (
      question.modelAnswer &&
      question.modelAnswer.trim()
    ) {
      drawTextBox({
        title: "IDEAL ANSWER",
        text: question.modelAnswer,
        background: [245, 243, 255],
        titleColor: PURPLE,
      });
    }

    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);

    checkY(5);

    doc.line(
      M,
      y,
      PW - M,
      y
    );

    y += 8;
  });

  // ---------------------------------------------------------
  // ROADMAP
  // ---------------------------------------------------------

  if (roadmap) {
    newPage();

    sectionHeader(
      "PERSONALIZED IMPROVEMENT ROADMAP",
      PURPLE
    );

    // Overall summary
    if (roadmap.overallSummary) {
      drawTextBox({
        title: "OVERALL SUMMARY",
        text: roadmap.overallSummary,
        background: [239, 246, 255],
        titleColor: BLUE,
      });
    }

    // Strengths
    if (roadmap.strengths?.length > 0) {
      sectionHeader(
        "YOUR STRENGTHS",
        GREEN
      );

      roadmap.strengths.forEach((strength) => {
        const lines = doc.splitTextToSize(
          `- ${strength}`,
          CW - 10
        );

        checkY(
          lines.length * 5 + 5
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...DARK);

        doc.text(
          lines,
          M + 4,
          y
        );

        y += lines.length * 5 + 3;
      });
    }

    // Next steps
    if (roadmap.nextSteps?.length > 0) {
      sectionHeader(
        "NEXT STEPS",
        PURPLE
      );

      roadmap.nextSteps.forEach((step, index) => {
        const lines = doc.splitTextToSize(
          `${index + 1}. ${step}`,
          CW - 10
        );

        checkY(
          lines.length * 5 + 5
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...DARK);

        doc.text(
          lines,
          M + 4,
          y
        );

        y += lines.length * 5 + 3;
      });
    }

    // Weak areas
    if (roadmap.weakAreas?.length > 0) {
      sectionHeader(
        "AREAS TO IMPROVE",
        AMBER
      );

      roadmap.weakAreas.forEach((weakArea) => {
        const topic = weakArea.topic || "Topic";

        const reason =
          weakArea.reason
            ? `Reason: ${weakArea.reason}`
            : "";

        const action =
          weakArea.action
            ? `Action: ${weakArea.action}`
            : "";

        const resource =
          weakArea.resource
            ? `Resource: ${weakArea.resource}`
            : "";

        const content = [
          reason,
          action,
          resource,
        ].filter(Boolean);

        const lines = [];

        content.forEach((item) => {
          const wrapped = doc.splitTextToSize(
            item,
            CW - 12
          );

          lines.push(...wrapped);
        });

        const boxHeight =
          14 + lines.length * 4.5;

        checkY(boxHeight + 5);

        doc.setFillColor(255, 251, 235);
        doc.setDrawColor(...AMBER);
        doc.setLineWidth(0.3);

        doc.roundedRect(
          M,
          y,
          CW,
          boxHeight,
          2,
          2,
          "FD"
        );

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...AMBER);

        doc.text(
          topic,
          M + 4,
          y + 7
        );

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...DARK);

        doc.text(
          lines,
          M + 4,
          y + 13
        );

        y += boxHeight + 5;
      });
    }

    checkY(15);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...GREEN);

    doc.text(
      "Keep practicing. Every interview makes you stronger.",
      PW / 2,
      y,
      { align: "center" }
    );
  }

  // ---------------------------------------------------------
  // FINALIZE PDF
  // ---------------------------------------------------------

  addFooter();

  const fileName =
    `InterviewIQ_Report_${candidateName
      .replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

  doc.save(fileName);

  // ---------------------------------------------------------
  // SEND EMAIL
  // ---------------------------------------------------------

  if (report.interviewId && !emailSent) {
    setEmailSending(true);

    try {
      const pdfBase64 =
        doc.output("datauristring").split(",")[1];

      await axios.post(
        `${SERVER_URL}/api/interview/send-report`,
        {
          interviewId: report.interviewId,
          pdfBase64,
        },
        {
          withCredentials: true,
        }
      );

      setEmailSent(true);

      toast.success(
        "Report sent to your email!"
      );
    } catch (error) {
      console.warn(
        "[Email] Failed to send:",
        error.message
      );

      // PDF download still succeeds
    } finally {
      setEmailSending(false);
    }
  }
};

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-green-50 px-4 sm:px-6 lg:px-10 py-8'>
      <div className='mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div className='md:mb-10 w-full flex items-start gap-4 flex-wrap'>
          <button
            onClick={() => navigate("/history")}
            className='mt-1 p-3 rounded-full bg-white shadow hover:shadow-md transition'><FaArrowLeft className='text-gray-600' /></button>

          <div>
            <h1 className='text-3xl font-bold flex-nowrap text-gray-800'>
              Interview Analytics Dashboard
            </h1>
            <p className='text-gray-500 mt-2'>
              AI-powered performance insights
            </p>

          </div>
        </div>

        <button onClick={downloadPDF} className='bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl shadow-md transition-all duration-300 font-semibold text-sm sm:text-base text-nowrap'>
          {emailSending ? "Sending..." : emailSent ? "✓ Sent to Email" : "Download PDF"}
        </button>
      </div>


      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8'>

        <div className='space-y-6'>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-6 sm:p-8 text-center">

            <h3 className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base">
              Overall Performance
            </h3>
            <div className='relative w-20 h-20 sm:w-24 sm:h-24 mx-auto'>
              <CircularProgressbar
                value={percentage}
                text={`${score}/10`}
                styles={buildStyles({
                  textSize: "18px",
                  pathColor: "#10b981",
                  textColor: "#ef4444",
                  trailColor: "#e5e7eb",
                })}
              />
            </div>

            <p className="text-gray-400 mt-3 text-xs sm:text-sm">
              Out of 10
            </p>

            <div className="mt-4">
              <p className="font-semibold text-gray-800 text-sm sm:text-base">
                {performanceText}
              </p>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">
                {shortTagline}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='bg-white rounded-2xl sm:rounded-3xl shadow-lg p-6 sm:p-8'>
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-6">
              Skill Evaluation
            </h3>

            <div className='space-y-5'>
              {
                skills.map((s, i) => (
                  <div key={i}>
                    <div className='flex justify-between mb-2 text-sm sm:text-base'>

                      <span>{s.label}</span>
                      <span className='font-semibold text-green-600'>{s.value}</span>
                    </div>

                    <div className='bg-gray-200 h-2 sm:h-3 rounded-full'>
                      <div className='bg-green-500 h-full rounded-full'
                        style={{ width: `${s.value * 10}%` }}

                      ></div>

                    </div>


                  </div>
                ))
              }
            </div>

          </motion.div>


        </div>

        <div className='lg:col-span-2 space-y-6'>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='bg-white rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-8'>
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-4 sm:mb-6">
              Performance Trend
            </h3>

            <div className='h-64 sm:h-72'>

              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={questionScoreData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Area type="monotone"
                    dataKey="score"
                    stroke="#22c55e"
                    fill="#bbf7d0"
                    strokeWidth={3} />


                </AreaChart>

              </ResponsiveContainer>


            </div>


          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='bg-white rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-8'>
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-6">
              Question Breakdown
            </h3>
            <div className='space-y-6'>
              {questionWiseScore.map((q, i) => (
                <div key={i} className='bg-gray-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200'>

                  <div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4'>
                    <div>
                      <p className="text-xs text-gray-400">
                        Question {i + 1}
                      </p>

                      <p className="font-semibold text-gray-800 text-sm sm:text-base leading-relaxed">
                        {q.question || "Question not available"}
                      </p>
                    </div>


                    <div className='bg-green-100 text-green-600 px-3 py-1 rounded-full font-bold text-xs sm:text-sm w-fit'>
                      {q.score ?? 0}/10
                    </div>
                  </div>

                  <div className='bg-green-50 border border-green-200 p-4 rounded-lg mb-3'>
                    <p className='text-xs text-green-600 font-semibold mb-1'>
                      AI Feedback
                    </p>
                    <p className='text-sm text-gray-700 leading-relaxed'>

                      {q.feedback && q.feedback.trim() !== ""
                        ? q.feedback
                        : "No feedback available for this question."}
                    </p>
                  </div>

                  {/* Your Answer */}
                  {q.answer && q.answer.trim() && (
                    <div className='bg-gray-50 border border-gray-200 p-4 rounded-lg mb-3'>
                      <p className='text-xs text-gray-500 font-semibold mb-1'>
                        Your Answer
                      </p>
                      <p className='text-sm text-gray-600 leading-relaxed'>
                        {q.answer}
                      </p>
                    </div>
                  )}

                  {/* Ideal Answer */}
                  {q.modelAnswer && q.modelAnswer.trim() && (
                    <div className='bg-purple-50 border border-purple-200 p-4 rounded-lg'>
                      <p className='text-xs text-purple-600 font-semibold mb-1 flex items-center gap-1'>
                        <span>💡</span> Ideal Answer (What a great answer looks like)
                      </p>
                      <p className='text-sm text-purple-900 leading-relaxed'>
                        {q.modelAnswer}
                      </p>
                    </div>
                  )}

                </div>
              ))}
            </div>

          </motion.div>

          {/* ── Feature 3 & 4: Delivery + Transcript Replay ── */}
          {questionWiseScore.some(q => q.transcript || q.deliveryScore > 0) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='bg-white rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-8'>
              <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-6 flex items-center gap-2">
                🎙️ Voice Delivery & Transcript Replay
              </h3>
              <div className="space-y-4">
                {questionWiseScore.map((q, i) => (
                  (q.transcript || q.deliveryScore > 0) && (
                    <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedTranscript(expandedTranscript === i ? null : i)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-gray-500">Q{i + 1}</span>
                          <div className="flex gap-2 flex-wrap">
                            {q.deliveryScore > 0 && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                q.deliveryScore >= 7 ? "bg-emerald-100 text-emerald-700" :
                                q.deliveryScore >= 5 ? "bg-yellow-100 text-yellow-700" :
                                "bg-red-100 text-red-700"
                              }`}>
                                Delivery {q.deliveryScore}/10
                              </span>
                            )}
                            {q.wpm > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                                {q.wpm} wpm
                              </span>
                            )}
                            {q.fillerCount > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold">
                                {q.fillerCount} fillers
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-gray-400 text-xs">{expandedTranscript === i ? "▲" : "▼"}</span>
                      </button>
                      {expandedTranscript === i && q.transcript && (
                        <div className="px-4 py-3 bg-white border-t border-gray-100">
                          <p className="text-xs text-gray-400 font-semibold mb-2">📝 What you said:</p>
                          <p className="text-sm text-gray-700 leading-relaxed italic">"{q.transcript}"</p>
                        </div>
                      )}
                    </div>
                  )
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Feature 5: Personalized Improvement Roadmap ── */}
          {roadmap && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='bg-white rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-8'>
              <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
                🗺️ Your Personalized Improvement Roadmap
              </h3>
              <p className="text-xs text-gray-400 mb-6">AI-generated based on your performance</p>

              {/* Overall summary */}
              {roadmap.overallSummary && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
                  <p className="text-sm text-blue-800 leading-relaxed">{roadmap.overallSummary}</p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4 mb-5">
                {/* Strengths */}
                {roadmap.strengths?.length > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-emerald-700 mb-3 flex items-center gap-1">
                      ✅ Your Strengths
                    </p>
                    <ul className="space-y-1.5">
                      {roadmap.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-emerald-800 flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">•</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Next Steps */}
                {roadmap.nextSteps?.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-purple-700 mb-3 flex items-center gap-1">
                      🚀 Next Steps
                    </p>
                    <ul className="space-y-1.5">
                      {roadmap.nextSteps.map((s, i) => (
                        <li key={i} className="text-sm text-purple-800 flex items-start gap-2">
                          <span className="text-purple-400 font-bold mt-0.5">{i + 1}.</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Weak areas with actions */}
              {roadmap.weakAreas?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-3">📚 Areas to Improve</p>
                  <div className="space-y-3">
                    {roadmap.weakAreas.map((w, i) => (
                      <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-semibold text-amber-800">{w.topic}</p>
                          <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium flex-shrink-0">Improve</span>
                        </div>
                        <p className="text-xs text-amber-700 mb-2">{w.reason}</p>
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-amber-600 font-semibold flex-shrink-0">Action:</span>
                          <p className="text-xs text-amber-700">{w.action}</p>
                        </div>
                        {w.resource && (
                          <div className="flex items-start gap-2 mt-1">
                            <span className="text-xs text-amber-600 font-semibold flex-shrink-0">Resource:</span>
                            <p className="text-xs text-amber-700">{w.resource}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}





        </div>
      </div>

    </div>
  )
}

export default Step3Report
