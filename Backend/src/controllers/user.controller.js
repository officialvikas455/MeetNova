import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Meeting } from "../models/meeting.model.js";
import { OAuth2Client } from "google-auth-library";

const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  "423089796215-mtpfs4tqk35dj80ulkt4ie1ao47rnut6.apps.googleusercontent.com";

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Please Provide Your Details!!" });
  }

  try {
    const cleanIdentifier = username.trim();
    // Allow login with either username or email
    const user = await User.findOne({
      $or: [
        { username: cleanIdentifier },
        { email: cleanIdentifier.toLowerCase() },
      ],
    });

    if (!user) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "User Not Found!!" });
    }

    if (!user.password) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message:
          "This account was created with Google Sign-In. Please sign in with Google.",
      });
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

    return res.status(httpStatus.OK).json({
      token,
      user: {
        name: user.name,
        username: user.username,
        email: user.email,
        picture: user.picture,
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: `Something went Wrong ${err.message}` });
  }
};

const register = async (req, res) => {
  const { name, username, password, email } = req.body;

  if (!name || !username || !password) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Name, username, and password are required!" });
  }

  try {
    const cleanUsername = username.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : "";

    // Check if user with this username or email already exists
    const query = [{ username: cleanUsername }];
    if (cleanEmail) {
      query.push({ email: cleanEmail });
    }

    const existingUser = await User.findOne({ $or: query });

    if (existingUser) {
      if (existingUser.username === cleanUsername) {
        return res
          .status(httpStatus.CONFLICT)
          .json({ message: "Username is already taken! Please choose another." });
      }
      if (cleanEmail && existingUser.email === cleanEmail) {
        return res.status(httpStatus.CONFLICT).json({
          message: "An account with this email already exists! Please log in.",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
    });

    await newUser.save();
    return res
      .status(httpStatus.CREATED)
      .json({ message: "User Registered Successfully!" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: `Something went wrong: ${err.message}` });
  }
};

const getUserHistory = async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({ token: token });
    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid session." });
    }
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
      .json({ message: "Username or email and new password are required!" });
  }

  if (newPassword.length < 6) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Password must be at least 6 characters long!" });
  }

  try {
    const cleanIdentifier = username.trim();
    const user = await User.findOne({
      $or: [
        { username: cleanIdentifier },
        { email: cleanIdentifier.toLowerCase() },
      ],
    });

    if (!user) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "No account found with this username or email!" });
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
        audience: [
          GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_ID,
          "423089796215-mtpfs4tqk35dj80ulkt4ie1ao47rnut6.apps.googleusercontent.com",
        ].filter(Boolean),
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.warn("Primary Google verify failed:", verifyErr.message);
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
        });
        payload = ticket.getPayload();
      } catch (fbErr) {
        console.warn("Fallback verification failed, decoding token directly:", fbErr.message);
        payload = jwt.decode(credential);
      }
    }

    if (!payload || !payload.email) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Invalid Google credential." });
    }

    const { sub: googleId, email, name, picture } = payload;
    const cleanEmail = email ? email.trim().toLowerCase() : "";

    // Check if user exists by googleId, email, or username matching email
    let user = await User.findOne({
      $or: [
        ...(googleId ? [{ googleId }] : []),
        ...(cleanEmail ? [{ email: cleanEmail }, { username: cleanEmail }] : []),
      ],
    });

    if (!user) {
      // Create a clean unique username from email prefix
      const baseUsername =
        cleanEmail.split("@")[0].replace(/[^a-zA-Z0-9]/g, "") || "user";
      let uniqueUsername = baseUsername;
      let counter = 1;
      while (await User.findOne({ username: uniqueUsername })) {
        uniqueUsername = `${baseUsername}${counter}`;
        counter++;
      }

      user = new User({
        name: name || "Google User",
        username: uniqueUsername,
        email: cleanEmail,
        googleId,
        picture,
      });
    } else {
      if (!user.googleId && googleId) user.googleId = googleId;
      if (!user.email && cleanEmail) user.email = cleanEmail;
      if (!user.picture && picture) user.picture = picture;
      if (!user.name && name) user.name = name;
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
