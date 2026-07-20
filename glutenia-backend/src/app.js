const express = require("express");
const cors = require("cors");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth.routes");
const establishmentRoutes = require("./routes/establishment.routes");
const eventRoutes = require("./routes/event.routes");
const gamificationRoutes = require("./routes/gamification.routes");
const notificationRoutes = require("./routes/notification.routes");
const onboardingRoutes = require("./routes/onboarding.routes");
const orderRoutes = require("./routes/order.routes");
const productRoutes = require("./routes/product.routes");
const professionalRoutes = require("./routes/professional.routes");
const recipeRoutes = require("./routes/recipe.routes");
const scanRoutes = require("./routes/scan.routes");
const userRoutes = require("./routes/user.routes");

const buildCorsOptions = () => {
  if (process.env.NODE_ENV !== "production") {
    return { origin: "*" };
  }

  const allowedOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  };
};

const app = express();

app.use(cors(buildCorsOptions()));
app.use(express.json({ limit: "8mb" }));

app.get("/", (req, res) => {
  res.json({
    success: true,
    data: {
      name: "Glutenia API",
      status: "running",
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/establishments", establishmentRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
app.use("/api/professionals", professionalRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api/users", userRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorHandler);

module.exports = app;
module.exports.buildCorsOptions = buildCorsOptions;
