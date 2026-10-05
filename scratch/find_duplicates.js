const fs = require("fs");
const path = require("path");

const jsDir = path.join(__dirname, "../js");
const files = fs.readdirSync(jsDir).filter(f => f.endsWith(".js"));

const funcMap = {};

for (const file of files) {
  const content = fs.readFileSync(path.join(jsDir, file), "utf8");
  const regex = /(?:function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?(?:function|\([^)]*\)\s*=>))/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const fnName = match[1] || match[2];
    if (!funcMap[fnName]) funcMap[fnName] = new Set();
    funcMap[fnName].add(file);
  }
}

const ignore = new Set([
  "init", "render", "setupEventListeners", "updateUI", "showModal", "closeModal",
  "openModal", "renderTable", "bindEvents", "applyFilters", "filterData", "t",
  "renderPagination", "goToPage", "nextPage", "prevPage", "resetForm", "onMounted"
]);

const duplicates = Object.entries(funcMap).filter(([k, v]) => v.size > 1 && !ignore.has(k));
duplicates.sort((a, b) => b[1].size - a[1].size);
for (const [fn, fileSet] of duplicates) {
  console.log(`${fn}: [${Array.from(fileSet).join(", ")}]`);
}
