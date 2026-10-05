const https = require("https");

const getUrl = "https://firestore.googleapis.com/v1/projects/pharmacare-ab4b6/databases/(default)/documents/app_state/master_data";

https.get(getUrl, (res) => {
  let data = "";
  res.on("data", c => data += c);
  res.on("end", () => {
    const doc = JSON.parse(data);
    const payload = JSON.parse(doc.fields.payload.stringValue);

    console.log("Before revert:");
    console.log("- doctors count:", payload.doctors?.length);
    console.log("- hospitals count:", payload.hospitals?.length);
    console.log("- pharmacies count:", payload.pharmacies?.length);
    console.log("- publicHolidays:", payload.publicHolidays);

    // Keep only original 7 pharmacies (p1..p7)
    const originalPharmacies = (payload.pharmacies || []).filter(p => ['p1','p2','p3','p4','p5','p6','p7'].includes(p.id));

    // Clear doctors and hospitals as requested
    payload.doctors = [];
    payload.hospitals = [];
    payload.pharmacies = originalPharmacies;
    // Restore Armed Forces Day holiday on 2026-10-06
    payload.publicHolidays = [{ date: "2026-10-06", title: "Armed Forces Day", titleAr: "عيد القوات المسلحة" }];

    console.log("\nAfter revert:");
    console.log("- doctors count:", payload.doctors.length);
    console.log("- hospitals count:", payload.hospitals.length);
    console.log("- pharmacies count:", payload.pharmacies.length);
    console.log("- publicHolidays:", payload.publicHolidays);

    const newPayloadString = JSON.stringify(payload);
    const patchBody = JSON.stringify({
      fields: {
        payload: { stringValue: newPayloadString },
        updatedAtMs: { integerValue: String(Date.now()) },
        updatedBy: { stringValue: "admin_revert_requested" }
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
          console.log("SUCCESS! Firestore master_data reverted cleanly.");
        } else {
          console.log("Response:", patchData);
        }
      });
    });

    req.on("error", err => console.error("PATCH error:", err));
    req.write(patchBody);
    req.end();
  });
});
