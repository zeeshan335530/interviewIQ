import { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "face-api.js";

const MODEL_URL = "/models";
const DETECTION_INTERVAL = 2000;   // check every 2s
const WARN_THROTTLE = 7000;        // same warning max once per 7s
const BAD_FRAME_THRESHOLD = 2;     // consecutive bad frames before warning

export function useProctoring({ enabled = true } = {}) {
  const webcamRef        = useRef(null);
  const streamRef        = useRef(null);
  const intervalRef      = useRef(null);
  const badFrames        = useRef({});          // { type: count }
  const lastWarn         = useRef({});          // { type: timestamp }
  const prevFaceCount    = useRef(0);           // track sudden person entry

  const [modelsLoaded, setModelsLoaded]   = useState(false);
  const [cameraReady, setCameraReady]     = useState(false);
  const [cameraError, setCameraError]     = useState(null);
  const [warning, setWarning]             = useState(null);  // { type, message, severity }
  const [faceCount, setFaceCount]         = useState(0);
  const [violations, setViolations]       = useState([]);    // full log for report
  const [expression, setExpression]       = useState(null);  // { dominant, scores }

  // ── Load models ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    (async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (e) {
        console.warn("[Proctoring] Model load failed:", e.message);
      }
    })();
  }, [enabled]);

  // ── Start webcam ─────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    if (!enabled) return;
    // If stream already running, just re-attach to video element if needed
    if (streamRef.current) {
      if (webcamRef.current && !webcamRef.current.srcObject) {
        webcamRef.current.srcObject = streamRef.current;
        try { await webcamRef.current.play(); } catch { /* ignore */ }
      }
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      // Attach to video element if it's already mounted
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
        try { await webcamRef.current.play(); } catch { /* ignore */ }
      }
      setCameraReady(true);
      setCameraError(null);
    } catch (e) {
      setCameraError("Camera access denied. Proctoring disabled.");
    }
  }, [enabled]);

  // ── Stop webcam ──────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  // ── Trigger warning — throttled per type ─────────────────────────────────────
  const triggerWarning = useCallback((type, message, severity = "medium") => {
    const now = Date.now();
    if (now - (lastWarn.current[type] || 0) < WARN_THROTTLE) return;
    lastWarn.current[type] = now;

    const entry = { type, message, severity, time: new Date().toLocaleTimeString() };
    setWarning(entry);
    setViolations((prev) => [...prev, entry]);
    setTimeout(() => setWarning(null), 5000);
  }, []);

  // ── Bad frame counter per type ────────────────────────────────────────────────
  const incrementBad = useCallback((type, message, severity) => {
    badFrames.current[type] = (badFrames.current[type] || 0) + 1;
    if (badFrames.current[type] >= BAD_FRAME_THRESHOLD) {
      triggerWarning(type, message, severity);
    }
  }, [triggerWarning]);

  const clearBad = useCallback((type) => {
    badFrames.current[type] = 0;
  }, []);

  // ── Tab switch / window blur detection ───────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerWarning(
          "tab_switch",
          "🚨 Tab switch detected! Do not leave the interview window.",
          "high"
        );
      }
    };

    const handleBlur = () => {
      triggerWarning(
        "window_blur",
        "⚠️ Window focus lost! Please stay on the interview page.",
        "high"
      );
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [enabled, triggerWarning]);

  // ── Face detection loop ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!modelsLoaded || !cameraReady || !enabled) return;

    intervalRef.current = setInterval(async () => {
      const video = webcamRef.current;
      if (!video || video.readyState < 2) return;

      try {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.35 }))
          .withFaceLandmarks(true)
          .withFaceExpressions();

        const count = detections.length;
        setFaceCount(count);

        // ── Sudden person entry (prev was 1, now 2+) ──────────────────────────
        if (prevFaceCount.current <= 1 && count >= 2) {
          triggerWarning(
            "person_entered",
            "🚨 Someone entered the frame! Only you should be visible.",
            "high"
          );
        }
        prevFaceCount.current = count;

        // ── No face ───────────────────────────────────────────────────────────
        if (count === 0) {
          incrementBad("no_face", "⚠️ Face not visible! Please stay in frame.", "medium");
          clearBad("multiple_faces");
          clearBad("looking_away");
          setExpression(null);
          return;
        }
        clearBad("no_face");

        // ── Multiple faces / crowd ────────────────────────────────────────────
        if (count === 2) {
          incrementBad(
            "multiple_faces",
            "🚨 Another person detected! Only the candidate should be visible.",
            "high"
          );
          return;
        }
        if (count >= 3) {
          incrementBad(
            "crowd",
            "🚨 Multiple people detected! This looks like a group setting.",
            "high"
          );
          return;
        }
        clearBad("multiple_faces");
        clearBad("crowd");

        // ── Expression detection ──────────────────────────────────────────────
        if (detections[0]?.expressions) {
          const expr = detections[0].expressions;
          // Pick dominant expression
          const dominant = Object.entries(expr).reduce((a, b) => a[1] > b[1] ? a : b)[0];
          setExpression({ dominant, scores: expr });
        }

        // ── 1 face — check looking away ───────────────────────────────────────
        const landmarks = detections[0].landmarks;
        const nose      = landmarks.getNose();
        const leftEye   = landmarks.getLeftEye();
        const rightEye  = landmarks.getRightEye();

        const eyeCenterX = (leftEye[0].x + rightEye[3].x) / 2;
        const noseTipX   = nose[3].x;
        const faceWidth  = Math.abs(rightEye[3].x - leftEye[0].x);
        const deviation  = Math.abs(noseTipX - eyeCenterX) / faceWidth;

        if (deviation > 0.35) {
          incrementBad(
            "looking_away",
            "👀 Please look at the screen during the interview.",
            "low"
          );
        } else {
          clearBad("looking_away");
        }

      } catch {
        // silently ignore
      }
    }, DETECTION_INTERVAL);

    return () => clearInterval(intervalRef.current);
  }, [modelsLoaded, cameraReady, enabled, triggerWarning, incrementBad, clearBad]);

  // ── Cleanup ───────────────────────────────────────────────────────────────────
  useEffect(() => () => stopCamera(), [stopCamera]);

  return {
    webcamRef,
    streamRef,
    cameraReady,
    cameraError,
    modelsLoaded,
    warning,
    faceCount,
    expression,
    violations,
    startCamera,
    stopCamera,
  };
}
