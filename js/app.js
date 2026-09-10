/**
 * @file app.js
 * @description Core shared logic, synchronous theme execution, authentication, and universal topbar rendering across all pages.
 */

// ============================================================================
// Immediate Synchronous Theme Engine (Eliminates Flash of Light Theme - FOUC)
// ============================================================================
(function () {
  try {
    const savedTheme = localStorage.getItem("pharmaTheme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
  } catch (err) {}
})();

// ============================================================================
// Section 0: HTML Escaping Utility
// Use this whenever free-text a user typed (announcement body, visit comment,
// leave reason, etc.) is inserted into innerHTML, to prevent stored XSS.
// Safe to call on undefined/null - returns an empty string.
// ============================================================================
function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
window.escapeHtml = escapeHtml;

// ============================================================================
// Section 1: Default Master Seed Data
// ============================================================================
const DEFAULT_DEMO_DATA = {
  currentUser: {
    id: "rep1",
    email: "ahmed@pharmacare.com",
    name: "Ahmed Mostafa",
    nameAr: "أحمد مصطفى",
    role: "medical_rep",
    employeeCode: "EMP-001",
    managerId: "dm1",
    areaId: "area1",
    lineId: "line1",
    lineIds: ["line1"],
    photoURL: "",
    lang: "en",
    leaveBalance: {
      annual: 21,
      sick: 7,
      emergency: 3,
      unpaid: 0,
      maternity: 90,
    },
  },
  users: [
    {
      id: "admin1",
      name: "System Admin",
      nameAr: "مدير النظام",
      role: "admin",
      employeeCode: "ADM-001",
    },
    {
      id: "bu1",
      name: "Tarek Saad",
      nameAr: "طارق سعد",
      role: "business_unit",
      employeeCode: "BU-001",
      managerId: "admin1",
    },
    {
      id: "lm1",
      name: "Hassan Ali",
      nameAr: "حسن علي",
      role: "line_manager",
      employeeCode: "LM-001",
      managerId: "bu1",
      lineId: "line1",
      lineIds: ["line1", "line2"],
    },
    {
      id: "lm2",
      name: "Sayed Ibrahim",
      nameAr: "سيد إبراهيم",
      role: "line_manager",
      employeeCode: "LM-002",
      managerId: "bu1",
      lineId: "line2",
      lineIds: ["line2"],
    },
    {
      id: "dm1",
      name: "Karim Nasser",
      nameAr: "كريم ناصر",
      role: "district_manager",
      employeeCode: "DM-001",
      managerId: "lm1",
      lineId: "line1",
      lineIds: ["line1"],
    },
    {
      id: "dm2",
      name: "Mona Adel",
      nameAr: "منى عادل",
      role: "district_manager",
      employeeCode: "DM-002",
      managerId: "lm1",
      lineId: "line1",
      lineIds: ["line1"],
    },
    {
      id: "dm3",
      name: "Rami Samir",
      nameAr: "رامي سمير",
      role: "district_manager",
      employeeCode: "DM-003",
      managerId: "lm2",
      lineId: "line2",
      lineIds: ["line2"],
    },
    {
      id: "rep1",
      name: "Ahmed Mostafa",
      nameAr: "أحمد مصطفى",
      role: "medical_rep",
      employeeCode: "EMP-001",
      managerId: "dm1",
      areaId: "area1",
      lineId: "line1",
      lineIds: ["line1"],
    },
    {
      id: "rep2",
      name: "Omar Youssef",
      nameAr: "عمر يوسف",
      role: "medical_rep",
      employeeCode: "EMP-002",
      managerId: "dm1",
      areaId: "area2",
      lineId: "line1",
      lineIds: ["line1"],
    },
    {
      id: "rep3",
      name: "Ali Mahmoud",
      nameAr: "علي محمود",
      role: "medical_rep",
      employeeCode: "EMP-003",
      managerId: "dm2",
      areaId: "area1",
      lineId: "line1",
      lineIds: ["line1"],
    },
    {
      id: "rep4",
      name: "Nourhan Ezz",
      nameAr: "نورهان عز",
      role: "medical_rep",
      employeeCode: "EMP-004",
      managerId: "dm3",
      areaId: "area2",
      lineId: "line2",
      lineIds: ["line2"],
    },
    {
      id: "hr1",
      name: "Fatma El-Sherif",
      nameAr: "فاطمة الشريف",
      role: "hr",
      employeeCode: "HR-001",
      email: "hr@pharmacare.com",
      managerId: "admin1",
    },
  ],
  areas: [
    { id: "area1", name: "Nasr City", code: "CAI-N01", repId: "rep1" },
    { id: "area2", name: "Heliopolis", code: "CAI-H01", repId: "rep2" },
  ],
  productLines: [
    {
      id: "line1",
      name: "Cardio Line",
      lineManagerId: "lm1",
      products: [
        { id: "prod1", name: "Amoxicillin 500mg", dosage: "500mg", form: "Tablet" },
        { id: "prod2", name: "Vitamin D Drops 1000IU", dosage: "1000IU", form: "Drops" },
        { id: "prod3", name: "Omeprazole 20mg", dosage: "20mg", form: "Capsule" },
        { id: "prod4", name: "Azithromycin 250mg", dosage: "250mg", form: "Tablet" },
      ],
    },
    {
      id: "line2",
      name: "Neuro Line",
      lineManagerId: "lm1",
      products: [
        { id: "prod5", name: "Pregabalin 75mg", dosage: "75mg", form: "Capsule" },
        { id: "prod6", name: "Carbamazepine 200mg", dosage: "200mg", form: "Tablet" },
      ],
    },
  ],
  doctors: [
    {
      id: "d1",
      name: "Ahmed Mostafa",
      nameAr: "د. أحمد مصطفى",
      specialty: "Internal Medicine",
      specialtyAr: "باطنة",
      class: "A",
      type: "doctor",
      clinicAddress: "15 Makram Ebeid, Nasr City",
      phone: "01001234567",
      repId: "rep1",
    },
    {
      id: "d2",
      name: "Sara Abdullah",
      nameAr: "د. سارة عبدالله",
      specialty: "Pediatrics",
      specialtyAr: "أطفال",
      class: "A",
      type: "doctor",
      clinicAddress: "22 Abbas Al-Akkad, Nasr City",
      phone: "01112345678",
      repId: "rep1",
    },
    {
      id: "d3",
      name: "Mohamed Hassan",
      nameAr: "د. محمد حسن",
      specialty: "Dermatology",
      specialtyAr: "جلدية",
      class: "B",
      type: "doctor",
      clinicAddress: "8 Mostafa El Nahas, Nasr City",
      phone: "01223456789",
      repId: "rep1",
    },
    {
      id: "d4",
      name: "Noura Mahmoud",
      nameAr: "د. نورا محمود",
      specialty: "Ophthalmology",
      specialtyAr: "عيون",
      class: "B",
      type: "doctor",
      clinicAddress: "3 Al Tayaran St, Nasr City",
      phone: "01098765432",
      repId: "rep1",
    },
    {
      id: "d5",
      name: "Khaled Omar",
      nameAr: "د. خالد عمر",
      specialty: "Cardiology",
      specialtyAr: "قلب وأوعية",
      class: "A",
      type: "doctor",
      clinicAddress: "12 Nozha St, Heliopolis",
      phone: "01234567890",
      repId: "rep1",
    },
    {
      id: "d6",
      name: "Mona Wagdy",
      nameAr: "د. منى وجدي",
      specialty: "Cardiology",
      specialtyAr: "قلب وأوعية",
      class: "A",
      type: "doctor",
      clinicAddress: "45 Al-Horreya St, Heliopolis",
      phone: "01144556677",
      repId: "rep2",
    },
    {
      id: "d7",
      name: "Tamer Shawky",
      nameAr: "د. تامر شوقي",
      specialty: "Internal Medicine",
      specialtyAr: "باطنة",
      class: "B",
      type: "doctor",
      clinicAddress: "30 Nozha St, Heliopolis",
      phone: "01088776655",
      repId: "rep2",
    },
    {
      id: "d8",
      name: "Essam Badawy",
      nameAr: "د. عصام بدوي",
      specialty: "Pediatrics",
      specialtyAr: "أطفال",
      class: "A",
      type: "doctor",
      clinicAddress: "14 Abbas Al-Akkad, Nasr City",
      phone: "01211223344",
      repId: "rep3",
    },
    {
      id: "d9",
      name: "Rania Helmy",
      nameAr: "د. رانيا حلمي",
      specialty: "Dermatology",
      specialtyAr: "جلدية",
      class: "B",
      type: "doctor",
      clinicAddress: "19 Merghany St, Heliopolis",
      phone: "01066778899",
      repId: "rep4",
    },
  ],
  hospitals: [
    {
      id: "h1",
      name: "Al-Salam Hospital",
      nameAr: "مستشفى السلام",
      type: "hospital",
      address: "Nasr City",
      repId: "rep1",
    },
    {
      id: "h2",
      name: "Nasser Institute",
      nameAr: "معهد ناصر",
      type: "hospital",
      address: "Nasr City",
      repId: "rep1",
    },
  ],
  pharmacies: [
    {
      id: "p1",
      name: "Al-Ezaby Pharmacy",
      nameAr: "صيدلية العزبي",
      address: "15 Abbas Al-Akkad, Nasr City",
      phone: "01001112233",
      contactPerson: "Mohamed Ibrahim",
      areaId: "area1",
      repId: "rep1",
    },
    {
      id: "p2",
      name: "Seif Pharmacy",
      nameAr: "صيدلية سيف",
      address: "28 Mostafa El-Nahas, Nasr City",
      phone: "01009998877",
      contactPerson: "Youssef Ahmed",
      areaId: "area1",
      repId: "rep1",
    },
    {
      id: "p3",
      name: "Roshdy Pharmacy",
      nameAr: "صيدلية رشدي",
      address: "5 Tayaran St, Nasr City",
      phone: "01155566677",
      contactPerson: "Ramy Adel",
      areaId: "area1",
      repId: "rep1",
    },
    {
      id: "p4",
      name: "19011 Pharmacy",
      nameAr: "صيدلية 19011",
      address: "42 Makram Ebeid, Nasr City",
      phone: "01234567890",
      contactPerson: "Sara Maher",
      areaId: "area1",
      repId: "rep1",
    },
    {
      id: "p5",
      name: "Misr Pharmacy",
      nameAr: "صيدلية مصر",
      address: "18 Al-Ahram St, Heliopolis",
      phone: "01099887766",
      contactPerson: "Hazem Tarek",
      areaId: "area2",
      repId: "rep2",
    },
    {
      id: "p6",
      name: "El-Tarshouby Pharmacy",
      nameAr: "صيدلية الطرشوبي",
      address: "10 Abbas Al-Akkad, Nasr City",
      phone: "01223344556",
      contactPerson: "Mina Magdy",
      areaId: "area1",
      repId: "rep3",
    },
    {
      id: "p7",
      name: "Dawaee Pharmacy",
      nameAr: "صيدلية دوائي",
      address: "25 Beirut St, Heliopolis",
      phone: "01122334455",
      contactPerson: "Hoda Sameh",
      areaId: "area2",
      repId: "rep4",
    },
  ],
  visits: [
    {
      id: "v1",
      repId: "rep1",
      doctorId: "d1",
      doctorName: "Ahmed Mostafa",
      date: "2026-09-02",
      time: "11:30",
      period: "pm",
      visitType: "single",
      products: ["Amoxicillin 500mg"],
      comment: "Discussed new formulation",
      status: "completed",
      source: "plan",
    },
    {
      id: "v2",
      repId: "rep1",
      doctorId: "d2",
      doctorName: "Sara Abdullah",
      date: "2026-09-02",
      time: "14:15",
      period: "pm",
      visitType: "double",
      doubleWithUserId: "dm1",
      doubleWithUserName: "Karim Nasser",
      products: ["Vitamin D Drops 1000IU"],
      comment: "Joint visit with DM",
      status: "completed",
      source: "plan",
    },
    {
      id: "v3",
      repId: "rep1",
      doctorId: "h1",
      doctorName: "Al-Salam Hospital",
      date: "2026-09-02",
      time: "09:45",
      period: "am",
      visitType: "single",
      products: [],
      comment: "Morning rounds",
      status: "completed",
      source: "plan",
    },
    {
      id: "v4",
      repId: "rep1",
      doctorId: "d3",
      doctorName: "Mohamed Hassan",
      date: "2026-09-02",
      time: "16:00",
      period: "pm",
      visitType: "single",
      products: ["Omeprazole 20mg"],
      comment: "Urgent visit",
      status: "completed",
      source: "actual",
    },
    {
      id: "v5",
      repId: "rep1",
      doctorId: "h2",
      doctorName: "Nasser Institute",
      date: "2026-09-03",
      time: "10:00",
      period: "am",
      visitType: "single",
      products: [],
      comment: "",
      status: "planned",
      source: "plan",
    },
    {
      id: "v6",
      repId: "rep1",
      doctorId: "d4",
      doctorName: "Ali Mahmoud",
      date: "2026-09-03",
      time: "13:00",
      period: "pm",
      visitType: "single",
      products: [],
      comment: "",
      status: "planned",
      source: "plan",
    },
    {
      id: "v7",
      repId: "rep2",
      doctorId: "d5",
      doctorName: "Khaled Omar",
      date: "2026-09-02",
      time: "13:00",
      period: "pm",
      visitType: "single",
      products: [],
      comment: "",
      status: "planned",
      source: "plan",
    },
    {
      id: "v8",
      repId: "rep2",
      doctorId: "d6",
      doctorName: "Youssef Fathy",
      date: "2026-09-01",
      time: "14:20",
      period: "pm",
      visitType: "single",
      products: ["Azithromycin 250mg"],
      comment: "Sample dropped",
      status: "completed",
      source: "actual",
    },
    {
      id: "v9",
      repId: "lm1",
      doctorId: "h3",
      doctorName: "Dar Al Fouad",
      date: "2026-09-02",
      time: "10:30",
      period: "am",
      visitType: "single",
      products: ["Amoxicillin 500mg"],
      comment: "Key account hospital follow-up",
      status: "completed",
      source: "actual",
    },
    {
      id: "v10",
      repId: "lm1",
      doctorId: "d7",
      doctorName: "Tamer Shawky",
      date: "2026-09-02",
      time: "15:00",
      period: "pm",
      visitType: "single",
      products: ["Omeprazole 20mg"],
      comment: "Quarterly review",
      status: "planned",
      source: "plan",
    },
    {
      id: "v11",
      repId: "dm1",
      doctorId: "h4",
      doctorName: "Cleopatra Hospital",
      date: "2026-09-02",
      time: "09:30",
      period: "am",
      visitType: "single",
      products: ["Azithromycin 250mg"],
      comment: "",
      status: "completed",
      source: "actual",
    },
    {
      id: "v12",
      repId: "dm2",
      doctorId: "d8",
      doctorName: "Essam Badawy",
      date: "2026-09-02",
      time: "14:00",
      period: "pm",
      visitType: "single",
      products: ["Vitamin D Drops 1000IU"],
      comment: "",
      status: "planned",
      source: "plan",
    },
    {
      id: "v13",
      repId: "rep3",
      doctorId: "d9",
      doctorName: "Rania Helmy",
      date: "2026-09-02",
      time: "16:30",
      period: "pm",
      visitType: "single",
      products: ["Omeprazole 20mg"],
      comment: "Product presentation",
      status: "completed",
      source: "actual",
    },
    {
      id: "v14",
      repId: "rep1",
      doctorId: "d5",
      doctorName: "Khaled Omar",
      date: "2026-09-06",
      time: "11:00",
      period: "pm",
      status: "pending_approval",
      comment: "Monthly regular visit plan",
      source: "plan",
    },
    {
      id: "v15",
      repId: "rep1",
      doctorId: "h2",
      doctorName: "Nasser Institute",
      date: "2026-09-06",
      time: "09:30",
      period: "am",
      status: "pending_approval",
      comment: "Morning clinical rounds",
      source: "plan",
    },
    {
      id: "v16",
      repId: "rep1",
      doctorId: "d2",
      doctorName: "Sara Abdullah",
      date: "2026-09-07",
      time: "13:30",
      period: "pm",
      status: "pending_approval",
      comment: "Follow-up discussion",
      source: "plan",
    },
    {
      id: "v17",
      repId: "rep2",
      doctorId: "d6",
      doctorName: "Mona Wagdy",
      date: "2026-09-06",
      time: "12:15",
      period: "pm",
      status: "pending_approval",
      comment: "Cardio line product update",
      source: "plan",
    },
    {
      id: "v18",
      repId: "rep2",
      doctorId: "d7",
      doctorName: "Tamer Shawky",
      date: "2026-09-07",
      time: "15:00",
      period: "pm",
      status: "pending_approval",
      comment: "Quarterly sampling",
      source: "plan",
    },
    {
      id: "v19",
      repId: "rep3",
      doctorId: "d8",
      doctorName: "Essam Badawy",
      date: "2026-09-08",
      time: "10:30",
      period: "pm",
      status: "pending_approval",
      comment: "Pediatrics field plan",
      source: "plan",
    },
    {
      id: "v20",
      repId: "rep2",
      doctorId: "d6",
      doctorName: "Mona Wagdy",
      date: "2026-09-08",
      time: "11:00",
      period: "pm",
      status: "planned",
      comment: "Cardiology follow-up & product presentation",
      source: "plan",
    },
    {
      id: "v21",
      repId: "rep2",
      doctorId: "d7",
      doctorName: "Tamer Shawky",
      date: "2026-09-08",
      time: "13:30",
      period: "pm",
      status: "planned",
      comment: "Internal medicine sampling & discussion",
      source: "plan",
    },
  ],
  leaves: [
    {
      id: "l1",
      userId: "rep1",
      userName: "Ahmed Mostafa",
      userRole: "medical_rep",
      type: "annual",
      dayDuration: "full",
      days: 5,
      startDate: "2026-08-01",
      endDate: "2026-08-05",
      reason: "Family vacation",
      attachmentName: "flight_tickets.pdf",
      status: "approved",
      approvals: {
        dm: {
          status: "approved",
          approverName: "Karim Nasser",
          updatedAt: "2026-07-28 10:30 AM",
        },
        lm: {
          status: "approved",
          approverName: "Hassan Ali",
          updatedAt: "2026-07-28 02:15 PM",
        },
        hr: {
          status: "approved",
          approverName: "Fatma El-Sherif",
          updatedAt: "2026-07-29 09:00 AM",
        },
      },
    },
    {
      id: "l2",
      userId: "rep1",
      userName: "Ahmed Mostafa",
      userRole: "medical_rep",
      type: "sick",
      dayDuration: "full",
      days: 2,
      startDate: "2026-09-10",
      endDate: "2026-09-11",
      reason: "Medical rest",
      attachmentName: "doctor_prescription.pdf",
      status: "pending",
      approvals: {
        dm: {
          status: "approved",
          approverName: "Karim Nasser",
          updatedAt: "2026-09-02 11:30 AM",
        },
        lm: { status: "pending", approverName: null, updatedAt: null },
        hr: { status: "pending", approverName: null, updatedAt: null },
      },
    },
    {
      id: "l3",
      userId: "dm1",
      userName: "Karim Nasser",
      userRole: "district_manager",
      type: "casual",
      dayDuration: "full",
      days: 1,
      startDate: "2026-09-15",
      endDate: "2026-09-15",
      reason: "Urgent family matter",
      attachmentName: null,
      status: "pending",
      approvals: {
        dm: {
          status: "approved",
          approverName: "Karim Nasser",
          updatedAt: "2026-09-03 09:00 AM",
        },
        lm: { status: "pending", approverName: null, updatedAt: null },
        hr: { status: "pending", approverName: null, updatedAt: null },
      },
    },
  ],
  sales: [
    { id: 's1', month: '2026-09', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Amoxicillin 500mg', target: 20000, actual: 22500, amount: 22500, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's2', month: '2026-09', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Vitamin D Drops 1000IU', target: 12000, actual: 13000, amount: 13000, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's3', month: '2026-09', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Omeprazole 20mg', target: 10000, actual: 9500, amount: 9500, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's4', month: '2026-09', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Azithromycin 250mg', target: 8000, actual: 7000, amount: 7000, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's5', month: '2026-09', repName: 'Omar Youssef', area: 'Heliopolis', product: 'Amoxicillin 500mg', target: 18000, actual: 19000, amount: 19000, repId: 'rep2', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's6', month: '2026-09', repName: 'Omar Youssef', area: 'Heliopolis', product: 'Vitamin D Drops 1000IU', target: 12000, actual: 11000, amount: 11000, repId: 'rep2', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's7', month: '2026-09', repName: 'Omar Youssef', area: 'Heliopolis', product: 'Omeprazole 20mg', target: 9000, actual: 7500, amount: 7500, repId: 'rep2', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's8', month: '2026-09', repName: 'Omar Youssef', area: 'Heliopolis', product: 'Azithromycin 250mg', target: 6000, actual: 3500, amount: 3500, repId: 'rep2', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's9', month: '2026-08', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Amoxicillin 500mg', target: 18000, actual: 21000, amount: 21000, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's10', month: '2026-08', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Vitamin D Drops 1000IU', target: 12000, actual: 14000, amount: 14000, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's11', month: '2026-08', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Omeprazole 20mg', target: 9000, actual: 8500, amount: 8500, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's12', month: '2026-08', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Azithromycin 250mg', target: 6000, actual: 6500, amount: 6500, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's13', month: '2026-08', repName: 'Omar Youssef', area: 'Heliopolis', product: 'Amoxicillin 500mg', target: 17000, actual: 18500, amount: 18500, repId: 'rep2', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's14', month: '2026-08', repName: 'Omar Youssef', area: 'Heliopolis', product: 'Vitamin D Drops 1000IU', target: 11000, actual: 11500, amount: 11500, repId: 'rep2', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' }
  ],
  announcements: [
    {
      id: "ann1",
      title: "Ramadan Working Hours",
      titleAr: "مواعيد العمل في رمضان",
      body: "Please note that working hours during Ramadan will be from 9 AM to 3 PM starting next week.",
      bodyAr:
        "يرجى العلم أن مواعيد العمل خلال شهر رمضان ستكون من 9 صباحاً حتى 3 عصراً بدءاً من الأسبوع القادم.",
      priority: "high",
      createdBy: "hr1",
      createdAt: "2026-09-01",
      read: false,
    },
    {
      id: "ann2",
      title: "Annual Company Event",
      titleAr: "الحفل السنوي للشركة",
      body: "We are excited to announce our annual company event on October 15th at the Four Seasons Hotel. All employees are invited!",
      bodyAr:
        "يسعدنا الإعلان عن الحفل السنوي للشركة يوم 15 أكتوبر في فندق فور سيزونز. جميع الموظفين مدعوون!",
      priority: "normal",
      createdBy: "hr1",
      createdAt: "2026-08-28",
      read: true,
    },
    {
      id: "ann3",
      title: "New Health Insurance Policy",
      titleAr: "بوليصة التأمين الصحي الجديدة",
      body: "A new health insurance policy has been activated. Please review the updated benefits in your HR portal.",
      bodyAr:
        "تم تفعيل بوليصة تأمين صحي جديدة. يرجى مراجعة المزايا المحدثة في بوابة الموارد البشرية.",
      priority: "high",
      createdBy: "hr1",
      createdAt: "2026-08-25",
      read: false,
    },
  ],
  publicHolidays: [{ date: "2026-10-06", title: "Armed Forces Day" }],
};

// ============================================================================
// Section 2: Local Persistence Handling
// ============================================================================
function loadDataFromStorage() {
  try {
    const cached = localStorage.getItem("pharma_master_data");
    if (cached) {
      const data = JSON.parse(cached);
      if (data) {
        if (Array.isArray(data.users)) {
          DEFAULT_DEMO_DATA.users.forEach((u) => {
            if (!data.users.some((existing) => existing.id === u.id)) {
              data.users.push(u);
            }
          });
        }
        if (Array.isArray(data.doctors)) {
          DEFAULT_DEMO_DATA.doctors.forEach((d) => {
            if (!data.doctors.some((existing) => existing.id === d.id)) {
              data.doctors.push(d);
            }
          });
        } else {
          data.doctors = [...DEFAULT_DEMO_DATA.doctors];
        }
        if (Array.isArray(data.pharmacies) && data.pharmacies.length > 0) {
          DEFAULT_DEMO_DATA.pharmacies.forEach((p) => {
            if (!data.pharmacies.some((existing) => existing.id === p.id)) {
              data.pharmacies.push(p);
            }
          });
        } else {
          data.pharmacies = [...DEFAULT_DEMO_DATA.pharmacies];
        }
        if (Array.isArray(data.leaves)) {
          DEFAULT_DEMO_DATA.leaves.forEach((l) => {
            const existingIdx = data.leaves.findIndex(
              (existing) => existing.id === l.id,
            );
            if (existingIdx === -1) {
              data.leaves.push(l);
            } else if (!data.leaves[existingIdx].approvals) {
              data.leaves[existingIdx] = {
                ...l,
                ...data.leaves[existingIdx],
                approvals: l.approvals,
              };
            }
          });
          data.leaves.forEach((lv) => {
            if (lv.approvals) {
              ["dm", "lm", "hr"].forEach((tier) => {
                if (lv.approvals[tier] && lv.approvals[tier].approverName) {
                  lv.approvals[tier].approverName = lv.approvals[
                    tier
                  ].approverName
                    .replace(/\s*\((?:DM|LM|HR|Self)\)/gi, "")
                    .trim();
                  if (
                    lv.approvals[tier].approverName.toLowerCase() === "self"
                  ) {
                    lv.approvals[tier].approverName = "Karim Nasser";
                  }
                }
              });
            }
          });
        } else {
          data.leaves = JSON.parse(JSON.stringify(DEFAULT_DEMO_DATA.leaves));
        }
        if (
          !Array.isArray(data.publicHolidays) ||
          data.publicHolidays.length === 0
        ) {
          data.publicHolidays = JSON.parse(
            JSON.stringify(DEFAULT_DEMO_DATA.publicHolidays),
          );
        }
        if (Array.isArray(data.visits)) {
          data.visits.forEach((item) => {
            if (item.comment && /supervisory/i.test(item.comment)) {
              item.comment = "";
            }
          });
          DEFAULT_DEMO_DATA.visits.forEach((v) => {
            const existingIdx = data.visits.findIndex((existing) => existing.id === v.id);
            if (existingIdx === -1) {
              data.visits.push(v);
            } else if (v.id === "v2" || v.id === "v11" || v.id === "v12" || v.id === "v20" || v.id === "v21") {
              data.visits[existingIdx] = { ...v };
            }
          });
        } else {
          data.visits = JSON.parse(JSON.stringify(DEFAULT_DEMO_DATA.visits));
        }
        // Ensure synchronized sales seed
        if (!Array.isArray(data.sales) || data.sales.length === 0) {
          data.sales = JSON.parse(JSON.stringify(DEFAULT_DEMO_DATA.sales));
        }
      }
      return data;
    }
  } catch (err) {
    console.error("Error loading pharma_master_data from localStorage:", err);
  }
  return JSON.parse(JSON.stringify(DEFAULT_DEMO_DATA));
}

function saveDataToStorage() {
  try {
    localStorage.setItem("pharma_master_data", JSON.stringify(DEMO_DATA));
  } catch (err) {
    console.error("Error saving pharma_master_data to localStorage:", err);
  }
}

const DEMO_DATA = loadDataFromStorage();
window.DEMO_DATA = DEMO_DATA;
window.saveDataToStorage = saveDataToStorage;

// ============================================================================
// Section 3: Recursive Hierarchy & Multi-Line Helpers
// ============================================================================
function getAllSubordinates(managerId) {
  const users = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const manager = users.find((u) => u.id === managerId);
  if (!manager) return [];

  if (manager.role === "admin") {
    return users.filter((u) => u.role !== "admin");
  }

  const direct = users.filter((u) => u.managerId === managerId);
  let all = [...direct];
  direct.forEach((d) => {
    all = all.concat(getAllSubordinates(d.id));
  });
  return all;
}

window.getAllSubordinates = getAllSubordinates;

function getUserLines(userId) {
  const users = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const lines = (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];
  const user = users.find((u) => u.id === userId);
  if (!user) return [];

  const assignedLineIds = user.lineIds || (user.lineId ? [user.lineId] : []);
  lines.forEach((l) => {
    if (l.lineManagerId === userId && !assignedLineIds.includes(l.id)) {
      assignedLineIds.push(l.id);
    }
  });

  return lines.filter((l) => assignedLineIds.includes(l.id));
}

window.getUserLines = getUserLines;

function getManagerChain(userId) {
  const users = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  let chain = [];
  let user = users.find((u) => u.id === userId);

  while (user && user.managerId) {
    user = users.find((u) => u.id === user.managerId);
    if (user) chain.push(user);
  }
  return chain;
}

window.getManagerChain = getManagerChain;

function canApproveFor(targetUserId) {
  const currentUser = checkAuth();
  if (!currentUser) return false;
  if (currentUser.role === "admin" || currentUser.role === "hr") return true;

  const chain = getManagerChain(targetUserId);
  return chain.some((m) => m.id === currentUser.id);
}

window.canApproveFor = canApproveFor;

function formatVisitDateTime(dateStr, timeStr, lang) {
  const currentLang =
    lang || (window.getCurrentLang && window.getCurrentLang()) || "ar";
  const isAr = currentLang === "ar";
  const arDays = [
    "الأحد",
    "الاثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
  ];
  const enDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  let dayName = "";
  let validDate = dateStr || "";

  if (dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    const dayIndex = isNaN(d.getDay()) ? 0 : d.getDay();
    dayName = isAr ? arDays[dayIndex] : enDays[dayIndex];
  }

  const safeTime = timeStr || "10:00";

  return {
    dayName: dayName,
    date: validDate,
    time: safeTime,
    displayWithDay: dayName
      ? `${dayName} - ${validDate} (⏰ ${safeTime})`
      : `${validDate} (⏰ ${safeTime})`,
    dayAndTime: dayName ? `${dayName} • ⏰ ${safeTime}` : `⏰ ${safeTime}`,
  };
}

window.formatVisitDateTime = formatVisitDateTime;

// ============================================================================
// Section 3.5: Centralized Role & Permission Engine (Single Source of Truth)
// ============================================================================
function normalizeRole(role) {
  if (!role) return "";
  const r = String(role).toLowerCase().trim();
  if (r === "dm" || r === "district_manager") return "district_manager";
  if (r === "lm" || r === "line_manager") return "line_manager";
  if (r === "bu" || r === "business_unit") return "business_unit";
  if (r === "rep" || r === "medical_rep") return "medical_rep";
  if (r === "admin" || r === "administrator") return "admin";
  if (r === "hr") return "hr";
  return r;
}

function resolveUserForAuth(user) {
  if (user && user.role) return user;
  if (typeof checkAuth === "function") {
    const auth = checkAuth();
    if (auth && auth.role) return auth;
  }
  const rawRole = localStorage.getItem("userRole");
  if (rawRole)
    return { role: rawRole, id: localStorage.getItem("userId") || "rep1" };
  return { role: "medical_rep", id: "rep1" };
}

function isAdmin(user) {
  const u = resolveUserForAuth(user);
  return normalizeRole(u?.role) === "admin";
}

function isManagerRole(user) {
  const u = resolveUserForAuth(user);
  const r = normalizeRole(u?.role);
  return [
    "admin",
    "business_unit",
    "line_manager",
    "district_manager",
  ].includes(r);
}

function isRepRole(user) {
  const u = resolveUserForAuth(user);
  return normalizeRole(u?.role) === "medical_rep";
}

function hasAnyRole(allowedRoles = [], user) {
  const u = resolveUserForAuth(user);
  const current = normalizeRole(u?.role);
  return allowedRoles.map(normalizeRole).includes(current);
}

window.normalizeRole = normalizeRole;
window.isAdmin = isAdmin;
window.isManagerRole = isManagerRole;
window.isRepRole = isRepRole;
window.hasAnyRole = hasAnyRole;

// ============================================================================
// Section 4: Localization Dictionary
// ============================================================================
const translations = {
  en: {
    brandName: "PharmaCare",
    brandSub: "Excellence in Healthcare",
    navMain: "Main Menu",
    navHome: "Home",
    navVisits: "Visits",
    navCalendar: "Calendar",
    navRequests: "Requests",
    navVacations: "Vacations",
    navNotifications: "Notifications",
    navSettings: "Settings",
    navReports: "Reports",
    navDoctors: "Doctors",
    navPharmacies: "Pharmacies",
    navPlan: "My Plan",
    navCoverage: "Coverage",
    navActivities: "Activities",
    navLeaves: "Leaves",
    navSales: "Sales",
    navQuizzes: "Quizzes",
    navProducts: "Products",
    navAreas: "Areas",
    navDistributors: "Distributors",
    navUsers: "Users",
    navProfile: "Profile",
    navHelp: "Help",
    roleAdmin: "System Admin",
    roleBusinessUnit: "BU Head",
    roleLineManager: "Line Manager",
    roleDistrictManager: "District Manager",
    roleMedicalRep: "Medical Representative",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    search: "Search...",
    filter: "Filter",
    submit: "Submit",
    approve: "Approve",
    reject: "Reject",
    pending: "Pending",
    completed: "Completed",
    cancelled: "Cancelled",
    viewAll: "View All",
    loading: "Loading...",
    noData: "No data available",
    welcome: "Welcome",
    logout: "Logout",
    roleHR: "HR Manager",
    navAnnouncements: "Announcements",
    logActualVisit: "Log Actual Visit",
    plannedVisit: "Planned Visit",
    actualVisit: "Actual Visit (Direct)",
    officeWork: "Office Work",
    training: "Training",
    meeting: "Meeting",
    conference: "Conference",
    periodAM: "AM",
    periodPM: "PM",
    periodFullDay: "Full Day",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    btnShow: "Show",
    userCodeLabel: "Code:",
    selectRep: "Viewing Schedule For:",
    browseOrgTree: "Browse Org Hierarchy",
    viewAllTeam: "View All Team",
    selectAllTeam: "Select Entire Team",
    orgTreeTitle: "🏢 Select Team Member / Branch",
    orgTreeSubtitle: "Pick any Level (BU, LM, DM, or Rep) or search directly",
    navPlansReview: "Plans Review",
    close: "Close",
    leaveAllocationTitle: "Leave Balance Allocation (Days)",
    leaveAllocationSub: "Set initial annual, casual, and sick days",
    hrGovernanceTitle: "🏛️ HR Governance: Leave Balances & Public Holidays",
    employeeBalanceControl: "Employee Leave Balance Allocation",
    employeeBalanceControlSub:
      "Customize annual, casual, and sick days per employee",
    selectEmployee: "Select Employee",
    chooseEmployee: "Choose an employee...",
    annualDaysLabel: "Annual (Days)",
    casualDaysLabel: "Casual (Days)",
    sickDaysLabel: "Sick (Days)",
    saveEmployeeBalance: "Save Employee Balance",
    declarePublicHoliday: "Declare Official Public Holiday",
    declarePublicHolidaySub: "Company-wide calendar, zero balance deduction",
    holidayDateLabel: "Holiday Date",
    holidayTitleLabel: "Holiday Title",
    addHolidayBtn: "Add Official Public Holiday",
    currentHolidays: "Currently Declared Public Holidays:",
    totalDays: "Total",
  },
  ar: {
    brandName: "فارماكير",
    brandSub: "التميز في الرعاية الصحية",
    navMain: "القائمة الرئيسية",
    navHome: "الرئيسية",
    navVisits: "الزيارات",
    navCalendar: "التقويم",
    navRequests: "الطلبات والأنشطة",
    navVacations: "الإجازات",
    navNotifications: "الإشعارات",
    navSettings: "الإعدادات",
    navReports: "التقارير",
    navDoctors: "الأطباء",
    navPharmacies: "الصيدليات",
    navPlan: "خطتي الأسبوعية",
    navCoverage: "التغطية",
    navActivities: "الأنشطة",
    navLeaves: "الإجازات",
    navSales: "المبيعات",
    navQuizzes: "الاختبارات",
    navProducts: "المنتجات",
    navAreas: "المناطق",
    navDistributors: "الموزعين",
    navUsers: "المستخدمين",
    navProfile: "الملف الشخصي",
    navHelp: "مساعدة",
    roleAdmin: "مدير النظام",
    roleBusinessUnit: "مدير وحدة الأعمال",
    roleLineManager: "مدير الخط",
    roleDistrictManager: "مدير المنطقة",
    roleMedicalRep: "مندوب طبي",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    add: "إضافة",
    search: "بحث...",
    filter: "تصفية",
    submit: "إرسال",
    approve: "موافقة",
    reject: "رفض",
    pending: "قيد الانتظار",
    completed: "مكتمل",
    cancelled: "ملغى",
    viewAll: "عرض الكل",
    loading: "جاري التحميل...",
    noData: "لا توجد بيانات",
    welcome: "مرحباً",
    logout: "تسجيل الخروج",
    roleHR: "مدير الموارد البشرية",
    navAnnouncements: "الإعلانات",
    logActualVisit: "تسجيل زيارة فعلية",
    plannedVisit: "زيارة من الخطة",
    actualVisit: "زيارة فعلية مباشرة",
    officeWork: "عمل مكتبي",
    training: "تدريب",
    meeting: "اجتماع",
    conference: "مؤتمر",
    periodAM: "صباحاً (AM)",
    periodPM: "مساءً (PM)",
    periodFullDay: "يوم كامل",
    darkMode: "الوضع الليلي",
    lightMode: "الوضع النهاري",
    btnShow: "عرض النتائج",
    userCodeLabel: "كود:",
    selectRep: "عرض جدول المواعيد لـ:",
    browseOrgTree: "تصفح الهيكل الوظيفي",
    viewAllTeam: "عرض كل الفريق",
    selectAllTeam: "اختيار كامل الفريق",
    orgTreeTitle: "🏢 اختر الموظف أو الفرع الإداري",
    orgTreeSubtitle: "اختر أي مستوى (BU أو LM أو DM أو مندوب) أو ابحث مباشرة",
    navPlansReview: "مراجعة الخطط",
    close: "إغلاق",
    leaveAllocationTitle: "تخصيص أرصدة الإجازات السنوية (بالأيام)",
    leaveAllocationSub: "تحديد رصيد الإجازة الاعتيادية والعارضة والمرضية",
    hrGovernanceTitle:
      "🏛️ إدارة الموارد البشرية: أرصدة الإجازات والإجازات الرسمية",
    employeeBalanceControl: "تخصيص وضبط أرصدة إجازات الموظفين",
    employeeBalanceControlSub:
      "تحديد عدد أيام الإجازات السنوية والعارضة والمرضية لكل موظف",
    selectEmployee: "اختر الموظف",
    chooseEmployee: "اختر موظفاً...",
    annualDaysLabel: "الاعتيادية (أيام)",
    casualDaysLabel: "العارضة (أيام)",
    sickDaysLabel: "المرضية (أيام)",
    saveEmployeeBalance: "حفظ رصيد الموظف",
    declarePublicHoliday: "تسجيل إجازة رسمية عامة",
    declarePublicHolidaySub: "تظهر في نتيجة الشركة بدون خصم من رصيد الموظف",
    holidayDateLabel: "تاريخ الإجازة",
    holidayTitleLabel: "اسم / مناسبة الإجازة",
    addHolidayBtn: "إضافة إجازة رسمية",
    currentHolidays: "الإجازات الرسمية المسجلة حالياً:",
    totalDays: "الإجمالي",
  },
};

window.translations = translations;

function getCurrentLang() {
  return localStorage.getItem("pharmaLang") || "en";
}

function applyTranslations(lang) {
  const current = lang || getCurrentLang();
  const dict = translations[current];
  if (!dict) return;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key]) el.placeholder = dict[key];
  });
}

function switchLanguage(lang) {
  localStorage.setItem("pharmaLang", lang);
  localStorage.setItem("lang", lang);
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = lang;

  applyTranslations(lang);
  document.dispatchEvent(
    new CustomEvent("languageChanged", { detail: { lang } }),
  );

  renderSidebar(window.currentActivePage || resolveActivePage());
  renderTopbar();
}

// ============================================================================
// Section 5: Mobile Sidebar Drawer Controls
// ============================================================================
window.toggleMobileSidebar = function () {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;

  let backdrop = document.getElementById("sidebarBackdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "sidebarBackdrop";
    backdrop.className = "sidebar-backdrop";
    backdrop.onclick = window.closeMobileSidebar;
    document.body.appendChild(backdrop);
  }

  sidebar.classList.toggle("open");
  if (sidebar.classList.contains("open")) {
    backdrop.classList.add("active");
    document.body.style.overflow = "hidden";
  } else {
    backdrop.classList.remove("active");
    document.body.style.overflow = "";
  }
};

window.closeMobileSidebar = function () {
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("sidebarBackdrop");
  if (sidebar) sidebar.classList.remove("open");
  if (backdrop) backdrop.classList.remove("active");
  document.body.style.overflow = "";
};

// ============================================================================
// Section 6: Active Route Auto-Detector
// ============================================================================
function resolveActivePage() {
  const path =
    window.location.pathname.split("/").pop().split("?")[0] || "index.html";
  const pageMap = {
    "index.html": "home",
    "": "home",
    "visits.html": "visits",
    "calendar.html": "calendar",
    "activities.html": "activities",
    "leaves.html": "leaves",
    "announcements.html": "announcements",
    "reports.html": "reports",
    "profile.html": "profile",
    "users.html": "users",
    "doctors.html": "doctors",
    "pharmacies.html": "pharmacies",
    "products.html": "products",
    "quizzes.html": "quizzes",
    "areas.html": "areas",
    "distributors.html": "distributors",
    "plans-review.html": "plans-review",
  };
  return pageMap[path] || "home";
}

// ============================================================================
// Section 7: Navigation Generators (Topbar & Mobile Sidebar)
// ============================================================================
function getIconSymbol(id) {
  const map = {
    home: "🏠",
    visits: "📍",
    calendar: "📅",
    activities: "🔄",
    leaves: "🏖️",
    announcements: "🔔",
    profile: "⚙️",
    reports: "📊",
    users: "👥",
    doctors: "👨‍⚕️",
    pharmacies: "💊",
    areas: "🗺️",
    distributors: "🚚",
    products: "📦",
    sales: "📈",
    plan: "🗓️",
    coverage: "🎯",
    quizzes: "📋",
    "plans-review": "📋",
  };
  return map[id] || "📌";
}

function getRoleBadge(role, lang) {
  const roleNames = {
    en: {
      admin: "Admin",
      business_unit: "BU Head",
      line_manager: "Line Manager",
      district_manager: "District Manager",
      medical_rep: "Medical Rep",
      hr: "HR Manager",
    },
    ar: {
      admin: "مدير النظام",
      business_unit: "مدير وحدة الأعمال",
      line_manager: "مدير الخط",
      district_manager: "مدير المنطقة",
      medical_rep: "مندوب طبي",
      hr: "مدير الموارد البشرية",
    },
  };
  return (roleNames[lang] && roleNames[lang][role]) || role;
}

function getNavItemsForRole(role) {
  let primaryNavItems = [
    { id: "home", i18n: "navHome", link: "index.html" },
    { id: "visits", i18n: "navVisits", link: "visits.html" },
    { id: "calendar", i18n: "navCalendar", link: "calendar.html" },
    { id: "activities", i18n: "navRequests", link: "activities.html" },
    { id: "leaves", i18n: "navVacations", link: "leaves.html" },
    {
      id: "announcements",
      i18n: "navNotifications",
      link: "announcements.html",
    },
    { id: "reports", i18n: "navReports", link: "reports.html" },
    { id: "profile", i18n: "navSettings", link: "profile.html" },
  ];

  const managementNavItems = [];

  if (role === "hr") {
    primaryNavItems = primaryNavItems.filter((item) => item.id !== "reports");
    primaryNavItems.splice(1, 0, {
      id: "users",
      i18n: "navUsers",
      link: "users.html",
    });
    managementNavItems.push({
      id: "areas",
      i18n: "navAreas",
      link: "areas.html",
    });
  } else if (role === "admin") {
    managementNavItems.push(
      { id: "users", i18n: "navUsers", link: "users.html" },
      {
        id: "distributors",
        i18n: "navDistributors",
        link: "distributors.html",
      },
      { id: "areas", i18n: "navAreas", link: "areas.html" },
      { id: "products", i18n: "navProducts", link: "products.html" },
      { id: "quizzes", i18n: "navQuizzes", link: "quizzes.html" },
    );
  } else {
    if (role === "district_manager") {
      managementNavItems.push({
        id: "plans-review",
        i18n: "navPlansReview",
        link: "plans-review.html",
      });
    }
    managementNavItems.push({
      id: "quizzes",
      i18n: "navQuizzes",
      link: "quizzes.html",
    });
  }

  return { primaryNavItems, managementNavItems };
}

function renderSidebar(activePage) {
  const resolved = activePage || resolveActivePage();
  window.currentActivePage = resolved;
  const user = checkAuth();
  if (!user) return;

  const lang = getCurrentLang();
  const { primaryNavItems, managementNavItems } = getNavItemsForRole(user.role);

  let html = `
    <div class="sidebar-header" style="display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid var(--gray-100);">
      <div style="display: flex; align-items: center; gap: 10px;">
        <div class="company-logo-badge" style="width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, #0d6efd, #0a58ca); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1.1rem;">
          ⚕
        </div>
        <div>
          <h2 style="font-size: 1.1rem; font-weight: 800; color: var(--gray-800); margin: 0; line-height: 1.1;">PharmaCare</h2>
          <span style="font-size: 0.7rem; color: var(--gray-500);">CRM Healthcare</span>
        </div>
      </div>
      <button class="sidebar-close-btn" onclick="closeMobileSidebar()" style="background: none; border: none; font-size: 1.6rem; color: var(--gray-500); cursor: pointer; padding: 2px 6px;">
        &times;
      </button>
    </div>
    
    <div class="sidebar-nav">
      <div style="padding: 10px 24px 4px; font-size: 0.75rem; text-transform: uppercase; color: var(--gray-400); font-weight: 700; letter-spacing: 0.5px;">
        ${lang === "ar" ? "القائمة الرئيسية" : "Main Menu"}
      </div>
      <ul style="list-style: none; padding: 0; margin: 0;">
  `;

  primaryNavItems.forEach((item) => {
    const activeClass = item.id === resolved ? "active" : "";
    html += `
      <li class="nav-item">
        <a href="${item.link}" onclick="closeMobileSidebar()" class="nav-link ${activeClass}" style="display: flex; align-items: center; gap: 12px; padding: 10px 24px; color: ${item.id === resolved ? "var(--primary)" : "var(--gray-600)"}; font-weight: ${item.id === resolved ? "600" : "500"}; background: ${item.id === resolved ? "var(--primary-light)" : "transparent"}; border-radius: 8px; margin: 2px 12px; text-decoration: none;">
          <span style="font-size: 1.1rem; width: 22px; text-align: center;">${getIconSymbol(item.id)}</span>
          <span data-i18n="${item.i18n}">${translations[lang][item.i18n] || item.id}</span>
        </a>
      </li>
    `;
  });

  if (managementNavItems.length > 0) {
    html += `
      <div style="padding: 16px 24px 4px; font-size: 0.75rem; text-transform: uppercase; color: var(--gray-400); font-weight: 700; letter-spacing: 0.5px;">
        ${lang === "ar" ? "الإدارة والبيانات" : "Management & Data"}
      </div>
    `;
    managementNavItems.forEach((item) => {
      const activeClass = item.id === resolved ? "active" : "";
      html += `
        <li class="nav-item">
          <a href="${item.link}" onclick="closeMobileSidebar()" class="nav-link ${activeClass}" style="display: flex; align-items: center; gap: 12px; padding: 10px 24px; color: ${item.id === activePage ? "var(--primary)" : "var(--gray-600)"}; font-weight: ${item.id === activePage ? "600" : "500"}; background: ${item.id === activePage ? "var(--primary-light)" : "transparent"}; border-radius: 8px; margin: 2px 12px; text-decoration: none;">
            <span style="font-size: 1.1rem; width: 22px; text-align: center;">${getIconSymbol(item.id)}</span>
            <span data-i18n="${item.i18n}">${translations[lang][item.i18n] || item.id}</span>
          </a>
        </li>
      `;
    });
  }

  html += `</ul></div>
    <div class="sidebar-footer" style="padding: 16px 20px; border-top: 1px solid var(--gray-100); background: var(--gray-50); margin-top: auto;">
      <div class="user-info" style="display: flex; align-items: center; gap: 10px;">
        <div class="avatar" style="width: 36px; height: 36px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">
          ${user.name ? user.name.charAt(0) : "U"}
        </div>
        <div class="details" style="flex: 1; min-width: 0;">
          <div class="name" style="font-weight: 600; font-size: 0.88rem; color: var(--gray-800); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${lang === "ar" ? user.nameAr || user.name : user.name}
          </div>
          <div class="role" style="font-size: 0.75rem; color: var(--gray-500);">
            ${getRoleBadge(user.role, lang)}
          </div>
        </div>
      </div>
    </div>
  `;

  const sidebarEl = document.getElementById("sidebar");
  if (sidebarEl) sidebarEl.innerHTML = html;
}

function renderTopbar() {
  const topbarEl = document.getElementById("topbar");
  if (!topbarEl) return;

  let user = checkAuth();
  if (!user) {
    user = DEMO_DATA.currentUser;
    sessionStorage.setItem("pharmaUser", JSON.stringify(user));
  }
  const lang = getCurrentLang();
  const activePage = window.currentActivePage || resolveActivePage();

  const userName = lang === "ar" ? user.nameAr || user.name : user.name;
  const userCode = user.employeeCode || user.code || "EMP-001";
  const roleBadge = getRoleBadge(user.role, lang);
  const codeLabel =
    translations[lang]?.userCodeLabel || (lang === "ar" ? "كود:" : "Code:");
  const avatarChar = user.name ? user.name.charAt(0) : "U";

  const { primaryNavItems, managementNavItems } = getNavItemsForRole(user.role);
  const allTopNavItems = primaryNavItems.concat(managementNavItems);

  const topRow = topbarEl.querySelector(".pharma-topbar-top-row");
  const navStrip = topbarEl.querySelector(".pharma-navbar-strip");

  if (topRow && navStrip) {
    topbarEl.querySelectorAll(".user-display-name").forEach((el) => {
      if (el.textContent !== userName) el.textContent = userName;
    });
    topbarEl.querySelectorAll(".user-display-code").forEach((el) => {
      const codeHtml = `${codeLabel} <strong>${userCode}</strong>`;
      if (el.innerHTML !== codeHtml) el.innerHTML = codeHtml;
    });
    topbarEl.querySelectorAll(".user-role-tag").forEach((el) => {
      if (el.textContent !== roleBadge) el.textContent = roleBadge;
    });
    topbarEl.querySelectorAll(".user-avatar-mini").forEach((el) => {
      if (el.textContent !== avatarChar) el.textContent = avatarChar;
    });

    const langLabelEl = topbarEl.querySelector("#langLabel");
    if (langLabelEl) {
      const targetLangText = lang === "ar" ? "English" : "عربي";
      if (langLabelEl.textContent !== targetLangText) langLabelEl.textContent = targetLangText;
    }

    const theme = document.documentElement.getAttribute("data-theme") || "light";
    const themeIconEl = topbarEl.querySelector("#themeIcon");
    const themeTextEl = topbarEl.querySelector("#themeText");
    if (themeIconEl) themeIconEl.textContent = theme === "dark" ? "☀️" : "🌙";
    if (themeTextEl) {
      themeTextEl.textContent = theme === "dark" 
        ? (translations[lang]?.lightMode || "Light") 
        : (translations[lang]?.darkMode || "Dark");
    }

    const currentNavLinks = navStrip.querySelectorAll(".pharma-nav-item");
    const needsFullNavRebuild = currentNavLinks.length !== allTopNavItems.length;

    if (!needsFullNavRebuild) {
      currentNavLinks.forEach((linkEl, idx) => {
        const item = allTopNavItems[idx];
        if (item) {
          const isAct = item.id === activePage;
          if (isAct && !linkEl.classList.contains("active")) linkEl.classList.add("active");
          if (!isAct && linkEl.classList.contains("active")) linkEl.classList.remove("active");
          const textEl = linkEl.querySelector(".nav-item-text");
          if (textEl) {
            const expectedText = translations[lang]?.[item.i18n] || item.id;
            if (textEl.textContent !== expectedText) textEl.textContent = expectedText;
          }
        }
      });
    } else {
      let topNavLinksHtml = "";
      allTopNavItems.forEach((item) => {
        const isAct = item.id === activePage;
        topNavLinksHtml += `
          <a href="${item.link}" class="pharma-nav-item ${isAct ? "active" : ""}">
            <span class="nav-item-icon">${getIconSymbol(item.id)}</span>
            <span class="nav-item-text">${translations[lang]?.[item.i18n] || item.id}</span>
          </a>
        `;
      });
      navStrip.innerHTML = topNavLinksHtml;
    }
    return;
  }

  let topNavLinksHtml = '<div class="pharma-navbar-strip">';
  allTopNavItems.forEach((item) => {
    const isAct = item.id === activePage;
    topNavLinksHtml += `
      <a href="${item.link}" class="pharma-nav-item ${isAct ? "active" : ""}">
        <span class="nav-item-icon">${getIconSymbol(item.id)}</span>
        <span class="nav-item-text">${translations[lang]?.[item.i18n] || item.id}</span>
      </a>
    `;
  });
  topNavLinksHtml += "</div>";

  let html = `
    <div class="pharma-topbar-top-row">
      <div class="pharma-brand-group">
        <button class="pharma-mobile-btn" onclick="toggleMobileSidebar()" title="Toggle Menu">
          &#9776;
        </button>
        <a href="index.html" class="pharma-brand-link">
          <div class="pharma-brand-icon">&#9764;</div>
          <span class="pharma-brand-title">PharmaCare</span>
        </a>
      </div>

      <div class="pharma-user-status-pill pharma-user-desktop-pill">
        <div class="user-avatar-mini">${avatarChar}</div>
        <div class="user-info-text">
          <span class="user-display-name">${userName}</span>
          <span class="user-display-code">${codeLabel} <strong>${userCode}</strong></span>
        </div>
        <span class="user-role-tag">${roleBadge}</span>
      </div>

      <div class="pharma-actions-group">
        <button class="pharma-action-btn" onclick="switchLanguage('${lang === "ar" ? "en" : "ar"}')" title="Language">
          &#127760; <span id="langLabel">${lang === "ar" ? "English" : "عربي"}</span>
        </button>
        
        <button class="pharma-action-btn" id="themeToggleBtn" onclick="toggleTheme()" title="Theme">
          <span id="themeIcon">${document.documentElement.getAttribute("data-theme") === "dark" ? "☀️" : "🌙"}</span>
          <span id="themeText">${document.documentElement.getAttribute("data-theme") === "dark" ? translations[lang]?.lightMode || "Light" : translations[lang]?.darkMode || "Dark"}</span>
        </button>

        <button class="pharma-action-btn pharma-logout-btn" onclick="logout()" title="${translations[lang]?.logout || "Logout"}">
          <span class="logout-icon">&#10140;</span>
          <span class="logout-text">${translations[lang]?.logout || "Logout"}</span>
        </button>
      </div>
    </div>

    <div class="pharma-user-mobile-row">
      <div class="pharma-user-status-pill">
        <div class="user-avatar-mini">${avatarChar}</div>
        <div class="user-info-text">
          <span class="user-display-name">${userName}</span>
          <span class="user-display-code">${codeLabel} <strong>${userCode}</strong></span>
        </div>
        <span class="user-role-tag">${roleBadge}</span>
      </div>
    </div>

    <div class="pharma-nav-center">
      ${topNavLinksHtml}
    </div>
  `;

  topbarEl.innerHTML = html;
}

// ============================================================================
// Section 8: Theme Management
// ============================================================================
window.updateThemeUI = function (theme) {
  const t =
    theme || document.documentElement.getAttribute("data-theme") || "light";
  const lang = getCurrentLang();
  const isDark = t === "dark";
  const lightText = translations[lang]?.lightMode || "Light";
  const darkText = translations[lang]?.darkMode || "Dark";

  document.querySelectorAll("#themeIcon").forEach((el) => {
    el.textContent = isDark ? "☀️" : "🌙";
  });
  document.querySelectorAll("#themeText").forEach((el) => {
    el.textContent = isDark ? lightText : darkText;
  });
};

window.toggleTheme = function () {
  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);
  if (document.body) document.body.setAttribute("data-theme", newTheme);
  try {
    localStorage.setItem("pharmaTheme", newTheme);
  } catch (e) {}
  window.updateThemeUI(newTheme);
  document.dispatchEvent(new CustomEvent("themeChanged", { detail: newTheme }));
};

window.initTheme = function () {
  const savedTheme = localStorage.getItem("pharmaTheme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  if (document.body) document.body.setAttribute("data-theme", savedTheme);
  window.updateThemeUI(savedTheme);
};

// ============================================================================
// Section 9: Authentication & Session
// ============================================================================
function checkAuth() {
  const userStr =
    sessionStorage.getItem("pharmaUser") || localStorage.getItem("pharmaUser");
  if (userStr) {
    try {
      const parsed = JSON.parse(userStr);
      if (
        parsed &&
        parsed.id &&
        typeof DEMO_DATA !== "undefined" &&
        Array.isArray(DEMO_DATA.users)
      ) {
        const freshUser = DEMO_DATA.users.find((u) => u.id === parsed.id);
        if (freshUser) {
          const merged = { ...parsed, ...freshUser };
          sessionStorage.setItem("pharmaUser", JSON.stringify(merged));
          return merged;
        }
      }
      return parsed;
    } catch (e) {}
  }
  const role = localStorage.getItem("userRole");
  if (role) {
    const user = DEMO_DATA.users.find((u) => u.role === role) || {
      ...DEMO_DATA.currentUser,
      role: role,
    };
    sessionStorage.setItem("pharmaUser", JSON.stringify(user));
    return user;
  }
  if (sessionStorage.getItem("pharma_logged_out") === "true") {
    return null;
  }
  sessionStorage.setItem("pharmaUser", JSON.stringify(DEMO_DATA.currentUser));
  return DEMO_DATA.currentUser;
}

function requireAuth() {
  const user = checkAuth();
  if (!user && !window.location.href.includes("login.html")) {
    window.location.replace("login.html");
  }
  return user;
}

window.checkAuth = checkAuth;
window.requireAuth = requireAuth;

function logout() {
  sessionStorage.clear();
  localStorage.removeItem("pharmaUser");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userId");
  sessionStorage.setItem("pharma_logged_out", "true");
  window.location.replace("login.html");
}

function switchDemoUser(role) {
  const roleMap = {
    admin: "admin",
    bu: "business_unit",
    lm: "line_manager",
    dm: "district_manager",
    rep: "medical_rep",
    hr: "hr",
  };
  const targetRole = roleMap[role] || role;
  const user = DEMO_DATA.users.find((u) => u.role === targetRole);
  if (user) {
    sessionStorage.removeItem("pharma_logged_out");
    sessionStorage.setItem("pharmaUser", JSON.stringify(user));
    localStorage.setItem("userRole", targetRole);
    localStorage.setItem("userId", user.id);
    window.location.reload();
  }
}

function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
window.showToast = showToast;

function initPage(pageName) {
  requireAuth();
  const lang = getCurrentLang();
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = lang;
  renderSidebar(pageName);
  renderTopbar();
  applyTranslations(lang);
}

if (document.getElementById("topbar")) {
  renderTopbar();
}

document.addEventListener("DOMContentLoaded", () => {
  window.initTheme();

  const topbar = document.getElementById("topbar");
  if (topbar) {
    renderTopbar();
  }

  const sidebar = document.getElementById("sidebar");
  if (sidebar) {
    renderSidebar(window.currentActivePage || resolveActivePage());
  }

  if (
    "serviceWorker" in navigator &&
    window.location.protocol.startsWith("http")
  ) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch((err) => {
        console.warn("SW registration skipped:", err);
      });
    });
  }
});
