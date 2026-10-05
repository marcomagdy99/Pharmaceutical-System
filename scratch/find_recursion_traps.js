const fs = require("fs");
const path = require("path");

const jsDir = path.resolve(__dirname, "../js");
const files = fs.readdirSync(jsDir).filter(f => f.endsWith(".js"));

for (const file of files) {
  const content = fs.readFileSync(path.join(jsDir, file), "utf8");
  const regex = /function\s+([a-zA-Z0-9_$]+)\s*\([^\)]*\)\s*\{[\s\S]*?return\s+window\.([a-zA-Z0-9_$]+)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match[1] === match[2]) {
      console.log(`POTENTIAL RECURSION TRAP in ${file}: function ${match[1]} calls window.${match[2]}`);
    }
  }
}
