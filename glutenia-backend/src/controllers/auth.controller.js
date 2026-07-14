const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getJwtExpiresIn, getJwtSecret } = require("../config/auth");
const User = require("../models/User");
const { sendVerificationEmail } = require("../services/emailService");

const VERIFICATION_CODE_TTL_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

const createToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
    getJwtSecret(),
    { expiresIn: getJwtExpiresIn() }
  );
};

const toSafeUser = (user) => {
  const safeUser = user.toObject ? user.toObject() : { ...user };
  delete safeUser.password;
  delete safeUser.emailVerificationCode;
  delete safeUser.emailVerificationCodeExpires;
  delete safeUser.emailVerificationLastSentAt;
  return safeUser;
};

const generateApprovalCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const generateVerificationCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isEmailVerified) {
      return res.status(409).json({
        success: false,
        message: "Email is already taken",
      });
    }

    const isProfessional = role === "professional";
    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationCode = generateVerificationCode();
    const now = new Date();

    const userData = {
      name,
      email,
      password: hashedPassword,
      role: isProfessional ? "professional" : "customer",
      professionalStatus: isProfessional ? "pending" : null,
      approvalCode: isProfessional ? generateApprovalCode() : null,
      isEmailVerified: false,
      emailVerificationCode: verificationCode,
      emailVerificationCodeExpires: new Date(now.getTime() + VERIFICATION_CODE_TTL_MS),
      emailVerificationLastSentAt: now,
    };

    // An unverified record from a previous, abandoned signup attempt
    // shouldn't permanently reserve the email — restart it in place.
    const user = existingUser
      ? Object.assign(existingUser, userData)
      : new User(userData);
    await user.save();

    const emailSent = await sendVerificationEmail(user.email, verificationCode);

    return res.status(201).json({
      success: true,
      data: {
        pendingVerification: true,
        email: user.email,
        role: user.role,
        ...(isProfessional
          ? { professionalStatus: user.professionalStatus, approvalCode: user.approvalCode }
          : {}),
        emailDeliveryFailed: !emailSent,
        message: emailSent
          ? "We sent a 6-digit verification code to your email. Enter it to confirm your account."
          : "Your account was created, but we couldn't send the verification email. Tap resend to try again.",
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
        data: { needsVerification: true, email: user.email },
      });
    }

    if (user.role === "professional" && user.professionalStatus !== "approved") {
      const status = user.professionalStatus || "pending";
      return res.status(403).json({
        success: false,
        message:
          status === "rejected"
            ? "Your professional account request was rejected by the admin."
            : "Your professional account is still pending admin approval.",
        data: { professionalStatus: status, approvalCode: user.approvalCode },
      });
    }

    const token = createToken(user);

    return res.json({
      success: true,
      data: {
        token,
        user: toSafeUser(user),
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({ email }).select(
      "+emailVerificationCode +emailVerificationCodeExpires"
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "No account found for this email" });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        data: { verified: true, alreadyVerified: true, message: "Email already verified. You can log in." },
      });
    }

    if (
      !user.emailVerificationCode ||
      !user.emailVerificationCodeExpires ||
      user.emailVerificationCodeExpires.getTime() < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "This code has expired. Request a new one.",
        data: { expired: true },
      });
    }

    if (user.emailVerificationCode !== code) {
      return res.status(400).json({ success: false, message: "Invalid verification code" });
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationCodeExpires = null;
    await user.save();

    if (user.role === "professional" && user.professionalStatus !== "approved") {
      return res.json({
        success: true,
        data: {
          verified: true,
          pending: true,
          professionalStatus: user.professionalStatus || "pending",
          approvalCode: user.approvalCode,
          message: "Email confirmed. Your professional account is still pending admin approval.",
        },
      });
    }

    const token = createToken(user);
    return res.json({
      success: true,
      data: { verified: true, token, user: toSafeUser(user) },
    });
  } catch (error) {
    return next(error);
  }
};

exports.resendVerificationCode = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).select("+emailVerificationLastSentAt");

    if (!user) {
      return res.status(404).json({ success: false, message: "No account found for this email" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: "Email already verified. You can log in." });
    }

    if (user.emailVerificationLastSentAt) {
      const elapsed = Date.now() - user.emailVerificationLastSentAt.getTime();
      if (elapsed < RESEND_COOLDOWN_MS) {
        const secondsRemaining = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${secondsRemaining}s before requesting another code.`,
          data: { secondsRemaining },
        });
      }
    }

    const verificationCode = generateVerificationCode();
    const now = new Date();
    user.emailVerificationCode = verificationCode;
    user.emailVerificationCodeExpires = new Date(now.getTime() + VERIFICATION_CODE_TTL_MS);
    user.emailVerificationLastSentAt = now;
    await user.save();

    const emailSent = await sendVerificationEmail(user.email, verificationCode);

    return res.json({
      success: true,
      data: {
        resent: true,
        emailDeliveryFailed: !emailSent,
        message: emailSent
          ? "A new code has been sent to your email."
          : "Could not send the email, try again shortly.",
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      data: toSafeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};
