# 🎯 InterviewIQ.AI

## 🚀 Live Demo

🌐 Frontend: https://interview-iq-olive.vercel.app/

🔗 Backend: https://interviewiq-ehby.onrender.com

💻 GitHub: https://github.com/zeeshan335530/interviewIQ

---

## 📌 Project Overview

**InterviewIQ.AI** is an AI-powered interview preparation platform designed to help students and job seekers practice interviews and improve their performance.

The platform generates personalized mock interviews based on the candidate's **role, company, skills, resume, job description, and projects**. After the interview, AI analyzes the responses and provides detailed feedback, scores, strengths, weak areas, and an improvement roadmap.

---

## 🚀 Features

- 🤖 AI-powered mock interviews
- 🎯 Personalized interview questions
- 🧠 AI-based answer evaluation
- 📊 Interview performance analytics
- 📋 Detailed interview reports
- 📄 PDF report generation
- 📧 Report delivery through email
- 🔐 Google/Firebase authentication
- 💳 Credit-based interview system
- 💰 Razorpay payment integration
- 📈 Performance improvement roadmap
- 🛡️ Interview integrity analysis
- 🌐 Fully deployed web application

---

## 🤖 AI Interview System

InterviewIQ.AI uses **Groq AI** to generate and evaluate interview questions.

The interview can be personalized according to:

- Job role
- Company
- Skills
- Job description
- Projects
- Resume information

The AI evaluates the candidate's answers and generates meaningful feedback to help improve interview performance.

---

## 📊 Interview Analytics

After completing an interview, the platform provides:

- Overall performance score
- Individual answer evaluation
- Strengths
- Weak areas
- Improvement suggestions
- Integrity analysis
- Detailed interview report

---

## 📄 Interview Report

Users can generate a professional interview report containing their performance analysis.

The report can be:

- Viewed inside the application
- Downloaded as a PDF
- Sent directly to the user's email

---

## 💳 Payment & Credit System

InterviewIQ.AI uses a credit-based system.

| Plan | Price | Credits |
|------|------:|--------:|
| Basic | ₹100 | 150 |
| Pro | ₹500 | 650 |

Payments are integrated using **Razorpay Test Mode** for development and testing.

---

## 🛠️ Technologies Used

### Frontend

- React.js
- Vite
- JavaScript
- Axios
- Firebase Authentication
- Recharts
- jsPDF
- CSS

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- Axios
- Multer
- dotenv

### Integrations

- Groq AI
- Firebase
- Razorpay
- Resend

### Deployment

- Vercel
- Render
- MongoDB Atlas

---

## 📂 Project Structure

```text
InterviewIQ.AI/
│
├── client/              # React frontend
├── server/              # Node.js backend
│
├── .gitignore
├── package-lock.json
└── README.md
```

## ⚙️ Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/zeeshan335530/interviewIQ.git
cd interviewIQ
```

### 2. Setup Backend

```bash
cd server
npm install
node index.js
```

Backend runs on:

```text
http://localhost:8000
```

### 3. Setup Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

## 🔑 Environment Variables

### Backend `.env`

```env
PORT=8000
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
CLIENT_URL=http://localhost:5173
NODE_ENV=development
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=your_sender_email
```

### Frontend `.env`

```env
VITE_SERVER_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

> ⚠️ Never upload `.env` files or secret API keys to GitHub.

## 📊 Application Workflow

```text
User Login
    ↓
Create Interview
    ↓
Enter Role / Company / Skills / Job Details
    ↓
AI Generates Interview
    ↓
Candidate Answers Questions
    ↓
AI Evaluates Performance
    ↓
Analytics & Feedback
    ↓
Generate Interview Report
    ↓
Download PDF / Send Report by Email
```

## 🎯 Project Objective

The main objective of InterviewIQ.AI is to provide an accessible and intelligent platform where candidates can practice interviews, understand their weaknesses, and continuously improve their interview skills.

## 💡 About the Project

InterviewIQ.AI was developed as a practical full-stack AI project combining **Artificial Intelligence, Web Development, Authentication, Database Management, Payments, Analytics, PDF generation, and Email Services** into one complete application.

The project involved designing the frontend, developing the backend APIs, integrating multiple external services, connecting the database, handling authentication and payments, deploying the application, and testing the complete workflow in production.

## 💪 Built With Hard Work

This project was built with continuous learning, debugging, testing, and problem-solving.

From developing the initial application to integrating AI, authentication, payments, analytics, PDF reports, email delivery, and finally deploying both frontend and backend, every part of the project required practical development and troubleshooting.

The goal was not only to build a project, but to create something that can actually help candidates prepare for real interviews.

## 🔮 Future Improvements

- 🎙️ Advanced voice interview capabilities
- 🗣️ Speech and communication analysis
- 📱 Mobile application
- 📚 More interview categories
- 🧑‍💼 Company-specific interview preparation
- 📈 Advanced performance tracking
- 🌍 Support for more languages

## 👨‍💻 Author

### Zeeshan Ansari

Passionate about **Full-Stack Development, Artificial Intelligence, and building practical real-world applications**.

🔗 GitHub: https://github.com/zeeshan335530

## ⭐ Support

If you like this project, consider giving the repository a ⭐ on GitHub.

Thanks for checking out **InterviewIQ.AI** 🚀

> **Prepare Better. Practice Smarter. Interview with Confidence.**
