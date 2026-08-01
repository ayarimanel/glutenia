const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET environment variable is not set. Copy .env.example to .env and set a long random secret before starting the server."
    );
  }
  return secret;
};

const getJwtExpiresIn = () => process.env.JWT_EXPIRES_IN || "7d";

module.exports = {
  getJwtExpiresIn,
  getJwtSecret,
};
