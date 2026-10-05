const https = require("https");

const url = "https://firestore.googleapis.com/v1/projects/pharmacare-ab4b6/databases/(default)/documents/app_state/master_data";

https.get(url, (res) => {
  let data = "";
  res.on("data", (chunk) => data += chunk);
  res.on("end", () => {
    try {
      const doc = JSON.parse(data);
      if (!doc.fields || !doc.fields.payload) {
        console.log("No payload found in master_data:", data);
        return;
      }
      const payload = JSON.parse(doc.fields.payload.stringValue);
      console.log("Keys in payload:", Object.keys(payload));
      console.log("users:", payload.users?.length);
      console.log("areas:", payload.areas?.length);
      console.log("productLines:", payload.productLines?.length);
      console.log("doctors:", payload.doctors?.length);
      console.log("hospitals:", payload.hospitals?.length);
      console.log("pharmacies:", payload.pharmacies?.length);
      console.log("visits:", payload.visits?.length);
      
      console.log("\nUsers breakdown:");
      payload.users?.forEach(u => {
        console.log(`- ${u.id} | ${u.name} | role: ${u.role} | line: ${u.lineId || u.lineIds} | area: ${u.areaId || u.areaIds} | mgr: ${u.managerId}`);
      });

      console.log("\nAreas breakdown:");
      payload.areas?.forEach(a => {
        console.log(`- ${a.id} | ${a.name} | lineId: ${a.lineId} | repId: ${a.repId}`);
      });

      console.log("\nPharmacies breakdown:");
      payload.pharmacies?.forEach(p => {
        console.log(`- ${p.id} | ${p.name} | areaId: ${p.areaId} | lineId: ${p.lineId} | repId: ${p.repId}`);
      });
    } catch (e) {
      console.error("Parse error:", e);
    }
  });
}).on("error", (err) => console.error("HTTP error:", err));
