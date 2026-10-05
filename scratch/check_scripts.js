const fs = require("fs");
const files = fs.readdirSync(".").filter(f => f.endsWith(".html"));
let issues = 0;
for (const f of files) {
  const content = fs.readFileSync(f, "utf8");
  const matches = content.match(/src="js\/[^"]+"/g) || [];
  for (const m of matches) {
    if (!m.includes("chart.umd.min.js") && !m.includes("?v=v115")) {
      console.log(`${f}: ${m}`);
      issues++;
    }
  }
}
if (issues === 0) {
  console.log("ALL js scripts in all 15 HTML files are correctly tagged with ?v=v115!");
}
