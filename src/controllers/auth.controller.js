import userModel from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt, { decode } from "jsonwebtoken";
import config from "../config/config.js";
import sessionModel from "../models/session.model.js";
import crpto, { verify } from "crypto";
import { sendEmail } from "../service/email.service.js";
import otpModel from "../models/otp.model.js";
import { generateOtp, getOtpHtml } from "../utils/utils.js";

export async function registerUser(req, res) {
  const { username, email, password } = req.body;

  const isUserExists = await userModel.findOne({
    $or: [{ username }, { email }],
  });

  if (isUserExists) {
    return res.status(409).json({
      message: "User already exists",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await userModel.create({
    username,
    email,
    password: hashedPassword,
  });

  const opt = generateOtp();
  const otpHtml = getOtpHtml(opt);

  const otpHash = crpto.createHash("sha256").update(String(opt)).digest("hex");
  await otpModel.create({
    email,
    user: user._id,
    otphash: otpHash,
  });

  await sendEmail(email, "Verify your email", `Your OTP is ${opt}`, otpHtml);

  

  res.status(201).json({
    message: "User registered successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      verifyed: user.verified
    },
  });
}

export async function loginUser(req, res) {

    const {username,email, password} = req.body;

    const user = await userModel.findOne({
        $or: [{username}, {email}]
    });

    if(!user){
        return res.status(404).json({
            message: "User not found"
        });
    }

    if(!user.verified) {
        return res.status(403).json({
            message: "User not verified"
        });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if(!isPasswordValid){
        return res.status(401).json({
            message: "Invalid password"
        });
    }

    const refreshToken = jwt.sign(
        {
            id: user._id,
            username: user.username
        },
        config.JWT_SECRET,
        {expiresIn: "7d"}
    );

    const refreshTokenHash = crpto.createHash("sha256").update(refreshToken).digest("hex");

    const session = await sessionModel.create({
        user: user._id,
        ip: req.ip,
        refreshTokenHash,
        userAgent: req.headers["user-agent"]
    });

    const accessToken = jwt.sign(
        {
            id: user._id,
            sessionId: session._id,
            username: user.username
        },
        config.JWT_SECRET,
        {expiresIn: "15m"}
    );

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
        message: "User logged in successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email 
         },
        accessToken
    });
    
}


export async function getMe(req, res) {
  const user = req.cookies.refreshToken;

  if (!user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(user, config.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const userData = await userModel.findById(decoded.id);

  if (!userData) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  res.status(200).json({
    message: "User found",
    user: userData,
  });
}

export async function refreshToken(req, res) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(refreshToken, config.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const refreshTokenHash = crpto.createHash("sha256").update(refreshToken).digest("hex");

  const session = await sessionModel.findOne({
    user: decoded.id,
    refreshTokenHash,
    revoke: false,
  });

  if (!session) {
    return res.status(401).json({
      message: "Invalid refresh token",
    });
  }

  const accessToken = jwt.sign(
    {
      id: decoded.id,
      sessionId: session._id,
      username: decoded.username,
    },
    config.JWT_SECRET,
    { expiresIn: "15m" },
  );

  const newRefreshToken = jwt.sign(
    {
      id: decoded.id,
      username: decoded.username,
    },
    config.JWT_SECRET,
    { expiresIn: "7d" },
  );

  const newRefreshTokenHash = crpto.createHash("sha256").update(newRefreshToken).digest("hex");

  session.refreshTokenHash = newRefreshTokenHash;
  await session.save();

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(200).json({
    message: "Access token refreshed",
    accessToken,
  });
}

export async function logout(req, res) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const refresshTokenHash = crpto.createHash("sha256").update(refreshToken).digest("hex");
  const session = await sessionModel.findOne({
    refreshTokenHash: refresshTokenHash,
    revoke: false,
  });

  if (!session) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
  // Here you would typically invalidate the refresh token
  // For example, you could remove it from the database or add it to a blacklist
  session.revoke = true;
  await session.save(); // Mark the session as revoked

  res.clearCookie("refreshToken");

  res.status(200).json({
    message: "User logged out successfully",
  });
}

export async function logoutAllSessions(req, res) {

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }

    let decoded;

    try {
        decoded = jwt.verify(refreshToken, config.JWT_SECRET);
    }catch (err) {
        return res.status(401).json({
            message: "Unauthorized",
        });
    }

    await sessionModel.updateMany(
        { user: decoded.id, revoke: false },
        { $set: { revoke: true } }
    );

    res.clearCookie("refreshToken");

    res.status(200).json({
        message: "User logged out from all sessions successfully",
    });
}

export async function verifyEmail(req, res) {

  const { email, otp } = req.body;

  const optHash = crpto.createHash("sha256").update(String(otp)).digest("hex");

  const otpRecord = await otpModel.findOne({
    email,
    otphash: optHash,
  });

  if(!otpRecord) {
    return res.status(400).json({
      message: "Invalid OTP",
    });
  }

  const user = await userModel.findByIdAndUpdate(
    otpRecord.user,
    { verified: true },
    { new: true, runValidators: true }, //this option returns the updated document and runs validators on update
  );

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  await otpModel.deleteMany({ user: otpRecord.user });

  return res.status(200).json({
    message: "Email verified successfully",
    user:{
      username: user.username,
      email: user.email,
      verified: user.verified,

    }
  })
}

export async function resendOtp(req, res){
    const {email} = req.body;

    const user = await userModel.findOne({email})

    if(!user){
      return res.status(404).json({
        message: "User not found"
      })
    }

    if(user.verified){
      return res.status(400).json({
        message: "Email already verified"
      })
    }

    await otpModel.deleteMany({user: user.email}) 

    const opt = generateOtp();
    const otpHtml = getOtpHtml(opt);
    const otpHash = crpto.createHash("sha256").update(String(opt)).digest("hex");

    const otpRecord = await otpModel.create({
      email,
      user: user._id,
      otphash: otpHash
    })

    await sendEmail(email, "Verify your email", `Your OTP is ${opt}`, otpHtml);

    return res.status(200).json({
      message: "OTP resent successfully"
    })
}