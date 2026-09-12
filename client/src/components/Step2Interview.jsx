import React, { useState, useRef, useEffect, useCallback } from "react";
import maleVideo from "../assets/videos/male-ai.mp4";
import femaleVideo from "../assets/videos/female-ai.mp4";
import Timer from "./Timer";
import { motion, AnimatePresence } from "motion/react";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { BsArrowRight } from "react-icons/bs";
import { BsCameraVideo, BsCameraVideoOff } from "react-icons/bs";
import axios from "axios";
import { SERVER_URL } from "../config";
import toast from "react-hot-toast";
import { useProctoring } from "./useProctoring";

// ── Short toast message map ───────────────────────────────────────────────────
const TOAST_MESSAGES = {
  tab_switch:      "🚨 Tab switched!",
  window_blur:     "⚠️ Stay on this page!",
  person_entered:  "🚨 Someone entered frame!",
  multiple_faces:  "🚨 Multiple people detected!",
  crowd:           "🚨 Group detected!",
  no_face:         "⚠️ Face not visible!",
  looking_away:    "👀 Look at screen!",
};

function Step2Interview({ interviewData, onFinish }) {
  const { interviewId, questions, userName } = interviewData;

  const [isIntroPhase, setIsIntroPhase] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isAIPlaying, setIsAIPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [timeLeft, setTimeLeft] = useState(questions[0]?.timeLimit || 60);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceGender, setVoiceGender] = useState("female");
  const [subtitle, setSubtitle] = useState("");
  const [isFinishing, setIsFinishing] = useState(false);

  // ── Follow-up state ──────────────────────────────────────────────────────────
  const [followUpQuestion, setFollowUpQuestion] = useState(null);
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [followUpFeedback, setFollowUpFeedback] = useState("");
  const [followUpTimeLeft, setFollowUpTimeLeft] = useState(45);
  const [isFollowUpPhase, setIsFollowUpPhase] = useState(false);
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);

  // ── Model answer state ───────────────────────────────────────────────────────
  const [modelAnswer, setModelAnswer] = useState(null);
  const [showModelAnswer, setShowModelAnswer] = useState(false);

  // ── Live transcript (interim speech) ────────────────────────────────────────
  const [interimTranscript, setInterimTranscript] = useState("");

  // ── Proctoring ───────────────────────────────────────────────────────────────
  const [proctoringEnabled, setProctoringEnabled] = useState(true);
  const {
    webcamRef,
    cameraReady,
    cameraError,
    warning: proctoringWarning,
    faceCount,
    expression,
    violations,
    startCamera,
    stopCamera,
  } = useProctoring({ enabled: proctoringEnabled });

  // ── Feature states ────────────────────────────────────────────────────────
  // Feature 2: Filler word detector
  const FILLER_WORDS = ["umm", "um", "uh", "like", "basically", "you know", "so", "actually", "literally", "right"];
  const [fillerCount, setFillerCount]         = useState(0);
  const [fillerQuality, setFillerQuality]     = useState("good"); // good | warning | bad
  const fillerCountRef                        = useRef(0);

  // Feature 3: Voice delivery tracker
  const [wordCount, setWordCount]             = useState(0);
  const [pauseCount, setPauseCount]           = useState(0);
  const [deliveryLabel, setDeliveryLabel]     = useState(""); // Calm | Fast | Slow | Nervous
  const answerStartTimeRef                    = useRef(null);
  const lastSpeechTimeRef                     = useRef(null);
  const pauseTimerRef                         = useRef(null);
  const wordCountRef                          = useRef(0);
  const pauseCountRef                         = useRef(0);

  // Feature 4: Transcript accumulator per question
  const transcriptRef                         = useRef(""); // full spoken text for current Q

  // Per-question delivery data collected at submit time
  const [questionDeliveryData, setQuestionDeliveryData] = useState([]);

  // ── Snapshots — captured at Q3, Q6, Q9 (or every 3rd question) ───────────
  const snapshotsRef = useRef([]); // [{ questionIndex, timestamp, imageData }]

  const captureSnapshot = useCallback(() => {
    if (!webcamRef.current || !cameraReady) return;
    try {
      const video  = webcamRef.current;
      const canvas = document.createElement("canvas");
      canvas.width  = video.videoWidth  || 320;
      canvas.height = video.videoHeight || 240;
      const ctx = canvas.getContext("2d");
      // Mirror to match display (scaleX -1)
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL("image/jpeg", 0.7);
      snapshotsRef.current.push({
        questionIndex: currentIndex,
        timestamp: new Date().toLocaleTimeString(),
        imageData,
      });
    } catch (e) {
      console.warn("[Snapshot] Failed:", e.message);
    }
  }, [cameraReady, currentIndex]);

  // ── Floating camera drag state ────────────────────────────────────────────
  const [camPos, setCamPos] = useState({ x: 20, y: 20 });
  const [camMinimized, setCamMinimized] = useState(false);
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0 });

  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const isMicOnRef = useRef(isMicOn);
  const isAIPlayingRef = useRef(isAIPlaying);
  // Always holds latest answer value — avoids stale closure in submitAnswer
  const answerRef = useRef("");
  const followUpAnswerRef = useRef("");
  const isFollowUpPhaseRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { isMicOnRef.current = isMicOn; }, [isMicOn]);
  useEffect(() => { isAIPlayingRef.current = isAIPlaying; }, [isAIPlaying]);
  useEffect(() => { answerRef.current = answer; }, [answer]);
  useEffect(() => { followUpAnswerRef.current = followUpAnswer; }, [followUpAnswer]);
  useEffect(() => { isFollowUpPhaseRef.current = isFollowUpPhase; }, [isFollowUpPhase]);

  // ── Drag handlers for floating camera ────────────────────────────────────
  // camPosRef mirrors camPos so the stable callback can read latest position
  // without being in the dependency array — prevents recreation on every move.
  const camPosRef = useRef({ x: 20, y: 20 });

  const startDrag = useCallback((clientX, clientY) => {
    dragRef.current = {
      dragging: true,
      startX: clientX,
      startY: clientY,
      origX: camPosRef.current.x,
      origY: camPosRef.current.y,
    };

    const CAM_W = 160;
    const CAM_H = 120;

    const move = (ex, ey) => {
      if (!dragRef.current.dragging) return;
      const dx = ex - dragRef.current.startX;
      const dy = ey - dragRef.current.startY;

      // right/bottom offsets — invert dx/dy; clamp to viewport
      const maxX = window.innerWidth  - CAM_W;
      const maxY = window.innerHeight - CAM_H;
      const newX = Math.min(maxX, Math.max(0, dragRef.current.origX - dx));
      const newY = Math.min(maxY, Math.max(0, dragRef.current.origY - dy));

      camPosRef.current = { x: newX, y: newY };
      setCamPos({ x: newX, y: newY });
    };

    const handleMouseMove = (ev) => move(ev.clientX, ev.clientY);
    const handleTouchMove = (ev) => {
      ev.preventDefault();
      move(ev.touches[0].clientX, ev.touches[0].clientY);
    };

    const stop = () => {
      dragRef.current.dragging = false;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup",   stop);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend",  stop);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup",   stop);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend",  stop);
  }, []); // stable — reads position via camPosRef, not camPos state

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  }, [startDrag]);

  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    startDrag(e.touches[0].clientX, e.touches[0].clientY);
  }, [startDrag]);

  const currentQuestion = questions[currentIndex];
  const videoSource = voiceGender === "male" ? maleVideo : femaleVideo;

  // ── Load voices ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;

      const femaleVoice = voices.find((v) =>
        v.name.toLowerCase().includes("zira") ||
        v.name.toLowerCase().includes("samantha") ||
        v.name.toLowerCase().includes("female")
      );
      if (femaleVoice) { setSelectedVoice(femaleVoice); setVoiceGender("female"); return; }

      const maleVoice = voices.find((v) =>
        v.name.toLowerCase().includes("david") ||
        v.name.toLowerCase().includes("mark") ||
        v.name.toLowerCase().includes("male")
      );
      if (maleVoice) { setSelectedVoice(maleVoice); setVoiceGender("male"); return; }

      setSelectedVoice(voices[0]);
      setVoiceGender("female");
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // ── Speech recognition setup ─────────────────────────────────────────────────
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) return;

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;   // false = more reliable on Chrome
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += t + " ";
        } else {
          interim += t;
        }
      }

      if (finalText) {
        // ── Feature 4: accumulate transcript ──────────────────────────────────
        transcriptRef.current += finalText;

        // ── Feature 2: filler word detection ─────────────────────────────────
        const lower = finalText.toLowerCase();
        const newFillers = FILLER_WORDS.reduce((count, fw) => {
          const regex = new RegExp(`\\b${fw}\\b`, "gi");
          return count + (lower.match(regex) || []).length;
        }, 0);
        if (newFillers > 0) {
          fillerCountRef.current += newFillers;
          setFillerCount(fillerCountRef.current);
          const total = fillerCountRef.current;
          setFillerQuality(total <= 2 ? "good" : total <= 5 ? "warning" : "bad");
        }

        // ── Feature 3: word count + pace tracking ─────────────────────────────
        const words = finalText.trim().split(/\s+/).filter(Boolean).length;
        wordCountRef.current += words;
        setWordCount(wordCountRef.current);
        lastSpeechTimeRef.current = Date.now();
        if (!answerStartTimeRef.current) answerStartTimeRef.current = Date.now();

        // Clear pause timer since speech resumed
        if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = setTimeout(() => {
          // 3s silence = a pause
          pauseCountRef.current += 1;
          setPauseCount(pauseCountRef.current);
        }, 3000);

        if (isFollowUpPhaseRef.current) {
          setFollowUpAnswer((prev) => {
            const updated = prev + finalText;
            followUpAnswerRef.current = updated;
            return updated;
          });
        } else {
          setAnswer((prev) => {
            const updated = prev + finalText;
            answerRef.current = updated;
            return updated;
          });
        }
      }
      setInterimTranscript(interim);
    };

    // Auto-restart when a session ends (Chrome stops after silence)
    recognition.onend = () => {
      setInterimTranscript("");
      if (isMicOnRef.current && !isAIPlayingRef.current) {
        try { recognition.start(); } catch { /* ignore */ }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        toast.error("Microphone access denied. Please allow mic permission.");
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        console.warn("[SpeechRecognition]", event.error);
      }
    };

    recognitionRef.current = recognition;
  }, []); // eslint-disable-line

  const startMic = useCallback(() => {
    if (recognitionRef.current && !isAIPlayingRef.current) {
      try { recognitionRef.current.start(); } catch { /* already started */ }
    }
  }, []);

  const stopMic = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* already stopped */ }
    }
    setInterimTranscript(""); // clear live text when mic stops
  }, []);

  // ── Speak function ───────────────────────────────────────────────────────────
  const speakText = useCallback(
    (text) =>
      new Promise((resolve) => {
        if (!window.speechSynthesis || !selectedVoice) { resolve(); return; }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(
          text.replace(/,/g, ", ...").replace(/\./g, ". ...")
        );
        utterance.voice = selectedVoice;
        utterance.rate = 0.92;
        utterance.pitch = 1.05;
        utterance.volume = 1;

        utterance.onstart = () => {
          setIsAIPlaying(true);
          stopMic();
          videoRef.current?.play();
        };

        utterance.onend = () => {
          if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
          }
          setIsAIPlaying(false);
          if (isMicOnRef.current) startMic();
          setTimeout(() => { setSubtitle(""); resolve(); }, 300);
        };

        utterance.onerror = () => resolve();

        setSubtitle(text);
        window.speechSynthesis.speak(utterance);
      }),
    [selectedVoice, startMic, stopMic]
  );

  // ── Intro + question speaking ────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedVoice) return;

    const run = async () => {
      if (isIntroPhase) {
        await speakText(`Hi ${userName}, it's great to meet you today. I hope you're feeling confident and ready.`);
        await speakText("I'll ask you a few questions. Just answer naturally, and take your time. Let's begin.");
        setIsIntroPhase(false);
      } else if (currentQuestion) {
        await new Promise((r) => setTimeout(r, 800));
        if (currentIndex === questions.length - 1) {
          await speakText("Alright, this one might be a bit more challenging.");
        }
        await speakText(currentQuestion.question);
        if (isMicOnRef.current) startMic();
      }
    };

    run();
  }, [selectedVoice, isIntroPhase, currentIndex]); // eslint-disable-line

  // ── Start camera as soon as intro ends ───────────────────────────────────────
  useEffect(() => {
    if (!isIntroPhase && proctoringEnabled) {
      startCamera();
    }
  }, [isIntroPhase]); // eslint-disable-line

  // ── Delivery label — computed from pace (words/min) ───────────────────────
  useEffect(() => {
    if (wordCount === 0 || !answerStartTimeRef.current) return;
    const elapsedMin = (Date.now() - answerStartTimeRef.current) / 60000;
    if (elapsedMin < 0.05) return; // too early
    const wpm = wordCount / elapsedMin;
    if (wpm > 160)      setDeliveryLabel("Too Fast");
    else if (wpm > 110) setDeliveryLabel("Good Pace");
    else if (wpm > 60)  setDeliveryLabel("Calm");
    else                setDeliveryLabel("Too Slow");
  }, [wordCount]);

  // ── Reset delivery trackers on each new question ──────────────────────────
  useEffect(() => {
    fillerCountRef.current    = 0;
    wordCountRef.current      = 0;
    pauseCountRef.current     = 0;
    answerStartTimeRef.current = null;
    lastSpeechTimeRef.current  = null;
    transcriptRef.current      = "";
    setFillerCount(0);
    setFillerQuality("good");
    setWordCount(0);
    setPauseCount(0);
    setDeliveryLabel("");
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
  }, [currentIndex]); // eslint-disable-line

  // ── Capture snapshot at Q1, Q4, Q7, Q10 (every 3rd question) ────────────
  useEffect(() => {
    if (isIntroPhase || !cameraReady) return;
    // Capture at index 0, 3, 6, 9 — i.e. Q1, Q4, Q7, Q10
    if (currentIndex % 3 === 0) {
      // Small delay so camera is stable after question starts
      const t = setTimeout(() => captureSnapshot(), 3000);
      return () => clearTimeout(t);
    }
  }, [currentIndex, cameraReady, isIntroPhase]); // eslint-disable-line

  // ── Timer ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isIntroPhase || !currentQuestion) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isIntroPhase, currentIndex]); // eslint-disable-line

  // Reset timer when question changes
  useEffect(() => {
    if (!isIntroPhase && currentQuestion) {
      setTimeLeft(currentQuestion.timeLimit || 60);
    }
  }, [currentIndex]); // eslint-disable-line

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (!isIntroPhase && currentQuestion && timeLeft === 0 && !isSubmitting && !feedback) {
      submitAnswer();
    }
  }, [timeLeft]); // eslint-disable-line

  // ── Follow-up timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isFollowUpPhase || followUpFeedback) return;

    const timer = setInterval(() => {
      setFollowUpTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFollowUpPhase, followUpFeedback]); // eslint-disable-line

  // Auto-submit follow-up when its timer hits 0
  useEffect(() => {
    if (isFollowUpPhase && followUpTimeLeft === 0 && !isSubmittingFollowUp && !followUpFeedback) {
      submitFollowUpAnswer();
    }
  }, [followUpTimeLeft]); // eslint-disable-line

  // ── Cleanup on unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopMic();
      window.speechSynthesis.cancel();
    };
  }, [stopMic]);

  // ── Submit answer ────────────────────────────────────────────────────────────
  const submitAnswer = async () => {
    if (isSubmitting) return;
    stopMic();
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    setIsSubmitting(true);

    const currentAnswer = answerRef.current;

    // Compute delivery score (0-10) from pace + fillers + pauses
    const elapsedMin = answerStartTimeRef.current
      ? (Date.now() - answerStartTimeRef.current) / 60000
      : 0;
    const wpm = elapsedMin > 0 ? wordCountRef.current / elapsedMin : 0;
    const paceScore   = wpm >= 100 && wpm <= 150 ? 10 : wpm >= 70 && wpm <= 180 ? 7 : 4;
    const fillerScore = fillerCountRef.current === 0 ? 10 : fillerCountRef.current <= 2 ? 8 : fillerCountRef.current <= 5 ? 5 : 2;
    const pauseScore  = pauseCountRef.current <= 1 ? 10 : pauseCountRef.current <= 3 ? 7 : 4;
    const deliveryScore = Math.round((paceScore + fillerScore + pauseScore) / 3);

    // Save delivery data for this question
    const deliveryEntry = {
      questionIndex: currentIndex,
      transcript: transcriptRef.current.trim(),
      deliveryScore,
      fillerCount: fillerCountRef.current,
      wordCount: wordCountRef.current,
      pauseCount: pauseCountRef.current,
      wpm: Math.round(wpm),
    };
    setQuestionDeliveryData(prev => [...prev, deliveryEntry]);

    try {
      const result = await axios.post(
        `${SERVER_URL}/api/interview/submit-answer`,
        {
          interviewId,
          questionIndex: currentIndex,
          answer: currentAnswer,
          timeTaken: currentQuestion.timeLimit - timeLeft,
        },
        { withCredentials: true }
      );

      setFeedback(result.data.feedback);
      await speakText(result.data.feedback);

      // Store model answer (always present)
      if (result.data.modelAnswer) {
        setModelAnswer(result.data.modelAnswer);
      }

      // If AI returned a follow-up question, enter follow-up phase silently
      if (result.data.followUpQuestion) {
        setFollowUpQuestion(result.data.followUpQuestion);
        setFollowUpTimeLeft(45);
        setIsFollowUpPhase(true);
        // Speak follow-up directly — no preamble, like a real interviewer
        await speakText(result.data.followUpQuestion);
        if (isMicOnRef.current) startMic();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit answer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Submit follow-up answer ──────────────────────────────────────────────────
  const submitFollowUpAnswer = async () => {
    if (isSubmittingFollowUp) return;
    stopMic();
    setIsSubmittingFollowUp(true);

    const currentFollowUpAnswer = followUpAnswerRef.current;

    try {
      const result = await axios.post(
        `${SERVER_URL}/api/interview/submit-followup`,
        { interviewId, questionIndex: currentIndex, followUpAnswer: currentFollowUpAnswer },
        { withCredentials: true }
      );
      setFollowUpFeedback(result.data.followUpFeedback);
      await speakText(result.data.followUpFeedback);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to submit follow-up.");
    } finally {
      setIsSubmittingFollowUp(false);
    }
  };

  const toggleMic = () => {
    if (isMicOn) { stopMic(); } else { startMic(); }
    setIsMicOn((p) => !p);
  };

  const handleNext = async () => {
    setAnswer("");
    setFeedback("");
    setFollowUpQuestion(null);
    setFollowUpAnswer("");
    setFollowUpFeedback("");
    setIsFollowUpPhase(false);
    setFollowUpTimeLeft(45);
    setModelAnswer(null);
    setShowModelAnswer(false);
    setInterimTranscript("");
    answerRef.current = "";
    followUpAnswerRef.current = "";
    isFollowUpPhaseRef.current = false;

    if (currentIndex + 1 >= questions.length) {
      finishInterview();
      return;
    }

    await speakText("Alright, let's move to the next question.");
    setCurrentIndex((p) => p + 1);
    setTimeout(() => { if (isMicOnRef.current) startMic(); }, 500);
  };

  const finishInterview = async () => {
    stopMic();
    // Capture one final snapshot before stopping camera
    captureSnapshot();
    stopCamera();
    setIsMicOn(false);
    setIsFinishing(true);

    try {
      const result = await axios.post(
        `${SERVER_URL}/api/interview/finish`,
        {
          interviewId,
          deliveryData: questionDeliveryData,
          snapshots: snapshotsRef.current,
          violations,  // pass proctoring violations for integrity score
        },
        { withCredentials: true }
      );
      onFinish(result.data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to finish interview.");
      setIsFinishing(false);
    }
  };

  if (isFinishing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 font-medium">Generating your report...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-6xl min-h-[80vh] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col lg:flex-row overflow-hidden">

        {/* Video section — AI avatar, subtitle, timer only */}
        <div className="w-full lg:w-[35%] bg-white flex flex-col items-center p-6 space-y-4 border-r border-gray-200 self-stretch overflow-y-auto">

          {/* AI Avatar video */}
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-xl">
            <video
              src={videoSource}
              key={videoSource}
              ref={videoRef}
              muted
              playsInline
              preload="metadata"
              className="w-full h-auto object-cover"
            />
          </div>

          {/* Subtitle */}
          <AnimatePresence>
            {subtitle && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-md bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm"
              >
                <p className="text-gray-700 text-sm font-medium text-center leading-relaxed">
                  {subtitle}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Timer & status */}
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-md p-6 space-y-5">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Interview Status</span>
              {isAIPlaying && (
                <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  AI Speaking
                </span>
              )}
            </div>

            <div className="h-px bg-gray-200" />

            <div className="flex justify-center">
              <Timer timeLeft={timeLeft} totalTime={currentQuestion?.timeLimit} />
            </div>

            <div className="h-px bg-gray-200" />

            <div className="grid grid-cols-2 gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-emerald-600">{currentIndex + 1}</p>
                <p className="text-xs text-gray-400">Current Question</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{questions.length}</p>
                <p className="text-xs text-gray-400">Total Questions</p>
              </div>
            </div>
          </div>

          {/* ── Feature 1: Real-time Confidence Meter ── */}
          {!isIntroPhase && cameraReady && expression && (
            <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-md p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                <span>😊</span> Confidence Meter
              </p>
              {(() => {
                const { dominant, scores } = expression;
                const confidenceMap = {
                  happy:     { label: "Confident",  color: "bg-emerald-500", text: "text-emerald-700", pct: Math.round((scores.happy || 0) * 100) },
                  neutral:   { label: "Calm",       color: "bg-blue-400",    text: "text-blue-700",    pct: Math.round((scores.neutral || 0) * 100) },
                  surprised: { label: "Surprised",  color: "bg-yellow-400",  text: "text-yellow-700",  pct: Math.round((scores.surprised || 0) * 100) },
                  fearful:   { label: "Nervous",    color: "bg-orange-400",  text: "text-orange-700",  pct: Math.round((scores.fearful || 0) * 100) },
                  sad:       { label: "Hesitant",   color: "bg-gray-400",    text: "text-gray-600",    pct: Math.round((scores.sad || 0) * 100) },
                  disgusted: { label: "Uncomfortable", color: "bg-red-400",  text: "text-red-700",     pct: Math.round((scores.disgusted || 0) * 100) },
                  angry:     { label: "Stressed",   color: "bg-red-500",     text: "text-red-700",     pct: Math.round((scores.angry || 0) * 100) },
                };
                const current = confidenceMap[dominant] || confidenceMap.neutral;
                // Show top 3 expressions as bars
                const top3 = Object.entries(scores)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([key, val]) => ({ ...(confidenceMap[key] || confidenceMap.neutral), key, val: Math.round(val * 100) }));
                return (
                  <div className="space-y-2">
                    <div className={`text-sm font-bold ${current.text} flex items-center gap-2`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${current.color} animate-pulse`} />
                      {current.label}
                    </div>
                    {top3.map((e) => (
                      <div key={e.key}>
                        <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                          <span>{e.label}</span><span>{e.val}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${e.color} rounded-full transition-all duration-500`} style={{ width: `${e.val}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── Feature 2 & 3: Answer Quality + Voice Delivery ── */}
          {!isIntroPhase && !feedback && (isMicOn || wordCount > 0) && (
            <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-md p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                <span>🎙️</span> Live Answer Quality
              </p>
              <div className="flex flex-wrap gap-2">
                {/* Filler word badge */}
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  fillerQuality === "good"    ? "bg-emerald-100 text-emerald-700" :
                  fillerQuality === "warning" ? "bg-yellow-100 text-yellow-700"  :
                                               "bg-red-100 text-red-700"
                }`}>
                  {fillerQuality === "good" ? "✓ Clean speech" :
                   fillerQuality === "warning" ? `⚠️ ${fillerCount} fillers` :
                   `🚨 ${fillerCount} fillers`}
                </span>

                {/* Pace badge */}
                {deliveryLabel && (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    deliveryLabel === "Good Pace" ? "bg-emerald-100 text-emerald-700" :
                    deliveryLabel === "Calm"      ? "bg-blue-100 text-blue-700"       :
                    deliveryLabel === "Too Fast"  ? "bg-orange-100 text-orange-700"   :
                                                   "bg-gray-100 text-gray-600"
                  }`}>
                    {deliveryLabel === "Good Pace" ? "✓ Good pace" :
                     deliveryLabel === "Calm"      ? "🧘 Calm pace" :
                     deliveryLabel === "Too Fast"  ? "⚡ Too fast" :
                     "🐢 Too slow"}
                  </span>
                )}

                {/* Word count */}
                {wordCount > 0 && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">
                    {wordCount} words
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Answer section */}
        <div className="flex-1 flex flex-col p-4 sm:p-6 md:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-emerald-600 mb-6">
            AI Smart Interview
          </h2>

          {!isIntroPhase && currentQuestion && (
            <div className="relative mb-6 bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-xs sm:text-sm text-gray-400 mb-2">
                Question {currentIndex + 1} of {questions.length} ·{" "}
                <span className="capitalize">{currentQuestion.difficulty}</span>
              </p>
              <p className="text-base sm:text-lg font-semibold text-gray-800 leading-relaxed">
                {currentQuestion.question}
              </p>
            </div>
          )}

          {/* Main answer textarea — only shown when actively answering the main question */}
          {!feedback && !isFollowUpPhase && (
            <div className="flex-1 flex flex-col relative">
              <textarea
                placeholder="Type your answer here, or speak using the microphone..."
                onChange={(e) => setAnswer(e.target.value)}
                value={answer}
                className="flex-1 min-h-[160px] bg-gray-100 p-4 sm:p-6 rounded-2xl resize-none outline-none border border-gray-200 focus:ring-2 focus:ring-emerald-500 transition text-gray-800"
              />
              {/* Live interim transcript */}
              {interimTranscript && (
                <div className="mt-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" />
                  <p className="text-sm text-emerald-700 italic leading-relaxed">
                    {interimTranscript}
                  </p>
                </div>
              )}
            </div>
          )}

          {!feedback ? (
            /* ── Normal answer submit ── */
            <div className="flex items-center gap-4 mt-6">
              <motion.button
                onClick={toggleMic}
                whileTap={{ scale: 0.9 }}
                title={isMicOn ? "Mute microphone" : "Unmute microphone"}
                className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-full shadow-lg transition ${
                  isMicOn ? "bg-black text-white" : "bg-red-100 text-red-500 border border-red-200"
                }`}
              >
                {isMicOn ? <FaMicrophone size={20} /> : <FaMicrophoneSlash size={20} />}
              </motion.button>

              <motion.button
                onClick={submitAnswer}
                disabled={isSubmitting}
                whileTap={{ scale: 0.95 }}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-3 sm:py-4 rounded-2xl shadow-lg hover:opacity-90 transition font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Evaluating..." : "Submit Answer"}
              </motion.button>
            </div>
          ) : isFollowUpPhase && !followUpFeedback ? (
            /* ── Follow-up phase — clean, no feedback shown yet ── */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 space-y-4 flex-1 flex flex-col"
            >
              {/* Follow-up question card — styled like the main question */}
              <div className="bg-gray-50 border border-gray-200 p-4 sm:p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Follow-up
                  </p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    followUpTimeLeft <= 10 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"
                  }`}>
                    {followUpTimeLeft}s
                  </span>
                </div>
                <p className="text-base font-semibold text-gray-800 leading-relaxed">{followUpQuestion}</p>
              </div>

              {/* Follow-up answer textarea */}
              <textarea
                placeholder="Answer the follow-up question..."
                onChange={(e) => setFollowUpAnswer(e.target.value)}
                value={followUpAnswer}
                className="flex-1 min-h-[140px] bg-gray-100 p-4 rounded-2xl resize-none outline-none border border-gray-200 focus:ring-2 focus:ring-emerald-500 transition text-gray-800 text-sm"
              />

              {/* Live interim transcript */}
              {interimTranscript && (
                <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" />
                  <p className="text-sm text-emerald-700 italic leading-relaxed">
                    {interimTranscript}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-4">
                <motion.button
                  onClick={toggleMic}
                  whileTap={{ scale: 0.9 }}
                  className={`w-12 h-12 flex items-center justify-center rounded-full shadow-lg transition ${
                    isMicOn ? "bg-black text-white" : "bg-red-100 text-red-500 border border-red-200"
                  }`}
                >
                  {isMicOn ? <FaMicrophone size={18} /> : <FaMicrophoneSlash size={18} />}
                </motion.button>

                <motion.button
                  onClick={submitFollowUpAnswer}
                  disabled={isSubmittingFollowUp}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-3 rounded-2xl shadow-lg hover:opacity-90 transition font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmittingFollowUp ? "Evaluating..." : "Submit Answer"}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            /* ── Final card — all feedback shown together after everything is done ── */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 space-y-3"
            >
              {/* Combined feedback section */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-emerald-100 flex items-center gap-2">
                  <span className="text-base">📋</span>
                  <span className="text-xs font-semibold text-emerald-700">Interview Feedback</span>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {/* Main answer feedback */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 mb-1">Your Answer</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{feedback}</p>
                  </div>

                  {/* Follow-up feedback — only if there was a follow-up */}
                  {followUpFeedback && (
                    <>
                      <div className="h-px bg-emerald-100" />
                      <div>
                        <p className="text-xs font-semibold text-gray-400 mb-1">Follow-up Answer</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{followUpFeedback}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Model Answer collapsible card */}
              {modelAnswer && (
                <div className="border border-purple-200 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setShowModelAnswer((p) => !p)}
                    className="w-full flex items-center justify-between px-5 py-3 bg-purple-50 hover:bg-purple-100 transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">💡</span>
                      <span className="text-xs font-semibold text-purple-700">See Model Answer</span>
                      <span className="text-xs text-purple-400 hidden sm:inline">(What a great answer looks like)</span>
                    </div>
                    <motion.span
                      animate={{ rotate: showModelAnswer ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-purple-400 text-xs"
                    >
                      ▼
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {showModelAnswer && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 py-4 bg-white border-t border-purple-100">
                          <p className="text-sm text-gray-700 leading-relaxed">{modelAnswer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <button
                onClick={handleNext}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-3 rounded-xl shadow-md hover:opacity-90 transition flex items-center justify-center gap-2 font-semibold"
              >
                {currentIndex + 1 >= questions.length ? "Finish Interview" : "Next Question"}
                <BsArrowRight size={18} />
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Top-Right Toast Warning ─────────────────────────────────────────── */}
      <AnimatePresence>
        {proctoringWarning && (
          <motion.div
            key={proctoringWarning.time}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed top-4 right-4 z-[9999] px-4 py-2 rounded-full text-sm font-semibold shadow-lg pointer-events-none ${
              proctoringWarning.severity === "high"
                ? "bg-red-500 text-white"
                : proctoringWarning.severity === "medium"
                ? "bg-orange-400 text-white"
                : "bg-yellow-400 text-gray-800"
            }`}
          >
            {TOAST_MESSAGES[proctoringWarning.type] || proctoringWarning.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Draggable Camera Window — always rendered when proctoring enabled ── */}
      {proctoringEnabled && (
        <>
          {camMinimized ? (
            /* Minimized: small green circle */
            <button
              onClick={() => setCamMinimized(false)}
              className="fixed bottom-5 right-5 z-[9998] w-10 h-10 bg-emerald-500 rounded-full shadow-lg flex items-center justify-center hover:bg-emerald-600 transition"
              title="Restore camera"
            >
              <BsCameraVideo size={18} className="text-white" />
            </button>
          ) : (
            /* Expanded floating camera */
            <div
              style={{
                position: "fixed",
                bottom: `${camPos.y}px`,
                right: `${camPos.x}px`,
                width: "160px",
                height: "120px",
                zIndex: 9998,
              }}
              className={`rounded-xl overflow-hidden shadow-2xl border-2 transition-colors duration-300 ${
                proctoringWarning?.severity === "high"
                  ? "border-red-500"
                  : proctoringWarning?.severity === "medium"
                  ? "border-orange-400"
                  : proctoringWarning?.severity === "low"
                  ? "border-yellow-400"
                  : "border-emerald-400"
              }`}
            >
              {/* Drag handle — covers full area but sits below badges/buttons */}
              <div
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                className="absolute inset-0 cursor-move"
                style={{ zIndex: 10 }}
              />

              {/* Camera feed — always rendered so webcamRef is always attached */}
              <video
                ref={webcamRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover bg-gray-900 ${!cameraReady ? "hidden" : ""}`}
                style={{ transform: "scaleX(-1)" }}
              />

              {/* Placeholder shown when camera not ready */}
              {!cameraReady && (
                <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center gap-1">
                  <BsCameraVideoOff size={20} className="text-gray-500" />
                  <p className="text-xs text-gray-400 text-center px-2">
                    {cameraError || "Starting..."}
                  </p>
                </div>
              )}

              {/* Flashing red overlay on high severity */}
              {proctoringWarning?.severity === "high" && (
                <div className="absolute inset-0 bg-red-500 opacity-20 animate-pulse pointer-events-none z-20" />
              )}

              {/* Violation count badge — top-left */}
              {violations.length > 0 && (
                <div className="absolute top-1 left-1 z-30 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold pointer-events-none">
                  {violations.length}⚠️
                </div>
              )}

              {/* Face count badge — top-right (leave space for minimize btn) */}
              {cameraReady && (
                <div
                  className={`absolute top-1 right-6 z-30 text-xs px-1.5 py-0.5 rounded-full font-semibold pointer-events-none ${
                    faceCount === 1
                      ? "bg-emerald-500 text-white"
                      : faceCount === 0
                      ? "bg-red-500 text-white"
                      : "bg-orange-500 text-white"
                  }`}
                >
                  {faceCount === 1 ? "✓" : faceCount === 0 ? "✗" : `${faceCount}`}
                </div>
              )}

              {/* Minimize button — top-right corner */}
              <button
                onClick={(e) => { e.stopPropagation(); setCamMinimized(true); }}
                className="absolute top-0.5 right-0.5 z-30 w-5 h-5 bg-black bg-opacity-50 hover:bg-opacity-80 text-white text-xs rounded-full flex items-center justify-center transition"
                title="Minimize camera"
              >
                ×
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Step2Interview;
