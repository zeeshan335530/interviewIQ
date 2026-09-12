// In development, Vite proxy forwards /api/* to localhost:8000
// In production, set VITE_SERVER_URL to your deployed backend URL
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || "";
