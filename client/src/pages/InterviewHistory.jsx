import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { SERVER_URL } from "../config";
import { FaArrowLeft, FaPlus } from "react-icons/fa";
import { motion } from "motion/react";
import toast from "react-hot-toast";

function InterviewHistory() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getMyInterviews = async () => {
      try {
        const result = await axios.get(
          `${SERVER_URL}/api/interview/get-interview`,
          { withCredentials: true }
        );
        setInterviews(result.data);
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Failed to load interview history."
        );
      } finally {
        setLoading(false);
      }
    };

    getMyInterviews();
  }, []);

  const getScoreColor = (score) => {
    if (score >= 8) return "text-emerald-600";
    if (score >= 5) return "text-yellow-600";
    return "text-red-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 py-10">
      <div className="w-[90vw] lg:w-[70vw] max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-10 w-full flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate("/")}
              className="mt-1 p-3 rounded-full bg-white shadow hover:shadow-md transition"
            >
              <FaArrowLeft className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Interview History</h1>
              <p className="text-gray-500 mt-2">
                Track your past interviews and performance reports
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/interview")}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl shadow transition font-medium text-sm"
          >
            <FaPlus size={12} />
            New Interview
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : interviews.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow text-center">
            <p className="text-gray-500 text-lg mb-4">No interviews yet.</p>
            <button
              onClick={() => navigate("/interview")}
              className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition font-medium"
            >
              Start Your First Interview
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {interviews.map((item, index) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/report/${item._id}`)}
                className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-emerald-200"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{item.role}</h3>
                    <p className="text-gray-500 text-sm mt-1">
                      {item.experience} · {item.mode}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(item.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className={`text-xl font-bold ${getScoreColor(item.finalScore || 0)}`}>
                        {item.finalScore || 0}/10
                      </p>
                      <p className="text-xs text-gray-400">Overall Score</p>
                    </div>

                    <span
                      className={`px-4 py-1 rounded-full text-xs font-medium ${
                        item.status === "completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default InterviewHistory;
