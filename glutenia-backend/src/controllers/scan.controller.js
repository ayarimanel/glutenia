const Groq = require("groq-sdk");
const ScanHistory = require("../models/ScanHistory");
const { recordScanEvent } = require("../services/scanService");

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

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
            {
              type: "text",
              text: PROMPT,
            },
          ],
        },
      ],
      max_tokens: 1024,
      temperature: 0.1,
    });

    const raw = completion.choices[0].message.content.trim();
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

    const VALID_VERDICTS = ["safe", "caution", "unsafe", "error"];
    if (!VALID_VERDICTS.includes(parsed.verdict)) {
      return res.status(422).json({
        success: false,
        message: "Unexpected AI response format. Please try again.",
      });
    }

    const safe = {
      verdict: parsed.verdict,
      flagged: Array.isArray(parsed.flagged) ? parsed.flagged : [],
      safe_highlights: Array.isArray(parsed.safe_highlights) ? parsed.safe_highlights : [],
      raw_text: parsed.raw_text ?? "",
      confidence: parsed.confidence ?? "low",
      confidence_note: parsed.confidence_note ?? null,
      error: parsed.error ?? null,
    };

    const { gamification } = await recordScanEvent(req.user.id, "label", {
      verdict: safe.verdict,
      summary: safe.flagged[0]?.ingredient || "",
    });

    return res.json({ success: true, data: { ...safe, gamification } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || String(error),
    });
  }
};

exports.getScanHistory = async (req, res, next) => {
  try {
    const history = await ScanHistory.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("product", "name imageUrl");

    return res.json({ success: true, data: history });
  } catch (error) {
    return next(error);
  }
};
