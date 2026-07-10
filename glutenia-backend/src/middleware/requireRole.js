const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "You don't have permission to perform this action",
    });
  }

  return next();
};

module.exports = requireRole;
