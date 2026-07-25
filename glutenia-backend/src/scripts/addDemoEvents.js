// One-off, safe-to-run-in-production script: adds a set of demo events with
// real cover photos so the Events screen doesn't look empty. Upserts by
// title, so it never touches or duplicates anything an admin has since
// edited, added, or deleted — safe to re-run. Attributed to the first admin
// account found (or left unowned if none exists yet).
//
// Usage: node src/scripts/addDemoEvents.js
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Event = require("../models/Event");
const User = require("../models/User");

const img = (id) => `https://images.unsplash.com/photo-${id}?w=800&q=75&auto=format&fit=crop`;

const DEMO_EVENTS = [
  {
    title: "Gluten-Free Cooking Basics",
    description:
      "A hands-on class covering the essentials of gluten-free cooking: safe substitutions, avoiding cross-contamination, and building confidence in your own kitchen.",
    date: "Sat, Aug 8 • 2:00 PM",
    location: "Culinary Arts Center, Tunis",
    category: "Classes",
    price: 20,
    emoji: "👨‍🍳",
    color: "#FFF8E1",
    imageUrl: img("1556909212-d5b604d0c90d"),
  },
  {
    title: "Sourdough & Bread-Baking Workshop",
    description:
      "Learn to bake gluten-free sourdough and everyday loaves from scratch, with starter, kneading, and shaping techniques you can take home.",
    date: "Sun, Aug 16 • 10:00 AM",
    location: "La Marsa Community Kitchen",
    category: "Workshops",
    price: 25,
    emoji: "🍞",
    color: "#F3E5F5",
    imageUrl: img("1517686469429-8bdb88b9f907"),
  },
  {
    title: "Celiac Support Group Meetup",
    description:
      "A relaxed evening meetup for anyone managing celiac disease or supporting someone who is — share tips, ask questions, and meet others on the same journey.",
    date: "Thu, Aug 20 • 6:30 PM",
    location: "Glutenia Community Hall, Tunis",
    category: "Meetups",
    price: 0,
    emoji: "🎉",
    color: "#E8F5E9",
    imageUrl: img("1511578314322-379afb476865"),
  },
  {
    title: "Gluten-Free Farmers Market Pop-Up",
    description:
      "A morning pop-up market featuring local gluten-free producers, fresh produce, and safe snacks to try and buy.",
    date: "Sat, Aug 23 • 9:00 AM",
    location: "Place du 14 Janvier 2011, Tunis",
    category: "Markets",
    price: 0,
    emoji: "🧺",
    color: "#E3F2FD",
    imageUrl: img("1488459716781-31db52582fe9"),
  },
  {
    title: "Reading Labels with Confidence",
    description:
      "A practical workshop on decoding ingredient labels, spotting hidden gluten, and shopping safely — especially useful for those newly diagnosed.",
    date: "Wed, Aug 27 • 5:00 PM",
    location: "Glutenia HQ, Lac 2",
    category: "Workshops",
    price: 10,
    emoji: "🥗",
    color: "#FCE4EC",
    imageUrl: img("1556910096-6f5e72db6803"),
  },
  {
    title: "Chef's Table: Gluten-Free Recipe Demo",
    description:
      "Watch a professional chef prepare a full gluten-free tasting menu, with tips on flavor and technique you can recreate at home.",
    date: "Sat, Sep 6 • 3:00 PM",
    location: "Restaurant Dar Zarrouk, Sidi Bou Said",
    category: "Classes",
    price: 30,
    emoji: "🎪",
    color: "#FFF8E1",
    imageUrl: img("1622021142947-da7dedc7c39a"),
  },
];

const run = async () => {
  await connectDB();
  try {
    const admin = await User.findOne({ role: "admin" }).select("_id");
    for (const event of DEMO_EVENTS) {
      const result = await Event.findOneAndUpdate(
        { title: event.title },
        { ...event, createdBy: admin?._id },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`Event ready: ${result.title} (${result._id})`);
    }
  } catch (error) {
    console.error(`Failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
