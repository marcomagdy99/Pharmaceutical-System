const https = require("https");

const getUrl = "https://firestore.googleapis.com/v1/projects/pharmacare-ab4b6/databases/(default)/documents/app_state/master_data";

https.get(getUrl, (res) => {
  let data = "";
  res.on("data", c => data += c);
  res.on("end", () => {
    const doc = JSON.parse(data);
    const payload = JSON.parse(doc.fields.payload.stringValue);

    console.log("Current publicHolidays:", payload.publicHolidays);
    // Shift the demo holiday to 2026-10-25 so 2026-10-06 is a normal workday
    payload.publicHolidays = [{ date: "2026-10-25", title: "National Holiday" }];

    const newPayloadString = JSON.stringify(payload);
    const patchBody = JSON.stringify({
      fields: {
        payload: { stringValue: newPayloadString },
        updatedAtMs: { integerValue: String(Date.now()) },
        updatedBy: { stringValue: "admin_holiday_shift" }
      }
    });

    const patchUrl = new URL("https://firestore.googleapis.com/v1/projects/pharmacare-ab4b6/databases/(default)/documents/app_state/master_data?updateMask.fieldPaths=payload&updateMask.fieldPaths=updatedAtMs&updateMask.fieldPaths=updatedBy");

    const req = https.request(patchUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(patchBody)
      }
    }, (patchRes) => {
      let patchData = "";
      patchRes.on("data", c => patchData += c);
      patchRes.on("end", () => {
        console.log("PATCH status:", patchRes.statusCode);
        if (patchRes.statusCode === 200) {
          console.log("SUCCESS! Shifted holiday off today's date.");
        }
      });
    });

    req.on("error", err => console.error("PATCH error:", err));
    req.write(patchBody);
    req.end();
  });
});
