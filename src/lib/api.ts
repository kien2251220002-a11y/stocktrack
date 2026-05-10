export const API_BASE = import.meta.env.VITE_API_URL?.trim();

if (!API_BASE) {
  console.error(
    "VITE_API_URL is not defined. Please set VITE_API_URL in your Vercel environment variables and redeploy."
  );
}

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!API_BASE) {
    throw new Error(
      "VITE_API_URL is not defined. API calls cannot be constructed. " +
      "Set VITE_API_URL and rebuild the app."
    );
  }
  return `${API_BASE.replace(/\/$/, "")}${normalizedPath}`;
}
