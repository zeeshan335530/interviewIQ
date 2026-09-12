import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { askAi, parseAiJson } from "../services/groq.service.js";
import { sendReportEmail } from "../services/email.service.js";
import User from "../models/user.model.js";
import Interview from "../models/interview.model.js";

// ─────────────────────────────────────────────────────────────────────────────
// ANALYZE RESUME
// ─────────────────────────────────────────────────────────────────────────────
export const analyzeResume = async (req, res) => {
  const filePath = req.file?.path;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "Resume file is required." });
    }

    const fileBuffer = await fs.promises.readFile(filePath);
    const uint8Array = new Uint8Array(fileBuffer);
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

    let resumeText = "";
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      resumeText += content.items.map((item) => item.str).join(" ") + "\n";
    }

    resumeText = resumeText.replace(/\s+/g, " ").trim();

    if (!resumeText) {
      return res.status(400).json({ message: "Could not extract text from the PDF." });
    }

    const messages = [
      {
        role: "system",
        content: `Extract structured data from the resume. Return ONLY valid JSON, no markdown, no explanation:
{
  "role": "string",
  "experience": "string",
  "projects": ["project1", "project2"],
  "skills": ["skill1", "skill2"]
}`,
      },
      { role: "user", content: resumeText.slice(0, 4000) },
    ];

    const aiResponse = await askAi(messages, { temperature: 0.3, max_tokens: 512 });
    const parsed = parseAiJson(aiResponse);

    // Clean up uploaded file
    fs.unlink(filePath, () => {});

    return res.json({
      role: parsed.role || "",
      experience: parsed.experience || "",
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      resumeText,
    });
  } catch (error) {
    console.error("[analyzeResume]", error.message);
    if (filePath && fs.existsSync(filePath)) fs.unlink(filePath, () => {});
    return res.status(500).json({ message: "Failed to analyze resume. Please try again." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GENERATE QUESTIONS
// ─────────────────────────────────────────────────────────────────────────────
export const generateQuestion = async (req, res) => {
  try {
    let {
  company,
  role,
  experience,
  mode,
  jobDescription,
  resumeText,
  projects,
  skills
} = req.body;

    company = company?.trim();
role = role?.trim();
experience = experience?.trim();
mode = mode?.trim();
jobDescription = jobDescription?.trim() || "";
    if (!company || !role || !experience || !mode) {
  return res.status(400).json({
    message: "Company, role, experience, and mode are required."
  });
}

    const user = await User.findById(req.userId);

if (!user) {
  return res.status(404).json({ message: "User not found." });
}

// Make sure older users always have a valid name
if (!user.name || !user.name.trim()) {
  user.name = "Interview Candidate";
}

    if (user.credits < 50) {
      return res.status(400).json({
        message: "Not enough credits. You need at least 50 credits to start an interview.",
      });
    }

    const projectList = Array.isArray(projects) && projects.length ? projects : [];
    const skillList   = Array.isArray(skills)   && skills.length   ? skills   : [];
    const safeResume  = resumeText?.trim() || "";
    const hasResume   = safeResume.length > 50;
    const resumeContext = hasResume ? safeResume.slice(0, 4000) : "No resume provided.";
    const jdContext = jobDescription
  ? jobDescription.slice(0, 5000)
  : "No job description provided.";

    // ── Build mode-specific prompt ────────────────────────────────────────────
    const isTechnical = mode === "Technical";

    const technicalPrompt = `You are a senior software engineer conducting a real technical job interview.

You are conducting a ${company}-specific interview for the role of ${role}.

The interview must be aligned with the provided Job Description and candidate resume.

Your priorities are:
1. Identify technologies and skills explicitly required by the Job Description.
2. Prioritize skills that appear in both the Job Description and candidate resume.
3. Identify important JD skills missing from the candidate's resume.
4. Ask realistic questions relevant to the ${company} ${role} position.
5. Use the candidate's projects and skills to personalize questions.
6. Do not invent experience that is not present in the resume.

Generate exactly 10 interview questions as a JSON array.

QUESTION STRUCTURE (follow this order strictly):

Q1  — "Tell me about yourself" — always this exact phrasing. difficulty: "easy", timeLimit: 90
Q2  — Project question: ask about ${projectList[0] || "their first project"} — what they built, tech used, challenges. difficulty: "easy", timeLimit: 90
Q3  — Project question: ask about ${projectList[1] || projectList[0] || "another project"} — architecture, decisions, what they'd improve. difficulty: "easy", timeLimit: 90
Q4  — Project deep dive: pick the most technically interesting project and ask HOW a specific feature was implemented. difficulty: "medium", timeLimit: 90
Q5  — Core CS: OOPs concept — ask a conceptual question (inheritance, polymorphism, abstraction, encapsulation) with a real-world example. difficulty: "medium", timeLimit: 90
Q6  — Core CS: DBMS or OS — normalization / indexing / process vs thread / deadlock — pick based on their skills. difficulty: "medium", timeLimit: 90
Q7  — Skills-based: pick the most prominent skill from [${skillList.join(", ") || role}] and ask a technical depth question. difficulty: "medium", timeLimit: 90
Q8  — Coding/Output: give a SHORT code snippet (5–8 lines, OOPs or basic logic) and ask "What will be the output of this code and why?". Include the code inside the question text. difficulty: "hard", timeLimit: 120
Q9  — Problem solving: give a simple algorithmic problem — array, string, or recursion based. Ask them to explain their approach. difficulty: "hard", timeLimit: 120
Q10 — Scalability/System thinking: "If your ${projectList[0] || "application"} had to handle 1 million users, what changes would you make?" difficulty: "hard", timeLimit: 120

RULES:
- Return ONLY a valid JSON array, no markdown, no explanation, no numbering outside JSON.
- Each object: { "question": "...", "difficulty": "easy|medium|hard", "timeLimit": number }
- Q1 must be exactly: "Tell me about yourself — walk me through your background, projects, and what you're currently working on."
- Questions must sound like a real human interviewer speaking — conversational, direct, professional.
- For Q8, embed the actual code snippet inside the question string using plain text (no markdown backticks).
- Do NOT repeat questions or topics.`;

    const hrPrompt = `You are an experienced HR interviewer conducting a professional HR interview.

You are interviewing a candidate for ${company} for the role of ${role}.

Use the Job Description and candidate resume to personalize the interview.

Focus on:
- Motivation for the company and role
- Candidate's projects and experience
- Behavioral situations
- Skills relevant to the JD
- Candidate's strengths and skill gaps

Generate exactly 10 interview questions as a JSON array.

QUESTION STRUCTURE (follow this order strictly):

Q1  — "Tell me about yourself" — always this exact phrasing. difficulty: "easy", timeLimit: 90
Q2  — Why are you interested in the ${role} role? difficulty: "easy", timeLimit: 60
Q3  — Tell me about a project you're most proud of and why. difficulty: "easy", timeLimit: 90
Q4  — Describe a time you faced a challenge at work/college and how you handled it. difficulty: "medium", timeLimit: 90
Q5  — How do you handle working under pressure or tight deadlines? difficulty: "medium", timeLimit: 60
Q6  — Tell me about a time you worked in a team — what was your role and how did you contribute? difficulty: "medium", timeLimit: 90
Q7  — Have you ever had a conflict with a teammate or colleague? How did you resolve it? difficulty: "medium", timeLimit: 90
Q8  — Where do you see yourself in 3–5 years? difficulty: "medium", timeLimit: 60
Q9  — What are your strengths and one area you're actively working to improve? difficulty: "hard", timeLimit: 90
Q10 — Why should we hire you over other candidates? difficulty: "hard", timeLimit: 90

RULES:
- Return ONLY a valid JSON array, no markdown, no explanation.
- Each object: { "question": "...", "difficulty": "easy|medium|hard", "timeLimit": number }
- Q1 must be exactly: "Tell me about yourself — walk me through your background, projects, and what you're currently working on."
- Questions must sound like a real human HR interviewer — warm, professional, conversational.
- Personalize Q3 and Q4 using the candidate's actual projects/experience if resume is available.`;

    const messages = [
      {
        role: "system",
        content: isTechnical ? technicalPrompt : hrPrompt,
      },
      {
        role: "user",
        content: `CANDIDATE RESUME:
${resumeContext}

---
COMPANY:
${company}

---
JOB DESCRIPTION:
${jdContext}

---
Role applying for:
${role}

Years of experience:
${experience}

Key projects:
${projectList.length ? projectList.join(", ") : "Not specified"}

Key skills:
${skillList.length ? skillList.join(", ") : "Not specified"}

Generate 10 interview questions specifically aligned with the company, role, job description, and candidate resume.

Prioritize important requirements from the Job Description.
If the candidate has a skill gap, include questions that help assess that area.

Generate the 10 interview questions now.`,
      },
    ];

    const aiResponse = await askAi(messages, { temperature: 0.75, max_tokens: 1200 });

    // Parse JSON array from AI response
    let questionsArray = [];
    try {
      const parsed = parseAiJson(aiResponse);
      questionsArray = Array.isArray(parsed) ? parsed : [];
    } catch {
      // Fallback: try to extract array from raw text
      const match = aiResponse.match(/\[[\s\S]*\]/);
      if (match) {
        try { questionsArray = JSON.parse(match[0]); } catch { questionsArray = []; }
      }
    }

    // Validate — must have at least 8 questions
    if (questionsArray.length < 8) {
      return res.status(500).json({ message: "AI failed to generate questions. Please try again." });
    }

    // Ensure exactly 10, trim if more
    questionsArray = questionsArray.slice(0, 10);

    // Deduct credits
    user.credits -= 50;
    await user.save();

    const interview = await Interview.create({
  userId: user._id,

  company,
  role,
  experience,
  mode,
  jobDescription,

  resumeText: safeResume,

  questions: questionsArray.map((q) => ({
    question: q.question || "",
    difficulty: q.difficulty || "medium",
    timeLimit: q.timeLimit || 90,
  })),
});

    return res.json({
  interviewId: interview._id,
  creditsLeft: user.credits,
  userName: user.name,

  company,
  role,
  experience,
  mode,
  jobDescription,

  questions: interview.questions,
});
  } catch (error) {
    console.error("[generateQuestion]", error.message);
    return res.status(500).json({ message: "Failed to generate interview questions. Please try again." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT ANSWER
// ─────────────────────────────────────────────────────────────────────────────
export const submitAnswer = async (req, res) => {
  try {
    const { interviewId, questionIndex, answer, timeTaken } = req.body;

    if (!interviewId || questionIndex === undefined) {
      return res.status(400).json({ message: "interviewId and questionIndex are required." });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found." });
    }

    // Authorization: ensure this interview belongs to the requesting user
    if (interview.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Access denied." });
    }

    const question = interview.questions[questionIndex];
    if (!question) {
      return res.status(400).json({ message: "Invalid question index." });
    }

    // No answer submitted
    if (!answer || !answer.trim()) {
      question.score = 0;
      question.feedback = "No answer was submitted for this question.";
      question.answer = "";
      await interview.save();
      return res.json({ feedback: question.feedback });
    }

    // Time exceeded
    if (timeTaken > question.timeLimit) {
      question.score = 0;
      question.feedback = "Time limit exceeded. Please manage your time better.";
      question.answer = answer;
      await interview.save();
      return res.json({ feedback: question.feedback });
    }

    const messages = [
      {
        role: "system",
        content: `You are a professional interviewer evaluating a candidate's answer.

Score these areas from 0–10:
1. Confidence – clarity, assertiveness, well-presented delivery
2. Communication – simple, clear, easy to understand language
3. Correctness – accuracy, relevance, completeness

Calculate: finalScore = round((confidence + communication + correctness) / 3)

Feedback rules:
- 10–15 words only, natural human tone.
- Suggest improvement if needed.
- Do NOT repeat the question.
- Do NOT explain scoring.

Return ONLY valid JSON, no markdown:
{
  "confidence": number,
  "communication": number,
  "correctness": number,
  "finalScore": number,
  "feedback": "short feedback"
}`,
      },
      {
        role: "user",
        content: `Question: ${question.question}\nAnswer: ${answer}`,
      },
    ];

    const aiResponse = await askAi(messages, { temperature: 0.4, max_tokens: 256 });
    const parsed = parseAiJson(aiResponse);

    question.answer = answer;
    question.confidence = parsed.confidence ?? 0;
    question.communication = parsed.communication ?? 0;
    question.correctness = parsed.correctness ?? 0;
    question.score = parsed.finalScore ?? 0;
    question.feedback = parsed.feedback ?? "Answer evaluated.";

    // ── Generate follow-up (if score < 6) AND model answer — run in parallel ──
    let followUpQuestion = null;
    let modelAnswer = null;

    const [followUpResult, modelAnswerResult] = await Promise.allSettled([
      // Follow-up: only when score is weak
      (parsed.finalScore ?? 0) < 6
        ? askAi([
            {
              role: "system",
              content: `You are a professional interviewer. The candidate gave a weak or incomplete answer.
Generate exactly ONE smart follow-up question to dig deeper or give them a chance to improve.
Rules:
- 10–20 words only, a single sentence.
- Directly reference something specific from their answer.
- No preamble, no explanation, just the question itself.`,
            },
            {
              role: "user",
              content: `Original Question: ${question.question}\nCandidate Answer: ${answer}`,
            },
          ], { temperature: 0.7, max_tokens: 80 })
        : Promise.resolve(null),

      // Model answer: always generate
      askAi([
        {
          role: "system",
          content: `You are a senior interviewer. Write a concise, ideal model answer for the interview question.
Rules:
- 60–100 words maximum.
- Clear, structured, professional tone.
- Cover the key points a strong candidate would mention.
- No fluff, no filler phrases.
- Plain text only, no bullet points or markdown.`,
        },
        {
          role: "user",
          content: `Question: ${question.question}\nRole: ${interview.role}\nExperience: ${interview.experience}`,
        },
      ], { temperature: 0.4, max_tokens: 180 }),
    ]);

    if (followUpResult.status === "fulfilled" && followUpResult.value) {
      followUpQuestion = followUpResult.value.trim().replace(/^["']|["']$/g, "");
      question.followUpQuestion = followUpQuestion;
    }

    if (modelAnswerResult.status === "fulfilled" && modelAnswerResult.value) {
      modelAnswer = modelAnswerResult.value.trim();
      question.modelAnswer = modelAnswer;
    }

    await interview.save();

    return res.status(200).json({
      feedback: question.feedback,
      followUpQuestion: followUpQuestion || null,
      modelAnswer: modelAnswer || null,
    });
  } catch (error) {
    console.error("[submitAnswer]", error.message);
    return res.status(500).json({ message: "Failed to evaluate answer. Please try again." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT FOLLOW-UP ANSWER
// ─────────────────────────────────────────────────────────────────────────────
export const submitFollowUp = async (req, res) => {
  try {
    const { interviewId, questionIndex, followUpAnswer } = req.body;

    if (!interviewId || questionIndex === undefined) {
      return res.status(400).json({ message: "interviewId and questionIndex are required." });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) return res.status(404).json({ message: "Interview not found." });

    if (interview.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Access denied." });
    }

    const question = interview.questions[questionIndex];
    if (!question) return res.status(400).json({ message: "Invalid question index." });

    if (!followUpAnswer || !followUpAnswer.trim()) {
      question.followUpAnswer = "";
      question.followUpFeedback = "No follow-up answer provided.";
      question.followUpScore = 0;
      await interview.save();
      return res.json({ followUpFeedback: question.followUpFeedback });
    }

    const messages = [
      {
        role: "system",
        content: `You are a professional interviewer evaluating a follow-up answer.
Score from 0–10 based on improvement, clarity, and correctness.
Feedback: 10–15 words, natural tone, acknowledge if they improved.
Return ONLY valid JSON, no markdown:
{
  "followUpScore": number,
  "followUpFeedback": "short feedback"
}`,
      },
      {
        role: "user",
        content: `Original Question: ${question.question}
First Answer: ${question.answer}
Follow-up Question: ${question.followUpQuestion}
Follow-up Answer: ${followUpAnswer}`,
      },
    ];

    const aiResponse = await askAi(messages, { temperature: 0.4, max_tokens: 128 });
    const parsed = parseAiJson(aiResponse);

    question.followUpAnswer = followUpAnswer;
    question.followUpScore = parsed.followUpScore ?? 0;
    question.followUpFeedback = parsed.followUpFeedback ?? "Follow-up evaluated.";

    // Boost main score if follow-up improved (weighted average + small bonus)
    const boostedScore = Math.min(10, Math.round((question.score + (parsed.followUpScore ?? 0)) / 2 + 1));
    question.score = boostedScore;

    await interview.save();

    return res.json({ followUpFeedback: question.followUpFeedback });
  } catch (error) {
    console.error("[submitFollowUp]", error.message);
    return res.status(500).json({ message: "Failed to evaluate follow-up. Please try again." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FINISH INTERVIEW
// ─────────────────────────────────────────────────────────────────────────────
export const finishInterview = async (req, res) => {
  try {
    const { interviewId, deliveryData, snapshots, violations } = req.body;

    if (!interviewId) {
      return res.status(400).json({ message: "interviewId is required." });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found." });
    }

    if (interview.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Access denied." });
    }

    // ── Save delivery data per question ───────────────────────────────────────
    if (Array.isArray(deliveryData)) {
      deliveryData.forEach((d) => {
        const q = interview.questions[d.questionIndex];
        if (q) {
          q.transcript    = d.transcript    || "";
          q.deliveryScore = d.deliveryScore || 0;
          q.fillerCount   = d.fillerCount   || 0;
          q.wordCount     = d.wordCount     || 0;
          q.pauseCount    = d.pauseCount    || 0;
          q.wpm           = d.wpm           || 0;
        }
      });
    }

    // ── Save snapshots ────────────────────────────────────────────────────────
    if (Array.isArray(snapshots) && snapshots.length > 0) {
      interview.snapshots = snapshots.slice(0, 6).map((s) => ({
        questionIndex: s.questionIndex ?? 0,
        timestamp:     s.timestamp     || "",
        imageData:     s.imageData     || "",
      }));
    }

    // ── Compute integrity score from violations count ─────────────────────────
    // Count violations from the proctoring data already saved on questions
    // (violations are passed from frontend as part of the request)
    const totalViolationCount = Array.isArray(violations)
      ? violations.length
      : 0;
    interview.integrityScore =
      totalViolationCount === 0 ? "High" :
      totalViolationCount <= 3  ? "Medium" : "Low";

    const totalQuestions = interview.questions.length;
    let totalScore = 0, totalConfidence = 0, totalCommunication = 0,
        totalCorrectness = 0, totalDelivery = 0;

    interview.questions.forEach((q) => {
      totalScore        += q.score        || 0;
      totalConfidence   += q.confidence   || 0;
      totalCommunication+= q.communication|| 0;
      totalCorrectness  += q.correctness  || 0;
      totalDelivery     += q.deliveryScore|| 0;
    });

    interview.finalScore       = Number((totalQuestions ? totalScore / totalQuestions : 0).toFixed(1));
    interview.avgConfidence    = Number((totalQuestions ? totalConfidence / totalQuestions : 0).toFixed(1));
    interview.avgCommunication = Number((totalQuestions ? totalCommunication / totalQuestions : 0).toFixed(1));
    interview.avgCorrectness   = Number((totalQuestions ? totalCorrectness / totalQuestions : 0).toFixed(1));
    interview.avgDelivery      = Number((totalQuestions ? totalDelivery / totalQuestions : 0).toFixed(1));
    interview.status = "completed";

    // ── Feature 5: Generate personalized improvement roadmap ─────────────────
    try {
      const weakAreas = interview.questions
        .filter(q => (q.score || 0) < 6)
        .map(q => `Q: ${q.question} | Score: ${q.score}/10 | Feedback: ${q.feedback}`)
        .join("\n");

      const roadmapPrompt = [
        {
          role: "system",
          content: `You are a career coach. Based on the candidate's interview performance, create a concise personalized improvement roadmap.
Return ONLY valid JSON, no markdown:
{
  "overallSummary": "2-3 sentence honest assessment",
  "weakAreas": [
    { "topic": "topic name", "reason": "why they struggled", "action": "specific thing to do", "resource": "book/course/practice suggestion" }
  ],
  "strengths": ["strength1", "strength2"],
  "nextSteps": ["step1", "step2", "step3"]
}
Keep it practical, specific, and encouraging. Max 3 weak areas.`,
        },
        {
          role: "user",
          content: `Role: ${interview.role} | Experience: ${interview.experience} | Mode: ${interview.mode}
Final Score: ${interview.finalScore}/10
Confidence: ${interview.avgConfidence} | Communication: ${interview.avgCommunication} | Correctness: ${interview.avgCorrectness} | Delivery: ${interview.avgDelivery}

Weak questions:
${weakAreas || "No significantly weak areas."}`,
        },
      ];

      const roadmapRaw = await askAi(roadmapPrompt, { temperature: 0.5, max_tokens: 600 });
      interview.roadmap = roadmapRaw.trim();
    } catch (e) {
      console.warn("[finishInterview] Roadmap generation failed:", e.message);
      interview.roadmap = "";
    }

    await interview.save();

    // Parse roadmap safely for response
    let parsedRoadmap = null;
    try {
      parsedRoadmap = parseAiJson(interview.roadmap);
    } catch { parsedRoadmap = null; }

    return res.status(200).json({
      interviewId:   interview._id,
      finalScore:    interview.finalScore,
      confidence:    interview.avgConfidence,
      communication: interview.avgCommunication,
      correctness:   interview.avgCorrectness,
      delivery:      interview.avgDelivery,
      roadmap:       parsedRoadmap,
      integrityScore: interview.integrityScore,
      snapshots:     interview.snapshots || [],
      questionWiseScore: interview.questions.map((q) => ({
        question:      q.question,
        score:         q.score         || 0,
        feedback:      q.feedback      || "",
        confidence:    q.confidence    || 0,
        communication: q.communication || 0,
        correctness:   q.correctness   || 0,
        modelAnswer:   q.modelAnswer   || "",
        answer:        q.answer        || "",
        transcript:    q.transcript    || "",
        deliveryScore: q.deliveryScore || 0,
        fillerCount:   q.fillerCount   || 0,
        wpm:           q.wpm           || 0,
      })),
    });
  } catch (error) {
    console.error("[finishInterview]", error.message);
    return res.status(500).json({ message: "Failed to finish interview. Please try again." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET MY INTERVIEWS
// ─────────────────────────────────────────────────────────────────────────────
export const getMyInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select("role experience mode finalScore status createdAt");

    return res.status(200).json(interviews);
  } catch (error) {
    console.error("[getMyInterviews]", error.message);
    return res.status(500).json({ message: "Failed to fetch interview history." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET INTERVIEW REPORT
// ─────────────────────────────────────────────────────────────────────────────
export const getInterviewReport = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: "Interview not found." });
    }

    // Authorization: only the owner can view their report
    if (interview.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Access denied." });
    }

    const totalQuestions = interview.questions.length;
    let totalConfidence = 0;
    let totalCommunication = 0;
    let totalCorrectness = 0;

    interview.questions.forEach((q) => {
      totalConfidence += q.confidence || 0;
      totalCommunication += q.communication || 0;
      totalCorrectness += q.correctness || 0;
    });

    return res.json({
      interviewId:   interview._id,
      finalScore:    interview.finalScore,
      confidence:    totalQuestions ? Number((totalConfidence / totalQuestions).toFixed(1)) : 0,
      communication: totalQuestions ? Number((totalCommunication / totalQuestions).toFixed(1)) : 0,
      correctness:   totalQuestions ? Number((totalCorrectness / totalQuestions).toFixed(1)) : 0,
      delivery:      interview.avgDelivery || 0,
      integrityScore: interview.integrityScore || "High",
      snapshots:     interview.snapshots || [],
      roadmap:       (() => { try { return JSON.parse(interview.roadmap); } catch { return null; } })(),
      role:          interview.role,
      mode:          interview.mode,
      questionWiseScore: interview.questions.map((q) => ({
        question:      q.question,
        score:         q.score         || 0,
        feedback:      q.feedback      || "",
        confidence:    q.confidence    || 0,
        communication: q.communication || 0,
        correctness:   q.correctness   || 0,
        modelAnswer:   q.modelAnswer   || "",
        answer:        q.answer        || "",
        transcript:    q.transcript    || "",
        deliveryScore: q.deliveryScore || 0,
        fillerCount:   q.fillerCount   || 0,
        wpm:           q.wpm           || 0,
      })),
    });
  } catch (error) {
    console.error("[getInterviewReport]", error.message);
    return res.status(500).json({ message: "Failed to fetch interview report." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SEND REPORT EMAIL
// ─────────────────────────────────────────────────────────────────────────────
export const sendReport = async (req, res) => {
  try {
    const { interviewId, pdfBase64 } = req.body;

    if (!interviewId) {
      return res.status(400).json({ message: "interviewId is required." });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) return res.status(404).json({ message: "Interview not found." });
    if (interview.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Access denied." });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    // Parse roadmap safely
    let roadmap = null;
    try { roadmap = parseAiJson(interview.roadmap); } catch { roadmap = null; }

    await sendReportEmail({
      toEmail:        user.email,
      candidateName:  user.name,
      role:           interview.role,
      finalScore:     interview.finalScore,
      integrityScore: interview.integrityScore || "High",
      pdfBase64:      pdfBase64 || null,
      roadmap,
    });

    return res.status(200).json({ message: "Report sent to your email successfully." });
  } catch (error) {
    console.error("[sendReport]", error.message);
    return res.status(500).json({ message: "Failed to send report email. Please try again." });
  }
};
