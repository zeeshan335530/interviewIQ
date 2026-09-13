# 🚀 Live Demo

👉 [**Open Live InterviewIQ.AI Application**](https://interview-iq-olive.vercel.app/)

# 🎯 InterviewIQ.AI

AI-Powered Mock Interview and Career Preparation Platform designed to help students and job seekers practice interviews, analyze their performance, and improve their interview skills using Artificial Intelligence.

## 📌 Project Overview

InterviewIQ.AI is a full-stack web application that provides an interactive and personalized mock interview experience.

The platform allows users to prepare for interviews based on their **job role, company, job description, resume, skills, and projects**.

After completing an interview, the system uses AI to evaluate the candidate's responses and provides performance analytics, strengths, weak areas, improvement suggestions, and a personalized roadmap.

The platform also supports **Google authentication, credit-based interviews, Razorpay payments, PDF report generation, and email report delivery**.

## 🚀 Features

- AI-powered mock interviews
- Personalized interview questions
- Resume-based interview preparation
- Job role and company-based interviews
- Job description-based preparation
- AI-powered answer evaluation
- Interview performance scoring
- Interview analytics dashboard
- Strength and weakness analysis
- Personalized improvement roadmap
- Interview integrity analysis
- Detailed interview reports
- PDF report generation
- Email report delivery with PDF attachment
- Google authentication
- Credit-based interview system
- Razorpay payment integration
- Responsive web interface

## 🤖 AI Interview System

InterviewIQ.AI uses the **Groq API** to provide AI-powered interview functionality.

The AI system is used for:

- Interview question generation
- Candidate response evaluation
- Performance analysis
- Feedback generation
- Strength identification
- Weak area identification
- Improvement recommendations
- Interview report generation

## 📊 Interview Analytics

After completing an interview, users can view their performance through the Interview Analytics Dashboard.

The dashboard provides information such as:

- Overall interview score
- Interview performance
- Strengths
- Areas to improve
- Interview results
- Improvement recommendations
- Personalized roadmap

## 📄 Interview Report

After an interview is completed, InterviewIQ.AI generates a detailed performance report.

The report can contain:

- Candidate information
- Job role
- Final score
- Question-wise performance
- Strengths
- Weak areas
- Improvement suggestions
- Next steps
- Interview integrity information
- Personalized improvement roadmap

The report can also be generated as a **PDF** and sent to the candidate through email.

## 📧 Email Report

InterviewIQ.AI uses **Resend** for email delivery.

The email workflow is:

```text
Interview Completed
        ↓
AI Evaluation
        ↓
Generate Report
        ↓
Generate PDF
        ↓
Resend Email API
        ↓
Candidate Email
        ↓
PDF Attachment

💳 Payment System

InterviewIQ.AI uses Razorpay for purchasing interview credits.

Available Plans
Plan	Price	Credits
Basic	₹100	150
Pro	₹500	650

Razorpay is currently configured in Test Mode for testing and demonstration.

Payment Workflow
Select Plan
     ↓
Razorpay Checkout
     ↓
Payment
     ↓
Backend Verification
     ↓
Credits Added
🔐 Authentication

Google authentication is implemented using Firebase Authentication.

The authentication system allows users to:

Sign in with Google
Create an account
Access protected features
Maintain an authenticated session
🛠️ Technologies Used
Frontend
React
Vite
JavaScript
Axios
Firebase
Recharts
jsPDF
CSS
Backend
Node.js
Express.js
MongoDB
Mongoose
JWT
Axios
Multer
dotenv
Services & APIs
Groq AI
Firebase Authentication
Razorpay
Resend
MongoDB Atlas
Deployment
Vercel
Render
📂 Project Structure
InterviewIQ/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   └── ...
│   │
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   │   └── email.service.js
│   │
│   ├── index.js
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
├── package-lock.json
└── README.md
⚙️ Installation and Setup
1. Clone the Repository
git clone https://github.com/zeeshan335530/interviewIQ.git
2. Navigate to the Project Directory
cd interviewIQ
3. Setup Backend

Navigate to the server directory:

cd server

Install the required dependencies:

npm install
4. Configure Backend Environment Variables

Create a .env file inside the server folder:

PORT=8000

MONGODB_URL=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

GROQ_API_KEY=your_groq_api_key

CLIENT_URL=http://localhost:5173

NODE_ENV=development

RAZORPAY_KEY_ID=your_razorpay_key_id

RAZORPAY_KEY_SECRET=your_razorpay_secret

RESEND_API_KEY=your_resend_api_key

EMAIL_FROM=InterviewIQ.AI <onboarding@resend.dev>
5. Start the Backend
node index.js

The backend will run at:

http://localhost:8000
6. Setup Frontend

Open a new terminal and navigate to the client directory:

cd client

Install dependencies:

npm install
7. Configure Frontend Environment Variables

Create a .env file inside the client folder:

VITE_SERVER_URL=http://localhost:8000

VITE_FIREBASE_APIKEY=your_firebase_api_key

VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain

VITE_FIREBASE_PROJECT_ID=your_firebase_project_id

VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket

VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_sender_id

VITE_FIREBASE_APP_ID=your_firebase_app_id

VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
8. Start the Frontend
npm run dev

The frontend will normally run at:

http://localhost:5173

⚠️ Never commit .env files, API keys, passwords, tokens, or other sensitive credentials to GitHub.

🔄 Application Workflow
User
 ↓
Google Authentication
 ↓
Interview Setup
 ↓
Resume / Skills / Projects
 ↓
Job Role / Company / Job Description
 ↓
AI Mock Interview
 ↓
Candidate Answers
 ↓
AI Evaluation
 ↓
Performance Analysis
 ↓
Interview Analytics
 ↓
Detailed Report
 ↓
PDF Generation
 ↓
Email Report
📈 Interview Preparation Workflow
Candidate Information
        ↓
Interview Configuration
        ↓
AI Question Generation
        ↓
Candidate Response
        ↓
AI Evaluation
        ↓
Performance Feedback
        ↓
Improvement Roadmap
🌍 Deployment
Frontend

Platform: Vercel

👉 https://interview-iq-olive.vercel.app/

Backend

Platform: Render

👉 https://interviewiq-ehby.onrender.com/

Database

Platform: MongoDB Atlas

Authentication

Platform: Firebase Authentication

AI

Platform: Groq

Payments

Platform: Razorpay

Email

Platform: Resend

🧪 Production Testing

The complete application workflow has been tested successfully in production.

Tested features include:

Google authentication
Firebase authentication
MongoDB connection
AI mock interviews
AI evaluation
Interview analytics
Report generation
PDF generation
Razorpay test payments
Credit allocation
Email delivery
PDF email attachment
Frontend and backend deployment
🩺 Backend Health Check

Production health endpoint:

https://interviewiq-ehby.onrender.com/health

Expected response:

{
  "status": "ok"
}
🎯 Project Objective

The objective of InterviewIQ.AI is to provide an AI-powered platform that helps candidates practice interviews in a personalized environment and understand exactly where they can improve.

The project combines Artificial Intelligence, Full-Stack Development, Authentication, Payments, Analytics, PDF Generation, Email Automation, and Cloud Deployment into one complete application.

💡 About the Project

InterviewIQ.AI was built to solve a real-world problem faced by students and job seekers — preparing for interviews without receiving personalized feedback.

The project was developed from the initial application setup through local development, API integration, AI implementation, database integration, authentication, payment integration, report generation, email automation, deployment, debugging, and production testing.

The main idea behind the project is:

Practice
   ↓
Analyze
   ↓
Improve
   ↓
Get Interview Ready
❤️ Built With Hard Work

Building InterviewIQ.AI required continuous learning, development, debugging, testing, and problem-solving.

The project involved hands-on work across:

Full-stack development
AI integration
REST API development
Database integration
Authentication
Payment integration
Analytics
PDF generation
Email automation
Cloud deployment
Production debugging
End-to-end testing

From the first local setup to the final production deployment, the application was developed and tested step by step to make the complete workflow functional.

Built with passion, persistence, learning, and a lot of debugging. 🚀

🔮 Future Improvements
Real-time AI voice interviews
Advanced communication analysis
More AI model options
Interview difficulty levels
Resume-to-job matching
Company-specific interview preparation
Advanced performance analytics
Interview comparison
Personalized preparation plans
Subscription-based plans
Admin dashboard
Mobile application
Automated testing
CI/CD pipeline
👨‍💻 Author

Zeeshan Ansari

Passionate developer interested in Full-Stack Development, Artificial Intelligence, and building practical real-world applications.

InterviewIQ.AI was developed as a hands-on project to apply modern technologies to a real-world problem and gain practical experience in AI integration, web development, cloud deployment, APIs, authentication, payments, and automation.

GitHub

👉 https://github.com/zeeshan335530

⭐ Support
If you find this project useful, consider giving the repository a ⭐.
