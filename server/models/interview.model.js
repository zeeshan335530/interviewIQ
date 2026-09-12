import mongoose from "mongoose";

const questionsSchema = new mongoose.Schema({
  question: String,
  difficulty: String,
  timeLimit: Number,
  answer: String,
  feedback: String,
  score: { type: Number, default: 0 },
  confidence: { type: Number, default: 0 },
  communication: { type: Number, default: 0 },
  correctness: { type: Number, default: 0 },
  // Follow-up question fields
  followUpQuestion: { type: String, default: "" },
  followUpAnswer: { type: String, default: "" },
  followUpFeedback: { type: String, default: "" },
  followUpScore: { type: Number, default: 0 },
  // Model answer
  modelAnswer: { type: String, default: "" },
  // Feature 3 & 4: Delivery + Transcript
  transcript:    { type: String, default: "" },
  deliveryScore: { type: Number, default: 0 },
  fillerCount:   { type: Number, default: 0 },
  wordCount:     { type: Number, default: 0 },
  pauseCount:    { type: Number, default: 0 },
  wpm:           { type: Number, default: 0 },
});

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: { type: String, required: true },
experience: { type: String, required: true },
mode: { type: String, enum: ["HR", "Technical"], required: true },

// Company-specific interview + JD alignment
company: { type: String, required: true },
jobDescription: { type: String, default: "" },

resumeText: { type: String },
    questions: [questionsSchema],

    finalScore: { type: Number, default: 0 },
    avgConfidence: { type: Number, default: 0 },
    avgCommunication: { type: Number, default: 0 },
    avgCorrectness: { type: Number, default: 0 },
    avgDelivery: { type: Number, default: 0 },
    // Feature 5: Personalized improvement roadmap
    roadmap: { type: String, default: "" },
    // Snapshots captured during interview (base64)
    snapshots: [
      {
        questionIndex: { type: Number },
        timestamp:     { type: String },
        imageData:     { type: String }, // base64 jpeg
      }
    ],
    integrityScore: { type: String, default: "High" }, // High | Medium | Low

    status: {
      type: String,
      enum: ["Incompleted", "completed"],
      default: "Incompleted",
    },
  },
  { timestamps: true }
);

const Interview = mongoose.model("Interview", interviewSchema);

export default Interview;
