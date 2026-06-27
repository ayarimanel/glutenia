const express = require("express");
const cors = require("cors");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth.routes");
const gamificationRoutes = require("./routes/gamification.routes");
const onboardingRoutes = require("./routes/onboarding.routes");
const orderRoutes = require("./routes/order.routes");
const productRoutes = require("./routes/product.routes");
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

app.post("/api/admin/run-seed", async (req, res) => {
  if (req.headers["x-seed-token"] !== "glutenia-seed-2026") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  try {
    const bcrypt = require("bcryptjs");
    const mongoose = require("mongoose");
    const Product = require("./models/Product");
    const User = require("./models/User");
    const Badge = require("./models/Badge");
    const Achievement = require("./models/Achievement");

    const products = [
      { name: "Pain sans gluten", description: "Pain moelleux pour le petit dejeuner.", price: 4.5, category: "Bread", stock: 25, barcode: "3017620422003" },
      { name: "Pâtes de riz", description: "Pates de riz legeres pour plats rapides.", price: 3.2, category: "Pasta", stock: 30, barcode: "8076809513456" },
      { name: "Biscuits au quinoa", description: "Biscuits croquants au quinoa.", price: 5.8, category: "Snacks", stock: 18, barcode: "3175681851752" },
      { name: "Farine de maïs", description: "Farine de mais sans gluten.", price: 2.9, category: "Flour", stock: 40, barcode: "3564700314551" },
      { name: "Gâteau au chocolat GF", description: "Gateau chocolat sans gluten.", price: 7.5, category: "Sweets", stock: 12, barcode: "3229820129488" },
      { name: "Crackers de sarrasin", description: "Crackers sales au sarrasin.", price: 4.1, category: "Snacks", stock: 22, barcode: "3270190207924" },
    ];

    await User.deleteMany({});
    await Product.deleteMany({});
    const hashedPassword = await bcrypt.hash("admin123", 12);
    const admin = await User.create({ name: "Admin", email: "admin@glutenia.tn", password: hashedPassword, role: "admin" });
    await Product.insertMany(products.map((p) => ({ ...p, isGlutenFree: true, createdBy: admin._id })));

    await Badge.deleteMany({});
    await Achievement.deleteMany({});
    await Badge.insertMany([
      { slug: "first_week", name: "First Week", description: "Active for 7 days", category: "journey", track: "both" },
      { slug: "one_month", name: "One Month", description: "Active for 30 days", category: "journey", track: "both" },
      { slug: "first_scan", name: "First Scan", description: "Scanned your first product", category: "scanner", track: "both" },
      { slug: "ten_scans", name: "10 Scans", description: "Scanned 10 products", category: "scanner", track: "both" },
    ]);
    await Achievement.insertMany([
      { slug: "scan_10", name: "10 Scans", description: "Scan 10 products", targetMetric: "scanCount", targetValue: 10, xpReward: 50 },
      { slug: "scan_50", name: "50 Scans", description: "Scan 50 products", targetMetric: "scanCount", targetValue: 50, xpReward: 150 },
    ]);

    res.json({ success: true, data: "Seeded successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);
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
