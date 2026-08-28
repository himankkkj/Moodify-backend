import userModel from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import sessionModel from "../models/session.model.js";
import crypto from "crypto";
import { sendEmail } from "../service/email.service.js";
import otpModel from "../models/otp.model.js";
import { generateOtp, getOtpHtml } from "../utils/utils.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export async function registerUser(req, res) {
  const { username, email, password } = req.body;

  // Basic Input Validation
  if (!username || username.trim().length < 3 || username.trim().length > 30) {
    return res.status(400).json({ message: "Username must be between 3 and 30 characters" });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email address format" });
  }
  if (!password || password.length < 8 || password.length > 128) {
    return res.status(400).json({ message: "Password must be between 8 and 128 characters" });
  }

  const isUsernameExists = await userModel.findOne({ username: username.trim() });
  if (isUsernameExists) {
    return res.status(409).json({
      message: "Username already taken",
    });
  }

  const isEmailExists = await userModel.findOne({ email: email.toLowerCase().trim() });
  if (isEmailExists) {
    return res.status(409).json({
      message: "Email already registered",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await userModel.create({
    username: username.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
  });

  const opt = generateOtp();
  const otpHtml = getOtpHtml(opt);

  const otpHash = crypto.createHash("sha256").update(String(opt)).digest("hex");
  await otpModel.create({
    email: user.email,
    user: user._id,
    otphash: otpHash,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min expiry
  });

  await sendEmail(user.email, "Verify your email", `Your OTP is ${opt}`, otpHtml);

  res.status(201).json({
    message: "User registered successfully. Please verify your email.",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      verified: user.verified,
    },
  });
}

export async function loginUser(req, res) {
  const { username, email, password } = req.body;

  const query = username
    ? { username: username.trim() }
    : { email: email?.toLowerCase()?.trim() };

  const user = await userModel.findOne(query);

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  if (!user.verified) {
    return res.status(403).json({
      message: "User not verified",
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({
      message: "Invalid password",
    });
  }

  const refreshToken = jwt.sign(
    {
      id: user._id,
      username: user.username,
    },
    config.JWT_SECRET,
    { expiresIn: "7d" }
  );

  const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

  const session = await sessionModel.create({
    user: user._id,
    ip: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
    refreshTokenHash,
    userAgent: req.headers["user-agent"] || "unknown",
  });

  const accessToken = jwt.sign(
    {
      id: user._id,
      sessionId: session._id,
      username: user.username,
    },
    config.JWT_SECRET,
    { expiresIn: "15m" }
  );

  res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

  res.status(200).json({
    message: "User logged in successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
    accessToken,
  });
}

export async function getMe(req, res) {
  const user = await userModel.findById(req.user.id).select("-password").lean();

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  res.setHeader("Cache-Control", "private, max-age=30");
  res.status(200).json({
    message: "User found",
    user,
  });
}

export async function refreshToken(req, res) {
  const refreshTokenStr = req.cookies.refreshToken;

  if (!refreshTokenStr) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshTokenStr, config.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const refreshTokenHash = crypto.createHash("sha256").update(refreshTokenStr).digest("hex");

  const session = await sessionModel.findOne({
    user: decoded.id,
    refreshTokenHash,
    revoke: false,
  });

  if (!session) {
    // Reuse detected or invalid session — revoke all sessions of this user
    await sessionModel.updateMany({ user: decoded.id }, { $set: { revoke: true } });
    res.clearCookie("refreshToken", { path: "/api/auth" });
    return res.status(401).json({
      message: "Token reuse detected or session revoked",
    });
  }

  const accessToken = jwt.sign(
    {
      id: decoded.id,
      sessionId: session._id,
      username: decoded.username,
    },
    config.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const newRefreshToken = jwt.sign(
    {
      id: decoded.id,
      username: decoded.username,
    },
    config.JWT_SECRET,
    { expiresIn: "7d" }
  );

  const newRefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

  session.refreshTokenHash = newRefreshTokenHash;
  await session.save();

  res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);

  res.status(200).json({
    message: "Access token refreshed",
    accessToken,
  });
}

export async function logout(req, res) {
  const refreshTokenStr = req.cookies.refreshToken;

  if (refreshTokenStr) {
    const refreshTokenHash = crypto.createHash("sha256").update(refreshTokenStr).digest("hex");
    const session = await sessionModel.findOne({
      refreshTokenHash,
      revoke: false,
    });

    if (session) {
      session.revoke = true;
      await session.save();
    }
  }

  res.clearCookie("refreshToken", { path: "/api/auth" });

  res.status(200).json({
    message: "User logged out successfully",
  });
}

export async function logoutAllSessions(req, res) {
  const refreshTokenStr = req.cookies.refreshToken;

  if (!refreshTokenStr) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshTokenStr, config.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  await sessionModel.updateMany(
    { user: decoded.id, revoke: false },
    { $set: { revoke: true } }
  );

  res.clearCookie("refreshToken", { path: "/api/auth" });

  res.status(200).json({
    message: "User logged out from all sessions successfully",
  });
}

export async function verifyEmail(req, res) {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  const otpRecord = await otpModel.findOne({ email: email.toLowerCase().trim() }).sort({ createdAt: -1 });

  if (!otpRecord) {
    return res.status(400).json({
      message: "Invalid or expired OTP",
    });
  }

  if (otpRecord.expiresAt < new Date()) {
    return res.status(400).json({
      message: "OTP expired",
    });
  }

  if (otpRecord.attempts >= 5) {
    return res.status(429).json({
      message: "Too many failed attempts. Please request a new OTP.",
    });
  }

  const optHash = crypto.createHash("sha256").update(String(otp)).digest("hex");

  if (otpRecord.otphash !== optHash) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    return res.status(400).json({
      message: "Invalid OTP",
    });
  }

  const user = await userModel.findByIdAndUpdate(
    otpRecord.user,
    { verified: true },
    { new: true, runValidators: true }
  );

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  await otpModel.deleteMany({ user: otpRecord.user });

  return res.status(200).json({
    message: "Email verified successfully",
    user: {
      username: user.username,
      email: user.email,
      verified: user.verified,
    },
  });
}

export async function resendOtp(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = await userModel.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  if (user.verified) {
    return res.status(400).json({
      message: "Email already verified",
    });
  }

  // Delete prior OTPs by User ObjectId
  await otpModel.deleteMany({ user: user._id });

  const opt = generateOtp();
  const otpHtml = getOtpHtml(opt);
  const otpHash = crypto.createHash("sha256").update(String(opt)).digest("hex");

  await otpModel.create({
    email: user.email,
    user: user._id,
    otphash: otpHash,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min expiry
  });

  await sendEmail(user.email, "Verify your email", `Your OTP is ${opt}`, otpHtml);

  return res.status(200).json({
    message: "OTP resent successfully",
  });
}