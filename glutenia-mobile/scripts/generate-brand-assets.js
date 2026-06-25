const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");

const root = path.resolve(__dirname, "..");
const assetsDir = path.join(root, "assets");

const colors = {
  brown: "#7B3A1E",
  brownLight: "#A0522D",
  cream: "#F8F5F0",
  green: "#1F6600",
  greenMid: "#2D8C00",
  white: "#FFFFFF",
};

const markSvg = ({ size = 1024, transparent = false, wordmark = false }) => {
  const bg = transparent
    ? ""
    : `<rect width="${size}" height="${size}" fill="${colors.cream}"/>`;
  const center = size / 2;
  const scale = size / 1024;
  const wordmarkPart = wordmark
    ? `
      <text x="${center}" y="${760 * scale}" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-size="${96 * scale}"
        font-weight="800" fill="${colors.brown}">Glutenia</text>
      <text x="${center}" y="${828 * scale}" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-size="${34 * scale}"
        font-weight="700" fill="${colors.green}">gluten-free market</text>`
    : "";

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      ${bg}
      <g transform="translate(${center} ${wordmark ? 394 * scale : center}) scale(${scale})">
        <circle cx="0" cy="0" r="310" fill="${colors.brown}"/>
        <circle cx="0" cy="0" r="246" fill="${colors.brownLight}" opacity="0.22"/>
        <path d="M-98 96 C-164 18 -154 -92 -86 -154 C-28 -207 60 -207 116 -154"
          fill="none" stroke="${colors.cream}" stroke-width="58" stroke-linecap="round"/>
        <path d="M102 -154 C42 -54 52 38 142 104" fill="none"
          stroke="${colors.cream}" stroke-width="58" stroke-linecap="round"/>
        <path d="M-8 164 C-10 44 18 -66 92 -170" fill="none"
          stroke="${colors.greenMid}" stroke-width="32" stroke-linecap="round"/>
        <path d="M30 -92 C116 -168 202 -162 250 -84 C158 -58 78 -56 30 -92Z"
          fill="${colors.greenMid}"/>
        <path d="M2 -22 C90 -76 174 -50 214 24 C126 44 48 36 2 -22Z"
          fill="${colors.green}"/>
        <path d="M-12 50 C70 16 140 44 168 112 C86 122 20 104 -12 50Z"
          fill="${colors.greenMid}"/>
        <path d="M-74 -174 L-134 -254 M-42 -184 L-78 -274 M-6 -188 L-2 -288
          M32 -184 L76 -274 M70 -170 L142 -244" fill="none"
          stroke="${colors.cream}" stroke-width="24" stroke-linecap="round"/>
      </g>
      ${wordmarkPart}
    </svg>`;
};

const renderPng = async (svg, outPath, size) => {
  await sharp(Buffer.from(svg))
    .resize(size, size, { fit: "contain" })
    .png()
    .toFile(outPath);
};

const main = async () => {
  await fs.mkdir(assetsDir, { recursive: true });

  await renderPng(markSvg({ size: 1024 }), path.join(assetsDir, "icon.png"), 1024);
  await renderPng(
    markSvg({ size: 1024, transparent: true }),
    path.join(assetsDir, "adaptive-icon.png"),
    1024
  );
  await renderPng(
    markSvg({ size: 1024, transparent: true, wordmark: true }),
    path.join(assetsDir, "splash-icon.png"),
    1024
  );
  await renderPng(
    markSvg({ size: 1024, transparent: true, wordmark: true }),
    path.join(assetsDir, "logo.png"),
    1024
  );

  console.log(`Generated Glutenia brand assets in ${assetsDir}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
