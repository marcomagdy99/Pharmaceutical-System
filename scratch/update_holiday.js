const fs = require("fs");
let content = fs.readFileSync("js/app.js", "utf8");
content = content.replace('publicHolidays: [{ date: "2026-10-06", title: "Armed Forces Day" }]', 'publicHolidays: [{ date: "2026-10-25", title: "National Holiday" }]');
fs.writeFileSync("js/app.js", content, "utf8");
console.log("Updated app.js publicHolidays");
