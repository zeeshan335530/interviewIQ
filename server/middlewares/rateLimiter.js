import rateLimit from "express-rate-limit";

/** General API limiter — 100 requests per 15 minutes */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: false,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

/** Strict limiter for AI-heavy endpoints — 20 requests per 15 minutes */
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: false,
  legacyHeaders: false,
  message: { message: "Too many AI requests, please slow down." },
});

/** Auth limiter — 10 attempts per 15 minutes */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: false,
  legacyHeaders: false,
  message: { message: "Too many auth attempts, please try again later." },
});
