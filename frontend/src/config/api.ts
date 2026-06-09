// Centralized API constants used throughout the frontend.
// Vite will replace `import.meta.env.VITE_API_BASE_URL` at build time.
// Centralized API configuration
// API_BASE includes the `/api` prefix as defined in VITE_API_BASE_URL (e.g. "http://127.0.0.1:8000/api")
export const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Health endpoint lives at `/health` (no `/api` prefix). Build a URL that removes the `/api` portion
// from the base URL before appending the health path. This avoids hard‑coded strings throughout the app.
export const HEALTH_URL = `${API_BASE.replace(/\/api$/, "")}/health`;
