import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Meeting } from "../models/meeting.model.js";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Please Provide Your Details!!" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "User Not Found!!" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Invalid username or password" });
    }

    let token = crypto.randomBytes(20).toString("hex");
    user.token = token;
    await user.save();

    return res.status(httpStatus.OK).json({ token });
  } catch (err) {
    return res
      .status(500)
      .json({ message: `Something went Wrong ${err.message}` });
  }
};

const register = async (req, res) => {
  const { name, username, password } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(httpStatus.CONFLICT)
        .json({ message: "User already exists!!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      username,
      password: hashedPassword,
    });

    await newUser.save();
    return res.status(httpStatus.CREATED).json({ message: "User Registered!" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: `Something went wrong ${err.message}` });
  }
};

const getUserHistory = async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({ token: token });
    const meetings = await Meeting.find({
      user_id: user.username,
    });
    res.json(meetings);
  } catch (e) {
    res.json({ message: `Something Went Wrong ${e}` });
  }
};
const addToHistory = async (req, res) => {
  const { token, meeting_code } = req.body;

  try {
    const user = await User.findOne({ token: token });

    if (!user) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "User not found" });
    }

    const newMeeting = new Meeting({
      user_id: user.username,
      meetingCode: meeting_code,
    });
    await newMeeting.save();

    res.status(httpStatus.CREATED).json({ message: "Added code to history" });
  } catch (error) {
    res.status(500).json({ message: `Something went Wrong ${error}` });
  }
};

const resetPassword = async (req, res) => {
  const { username, newPassword } = req.body;

  if (!username || !newPassword) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Username and new password are required!" });
  }

  if (newPassword.length < 6) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Password must be at least 6 characters long!" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "No account found with this username!" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.token = ""; // invalidate old session token
    await user.save();

    return res
      .status(httpStatus.OK)
      .json({ message: "Password reset successfully! Please log in." });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Something went wrong: ${error.message}` });
  }
};

const googleLogin = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Google credential is required!" });
  }

  try {
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID || undefined,
      });
      payload = ticket.getPayload();
    } catch {
      // Fallback verification without strict audience if client id not in server env
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
      });
      payload = ticket.getPayload();
    }

    if (!payload || !payload.email) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Invalid Google credential." });
    }

    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists by googleId, email, or username
    let user = await User.findOne({
      $or: [{ googleId }, { email }, { username: email }],
    });

    if (!user) {
      // Create a clean unique username from email
      const baseUsername = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
      let uniqueUsername = baseUsername;
      let counter = 1;
      while (await User.findOne({ username: uniqueUsername })) {
        uniqueUsername = `${baseUsername}${counter}`;
        counter++;
      }

      user = new User({
        name: name || "Google User",
        username: uniqueUsername,
        email,
        googleId,
        picture,
      });
    } else {
      if (!user.googleId) user.googleId = googleId;
      if (!user.email) user.email = email;
      if (!user.picture && picture) user.picture = picture;
    }

    const token = crypto.randomBytes(20).toString("hex");
    user.token = token;
    await user.save();

    return res.status(httpStatus.OK).json({
      token,
      user: {
        name: user.name,
        username: user.username,
        email: user.email,
        picture: user.picture,
      },
    });
  } catch (error) {
    console.error("Google Auth error:", error);
    return res
      .status(500)
      .json({ message: `Google authentication failed: ${error.message}` });
  }
};

export {
  login,
  register,
  getUserHistory,
  addToHistory,
  resetPassword,
  googleLogin,
};
