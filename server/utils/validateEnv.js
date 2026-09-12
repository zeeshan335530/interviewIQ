/**
 * Validate required environment variables on server startup
 * Fails fast if critical variables are missing
 */
export const validateEnv = () => {
  const required = [
    "PORT",
    "MONGODB_URL",
    "JWT_SECRET",
    "GROQ_API_KEY",
    "CLIENT_URL",
    "GMAIL_USER",
    "GMAIL_APP_PASSWORD",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((key) => console.error(`   - ${key}`));
    process.exit(1);
  }

  // Warn about optional payment variables
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn("⚠️  Razorpay credentials not set - payment features will not work");
  }

  console.log("✅ Environment variables validated");
};
