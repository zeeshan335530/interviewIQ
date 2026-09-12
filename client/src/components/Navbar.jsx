import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "motion/react";
import { BsRobot, BsCoin } from "react-icons/bs";
import { HiOutlineLogout } from "react-icons/hi";
import { FaUserAstronaut, FaHistory } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { SERVER_URL } from "../config";
import { setUserData } from "../redux/userSlice";
import AuthModel from "./AuthModel";
import toast from "react-hot-toast";

function Navbar() {
  const { userData } = useSelector((state) => state.user);
  const [showCreditPopup, setShowCreditPopup] = useState(false);
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const creditRef = useRef(null);
  const userRef = useRef(null);

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (creditRef.current && !creditRef.current.contains(e.target)) {
        setShowCreditPopup(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setShowUserPopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.get(`${SERVER_URL}/api/auth/logout`, { withCredentials: true });
      dispatch(setUserData(null));
      setShowCreditPopup(false);
      setShowUserPopup(false);
      navigate("/");
      toast.success("Logged out successfully.");
    } catch {
      toast.error("Logout failed. Please try again.");
    }
  };

  const popupVariants = {
    hidden: { opacity: 0, y: -8, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
  };

  return (
    <div className="bg-[#f3f3f3] flex justify-center px-4 pt-6">
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-6xl bg-white rounded-[24px] shadow-sm border border-gray-200 px-8 py-4 flex justify-between items-center relative"
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="bg-black text-white p-2 rounded-lg">
            <BsRobot size={18} />
          </div>
          <h1 className="font-semibold hidden md:block text-lg">InterviewIQ.AI</h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 relative">
          {/* Credits */}
          <div className="relative" ref={creditRef}>
            <button
              onClick={() => {
                if (!userData) { setShowAuth(true); return; }
                setShowCreditPopup((p) => !p);
                setShowUserPopup(false);
              }}
              className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full text-sm hover:bg-gray-200 transition font-medium"
            >
              <BsCoin size={18} className="text-emerald-600" />
              <span>{userData?.credits ?? 0}</span>
            </button>

            <AnimatePresence>
              {showCreditPopup && (
                <motion.div
                  variants={popupVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-64 bg-white shadow-xl border border-gray-200 rounded-2xl p-5 z-50"
                >
                  <p className="text-sm text-gray-600 mb-1 font-medium">
                    {userData?.credits} credits remaining
                  </p>
                  <p className="text-xs text-gray-400 mb-4">
                    Each interview costs 50 credits.
                  </p>
                  <button
                    onClick={() => { navigate("/pricing"); setShowCreditPopup(false); }}
                    className="w-full bg-black text-white py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition"
                  >
                    Buy more credits
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User avatar */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => {
                if (!userData) { setShowAuth(true); return; }
                setShowUserPopup((p) => !p);
                setShowCreditPopup(false);
              }}
              className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center font-semibold text-sm hover:bg-gray-800 transition"
            >
              {userData?.name?.slice(0, 1)?.toUpperCase() || <FaUserAstronaut size={16} />}
            </button>

            <AnimatePresence>
              {showUserPopup && (
                <motion.div
                  variants={popupVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-52 bg-white shadow-xl border border-gray-200 rounded-2xl p-4 z-50"
                >
                  <p className="text-sm text-blue-500 font-semibold mb-1 truncate">
                    {userData?.name}
                  </p>
                  <p className="text-xs text-gray-400 mb-3 truncate">{userData?.email}</p>
                  <div className="h-px bg-gray-100 mb-3" />
                  <button
                    onClick={() => { navigate("/history"); setShowUserPopup(false); }}
                    className="w-full text-left text-sm py-2 flex items-center gap-2 text-gray-600 hover:text-black transition"
                  >
                    <FaHistory size={14} />
                    Interview History
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left text-sm py-2 flex items-center gap-2 text-red-500 hover:text-red-700 transition"
                  >
                    <HiOutlineLogout size={16} />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
    </div>
  );
}

export default Navbar;
