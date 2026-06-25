const fs = require("node:fs");
const path = require("node:path");

const manifestPath = path.join(
  __dirname,
  "..",
  "android",
  "app",
  "src",
  "main",
  "AndroidManifest.xml"
);
const gradlePropertiesPath = path.join(__dirname, "..", "android", "gradle.properties");

let manifest = fs.readFileSync(manifestPath, "utf8");

if (!manifest.includes("android:usesCleartextTraffic=")) {
  manifest = manifest.replace(
    "<application ",
    '<application android:usesCleartextTraffic="true" '
  );
  fs.writeFileSync(manifestPath, manifest);
  console.log("Enabled Android cleartext HTTP traffic for local API access.");
} else {
  console.log("Android cleartext HTTP traffic is already configured.");
}

let gradleProperties = fs.readFileSync(gradlePropertiesPath, "utf8");
const setGradleProperty = (name, value) => {
  const pattern = new RegExp(`^${name}=.*$`, "m");
  if (pattern.test(gradleProperties)) {
    gradleProperties = gradleProperties.replace(pattern, `${name}=${value}`);
  } else {
    gradleProperties += `\n${name}=${value}\n`;
  }
};

setGradleProperty("hermesEnabled", "false");
setGradleProperty("expo.useLegacyPackaging", "true");
fs.writeFileSync(gradlePropertiesPath, gradleProperties);
console.log("Configured Android release for JSC and legacy native library packaging.");
