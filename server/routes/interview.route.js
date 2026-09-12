import express from "express";
import { body, param } from "express-validator";
import isAuth from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";
import { aiLimiter } from "../middlewares/rateLimiter.js";
import validateRequest from "../middlewares/validateRequest.js";
import {
  analyzeResume,
  finishInterview,
  generateQuestion,
  getInterviewReport,
  getMyInterviews,
  submitAnswer,
  submitFollowUp,
  sendReport,
} from "../controllers/interview.controller.js";

const interviewRouter = express.Router();

// Resume analysis
interviewRouter.post(
  "/resume",
  isAuth,
  aiLimiter,
  upload.single("resume"),
  analyzeResume
);

// Generate questions
interviewRouter.post(
  "/generate-questions",
  isAuth,
  aiLimiter,
  [
    body("role").trim().notEmpty().withMessage("Role is required."),
    body("experience").trim().notEmpty().withMessage("Experience is required."),
    body("mode").isIn(["HR", "Technical"]).withMessage("Mode must be HR or Technical."),
  ],
  validateRequest,
  generateQuestion
);

// Submit answer
interviewRouter.post(
  "/submit-answer",
  isAuth,
  aiLimiter,
  [
    body("interviewId").notEmpty().withMessage("interviewId is required."),
    body("questionIndex").isInt({ min: 0 }).withMessage("questionIndex must be a non-negative integer."),
  ],
  validateRequest,
  submitAnswer
);

// Finish interview
interviewRouter.post(
  "/finish",
  isAuth,
  [body("interviewId").notEmpty().withMessage("interviewId is required.")],
  validateRequest,
  finishInterview
);

// Submit follow-up answer
interviewRouter.post(
  "/submit-followup",
  isAuth,
  aiLimiter,
  [
    body("interviewId").notEmpty().withMessage("interviewId is required."),
    body("questionIndex").isInt({ min: 0 }).withMessage("questionIndex must be a non-negative integer."),
  ],
  validateRequest,
  submitFollowUp
);

// Get all interviews
interviewRouter.get("/get-interview", isAuth, getMyInterviews);

// Get single report
interviewRouter.get(
  "/report/:id",
  isAuth,
  [param("id").isMongoId().withMessage("Invalid interview ID.")],
  validateRequest,
  getInterviewReport
);

// Send report email
interviewRouter.post(
  "/send-report",
  isAuth,
  [body("interviewId").notEmpty().withMessage("interviewId is required.")],
  validateRequest,
  sendReport
);

export default interviewRouter;
