// One-off, safe-to-run-in-production script: adds the 5 patient resources
// that used to be hardcoded in PatientResourcesScreen.js (the mobile app's
// static content) as real, admin-editable PatientResource documents. Upserts
// by title, so it never touches or duplicates anything an admin has since
// edited, added, or deleted — safe to re-run.
//
// Usage: node src/scripts/addPatientResources.js
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const PatientResource = require("../models/PatientResource");

const DEFAULT_PATIENT_RESOURCES = [
  {
    title: "Starting a Gluten-Free Diet",
    description:
      "Learn which foods to avoid, how to read ingredient labels, and how to set up a safe gluten-free kitchen from day one.",
    category: "diet",
    readTimeMinutes: 5,
    featured: false,
    body: `Transitioning to a gluten-free diet is the only treatment for celiac disease. Here is how to do it safely.

Foods to avoid:
• Wheat (bread, pasta, couscous, semolina, spelt)
• Barley (beer, malt, malt vinegar)
• Rye (rye bread, some cereals)
• Regular oats unless labelled "gluten-free"

Safe grains and starches:
• Rice, quinoa, corn, millet, buckwheat, teff, amaranth, sorghum, potatoes, and certified gluten-free oats.

Reading labels:
Look for the words "contains wheat", "contains gluten", or the certified GF symbol. Watch out for terms like "modified starch", "malt flavouring", and "hydrolysed vegetable protein" — these often contain gluten.

Setting up a safe kitchen:
• Use separate cutting boards, toasters, and colanders.
• Replace non-stick pans that have been scratched.
• Store gluten-free products on higher shelves to prevent crumbs falling in.
• Always wash hands and surfaces before preparing GF meals.

In the first weeks, stick to naturally gluten-free whole foods (meat, fish, eggs, vegetables, fruit, rice) while you learn to read labels confidently.`,
  },
  {
    title: "Hidden Sources of Gluten",
    description:
      "Gluten hides in soy sauce, salad dressings, medications, and more. Discover the unexpected products to watch out for.",
    category: "safe",
    readTimeMinutes: 4,
    featured: false,
    body: `Gluten does not only hide in obvious foods like bread and pasta. Many everyday products contain hidden gluten.

Common hidden sources:

Condiments and sauces:
• Soy sauce (use tamari or coconut aminos instead)
• Worcestershire sauce, ketchup, salad dressings, and marinades
• Gravy powders and stock cubes

Processed and packaged foods:
• Flavoured crisps and chips
• Processed meats (sausages, cold cuts)
• Imitation crab and seafood sticks
• Some chocolate bars and sweets

Drinks:
• Regular beer, ale, lager, and stout
• Some flavoured spirits and liqueurs
• Barley water and malt drinks

Medications and personal care:
• Some tablets and capsules use wheat starch as a filler — always check with your pharmacist.
• Lipsticks and lip balms (small amounts may be ingested).
• Communion wafers (ask for a certified GF host).

Cross-contamination risks:
• Shared deep fryers in restaurants and chip shops
• Bulk bins at grocery stores
• Shared toasters and butter dishes at home

When in doubt, contact the manufacturer directly or choose products with a certified GF label.`,
  },
  {
    title: "Nutritional Deficiencies in Celiac Patients",
    description:
      "Celiac disease often causes low levels of iron, calcium, vitamin D, and B12. Learn how to identify and correct them.",
    category: "celiac",
    readTimeMinutes: 6,
    featured: false,
    body: `Untreated celiac disease damages the small intestine, reducing its ability to absorb nutrients. Even after going gluten-free, deficiencies can persist for months while the gut heals.

Most common deficiencies:

Iron:
The most frequent deficiency. Causes fatigue, pale skin, and shortness of breath. Iron is absorbed mainly in the upper small intestine — the area most damaged by celiac disease. Eat iron-rich foods (red meat, lentils, spinach) and pair with vitamin C to boost absorption.

Calcium and Vitamin D:
Essential for bone health. Long-term deficiency leads to osteoporosis. Dairy products, fortified plant milks, sardines with bones, and sun exposure help. Your doctor may prescribe supplements.

Vitamin B12 and Folate:
Needed for nerve function and red blood cell production. Found in meat, eggs, dairy, and leafy greens. Often require supplementation in the first year after diagnosis.

Zinc:
Supports immune function and wound healing. Found in meat, shellfish, legumes, and seeds.

Fibre:
Gluten-free products are often low in fibre. Include more vegetables, fruit, legumes, and GF whole grains (quinoa, brown rice, buckwheat).

What to do:
Ask your doctor for a full blood panel at diagnosis and again at 6 and 12 months. Do not self-supplement without guidance — excess iron and vitamin D can cause harm. A dietitian specialising in celiac disease can build a plan tailored to your results.`,
  },
  {
    title: "Dining Out Safely",
    description:
      "Tips for eating at restaurants with confidence — how to communicate with staff and spot hidden gluten on any menu.",
    category: "lifestyle",
    readTimeMinutes: 4,
    featured: false,
    body: `Eating at restaurants with celiac disease requires preparation, but it is entirely possible to dine out safely.

Before you go:
• Research the restaurant online and look for a GF menu.
• Call ahead during quiet hours and explain that you have celiac disease — not just a preference.
• Avoid busy times when kitchen staff are rushed and more likely to make mistakes.

At the restaurant:
• Tell your server you have celiac disease and ask to speak with the chef if necessary.
• Ask specifically about cross-contamination: shared fryers, shared pasta water, and shared prep surfaces.
• Avoid sauces, gravies, and dressings unless confirmed GF — these are common gluten traps.
• Choose simple dishes: grilled meat or fish, plain rice or potatoes, and steamed vegetables.

Questions to ask:
• "Is this dish prepared in a dedicated gluten-free area?"
• "Are your fries cooked in a shared fryer with breaded items?"
• "Does the chef change gloves when preparing my meal?"

Types of restaurants that are generally safer:
• Naturally gluten-free cuisines: Mexican (corn-based), Japanese (sashimi, rice dishes), and Vietnamese (rice noodle dishes, if soy sauce is excluded).
• Dedicated gluten-free restaurants or those with an allergy-aware culture.

Red flags:
• Staff who do not know what gluten is.
• Kitchens with no separate preparation area.
• "We can just remove the croutons" — cross-contamination is the real risk, not just visible gluten.

If in doubt, choose a simpler venue or prepare your own food. Your health comes first.`,
  },
  {
    title: "What is Celiac Disease?",
    description:
      "Celiac disease is an autoimmune condition triggered by gluten. Learn its symptoms, how it's diagnosed with blood tests and biopsy, and what life looks like after diagnosis.",
    category: "celiac",
    readTimeMinutes: 8,
    featured: true,
    body: `Celiac disease is a chronic autoimmune condition in which the ingestion of gluten — a protein found in wheat, barley, and rye — causes damage to the lining of the small intestine.

How it works:
When someone with celiac disease eats gluten, their immune system mistakenly attacks the villi — the tiny finger-like projections lining the small intestine. Over time, this damage reduces the intestine's ability to absorb nutrients, leading to malnutrition and a wide range of symptoms.

Symptoms:
Celiac disease presents differently in every person.
• Digestive: bloating, diarrhoea, constipation, abdominal pain, and nausea.
• Non-digestive: fatigue, anaemia, joint pain, skin rash (dermatitis herpetiformis), headaches, and brain fog.
• In children: poor growth, delayed puberty, and irritability.
• Silent celiac: some people have no symptoms at all but still suffer intestinal damage.

Diagnosis:
• Blood test: elevated tTG-IgA antibodies (tissue transglutaminase).
• Endoscopy and biopsy: a small sample of the small intestinal lining is taken to confirm damage (Marsh score).
• Important: do not start a gluten-free diet before testing — it will make the results inaccurate.

Treatment:
There is currently no medication for celiac disease. The only treatment is a strict, lifelong gluten-free diet. Most people see significant improvement in symptoms within weeks, though full intestinal healing can take 1–2 years.

Living with celiac disease:
With the right knowledge, celiac disease is entirely manageable. Most people lead full, healthy lives. The key is education — learning to read labels, avoid cross-contamination, and communicate your needs when eating out.`,
  },
];

const run = async () => {
  await connectDB();
  try {
    for (const resource of DEFAULT_PATIENT_RESOURCES) {
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
