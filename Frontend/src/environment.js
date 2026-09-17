let IS_PROD = false;
const server = IS_PROD
  ? "https://meetnovabackend.onrender.com"
  : "http://localhost:8000";

export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "423089796215-mtpfs4tqk35dj80ulkt4ie1ao47rnut6.apps.googleusercontent.com";

export default server;
