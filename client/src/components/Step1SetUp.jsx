import React, { useState } from "react";
import { motion } from "motion/react";
import {
  FaUserTie,
  FaBriefcase,
  FaFileUpload,
  FaMicrophoneAlt,
  FaChartLine,
  FaCheckCircle,
} from "react-icons/fa";
import axios from "axios";
import { SERVER_URL } from "../config";
import { useDispatch, useSelector } from "react-redux";
import { setUserData } from "../redux/userSlice";
import toast from "react-hot-toast";

function Step1SetUp({ onStart }) {
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [mode, setMode] = useState("Technical");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [resumeText, setResumeText] = useState("");
  const [analysisDone, setAnalysisDone] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handleUploadResume = async () => {
  if (!resumeFile) {
    toast.error("Please select a resume first.");
    return;
  }

  setAnalyzing(true);

  const toastId = toast.loading("Analyzing your resume...");

  try {
    const formData = new FormData();
    formData.append("resume", resumeFile);

    const result = await axios.post(
      `${SERVER_URL}/api/interview/resume`,
      formData,
      {
        withCredentials: true,
      }
    );

    console.log("Resume analysis result:", result.data);

    setResumeText(result.data.resumeText || "");
    setProjects(result.data.projects || []);
    setSkills(result.data.skills || []);

    toast.success("Resume analyzed successfully!", {
      id: toastId,
    });
  } catch (error) {
    console.error("Resume analysis error:", error);

    toast.error(
      error?.response?.data?.message ||
        "Failed to analyze resume. Please try again.",
      {
        id: toastId,
      }
    );
  } finally {
    setAnalyzing(false);
  }
};

  const handleStart = async () => {
    if (!company.trim() || !role.trim() || !experience.trim()) {
  toast.error("Please fill in company, role, and experience.");
  return;
}
    setLoading(true);
    const toastId = toast.loading("Generating your interview questions...");

    try {
      const result = await axios.post(
        `${SERVER_URL}/api/interview/generate-questions`,
        {
  company,
  role,
  experience,
  mode,
  jobDescription,
  resumeText,
  projects,
  skills,
},
        { withCredentials: true }
      );

      if (userData) {
        dispatch(setUserData({ ...userData, credits: result.data.creditsLeft }));
      }

      toast.success("Interview ready! Let's go.", { id: toastId });
      onStart(result.data);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to generate questions.",
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-4"
    >
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl grid md:grid-cols-2 overflow-hidden">
        {/* Left panel */}
<motion.div
  initial={{ x: -80, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ duration: 0.7 }}
  className="relative bg-gradient-to-br from-green-50 to-green-100 p-12 pt-8 flex flex-col justify-start"
>
  <h2 className="text-4xl font-bold text-gray-800 mb-4">
    Start Your AI Interview
  </h2>

  <p className="text-gray-600 mb-6 leading-relaxed">
    Prepare smarter with an AI-powered mock interview tailored to your
    target company, role, resume, and job description.
  </p>

  {/* Interview Features */}
  <div className="space-y-4">
    {[
      {
        icon: <FaBriefcase className="text-green-600 text-xl" />,
        text: "Company-Specific Questions",
      },
      {
        icon: <FaFileUpload className="text-green-600 text-xl" />,
        text: "Resume & JD Based Interview",
      },
      {
        icon: <FaMicrophoneAlt className="text-green-600 text-xl" />,
        text: "AI-Powered Real-Time Feedback",
      },
      {
        icon: <FaChartLine className="text-green-600 text-xl" />,
        text: "Detailed Performance Analytics",
      },
    ].map((item, index) => (
      <motion.div
        key={index}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 + index * 0.15 }}
        className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm"
      >
        {item.icon}
        <span className="text-gray-700 font-medium">
          {item.text}
        </span>
      </motion.div>
    ))}
  </div>

  {/* Credits info */}
  {userData && (
    <div className="mt-6 bg-white rounded-xl p-4 shadow-sm border border-green-200">
      <p className="text-sm text-gray-500">
        Available credits:{" "}
        <span className="font-bold text-emerald-600">
          {userData.credits}
        </span>
      </p>

      <p className="text-xs text-gray-400 mt-1">
        Each interview costs 50 credits.
      </p>
    </div>
  )}
</motion.div>
    

        {/* Right panel */}
        <motion.div
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="p-12 bg-white"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-8">Interview Setup</h2>

          <div className="space-y-6">
            {/* Company */}
<div className="relative">
  <FaBriefcase className="absolute top-4 left-4 text-gray-400" />

  <select
    value={company}
    onChange={(e) => setCompany(e.target.value)}
    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition bg-white"
  >
    <option value="">Select Company</option>
    <option value="Amazon">Amazon</option>
    <option value="Google">Google</option>
    <option value="Microsoft">Microsoft</option>
    <option value="TCS">TCS</option>
    <option value="Infosys">Infosys</option>
    <option value="Wipro">Wipro</option>
    <option value="Accenture">Accenture</option>
    <option value="Deloitte">Deloitte</option>
    <option value="Other">Other</option>
  </select>
</div>
            {/* Role */}
            <div className="relative">
              <FaUserTie className="absolute top-4 left-4 text-gray-400" />
              <input
                type="text"
                placeholder="Enter role (e.g. Frontend Developer)"
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition"
                onChange={(e) => setRole(e.target.value)}
                value={role}
              />
            </div>

            {/* Experience */}
            <div className="relative">
              <FaBriefcase className="absolute top-4 left-4 text-gray-400" />
              <input
                type="text"
                placeholder="Experience (e.g. 2 years)"
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition"
                onChange={(e) => setExperience(e.target.value)}
                value={experience}
              />
            </div>

            {/* Mode */}
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full py-3 px-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition"
            >
              <option value="Technical">Technical Interview</option>
              <option value="HR">HR Interview</option>
            </select>
{/* Job Description */}
<div className="relative">
  <textarea
    value={jobDescription}
    onChange={(e) => setJobDescription(e.target.value)}
    placeholder="Paste Job Description (Optional)"
    rows={5}
    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition resize-none"
  />

  <p className="text-xs text-gray-400 mt-1">
    Paste the company's job description to get JD-specific interview questions.
  </p>
</div>
            {/* Resume upload */}
            {!analysisDone && (
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={() => document.getElementById("resumeUpload").click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition"
              >
                <FaFileUpload className="text-4xl mx-auto text-green-600 mb-3" />
                <input
                  type="file"
                  accept="application/pdf"
                  id="resumeUpload"
                  className="hidden"
                  onChange={(e) => setResumeFile(e.target.files[0])}
                />
                <p className="text-gray-600 font-medium">
                  {resumeFile ? resumeFile.name : "Click to upload resume (Optional)"}
                </p>
                {resumeFile && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={(e) => { e.stopPropagation(); handleUploadResume(); }}
                    disabled={analyzing}
                    className="mt-4 bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition disabled:opacity-60"
                  >
                    {analyzing ? "Analyzing..." : "Analyze Resume"}
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* Resume analysis result */}
            {analysisDone && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-500" />
                  <h3 className="text-lg font-semibold text-gray-800">Resume Analyzed</h3>
                </div>

                {projects.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Projects:</p>
                    <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                      {projects.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                )}

                {skills.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-700 mb-1">Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((s, i) => (
                        <span key={i} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => { setAnalysisDone(false); setResumeFile(null); }}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  Remove resume
                </button>
              </motion.div>
            )}

            {/* Start button */}
            <motion.button
              onClick={handleStart}
              disabled={!company || !role || !experience || loading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              className="w-full disabled:bg-gray-400 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700 text-white py-3 rounded-full text-lg font-semibold transition duration-300 shadow-md"
            >
              {loading ? "Starting..." : "Start Interview"}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Step1SetUp;
