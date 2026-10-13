const fs = require("fs");
const path = require("path");

const baseDir = path.resolve(__dirname, "..");
const files = fs.readdirSync(baseDir).filter(f => f.endsWith(".html"));

const targetVersion = "v195";
let updatedCount = 0;

for (const file of files) {
  const filePath = path.join(baseDir, file);
  let content = fs.readFileSync(filePath, "utf8");
  const original = content;

  // 1. Update EXPECTED_SW
  content = content.replace(/EXPECTED_SW\s*=\s*["']v\d+["']/g, `EXPECTED_SW = "${targetVersion}"`);

  // 2. Update all js script tags (excluding external/vendor)
  content = content.replace(/src="js\/([^"]+?\.js)(?:\?[^"]*)?"/g, (match, scriptName) => {
    // Keep chart.umd.min.js without version or with version
    if (scriptName.includes("chart.umd.min.js")) {
      return match;
    }
    return `src="js/${scriptName}?v=${targetVersion}"`;
  });

  // 3. Update all css link tags
  content = content.replace(/href="css\/([^"]+?\.css)(?:\?[^"]*)?"/g, (match, cssName) => {
    return `href="css/${cssName}?v=${targetVersion}"`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`Updated: ${file}`);
    updatedCount++;
  }
}

// Update sw.js
const swPath = path.join(baseDir, "sw.js");
if (fs.existsSync(swPath)) {
  let swContent = fs.readFileSync(swPath, "utf8");
  swContent = swContent.replace(/CACHE_VERSION\s*=\s*['"]v\d+['"]/, `CACHE_VERSION = '${targetVersion}'`);
  fs.writeFileSync(swPath, swContent, "utf8");
  console.log(`Updated sw.js to ${targetVersion}`);
}

console.log(`Successfully bumped all assets to ${targetVersion} in ${updatedCount} HTML files and sw.js.`);






