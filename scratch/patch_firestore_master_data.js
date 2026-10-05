const https = require("https");
const { generateDirectory } = require("./generate_seed_data");

async function checkAndPatchFirestore() {
  const getUrl = "https://firestore.googleapis.com/v1/projects/pharmacare-ab4b6/databases/(default)/documents/app_state/master_data";

  https.get(getUrl, (res) => {
    let data = "";
    res.on("data", chunk => data += chunk);
    res.on("end", async () => {
      const doc = JSON.parse(data);
      if (!doc.fields || !doc.fields.payload) {
        console.error("Payload not found:", data);
        return;
      }

      const payload = JSON.parse(doc.fields.payload.stringValue);
      console.log("Current doctors:", payload.doctors?.length);
      console.log("Current hospitals:", payload.hospitals?.length);
      console.log("Current pharmacies:", payload.pharmacies?.length);

      const seeded = generateDirectory();

      // Merge pharmacies: keep existing p1..p7 and add new ones
      const existingPharmacies = Array.isArray(payload.pharmacies) ? payload.pharmacies : [];
      const existingIds = new Set(existingPharmacies.map(p => p.id));
      const combinedPharmacies = [...existingPharmacies];
      seeded.pharmacies.forEach(p => {
        if (!existingIds.has(p.id)) combinedPharmacies.push(p);
      });

      payload.doctors = seeded.doctors;
      payload.hospitals = seeded.hospitals;
      payload.pharmacies = combinedPharmacies;

      console.log("New doctors count:", payload.doctors.length);
      console.log("New hospitals count:", payload.hospitals.length);
      console.log("New pharmacies count:", payload.pharmacies.length);

      const newPayloadString = JSON.stringify(payload);

      const patchBody = JSON.stringify({
        fields: {
          payload: { stringValue: newPayloadString },
          updatedAtMs: { integerValue: String(Date.now()) },
          updatedBy: { stringValue: "admin_seed" }
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
            console.log("SUCCESS! Firestore master_data updated.");
          } else {
            console.log("PATCH response:", patchData);
          }
        });
      });

      req.on("error", err => console.error("PATCH request error:", err));
      req.write(patchBody);
      req.end();
    });
  });
}

checkAndPatchFirestore();
