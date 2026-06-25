const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = path.join(
  root,
  "android",
  "app",
  "build",
  "outputs",
  "apk",
  "release",
  "app-release.apk"
);
const destination = path.join(root, "Glutenia.apk");

if (!fs.existsSync(source)) {
  console.error(`APK not found: ${source}`);
  process.exit(1);
}

fs.copyFileSync(source, destination);

const bytes = fs.readFileSync(destination);
const hash = crypto.createHash("sha256").update(bytes).digest("hex").toUpperCase();
const sizeMb = (bytes.length / 1024 / 1024).toFixed(1);

console.log(`Copied APK to: ${destination}`);
console.log(`Size: ${sizeMb} MB`);
console.log(`SHA-256: ${hash}`);
