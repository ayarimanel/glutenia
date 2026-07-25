// One-off, safe-to-run-in-production script: adds 3 more patient resource
// articles alongside the original 5 seeded by addPatientResources.js, so the
// Patient Resources page has a fuller library. Upserts by title, so it never
// touches or duplicates anything an admin has since edited, added, or
// deleted — safe to re-run.
//
// Usage: node src/scripts/addMorePatientResources.js
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const PatientResource = require("../models/PatientResource");

const MORE_PATIENT_RESOURCES = [
  {
    title: "Gluten-Free Grocery Shopping Guide",
    description:
      "A practical checklist for stocking a gluten-free kitchen — what to buy, what to double-check, and how to shop with confidence.",
    category: "safe",
    readTimeMinutes: 5,
    featured: false,
    body: `Grocery shopping with celiac disease takes a bit more planning at first, but it becomes second nature quickly.

Before you go:
• Make a list organized by aisle so you are not tempted to grab familiar packaged foods out of habit.
• Keep a short list on your phone of brands you already know are safe.

Naturally gluten-free staples to build around:
• Fresh fruit and vegetables, fresh meat, fish, and eggs.
• Rice, quinoa, corn, potatoes, and legumes.
• Plain dairy products (check flavoured yoghurts and ice creams separately).

At the shelf:
• Always read the full ingredient list, even on products you have bought before — recipes change.
• Look for a certified gluten-free label where available; it is the most reliable signal.
• Be extra careful with bulk bins, deli counters, and bakery sections, where cross-contact is common.

Building a routine:
Once you have identified a set of trusted staples and brands, shopping becomes fast again. Keep a running "safe list" on your phone and update it as you discover new products — the Glutenia scanner is built exactly for this, so you can check a new product in seconds instead of guessing.`,
  },
  {
    title: "Supporting a Loved One with Celiac Disease",
    description:
      "Practical, everyday ways to support a partner, child, or family member living gluten-free — from the kitchen to eating out together.",
    category: "lifestyle",
    readTimeMinutes: 5,
    featured: false,
    body: `Supporting someone with celiac disease is about more than avoiding gluten yourself — it is about making them feel safe and included.

In the kitchen:
• Learn the basics of cross-contamination: separate cutting boards, toasters, and utensils go a long way.
• Consider making shared meals naturally gluten-free where possible, so everyone can eat the same dish.
• Double-check labels together at first, until reading them becomes automatic for both of you.

Day to day:
• Ask before you assume — needs can vary from person to person, even within the same diagnosis.
• Celebrate the wins: a new safe restaurant, a recipe that worked, a worry-free trip. These moments matter.
• Avoid making gluten-free living feel like a burden or a restriction in conversation — it is simply how meals are prepared now.

Eating out and travelling together:
• Offer to call ahead or check menus in advance so your loved one does not have to do all the research alone.
• If cross-contamination risk is high, it is okay to suggest a different restaurant rather than pushing through.

Being a good supporter is not about being perfect — it is about staying curious, asking questions, and treating gluten-free needs as a normal part of planning, not an inconvenience.`,
  },
  {
    title: "Traveling Gluten-Free",
    description:
      "How to plan trips, flights, and hotel stays with confidence — packing tips, key phrases, and how to research before you go.",
    category: "lifestyle",
    readTimeMinutes: 6,
    featured: false,
    body: `Travelling with celiac disease is very possible with a little extra preparation.

Before you leave:
• Research restaurants and grocery stores at your destination in advance.
• Learn how to say "I have celiac disease, I cannot eat gluten" in the local language — write it down or save it on your phone.
• Check whether your accommodation has a kitchen or kitchenette, which gives you a safe fallback.

Packing:
• Bring a few safe snacks for transit days — gluten-free bars, crackers, or nuts.
• Pack any go-to safe products that may be hard to find abroad.
• Consider a small card explaining your dietary needs in the local language, to show to restaurant staff.

At the airport and on the plane:
• Many airlines offer gluten-free meals if requested at least 24-48 hours in advance.
• Do not rely solely on the in-flight meal — pack backup snacks in case of delays or menu changes.

At your destination:
• Naturally gluten-free cuisines (rice-based, corn-based) are often easier to navigate when travelling.
• Use the same restaurant questions you would at home: ask about shared fryers, prep surfaces, and sauces.

With a bit of planning, celiac disease does not have to limit where you go — it just changes how you prepare.`,
  },
];

const run = async () => {
  await connectDB();
  try {
    for (const resource of MORE_PATIENT_RESOURCES) {
      const result = await PatientResource.findOneAndUpdate(
        { title: resource.title },
        resource,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`Patient resource ready: ${result.title} (${result._id})`);
    }
  } catch (error) {
    console.error(`Failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
