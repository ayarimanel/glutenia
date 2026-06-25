const mongoose = require("mongoose");

const DEFAULT_DB_NAME = "glutenia";
const FALLBACK_MONGO_URI =
  "mongodb+srv://i33237431_db_user:u9p011qHW5RlaenC@glutenia.mgyqjf6.mongodb.net/glutenia?retryWrites=true&w=majority&appName=glutenia";

const getDbNameFromUri = (mongoUri) => {
  try {
    const { pathname } = new URL(mongoUri);
    const dbName = decodeURIComponent(pathname.replace(/^\/+/, ""));
    return dbName || null;
  } catch {
    return null;
  }
};

const connectDB = async () => {
  const mongoUri =
    process.env.MONGO_URI || process.env.MONGODB_URI || FALLBACK_MONGO_URI;

  const connectionOptions = {};
  if (!getDbNameFromUri(mongoUri)) {
    connectionOptions.dbName = process.env.MONGO_DB_NAME || DEFAULT_DB_NAME;
  }

  const connection = await mongoose.connect(mongoUri, connectionOptions);
  console.log(
    `MongoDB connected: ${connection.connection.host}/${connection.connection.name}`
  );
  return connection;
};

module.exports = connectDB;
module.exports.getDbNameFromUri = getDbNameFromUri;
