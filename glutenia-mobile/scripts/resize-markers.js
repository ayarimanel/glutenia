const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const markersDir = path.join(__dirname, "../assets/markers");
const OUT_SIZE = 72; // final PNG size in pixels (~36dp on 2x, ~24dp on 3x)
const ICON_SIZE = 44; // icon portion inside the circle

const TYPES = [
  { file: "marker-store.png",  bg: "#8BC34A" }, // green  — Supermarket / Pharmacy
  { file: "marker-food.png",   bg: "#C8102E" }, // red    — Restaurant / Bakery / Café
  { file: "marker-health.png", bg: "#8BC34A" }, // green  — Health Store
];

async function run() {
  for (const { file, bg } of TYPES) {
    const src = path.join(markersDir, file);

    if (!fs.existsSync(src)) {
      console.warn(`⚠  ${file} not found — skipping`);
      continue;
    }

    // 1. Resize the source icon to ICON_SIZE, keeping transparency
    const iconBuf = await sharp(src)
      .resize(ICON_SIZE, ICON_SIZE, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .ensureAlpha()
      .png()
      .toBuffer();

    // 2. Create a coloured circle as the background
    const circle = Buffer.from(
      `<svg width="${OUT_SIZE}" height="${OUT_SIZE}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${OUT_SIZE / 2}" cy="${OUT_SIZE / 2}" r="${OUT_SIZE / 2 - 2}"
                fill="${bg}" stroke="white" stroke-width="3"/>
      </svg>`
    );

    // 3. Composite: circle + centred icon
    const offset = Math.round((OUT_SIZE - ICON_SIZE) / 2);
    const buf = await sharp(circle)
      .composite([{ input: iconBuf, top: offset, left: offset }])
      .png()
      .toBuffer();

    fs.writeFileSync(src, buf);
    console.log(`✓  ${file}  →  ${OUT_SIZE}×${OUT_SIZE}px`);
  }

  console.log("\nDone. Rebuild the app to see the changes.");
}

run().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
