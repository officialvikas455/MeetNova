import { Router } from "express";
import {
  addToHistory,
  getUserHistory,
  googleLogin,
  login,
  register,
  resetPassword,
} from "../controllers/user.controller.js";

const router = Router();

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/google_login").post(googleLogin);
router.route("/reset_password").post(resetPassword);
router.route("/add_to_activity").post(addToHistory);
router.route("/get_all_activity").get(getUserHistory);

export default router;
