# 🚀 InterviewIQ.AI

### AI-Powered Mock Interview & Career Preparation Platform

InterviewIQ.AI is a full-stack AI-powered interview preparation platform designed to help students and job seekers practice realistic interviews, improve their answers, analyze their performance, and receive actionable feedback.

The platform combines AI-generated interview experiences, Google authentication, personalized interview preparation, interview analytics, PDF report generation, email delivery, and a credit-based payment system into a single web application.

---

## 🌐 Live Demo

### 🚀 Production Application

**Live Website:**  
https://interview-iq-olive.vercel.app

### 🔗 Backend API

**Backend:**  
https://interviewiq-ehby.onrender.com

### 💻 Source Code

**GitHub Repository:**  
https://github.com/zeeshan335530/interviewIQ

---

# ✨ Features

## 🤖 AI-Powered Mock Interviews

InterviewIQ.AI provides personalized AI-powered mock interviews that simulate real interview experiences.

Users can prepare for interviews based on:

- Job role
- Company
- Job description
- Resume
- Skills
- Projects
- Interview mode
- Previous performance

The AI interviewer generates relevant questions and evaluates candidate responses to provide meaningful interview feedback.

---

## 🎯 Personalized Interview Preparation

InterviewIQ.AI is designed to provide more relevant interview preparation instead of relying only on generic questions.

The platform can use candidate information such as:

- Resume details
- Technical skills
- Projects
- Job descriptions
- Target company
- Desired job role
- Interview type

This allows candidates to practice questions that are more closely related to the positions they are applying for.

---

## 🧠 AI Interview Evaluation

After completing an interview, InterviewIQ.AI analyzes the candidate's performance.

The evaluation includes:

- Overall interview score
- Answer quality
- Technical performance
- Communication performance
- Strengths
- Weak areas
- Improvement recommendations
- Interview integrity indicators
- Personalized improvement roadmap

---

## 📊 Interview Analytics Dashboard

The Interview Analytics Dashboard gives users a centralized view of their interview performance.

Users can review:

- Interview scores
- Previous interviews
- Performance results
- Strengths
- Weaknesses
- Improvement areas
- Overall progress
- Interview reports

This makes interview preparation more measurable and structured.

---

## 📄 Detailed Interview Reports

After an interview is completed, the application generates a detailed performance report.

The report can include:

- Overall performance score
- Question-wise analysis
- Performance insights
- Strengths
- Areas to improve
- Recommended next steps
- Personalized improvement roadmap
- Interview integrity information

The report can also be generated as a PDF document.

---

## 📧 Email Interview Reports

Users can send their completed interview reports directly to their email.

The email system:

1. Generates the interview report.
2. Generates the PDF report.
3. Creates a personalized HTML email.
4. Sends the email using the Resend API.
5. Attaches the PDF report to the email.

This allows candidates to save and review their interview results later.

---

## 🔐 Google Authentication

InterviewIQ.AI uses Firebase Authentication for Google Sign-In.

Authentication provides:

- Google login
- User account creation
- User sessions
- Protected application functionality
- Backend authentication
- JWT-based application sessions

---

## 💳 Credit-Based Interview System

InterviewIQ.AI uses a credit-based system for interview usage.

### Available Plans

| Plan | Price | Credits |
|------|------:|--------:|
| Basic | ₹100 | 150 |
| Pro | ₹500 | 650 |

> Razorpay is currently configured in Test Mode for development and demonstration purposes.

---

## 💰 Razorpay Payment Integration

InterviewIQ.AI integrates Razorpay for purchasing interview credits.

The payment flow is:

1. User selects a credit plan.
2. Razorpay Checkout opens.
3. User completes the payment.
4. Backend verifies the payment.
5. Credits are added to the user's account.
6. The updated balance can be used for interviews.

The current deployment uses Razorpay Test Mode.

---

# 🏗️ System Architecture

```text
                         ┌──────────────────────┐
                         │    User / Browser    │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    React + Vite      │
                         │      Frontend        │
                         │       Vercel         │
                         └──────────┬───────────┘
                                    │
                                    │ HTTPS / REST API
                                    ▼
                         ┌──────────────────────┐
                         │   Node.js + Express  │
                         │       Backend        │
                         │       Render         │
                         └──────┬───────┬───────┘
                                │       │
                  ┌─────────────┘       └──────────────┐
                  ▼                                    ▼
         ┌──────────────────┐                 ┌──────────────────┐
         │  MongoDB Atlas   │                 │     Groq AI      │
         │    Database      │                 │  AI Processing   │
         └──────────────────┘                 └──────────────────┘
                  │
                  │
         ┌────────┴───────────┐
         │                    │
         ▼                    ▼
┌──────────────────┐  ┌──────────────────┐
│ Firebase Auth    │  │ Razorpay         │
│ Google Sign-In   │  │ Payments         │
└──────────────────┘  └──────────────────┘

                         ┌──────────────────┐
                         │      Resend      │
                         │ Email + PDF      │
                         │    Delivery      │
                         └──────────────────┘
