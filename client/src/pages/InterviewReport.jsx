import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { SERVER_URL } from "../config";
import Step3Report from "../components/Step3Report";
import toast from "react-hot-toast";

function InterviewReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const result = await axios.get(
          `${SERVER_URL}/api/interview/report/${id}`,
          { withCredentials: true }
        );
        setReport(result.data);
      } catch (err) {
        const msg = err?.response?.data?.message || "Failed to load report.";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500">Loading your report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-red-500 text-lg font-medium">{error}</p>
        <button
          onClick={() => navigate("/history")}
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition"
        >
          Back to History
        </button>
      </div>
    );
  }

  return <Step3Report report={report} />;
}

export default InterviewReport;
