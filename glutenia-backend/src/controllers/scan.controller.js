const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const PROMPT = `You are a celiac disease specialist. Analyze the ingredient list in this food label image.

The label may be in Arabic, French, English, or a mix of all three.

Your task:
1. Extract ALL text visible on the label
2. Identify every ingredient that contains or may contain gluten
3. Gluten sources to flag: wheat (blé, farine de blé, قمح), barley (orge, شعير), rye (seigle, جاودار), spelt, kamut, malt, malt extract, semolina, durum, farro, triticale, seitan, hydrolyzed wheat protein, gluten, "may contain wheat", "peut contenir du blé", "traces de gluten", "manufactured in a facility with wheat". Also flag "amidon modifié" or "modified starch" ONLY if the source is not specified as corn or potato.
4. Return ONLY a valid JSON object — no markdown, no explanation, no code block:

{
  "verdict": "safe" | "caution" | "unsafe" | "error",
  "flagged": [{ "ingredient": "<name as it appears on label>", "reason": "<brief explanation>" }],
  "safe_highlights": ["<2-3 clearly safe ingredients for reassurance>"],
  "raw_text": "<all text extracted from the image>",
  "confidence": "high" | "medium" | "low",
  "confidence_note": "<only if medium or low: reason e.g. image is blurry>",
  "error": "<only if verdict is error: friendly message telling user what to do>"
}

Verdict rules:
- "unsafe" = one or more ingredients definitely contain gluten
- "caution" = only a "may contain" trace warning, or an ambiguous unlabeled starch
- "safe" = no gluten sources detected
- "error" = cannot read the image at all (too blurry, not a food label, no text)

If flagged is empty, return an empty array []. If safe_highlights is not relevant, return [].`;

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
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();

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
    if (error?.status === 429) {
      return res.status(429).json({
        success: false,
        message: "Too many scans right now. Wait a moment and try again.",
      });
    }
    next(error);
  }
};
