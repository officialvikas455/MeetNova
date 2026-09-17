const isLocal =
  typeof window !== "undefined"
    ? window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    : process.env.NODE_ENV !== "production";

const server =
  import.meta.env.VITE_BACKEND_URL ||
  (isLocal
    ? "http://localhost:8000"
    : "https://meetnovabackend.onrender.com");

export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "423089796215-mtpfs4tqk35dj80ulkt4ie1ao47rnut6.apps.googleusercontent.com";

export default server;
