const fs = require("fs");
const path = require("path");
const vm = require("vm");

const appJs = fs.readFileSync(path.resolve(__dirname, "../js/app.js"), "utf8");
const storeJs = fs.readFileSync(path.resolve(__dirname, "../js/store.js"), "utf8");

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log("  PASS", msg); }
  else { fail++; console.log("  FAIL", msg); }
}
const near = (a, b) => Math.abs(a - b) < 0.0051;

function mkEnv() {
  const sb = {
    document: {
      getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
      createElement: () => ({ appendChild() {}, setAttribute() {} }), body: { appendChild() {} },
      documentElement: { setAttribute() {} }, addEventListener() {}, removeEventListener() {},
      dispatchEvent() {},
    },
    localStorage: { _d: { pharmaUser: JSON.stringify({id:"lm1",role:"line_manager",name:"x"}) }, getItem(k) { return this._d[k] || null; }, setItem(k, v) { this._d[k] = v; }, removeItem() {} },
    sessionStorage: { _d: { pharmaUser: JSON.stringify({id:"lm1",role:"line_manager",name:"x"}) }, getItem(k) { return this._d[k] || null; }, setItem(k, v) { this._d[k] = v; }, removeItem() {} },
    addEventListener() {}, removeEventListener() {},
    location: { href: "https://x/index.html", pathname: "/index.html", replace() {}, assign() {} },
    navigator: { onLine: true }, console, setTimeout: () => 0, clearTimeout() {},
    CustomEvent: function (n, o) { this.detail = o && o.detail; },
    Date, Math, String, Array, Object, Set, RegExp, JSON, Number, parseFloat, isNaN,
  };
  sb.window = sb;
  sb.DEMO_DATA = {
    users: [
      { id: "lm1", role: "line_manager", managerId: null },
      { id: "dm1", role: "district_manager", managerId: "lm1" },
      { id: "dm2", role: "district_manager", managerId: "lm1" },
      { id: "r1", role: "medical_rep", managerId: "dm1" },
      { id: "r2", role: "medical_rep", managerId: "dm2" },
      { id: "r3", role: "medical_rep", managerId: "dm1" },
    ],
    productLines: [
      { id: "L1", name: "Line1", products: [
        { id: "pA", name: "ProdA", cutPoint: 0 },
        { id: "pB", name: "ProdB", cutPoint: 100 },
        { id: "pC", name: "ProdC (no weights)", cutPoint: 0 },
      ] },
      { id: "L2", name: "Line2", products: [{ id: "pD", name: "ProdD", cutPoint: 0 }] },
    ],
    areas: [
      { id: "a1", name: "Dokki", lineId: "L1", repId: "r1" },
      { id: "a2", name: "Mohandseen", lineId: "L1", repId: "r2" },
      { id: "a3", name: "Agouza", lineId: "L1", repId: "r3" },
      { id: "b1", name: "OtherLineArea", lineId: "L2", repId: "r1" },
    ],
    bulkWeights: [
      { id: "w1", productId: "pA", areaId: "a1", weight: 50 },
      { id: "w2", productId: "pA", areaId: "a2", weight: 30 },
      { id: "w3", productId: "pA", areaId: "a3", weight: 20 },
      { id: "w4", productId: "pB", areaId: "a1", weight: 50 },
      { id: "w5", productId: "pB", areaId: "a2", weight: 50 },
    ],
    distributorSales: [], pharmacyOverrides: [], distributors: [{ id: "d1", name: "D1" }],
  };
  return sb;
}

function load() {
  const sb = mkEnv();
  vm.createContext(sb);
  const data = sb.DEMO_DATA;
  vm.runInContext(appJs, sb);
  vm.runInContext(storeJs, sb);
  sb.DEMO_DATA = data; sb.window.DEMO_DATA = data;
  return sb;
}
let n = 0;
const sale = (o) => ({ id: "dsale_" + (1700000000000 + n++) + "_" + n, batchId: "b1", distributorId: "d1", month: "2026-09", date: "2026-09-10",
  pharmacyCode: "PH1", pharmacyName: "Big Pharmacy", areaRaw: "Dokki", salesType: undefined, ...o });

function totals(store, filter = () => true) {
  const rows = store.distributorSales.getAll().filter(filter);
  return { q: rows.reduce((a, r) => a + (r.quantity == null ? 0 : parseFloat(r.quantity)), 0),
           v: rows.reduce((a, r) => a + (parseFloat(r.value) || 0), 0), n: rows.length };
}
function byRep(store, filter = () => true) {
  const m = {};
  store.distributorSales.getAll().filter(filter).forEach((r) => {
    m[r.repId] = m[r.repId] || { q: 0, v: 0 };
    m[r.repId].q += r.quantity == null ? 0 : parseFloat(r.quantity);
    m[r.repId].v += parseFloat(r.value) || 0;
  });
  return m;
}

// ---------- 1. Split ----------
console.log("== Split 60/40 ==");
{
  const sb = load(); const store = sb.store || vm.runInContext("store", sb);
  const D = sb.DEMO_DATA;
  D.distributorSales.push(
    sale({ product: "ProdC", productId: "pC", lineId: "L1", quantity: 10, value: 333.33 }),
    sale({ product: "ProdC", productId: "pC", lineId: "L1", quantity: 7, value: 100 }),
    sale({ product: "ProdC", productId: "pC", lineId: "L1", quantity: null, value: 50.01 }),
    sale({ product: "ProdC", productId: "pC", lineId: "L1", quantity: -3, value: -30 }),
    sale({ product: "ProdD", productId: "pD", lineId: "L2", quantity: 5, value: 90 }),
    sale({ pharmacyCode: "OTHER", pharmacyName: "Other", product: "ProdC", productId: "pC", lineId: "L1", quantity: 4, value: 40, areaRaw: "Agouza" }),
  );
  store.distributorSales.applyAreaMatching(true, false);
  const before = totals(store, (r) => r.pharmacyCode === "PH1" && r.lineId === "L1");
  const otherBefore = totals(store, (r) => r.pharmacyCode === "OTHER");
  const saved = store.pharmacyOverrides.save({ distributorId: "d1", pharmacyCode: "PH1", pharmacyName: "Big Pharmacy", mode: "split",
    splits: [{ areaId: "a1", percent: 60 }, { areaId: "a2", percent: 40 }], effectiveScope: "all_history", createdMonth: "2026-10" });
  ok(saved.areaId === "a1", "save normalizes areaId to first split");
  store.distributorSales.applyPharmacyOverride(saved);
  const after = totals(store, (r) => r.pharmacyCode === "PH1" && r.lineId === "L1");
  ok(near(before.q, after.q) && near(before.v, after.v), `totals preserved q ${before.q}->${after.q} v ${before.v}->${after.v}`);
  ok(after.n === before.n * 2, "children created (2 per row)");
  const br = byRep(store, (r) => r.pharmacyCode === "PH1" && r.lineId === "L1");
  ok(near(br.r1.v, before.v * 0.6) || Math.abs(br.r1.v - before.v * 0.6) < 0.05, "rep1 value ~60%: " + br.r1.v);
  ok(Math.abs(br.r2.v - before.v * 0.4) < 0.05, "rep2 value ~40%: " + br.r2.v);
  ok(Math.abs(br.r1.q - before.q * 0.6) < 0.05, "rep1 qty ~60%");
  const nullRows = store.distributorSales.getAll().filter((r) => r.pharmacyCode === "PH1" && r.lineId === "L1" && r.quantity === null);
  ok(nullRows.length === 2, "null quantity stays null on parent + child");
  const otherAfter = totals(store, (r) => r.pharmacyCode === "OTHER");
  ok(otherAfter.n === otherBefore.n && near(otherAfter.v, otherBefore.v), "other pharmacy untouched");
  const l2 = store.distributorSales.getAll().filter((r) => r.productId === "pD");
  ok(l2.length === 1 && l2[0].areaId !== "a1" || l2.length === 1, "other-line row not split");
  // children carry dm/lm
  const child = store.distributorSales.getAll().find((r) => r.splitParentId);
  ok(child && child.areaId === "a2" && child.repId === "r2" && child.dmId === "dm2" && child.lmId === "lm1", "child chain rep/dm/lm");
  // idempotency
  for (let i = 0; i < 3; i++) store.distributorSales.applyCutPointAndBulk();
  const idem = totals(store, (r) => r.pharmacyCode === "PH1" && r.lineId === "L1");
  ok(idem.n === after.n && near(idem.v, after.v) && near(idem.q, after.q), "idempotent after 3 re-runs");
  // forceAll area matching must not move children/parents of splits
  store.distributorSales.applyAreaMatching(true, false);
  const br2 = byRep(store, (r) => r.pharmacyCode === "PH1" && r.lineId === "L1");
  ok(Math.abs(br2.r1.v - br.r1.v) < 0.001 && Math.abs(br2.r2.v - br.r2.v) < 0.001, "forceAll applyAreaMatching keeps split attribution");
  // percents must sum 100 else ignored
  const bad = store.pharmacyOverrides.save({ ...saved, splits: [{ areaId: "a1", percent: 50 }, { areaId: "a2", percent: 40 }] });
  store.distributorSales.applyPharmacyOverride(bad);
  const t3 = totals(store, (r) => r.pharmacyCode === "PH1" && r.lineId === "L1");
  ok(t3.n === before.n && near(t3.v, before.v), "invalid sum (90) -> no split, totals ok");
  // edit split -> 3 areas
  const e3 = store.pharmacyOverrides.save({ ...saved, splits: [{ areaId: "a1", percent: 50 }, { areaId: "a2", percent: 30 }, { areaId: "a3", percent: 20 }] });
  store.distributorSales.applyPharmacyOverride(e3);
  const t4 = totals(store, (r) => r.pharmacyCode === "PH1" && r.lineId === "L1");
  ok(t4.n === before.n * 3 && near(t4.v, before.v) && near(t4.q, before.q), "3-way split totals preserved");
  // switch to single
  const sgl = store.pharmacyOverrides.save({ ...saved, mode: "single", areaId: "a2", splits: undefined });
  store.distributorSales.applyPharmacyOverride(sgl);
  const t5 = totals(store, (r) => r.pharmacyCode === "PH1" && r.lineId === "L1");
  const b5 = byRep(store, (r) => r.pharmacyCode === "PH1" && r.lineId === "L1");
  ok(t5.n === before.n && near(t5.v, before.v) && near(t5.q, before.q) && near(b5.r2.v, before.v), "split->single restores originals & all to rep2");
  // back to split then delete
  const again = store.pharmacyOverrides.save({ ...saved, mode: "split", areaId: undefined, splits: [{ areaId: "a1", percent: 60 }, { areaId: "a2", percent: 40 }] });
  store.distributorSales.applyPharmacyOverride(again);
  store.pharmacyOverrides.delete(again.id);
  store.distributorSales.revertPharmacyOverride(again);
  const t6 = totals(store, (r) => r.pharmacyCode === "PH1" && r.lineId === "L1");
  ok(t6.n === before.n && near(t6.v, before.v) && near(t6.q, before.q), "delete split override restores originals");
  ok(store.distributorSales.getAll().every((r) => !r.splitParentId && !r.isSplitParent), "no split leftovers");
  // deleteByBatch removes children
  store.pharmacyOverrides.save({ ...saved, id: undefined, mode: "split", splits: [{ areaId: "a1", percent: 60 }, { areaId: "a2", percent: 40 }] });
  store.distributorSales.applyCutPointAndBulk();
  if (store.distributorSales.deleteByBatch) {
    store.distributorSales.deleteByBatch("b1");
    ok(store.distributorSales.getAll().length === 0, "deleteByBatch removes parents+children");
  }
}

// ---------- 2. future_only split ----------
console.log("== Split future_only ==");
{
  const sb = load(); const store = vm.runInContext("store", sb);
  const D = sb.DEMO_DATA;
  const old = sale({ product: "ProdC", productId: "pC", lineId: "L1", quantity: 10, value: 100 });
  old.id = "dsale_1000000000000_1";
  D.distributorSales.push(old);
  const ov = store.pharmacyOverrides.save({ distributorId: "d1", pharmacyCode: "PH1", pharmacyName: "Big Pharmacy", mode: "split",
    splits: [{ areaId: "a1", percent: 60 }, { areaId: "a2", percent: 40 }], effectiveScope: "future_only", createdMonth: "2026-09", createdAt: "2026-09-20T00:00:00.000Z" });
  store.distributorSales.applyPharmacyOverride(ov);
  ok(store.distributorSales.getAll().length === 1, "older import not split under future_only");
  const nw = sale({ product: "ProdC", productId: "pC", lineId: "L1", quantity: 10, value: 100 });
  nw.id = "dsale_" + (Date.now() + 100000) + "_1";
  store.distributorSales.addBatch([nw]);
  const all = store.distributorSales.getAll();
  ok(all.length === 3, "new import after override IS split: " + all.length);
}

// ---------- 3. All Bulk ----------
console.log("== All Bulk ==");
{
  const sb = load(); const store = vm.runInContext("store", sb);
  const D = sb.DEMO_DATA;
  D.distributorSales.push(
    sale({ product: "ProdA", productId: "pA", lineId: "L1", quantity: 100, value: 1000 }),
    sale({ product: "ProdA", productId: "pA", lineId: "L1", quantity: 50, value: 500, areaRaw: "Dokki" }),
    sale({ product: "ProdC", productId: "pC", lineId: "L1", quantity: 10, value: 80 }),
    sale({ product: "ProdA", productId: "pA", lineId: "L1", quantity: 30, value: 300, pharmacyCode: "PH2", pharmacyName: "Small" }),
  );
  store.distributorSales.applyAreaMatching(true, false);
  const ov = store.pharmacyOverrides.save({ distributorId: "d1", pharmacyCode: "PH1", pharmacyName: "Big Pharmacy", mode: "bulk", lineId: "L1",
    effectiveScope: "all_history", createdMonth: "2026-10" });
  ok(ov.areaId === null, "bulk areaId null");
  store.distributorSales.applyPharmacyOverride(ov);
  const sum = store.distributorSales.lastEngineSummary;
  ok(sum.skippedNoWeights === 1, "product without weights counted in skippedNoWeights: " + sum.skippedNoWeights);
  const bulk = store.distributorSales.getAll().filter((r) => r.salesType === "bulk" && r.pharmacyCode === "PH1");
  const bt = bulk.reduce((a, r) => ({ q: a.q + r.quantity, v: a.v + r.value }), { q: 0, v: 0 });
  ok(near(bt.q, 150) && near(bt.v, 1500), `bulk total conserved q=${bt.q} v=${bt.v}`);
  const r1 = bulk.filter((r) => r.areaId === "a1").reduce((a, r) => a + r.value, 0);
  ok(near(r1, 750), "a1 gets 50% of bulk value: " + r1);
  ok(bulk.every((r) => r.forcedBulk), "forcedBulk flag");
  const priv = store.distributorSales.getAll().filter((r) => r.salesType === "private" && r.pharmacyCode === "PH1" && r.productId === "pA");
  ok(priv.every((r) => r.quantity === 0 && r.value === 0), "private rows of forced pharmacy zeroed");
  const noW = store.distributorSales.getAll().find((r) => r.productId === "pC");
  ok(noW.quantity === 10 && noW.value === 80 && noW.salesType === "private", "no-weights product stays private/intact");
  const ph2 = store.distributorSales.getAll().filter((r) => r.pharmacyCode === "PH2");
  ok(ph2.length === 1 && ph2[0].value === 300 && ph2[0].salesType === "private", "other pharmacy unaffected");
  const bulkCount = bulk.length;
  for (let i = 0; i < 3; i++) store.distributorSales.applyCutPointAndBulk();
  const bulk2 = store.distributorSales.getAll().filter((r) => r.salesType === "bulk" && r.pharmacyCode === "PH1");
  ok(bulk2.length === bulkCount && near(bulk2.reduce((a, r) => a + r.value, 0), 1500), "idempotent");
  store.distributorSales.applyAreaMatching(true, false);
  const bulk3 = store.distributorSales.getAll().filter((r) => r.salesType === "bulk");
  ok(bulk3.length === bulkCount + 0 || bulk3.length >= bulkCount, "forceAll matching keeps bulk rows");
  ok(bulk3.find((r) => r.areaId === "a2").repId === "r2", "bulk rows keep their area/rep after forceAll");
  // revert
  store.pharmacyOverrides.delete(ov.id);
  store.distributorSales.revertPharmacyOverride(ov);
  const rest = store.distributorSales.getAll().filter((r) => r.pharmacyCode === "PH1" && r.productId === "pA");
  ok(rest.length === 2 && near(rest[0].value + rest[1].value, 1500) && near(rest[0].quantity + rest[1].quantity, 150), "delete bulk override restores originals");
  ok(store.distributorSales.getAll().every((r) => r.salesType !== "bulk"), "no bulk rows after delete");
  // bulk override scoped to other line should not affect L1
  const ovL2 = store.pharmacyOverrides.save({ distributorId: "d1", pharmacyCode: "PH1", pharmacyName: "Big Pharmacy", mode: "bulk", lineId: "L2", effectiveScope: "all_history", createdMonth: "2026-10" });
  store.distributorSales.applyPharmacyOverride(ovL2);
  ok(store.distributorSales.getAll().every((r) => r.salesType !== "bulk"), "line-L2 bulk override doesn't touch L1 rows");
}

// ---------- 4. cut-point regression (capped restore) ----------
console.log("== CutPoint re-run ==");
{
  const sb = load(); const store = vm.runInContext("store", sb);
  const D = sb.DEMO_DATA;
  D.distributorSales.push(
    sale({ product: "ProdB", productId: "pB", lineId: "L1", quantity: 150, value: 1500 }),
    sale({ product: "ProdB", productId: "pB", lineId: "L1", quantity: 50, value: 500, areaRaw: "Dokki" }),
  );
  store.distributorSales.applyAreaMatching(true, false);
  const r = [];
  for (let i = 0; i < 4; i++) { store.distributorSales.applyCutPointAndBulk(); r.push(totals(store)); }
  ok(r.every((x) => near(x.q, 200) && near(x.v, 2000)), "total 200/2000 preserved over 4 runs: " + JSON.stringify(r.map((x) => [x.q, x.v, x.n])));
  const priv = totals(store, (x) => x.salesType === "private");
  ok(near(priv.q, 100), "private capped at cutPoint 100: " + priv.q);
  // combine split + cutpoint
  const ov = store.pharmacyOverrides.save({ distributorId: "d1", pharmacyCode: "PH1", pharmacyName: "Big Pharmacy", mode: "split",
    splits: [{ areaId: "a1", percent: 70 }, { areaId: "a2", percent: 30 }], effectiveScope: "all_history", createdMonth: "2026-10" });
  store.distributorSales.applyPharmacyOverride(ov);
  const t = totals(store);
  ok(near(t.q, 200) && near(t.v, 2000), "split+cutpoint total preserved: " + t.q + "/" + t.v);
  const p2 = totals(store, (x) => x.salesType === "private");
  ok(near(p2.q, 100), "split+cutpoint private still 100");
  store.pharmacyOverrides.delete(ov.id);
  store.distributorSales.revertPharmacyOverride(ov);
  const t2 = totals(store);
  ok(near(t2.q, 200) && near(t2.v, 2000) && near(totals(store, (x) => x.salesType === "private").q, 100), "revert -> back to plain cutpoint result");
}

// ---------- 5. Legacy single override still works ----------
console.log("== Legacy single override ==");
{
  const sb = load(); const store = vm.runInContext("store", sb);
  const D = sb.DEMO_DATA;
  D.distributorSales.push(sale({ product: "ProdC", productId: "pC", lineId: "L1", quantity: 10, value: 100 }));
  D.pharmacyOverrides.push({ id: "old1", distributorId: "d1", pharmacyCode: "PH1", pharmacyName: "Big Pharmacy", areaId: "a3", effectiveScope: "all_history", createdMonth: "2026-01" });
  store.distributorSales.applyAreaMatching(true, false);
  const row = store.distributorSales.getAll()[0];
  ok(row.areaId === "a3" && row.repId === "r3", "legacy override (no mode) assigns area");
  store.distributorSales.applyPharmacyOverride(D.pharmacyOverrides[0]);
  ok(store.distributorSales.getAll().length === 1 && store.distributorSales.getAll()[0].areaId === "a3", "legacy apply ok");
}

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);



