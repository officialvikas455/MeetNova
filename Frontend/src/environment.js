let IS_PROD = false;
const server = IS_PROD
  ? "https://meetnovabackend.onrender.com"
  : "http://localhost:8000";

export default server;
