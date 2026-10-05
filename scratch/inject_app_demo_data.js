const fs = require("fs");
const path = require("path");
const { generateDirectory } = require("./generate_seed_data");

const appJsPath = path.resolve(__dirname, "../js/app.js");
let content = fs.readFileSync(appJsPath, "utf8");

const seeded = generateDirectory();

const doctorsJson = JSON.stringify(seeded.doctors, null, 2);
const hospitalsJson = JSON.stringify(seeded.hospitals, null, 2);
const pharmaciesJson = JSON.stringify(seeded.pharmacies, null, 2);

const regex = /doctors:\s*\[\],\s*hospitals:\s*\[\],\s*pharmacies:\s*\[\],/;

if (!regex.test(content)) {
  console.error("Could not match regex in app.js!");
  process.exit(1);
}

const replacement = `doctors: ${doctorsJson},\n  hospitals: ${hospitalsJson},\n  pharmacies: ${pharmaciesJson},`;

content = content.replace(regex, replacement);
fs.writeFileSync(appJsPath, content, "utf8");
console.log("Successfully updated DEFAULT_DEMO_DATA in js/app.js with seeded doctors, hospitals, and pharmacies.");
