# AI Ingredient Label Scanner — Full Feature Guide (Free, No Card)

## What this feature does

The user points their phone camera at the ingredient list on any food packaging. They take a photo. The app sends that photo to your backend, which sends it to a free AI vision API. The AI reads all the text, identifies every ingredient, flags anything containing gluten, and returns a verdict: **Safe**, **Caution**, or **Not Safe** — with a plain-language explanation of each flagged ingredient.

---

## Free AI options (no credit card, no payment)

### Option 1 — Google Gemini API (Recommended)

**What it is:** Google's own AI, completely free via Google AI Studio.
**What you need:** Just a Google account (Gmail). No card, no subscription.
**Where to get the key:** https://aistudio.google.com → "Get API key" → Create API key.
**Free limits:** 1,500 requests per day, 15 requests per minute. More than enough for a real app.
**Vision support:** Yes — it reads and understands images natively.
**Model to use:** `gemini-1.5-flash` (fast, free, handles multilingual labels well)

This is the recommended approach. You get it in 2 minutes with just your Gmail.

---

### Option 2 — Tesseract.js + keyword matching (Zero dependencies, forever free)

**What it is:** An open-source OCR library that runs directly on your backend Node.js server. No API, no account, no internet required for the AI part.
**How it works:** Tesseract reads text from the image, then your own code matches the extracted text against a hardcoded list of gluten keywords.
**Limitation:** Less intelligent than a real AI — if text is blurry or the image is low quality, accuracy drops. Also doesn't understand context ("wheat starch" vs "corn starch").

Use this as a fallback if Gemini is ever unavailable, or as the sole approach if you want zero external dependency.

---

## How it works end-to-end (with Gemini)

```
User taps "Scan Label"
  → Camera opens (photo mode)
  → User captures the ingredient list
  → Image is compressed on the phone to 800px wide
  → Image sent as base64 to your backend: POST /api/scan/label
  → Backend calls Google Gemini API (free)
  → Gemini reads the text and returns structured JSON
  → Backend sends result to the app
  → App shows: green/yellow/red verdict + flagged ingredients list
```

The Gemini API key is stored **only on your Render backend** as an environment variable. It never touches the phone. The APK is safe.

---

## What you need to build

### 1. Get your free Gemini API key

1. Go to https://aistudio.google.com
2. Sign in with your Gmail
3. Click "Get API key" in the top left
4. Click "Create API key"
5. Copy the key — it looks like `AIzaSy...`
6. Add it to your Render backend environment variables as `GEMINI_API_KEY`
7. Also add it to your local `glutenia-backend/.env` for testing:
   ```
   GEMINI_API_KEY=AIzaSy...your key here...
   ```

---

### 2. Backend changes (glutenia-backend/)

**Install the Google AI SDK:**
```powershell
cd glutenia-backend
npm install @google/generative-ai
```

**New file: `src/routes/scan.routes.js`**
```js
const express = require("express");
const router = express.Router();
const { scanLabel } = require("../controllers/scan.controller");
const { verifyToken } = require("../middleware/auth");

router.post("/label", verifyToken, scanLabel);

module.exports = router;
```

**New file: `src/controllers/scan.controller.js`**
```js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const PROMPT = `You are a celiac disease specialist. Analyze the ingredient list in this food label image.

Your task:
1. Extract ALL text visible on the label (it may be in Arabic, French, English, or a mix)
2. Identify every ingredient that contains or may contain gluten
3. Gluten sources: wheat (blé, قمح), barley (orge, شعير), rye (seigle, جاودار), spelt, kamut, malt, semolina, durum, farro, triticale, seitan, hydrolyzed wheat protein, modified starch (ONLY flag if NOT specified as corn or potato starch), "may contain wheat", "processed in a facility with wheat"
4. Return ONLY a valid JSON object with no extra text or markdown:

{
  "verdict": "safe" | "caution" | "unsafe",
  "flagged": [{ "ingredient": "<name as it appears>", "reason": "<why it contains gluten>" }],
  "safe_highlights": ["<2-3 safe ingredients for reassurance, e.g. sugar, palm oil>"],
  "raw_text": "<full text extracted from the image>",
  "confidence": "high" | "medium" | "low",
  "confidence_note": "<only include if medium or low: e.g. image is blurry>"
}

Verdict rules:
- "unsafe" = one or more ingredients definitely contain gluten
- "caution" = only a "may contain" trace warning, or an ambiguous unlabeled starch
- "safe" = no gluten sources detected at all

If you cannot read the label (image is too blurry, not a food label, no text visible), return:
{ "verdict": "error", "error": "Could not read the label. Please retake the photo in better lighting and focus on the ingredient list." }`;

exports.scanLabel = async (req, res, next) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, message: "No image provided" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      { inlineData: { mimeType, data: imageBase64 } },
      PROMPT,
    ]);

    const raw = result.response.text().trim();

    // Strip markdown code block if Gemini wraps it
    const cleaned = raw.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(422).json({
        success: false,
        message: "Could not parse AI response. Please try again.",
      });
    }

    return res.json({ success: true, data: parsed });
  } catch (error) {
    // Gemini rate limit hit (15 req/min)
    if (error?.status === 429) {
      return res.status(429).json({
        success: false,
        message: "Too many scans right now. Wait a moment and try again.",
      });
    }
    next(error);
  }
};
```

**Register the route in `server.js`:**
```js
const scanRoutes = require("./src/routes/scan.routes");
app.use("/api/scan", scanRoutes);
```

---

### 3. Mobile changes (glutenia-mobile/)

**Install image manipulator (for compression):**
```powershell
cd glutenia-mobile
npx expo install expo-image-manipulator
```

**Add to `src/api/client.js`:**
```js
scanLabel: (imageBase64, token) =>
  request("/scan/label", {
    method: "POST",
    body: { imageBase64, mimeType: "image/jpeg" },
    token,
  }),
```

**New screen: `src/screens/user/LabelScanScreen.js`**

Core logic (simplified):
```js
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function LabelScanScreen({ navigation }) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [status, setStatus] = useState("idle"); // idle | loading | result | error
  const [result, setResult] = useState(null);

  const handleScan = async () => {
    // 1. Open camera
    const picked = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (picked.canceled) return;

    setStatus("loading");

    try {
      // 2. Compress to 800px wide — MANDATORY
      const compressed = await ImageManipulator.manipulateAsync(
        picked.assets[0].uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      // 3. Send to backend
      const data = await api.scanLabel(compressed.base64, token);
      setResult(data);
      setStatus("result");
    } catch (err) {
      setStatus("error");
    }
  };

  // Render based on status...
}
```

**Add to your UserStack in `RootNavigator.js`:**
```js
<Stack.Screen name="LabelScan" component={LabelScanScreen} />
```

**Add a "Scan Label" button somewhere accessible**, for example on the Home screen quick access or as a second button inside the existing ScanScreen.

---

## Result screen — what to show

| `verdict` value | Color | Message |
|---|---|---|
| `safe` | Green ✅ | "No gluten detected" + safe highlights |
| `caution` | Orange ⚠️ | "Possible traces — read carefully" + flagged items |
| `unsafe` | Red ❌ | "Contains gluten" + each flagged ingredient with reason |
| `error` | Grey 📷 | AI message + Retake Photo button |
| `low` confidence | Orange border | Show verdict + "Low confidence — verify manually" |

Always add a small disclaimer under the result:
> "This analysis is AI-generated. Always read the label yourself when in doubt."

---

## After building the APK and installing on your phone

### What works with no issues
- Taking the photo — camera permission already in the APK from the barcode scanner
- Compressing and sending the image — standard network call to your Render backend
- Receiving and displaying results — normal React Native rendering

### Potential problems and solutions

**Problem 1: Render cold start (most common)**
Your Render free plan sleeps after inactivity. First request after sleep takes 10–30 seconds.
Solution: Show a long animated loading screen with "Analyzing ingredients…" — users expect AI to take a moment. Or upgrade to Render's $7/month paid plan to keep it awake.

**Problem 2: Image too large → timeout or crash**
If you skip the `ImageManipulator` compression step, the full-resolution photo from a modern phone can be 5–10 MB. This will time out on Render's free plan (30-second request limit).
Solution: The compression step in the code above is mandatory. Never skip it. 800px wide, JPEG 0.7 quality.

**Problem 3: Gemini rate limit (15 requests/minute)**
If many users scan at the exact same time, Gemini returns HTTP 429. The backend catches this and returns a friendly message.
Solution: Already handled in the controller above. Show "Too many scans right now, wait a moment."

**Problem 4: Blurry or dark photos**
Gemini returns `confidence: "low"` or `verdict: "error"`. 
Solution: Show the error message from Gemini and a Retake button. Add a tip in the UI: "Hold still, ensure the text is in focus and well-lit."

**Problem 5: No internet connection**
The feature requires internet. Show a clear offline message rather than a crash.

**Problem 6: Gemini wraps the JSON in markdown**
Sometimes Gemini returns the JSON inside a code block like \`\`\`json ... \`\`\`. The controller already strips this before parsing.

### Things that do NOT change when you rebuild the APK
- The Gemini API key stays on Render — no APK change needed if you rotate the key
- The backend URL is baked in, so if you change `EXPO_PUBLIC_API_URL` you need a new APK
- Camera permissions are already declared in `app.json` — no new permissions needed

---

## Dos

- **Do compress the image** before sending. 800px wide, quality 0.7 is the sweet spot.
- **Do show a loading animation** — Gemini + Render takes 2–5 seconds on a good connection.
- **Do add a Retake button** on every result — users have shaky hands.
- **Do add a tip overlay** in the camera: "Focus on the ingredient list only, not the whole package."
- **Do show the raw extracted text** in a collapsible section so users can verify what Gemini read.
- **Do add a disclaimer** under every result — AI is not a doctor.
- **Do store `GEMINI_API_KEY` only on Render** as an environment variable, never in the mobile code.

## Don'ts

- **Don't skip image compression** — a 8 MB photo will timeout every time.
- **Don't put the API key in the mobile app** — anyone can decompile an APK and steal it.
- **Don't treat the result as 100% accurate** — always show the disclaimer.
- **Don't open the camera in full product view mode** — guide the user to frame just the ingredient list.
- **Don't worry about the 1,500 daily limit** — that's 1,500 scans per day. Unless you go viral, you will not hit it.

---

## Option 2 in detail: Tesseract.js (no API at all)

If you ever want a fully offline or zero-dependency fallback:

**Install on backend:**
```
npm install tesseract.js
```

**Controller logic:**
```js
const Tesseract = require("tesseract.js");

exports.scanLabel = async (req, res, next) => {
  const { imageBase64 } = req.body;
  const buffer = Buffer.from(imageBase64, "base64");

  const { data: { text } } = await Tesseract.recognize(buffer, "eng+fra+ara");

  const GLUTEN_KEYWORDS = [
    "wheat", "blé", "قمح", "barley", "orge", "شعير",
    "rye", "seigle", "جاودار", "spelt", "malt", "semolina",
    "durum", "farro", "triticale", "seitan", "gluten",
    "hydrolyzed wheat", "farine de blé",
  ];

  const lowerText = text.toLowerCase();
  const flagged = GLUTEN_KEYWORDS.filter(k => lowerText.includes(k.toLowerCase()));

  const verdict = flagged.length > 0 ? "unsafe" : "safe";

  return res.json({
    success: true,
    data: { verdict, flagged: flagged.map(f => ({ ingredient: f, reason: "Contains gluten" })), raw_text: text },
  });
};
```

**Limitation:** Tesseract is slower (5–10 seconds on Render free plan), less accurate on Arabic text, and has no contextual understanding — it just does string matching. Use Gemini as primary.

---

## Summary: what you build

| Part | Where | Effort |
|---|---|---|
| Get Gemini API key | aistudio.google.com | 2 minutes |
| Add `GEMINI_API_KEY` to Render env | Render dashboard | 1 minute |
| Add `GEMINI_API_KEY` to local `.env` | glutenia-backend/.env | 1 line |
| `npm install @google/generative-ai` | glutenia-backend/ | 1 command |
| `npx expo install expo-image-manipulator` | glutenia-mobile/ | 1 command |
| New `scan.routes.js` | glutenia-backend/src/routes/ | 10 lines |
| New `scan.controller.js` | glutenia-backend/src/controllers/ | ~60 lines |
| Register route in `server.js` | glutenia-backend/ | 2 lines |
| New `LabelScanScreen.js` | glutenia-mobile/src/screens/user/ | ~200 lines |
| Add `scanLabel` to `client.js` | glutenia-mobile/src/api/ | 4 lines |
| Add screen to `RootNavigator.js` | glutenia-mobile/src/ | 1 line |

**Total cost: $0. Forever.**
The Gemini free tier resets every day and is more than enough for a real app at this stage.
