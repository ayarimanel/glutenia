const FALLBACK_JWT_SECRET =
  "glutenia-render-fallback-jwt-secret-change-after-deploy-2026";

const getJwtSecret = () => process.env.JWT_SECRET || FALLBACK_JWT_SECRET;

const getJwtExpiresIn = () => process.env.JWT_EXPIRES_IN || "7d";

module.exports = {
  getJwtExpiresIn,
  getJwtSecret,
};
