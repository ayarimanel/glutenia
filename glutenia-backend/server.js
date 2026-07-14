require("dotenv").config();

const connectDB = require("./src/config/db");
const app = require("./src/app");
const seedRecipesIfEmpty = require("./src/seed/seedRecipes");

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";

const startServer = async () => {
  await connectDB();

  app.listen(PORT, HOST, () => {
    console.log(`Glutenia API running at http://${HOST}:${PORT}`);
  });

  // Fire-and-forget: never block port binding on this.
  seedRecipesIfEmpty().catch((error) =>
    console.error(`Failed to seed recipes: ${error.message}`)
  );
};

startServer().catch((error) => {
  console.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});
