const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getJwtExpiresIn, getJwtSecret } = require("../config/auth");
const User = require("../models/User");

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
  return safeUser;
};

const generateApprovalCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already taken",
      });
    }

    const isProfessional = role === "professional";
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: isProfessional ? "professional" : "customer",
      professionalStatus: isProfessional ? "pending" : null,
      approvalCode: isProfessional ? generateApprovalCode() : null,
    });

    if (isProfessional) {
      return res.status(201).json({
        success: true,
        data: {
          pending: true,
          approvalCode: user.approvalCode,
          message:
            "Your professional account request has been sent to the admin for approval.",
        },
      });
    }

    const token = createToken(user);

    return res.status(201).json({
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
