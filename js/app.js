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
      email: "admin@pharmacare.com",
      phone: "+20100111222",
      status: "Active",
    },
    {
      id: "bu1",
      name: "Tarek Saad",
      nameAr: "طارق سعد",
      role: "business_unit",
      employeeCode: "BU-001",
      email: "bu@pharmacare.com",
      phone: "+20100222333",
      managerId: "admin1",
      status: "Active",
    },
    {
      id: "lm1",
      name: "Hassan Ali",
      nameAr: "حسن علي",
      role: "line_manager",
      employeeCode: "LM-001",
      email: "lm@pharmacare.com",
      phone: "+20100333444",
      managerId: "bu1",
      lineId: "line1",
      lineIds: ["line1", "line2"],
      status: "Active",
    },
    {
      id: "lm2",
      name: "Sayed Ibrahim",
      nameAr: "سيد إبراهيم",
      role: "line_manager",
      employeeCode: "LM-002",
      email: "lm2@pharmacare.com",
      phone: "+20100444555",
      managerId: "bu1",
      lineId: "line2",
      lineIds: ["line2"],
      status: "Active",
    },
    {
      id: "dm1",
      name: "Karim Nasser",
      nameAr: "كريم ناصر",
      role: "district_manager",
      employeeCode: "DM-001",
      email: "dm@pharmacare.com",
      phone: "+20100555666",
      managerId: "lm1",
      lineId: "line1",
      lineIds: ["line1"],
      status: "Active",
    },
    {
      id: "dm2",
      name: "Mona Adel",
      nameAr: "منى عادل",
      role: "district_manager",
      employeeCode: "DM-002",
      email: "dm2@pharmacare.com",
      phone: "+20100666777",
      managerId: "lm1",
      lineId: "line1",
      lineIds: ["line1"],
      status: "Active",
    },
    {
      id: "dm3",
      name: "Rami Samir",
      nameAr: "رامي سمير",
      role: "district_manager",
      employeeCode: "DM-003",
      email: "dm3@pharmacare.com",
      phone: "+20100777888",
      managerId: "lm2",
      lineId: "line2",
      lineIds: ["line2"],
      status: "Active",
    },
    {
      id: "rep1",
      name: "Ahmed Mostafa",
      nameAr: "أحمد مصطفى",
      role: "medical_rep",
      employeeCode: "EMP-001",
      email: "rep@pharmacare.com",
      phone: "+201001234567",
      managerId: "dm1",
      areaId: "area1",
      lineId: "line1",
      lineIds: ["line1"],
      status: "Active",
    },
    {
      id: "rep2",
      name: "Omar Youssef",
      nameAr: "عمر يوسف",
      role: "medical_rep",
      employeeCode: "EMP-002",
      email: "rep2@pharmacare.com",
      phone: "+201001234568",
      managerId: "dm1",
      areaId: "area2",
      lineId: "line1",
      lineIds: ["line1"],
      status: "Active",
    },
    {
      id: "rep3",
      name: "Ali Mahmoud",
      nameAr: "علي محمود",
      role: "medical_rep",
      employeeCode: "EMP-003",
      email: "rep3@pharmacare.com",
      phone: "+201001234569",
      managerId: "dm2",
      lineId: "line1",
      lineIds: ["line1"],
      status: "Active",
    },
    {
      id: "rep4",
      name: "Nourhan Ezz",
      nameAr: "نورهان عز",
      role: "medical_rep",
      employeeCode: "EMP-004",
      email: "rep4@pharmacare.com",
      phone: "+201001234570",
      managerId: "dm3",
      lineId: "line2",
      lineIds: ["line2"],
      status: "Active",
    },
    {
      id: "hr1",
      name: "Fatma El-Sherif",
      nameAr: "فاطمة الشريف",
      role: "hr",
      employeeCode: "HR-001",
      email: "hr@pharmacare.com",
      phone: "+20100888999",
      managerId: "admin1",
      status: "Active",
    },
  ],
  specialties: [
    { id: "spec_internal", code: "IM", name: "Internal Medicine", nameAr: "باطنة" },
    { id: "spec_pediatrics", code: "PED", name: "Pediatrics", nameAr: "أطفال" },
    { id: "spec_cardiology", code: "CARD", name: "Cardiology", nameAr: "قلب وأوعية" },
    { id: "spec_dermatology", code: "DERM", name: "Dermatology", nameAr: "جلدية" },
    { id: "spec_ophthalmology", code: "OPHTH", name: "Ophthalmology", nameAr: "عيون" },
    { id: "spec_orthopedics", code: "ORTHO", name: "Orthopedics", nameAr: "عظام" },
    { id: "spec_ent", code: "ENT", name: "ENT", nameAr: "أنف وأذن وحنجرة" },
    { id: "spec_neurology", code: "NEURO", name: "Neurology", nameAr: "مخ وأعصاب" },
    { id: "spec_urology", code: "URO", name: "Urology", nameAr: "مسالك بولية" },
    { id: "spec_gynecology", code: "GYN", name: "Gynecology", nameAr: "نساء وتوليد" },
    { id: "spec_other", code: "OTHER", name: "Other", nameAr: "أخرى" },
  ],
  areas: [
    { id: "area1", name: "Nasr City", code: "CAI-N01", repId: "rep1", lineId: "line1" },
    { id: "area2", name: "Heliopolis", code: "CAI-H01", repId: "rep2", lineId: "line1" },
    { id: "area3", name: "Nasr City", code: "CAI-N01", repId: "rep4", lineId: "line2" },
    { id: "area4", name: "Maadi", code: "CAI-M01", repId: null, lineId: "line2" },
  ],
  productLines: [
    {
      id: "line1",
      name: "Cardio Line",
      status: "Active",
      lineManagerId: "lm1",
      lineManagerName: "Hassan Ali",
      callFrequency: { classA: 4, classB: 3, classC: 1 },
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
      status: "Active",
      lineManagerId: "lm2",
      lineManagerName: "Sayed Ibrahim",
      callFrequency: { classA: 4, classB: 2, classC: 1 },
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
      specialtyId: "spec_internal",
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
      specialtyId: "spec_pediatrics",
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
      specialtyId: "spec_dermatology",
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
      specialtyId: "spec_ophthalmology",
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
      specialtyId: "spec_cardiology",
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
      specialtyId: "spec_cardiology",
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
      specialtyId: "spec_internal",
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
      specialtyId: "spec_pediatrics",
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
      specialtyId: "spec_dermatology",
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
      productIds: ["prod1"],
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
      productIds: ["prod2"],
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
      productIds: [],
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
      productIds: ["prod3"],
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
      productIds: [],
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
      productIds: [],
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
      productIds: [],
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
      productIds: ["prod4"],
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
      productIds: ["prod1"],
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
      productIds: ["prod3"],
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
      productIds: ["prod4"],
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
      productIds: ["prod2"],
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
      productIds: ["prod3"],
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
      productIds: [],
      products: [],
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
      productIds: [],
      products: [],
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
      productIds: [],
      products: [],
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
      productIds: [],
      products: [],
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
      productIds: [],
      products: [],
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
      productIds: [],
      products: [],
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
      productIds: [],
      products: [],
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
      productIds: [],
      products: [],
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
        dm: { status: "pending", approverName: null, updatedAt: null },
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
    { id: 's1', month: '2026-09', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Amoxicillin 500mg', productId: 'prod1', target: 20000, actual: 22500, amount: 22500, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's2', month: '2026-09', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Vitamin D Drops 1000IU', productId: 'prod2', target: 12000, actual: 13000, amount: 13000, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's3', month: '2026-09', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Omeprazole 20mg', productId: 'prod3', target: 10000, actual: 9500, amount: 9500, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's4', month: '2026-09', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Azithromycin 250mg', productId: 'prod4', target: 8000, actual: 7000, amount: 7000, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's5', month: '2026-09', repName: 'Omar Youssef', area: 'Heliopolis', product: 'Amoxicillin 500mg', productId: 'prod1', target: 18000, actual: 19000, amount: 19000, repId: 'rep2', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's6', month: '2026-09', repName: 'Omar Youssef', area: 'Heliopolis', product: 'Vitamin D Drops 1000IU', productId: 'prod2', target: 12000, actual: 11000, amount: 11000, repId: 'rep2', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's7', month: '2026-09', repName: 'Omar Youssef', area: 'Heliopolis', product: 'Omeprazole 20mg', productId: 'prod3', target: 9000, actual: 7500, amount: 7500, repId: 'rep2', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's8', month: '2026-09', repName: 'Omar Youssef', area: 'Heliopolis', product: 'Azithromycin 250mg', productId: 'prod4', target: 6000, actual: 3500, amount: 3500, repId: 'rep2', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's9', month: '2026-08', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Amoxicillin 500mg', productId: 'prod1', target: 18000, actual: 21000, amount: 21000, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's10', month: '2026-08', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Vitamin D Drops 1000IU', productId: 'prod2', target: 12000, actual: 14000, amount: 14000, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's11', month: '2026-08', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Omeprazole 20mg', productId: 'prod3', target: 9000, actual: 8500, amount: 8500, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's12', month: '2026-08', repName: 'Ahmed Mostafa', area: 'Nasr City', product: 'Azithromycin 250mg', productId: 'prod4', target: 6000, actual: 6500, amount: 6500, repId: 'rep1', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's13', month: '2026-08', repName: 'Omar Youssef', area: 'Heliopolis', product: 'Amoxicillin 500mg', productId: 'prod1', target: 17000, actual: 18500, amount: 18500, repId: 'rep2', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' },
    { id: 's14', month: '2026-08', repName: 'Omar Youssef', area: 'Heliopolis', product: 'Vitamin D Drops 1000IU', productId: 'prod2', target: 11000, actual: 11500, amount: 11500, repId: 'rep2', dmId: 'dm1', lmId: 'lm1', lineId: 'line1' }
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
  notifications: [
    {
      id: "notif_rep_1",
      userId: "rep1",
      type: "plan_approval",
      title: "اعتماد الخطة الميدانية",
      titleEn: "Field Plan Approved",
      message: "اعتمد مدير المنطقة (كريم ناصر) خطتك الميدانية لتاريخ 2026-09-20.",
      messageEn: "District Manager (Karim Nasser) approved your field plan for 2026-09-20.",
      link: "calendar.html",
      read: false,
      createdAt: "2026-09-17T15:30:00Z",
      icon: "🗓️",
      badgeClass: "bg-success",
      actorName: "كريم ناصر",
      action: "approved",
    },
    {
      id: "notif_rep_2",
      userId: "rep1",
      type: "leave_approval",
      title: "موافقة على طلب الإجازة",
      titleEn: "Leave Request Approved",
      message: "وافق قسم الموارد البشرية على طلب إجازتك الاعتيادية.",
      messageEn: "HR Department approved your annual leave request.",
      link: "leaves.html",
      read: false,
      createdAt: "2026-09-17T14:15:00Z",
      icon: "🏖️",
      badgeClass: "bg-success",
      actorName: "الموارد البشرية (HR)",
      action: "approved",
    },
    {
      id: "notif_rep_3",
      userId: "rep1",
      type: "visit_rejection",
      title: "رفض وتوجيه زيارة",
      titleEn: "Visit Directive / Rejection",
      message: "تم رفض زيارة د. أحمد مصطفى مع ملاحظة: يرجى تغيير موعد الزيارة للفترة الصباحية.",
      messageEn: "Visit for Dr. Ahmed Mostafa rejected with note: Please reschedule to morning period.",
      note: "يرجى تغيير موعد الزيارة للفترة الصباحية",
      link: "visits.html",
      read: false,
      createdAt: "2026-09-17T11:00:00Z",
      icon: "❌",
      badgeClass: "bg-danger",
      actorName: "كريم ناصر",
      action: "rejected",
    },
    {
      id: "notif_dm_1",
      userId: "dm1",
      type: "plan_submission",
      title: "خطة زيارات معلقة للاعتماد",
      titleEn: "Field Plan for Review",
      message: "قدم المندوب أحمد مصطفى خطته الميدانية لشهر سبتمبر للمراجعة والاعتماد.",
      messageEn: "Medical Rep Ahmed Mostafa submitted a new field plan for your review.",
      link: "plans-review.html",
      read: false,
      createdAt: "2026-09-17T13:00:00Z",
      icon: "📋",
      badgeClass: "bg-primary",
      actorName: "أحمد مصطفى",
      action: "submitted",
    },
    {
      id: "notif_dm_2",
      userId: "dm1",
      type: "leave_submission",
      title: "طلب إجازة جديد",
      titleEn: "New Leave Request",
      message: "طلب إجازة اعتيادية مقدم من المندوب أحمد مصطفى (يومان) بانتظار موافقتك.",
      messageEn: "Annual leave request submitted by Ahmed Mostafa (2 days) awaiting your approval.",
      link: "leaves.html",
      read: false,
      createdAt: "2026-09-17T10:00:00Z",
      icon: "🏖️",
      badgeClass: "bg-warning",
      actorName: "أحمد مصطفى",
      action: "submitted",
    },
    {
      id: "notif_hr_1",
      userId: "hr1",
      type: "leave_submission",
      title: "طلب إجازة للاعتماد النهائي",
      titleEn: "Leave Request Final Approval",
      message: "اعتمد مدير الخط طلب إجازة أحمد مصطفى وبانتظار اعتماد الموارد البشرية النهائي.",
      messageEn: "Line Manager approved leave for Ahmed Mostafa, awaiting HR final confirmation.",
      link: "leaves.html",
      read: false,
      createdAt: "2026-09-17T12:30:00Z",
      icon: "🏖️",
      badgeClass: "bg-info",
      actorName: "حسن علي",
      action: "endorsed",
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
        if (!Array.isArray(data.specialties) || data.specialties.length === 0) {
          data.specialties = JSON.parse(JSON.stringify(DEFAULT_DEMO_DATA.specialties));
        }
        if (Array.isArray(data.areas)) {
          data.areas.forEach((a) => {
            if (!a.lineId) a.lineId = "line1";
          });
          DEFAULT_DEMO_DATA.areas.forEach((da) => {
            if (!data.areas.some((existing) => existing.id === da.id)) {
              data.areas.push(da);
            }
          });
        } else {
          data.areas = JSON.parse(JSON.stringify(DEFAULT_DEMO_DATA.areas));
        }
        if (Array.isArray(data.productLines)) {
          data.productLines.forEach((pl) => {
            if (!pl.callFrequency) {
              pl.callFrequency = { classA: 4, classB: 3, classC: 1 };
            }
          });
        } else {
          data.productLines = JSON.parse(JSON.stringify(DEFAULT_DEMO_DATA.productLines));
        }
        if (Array.isArray(data.doctors)) {
          DEFAULT_DEMO_DATA.doctors.forEach((d) => {
            const existing = data.doctors.find((ed) => ed.id === d.id);
            if (!existing) {
              data.doctors.push(d);
            } else if (!existing.specialtyId && d.specialtyId) {
              existing.specialtyId = d.specialtyId;
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
            } else if (l.id === "l2" && data.leaves[existingIdx].approvals?.dm?.updatedAt === "2026-09-02 11:30 AM") {
              data.leaves[existingIdx].approvals.dm = { status: "pending", approverName: null, updatedAt: null };
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
        // Ensure synchronized live workflow notifications seed
        if (!Array.isArray(data.notifications) || data.notifications.length === 0) {
          data.notifications = JSON.parse(JSON.stringify(DEFAULT_DEMO_DATA.notifications));
        } else {
          const hasRepNotifs = data.notifications.some((n) => n.userId === "rep1");
          if (!hasRepNotifs) {
            DEFAULT_DEMO_DATA.notifications.forEach((dn) => {
              if (dn.userId === "rep1") data.notifications.unshift(dn);
            });
          }
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
  const users = (window.store && window.store.users ? window.store.users.getAll() : null) || (window.DEMO_DATA && window.DEMO_DATA.users) || [];
  const lines = (window.store && window.store.productLines ? window.store.productLines.getAll() : null) || (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];
  const user = users.find((u) => u.id === userId);
  if (!user) return [];

  const assignedLineIds = [...(user.lineIds || (user.lineId ? [user.lineId] : []))];
  lines.forEach((l) => {
    if (l.lineManagerId === userId && !assignedLineIds.includes(l.id)) {
      assignedLineIds.push(l.id);
    }
  });

  const role = window.normalizeRole ? window.normalizeRole(user.role) : (user.role || '').toLowerCase();
  if (role === 'business_unit') {
    const isLM = (u) => {
      const r = window.normalizeRole ? window.normalizeRole(u.role) : (u.role || '').toLowerCase();
      return r === 'line_manager' || r === 'lm';
    };
    const myLMs = users.filter((u) => u.managerId === userId && isLM(u));
    const myLmIds = myLMs.map((u) => u.id);

    lines.forEach((l) => {
      if (myLmIds.includes(l.lineManagerId) && !assignedLineIds.includes(l.id)) {
        assignedLineIds.push(l.id);
      }
    });

    myLMs.forEach((lm) => {
      const lmLines = lm.lineIds || (lm.lineId ? [lm.lineId] : []);
      lmLines.forEach((lId) => {
        if (!assignedLineIds.includes(lId)) {
          assignedLineIds.push(lId);
        }
      });
    });
  }

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

function getSpecialtyById(specialtyId) {
  const specs = (window.DEMO_DATA && window.DEMO_DATA.specialties) || [];
  return specs.find((s) => s.id === specialtyId) || null;
}
window.getSpecialtyById = getSpecialtyById;

function getDoctorCallTarget(doc) {
  if (!doc) return 4;
  const docClass = (doc.class || "A").toUpperCase();
  if (docClass === "HOSPITAL" || doc.type === "hospital" || doc.type === "Hospital") {
    return 6;
  }

  const allLines = (window.DEMO_DATA && window.DEMO_DATA.productLines) || [];
  let targetFreq = null;

  // 1. Direct lineId on doctor
  let lineId = doc.lineId || (doc.lineIds && doc.lineIds[0]);

  // 2. Line via assigned rep
  if (!lineId && doc.repId) {
    const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
    const rep = allUsers.find((u) => u.id === doc.repId);
    if (rep) {
      lineId = (rep.lineIds && rep.lineIds[0]) || rep.lineId;
    }
  }

  // 3. Line via territory/area assignment if rep is not directly set
  if (!lineId && (doc.areaId || doc.area)) {
    const allAreas = (window.DEMO_DATA && window.DEMO_DATA.areas) || [];
    const area = allAreas.find((a) => a.id === doc.areaId || a.name === doc.area);
    if (area && area.repId) {
      const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
      const rep = allUsers.find((u) => u.id === area.repId);
      if (rep) {
        lineId = (rep.lineIds && rep.lineIds[0]) || rep.lineId;
      }
    }
  }

  if (lineId) {
    const line = allLines.find((l) => l.id === lineId);
    if (line && line.callFrequency) {
      if (docClass === "A" && line.callFrequency.classA !== undefined) {
        targetFreq = Number(line.callFrequency.classA);
      } else if (docClass === "B" && line.callFrequency.classB !== undefined) {
        targetFreq = Number(line.callFrequency.classB);
      } else if (docClass === "C" && line.callFrequency.classC !== undefined) {
        targetFreq = Number(line.callFrequency.classC);
      }
    }
  }

  if (targetFreq === null && allLines.length > 0 && allLines[0].callFrequency) {
    const defaultFreq = allLines[0].callFrequency;
    if (docClass === "A" && defaultFreq.classA !== undefined) targetFreq = Number(defaultFreq.classA);
    else if (docClass === "B" && defaultFreq.classB !== undefined) targetFreq = Number(defaultFreq.classB);
    else if (docClass === "C" && defaultFreq.classC !== undefined) targetFreq = Number(defaultFreq.classC);
  }

  if (targetFreq === null) {
    targetFreq = docClass === "A" ? 4 : (docClass === "B" ? 3 : 1);
  }
  return targetFreq;
}
window.getDoctorCallTarget = getDoctorCallTarget;

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
    notifCenterTitle: "Notifications",
    notifMarkAllRead: "Mark all as read",
    notifClearAll: "Clear all",
    notifEmptyTitle: "No notifications",
    notifEmptyDesc: "Workflow approvals, rejections, and directives will appear here live.",
    notifTabAll: "All",
    notifTabUnread: "Unread",
    notifNew: "New",
    notifViewDetails: "View Details",
    notifDirectiveLabel: "Directive / Note:",
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
    notifCenterTitle: "مركز الإشعارات",
    notifMarkAllRead: "تحديد الكل كمقروء",
    notifClearAll: "مسح الكل",
    notifEmptyTitle: "لا توجد إشعارات جديدة",
    notifEmptyDesc: "ستظهر هنا إشعارات الاعتمادات، الرفض، والتوجيهات الميدانية فور حدوثها.",
    notifTabAll: "الكل",
    notifTabUnread: "غير مقروء",
    notifNew: "جديد",
    notifViewDetails: "عرض التفاصيل",
    notifDirectiveLabel: "ملاحظة التوجيه:",
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

function getNavPendingCount(itemId, user) {
  if (!user) return 0;
  const role = normalizeRole(user.role);

  if (itemId === "plans-review") {
    if (role !== "district_manager" && role !== "admin") return 0;
    const allVisits = (window.DEMO_DATA && window.DEMO_DATA.visits) || [];
    if (role === "admin") {
      return allVisits.filter((v) => v.status === "pending_approval").length;
    }
    const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
    const subordinateReps = allUsers.filter(
      (u) =>
        normalizeRole(u.role) === "medical_rep" &&
        (u.dmId === user.id || u.districtManagerId === user.id || u.managerId === user.id),
    );
    const subRepIds = subordinateReps.map((r) => r.id);
    return allVisits.filter(
      (v) => v.status === "pending_approval" && subRepIds.includes(v.repId),
    ).length;
  }

  if (itemId === "leaves") {
    const allLeaves =
      (window.store && window.store.leaves
        ? window.store.leaves.getAll()
        : (window.DEMO_DATA && window.DEMO_DATA.leaves)) || [];

    if (role === "admin" || role === "hr") {
      return allLeaves.filter(
        (l) =>
          l.status === "pending" &&
          l.approvals &&
          l.approvals.lm &&
          l.approvals.lm.status === "approved" &&
          (!l.approvals.hr || l.approvals.hr.status === "pending"),
      ).length;
    }

    if (role === "district_manager") {
      const allUsers = (window.DEMO_DATA && window.DEMO_DATA.users) || [];
      const subReps = allUsers.filter(
        (u) =>
          normalizeRole(u.role) === "medical_rep" &&
          (u.dmId === user.id || u.districtManagerId === user.id || u.managerId === user.id),
      );
      const subRepIds = subReps.map((r) => r.id);
      return allLeaves.filter(
        (l) =>
          l.status === "pending" &&
          subRepIds.includes(l.userId) &&
          (!l.approvals || !l.approvals.dm || l.approvals.dm.status === "pending"),
      ).length;
    }

    if (role === "line_manager") {
      return allLeaves.filter(
        (l) =>
          l.status === "pending" &&
          l.approvals &&
          l.approvals.dm &&
          l.approvals.dm.status === "approved" &&
          (!l.approvals.lm || l.approvals.lm.status === "pending"),
      ).length;
    }

    return 0;
  }

  return 0;
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
    const pendingCount = getNavPendingCount(item.id, user);
    const badgeHtml =
      pendingCount > 0
        ? `<span class="badge bg-danger rounded-pill nav-pending-badge ${lang === "ar" ? "me-auto" : "ms-auto"}" style="font-size: 0.72rem; padding: 2px 7px; box-shadow: 0 2px 4px rgba(220,53,69,0.3); font-weight: 700;">${pendingCount}</span>`
        : "";
    html += `
      <li class="nav-item">
        <a href="${item.link}" onclick="closeMobileSidebar()" class="nav-link ${activeClass}" style="display: flex; align-items: center; gap: 12px; padding: 10px 24px; color: ${item.id === resolved ? "var(--primary)" : "var(--gray-600)"}; font-weight: ${item.id === resolved ? "600" : "500"}; background: ${item.id === resolved ? "var(--primary-light)" : "transparent"}; border-radius: 8px; margin: 2px 12px; text-decoration: none;">
          <span style="font-size: 1.1rem; width: 22px; text-align: center;">${getIconSymbol(item.id)}</span>
          <span data-i18n="${item.i18n}">${translations[lang][item.i18n] || item.id}</span>
          ${badgeHtml}
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
      const pendingCount = getNavPendingCount(item.id, user);
      const badgeHtml =
        pendingCount > 0
          ? `<span class="badge bg-danger rounded-pill nav-pending-badge ${lang === "ar" ? "me-auto" : "ms-auto"}" style="font-size: 0.72rem; padding: 2px 7px; box-shadow: 0 2px 4px rgba(220,53,69,0.3); font-weight: 700;">${pendingCount}</span>`
          : "";
      html += `
        <li class="nav-item">
          <a href="${item.link}" onclick="closeMobileSidebar()" class="nav-link ${activeClass}" style="display: flex; align-items: center; gap: 12px; padding: 10px 24px; color: ${item.id === resolved ? "var(--primary)" : "var(--gray-600)"}; font-weight: ${item.id === resolved ? "600" : "500"}; background: ${item.id === resolved ? "var(--primary-light)" : "transparent"}; border-radius: 8px; margin: 2px 12px; text-decoration: none;">
            <span style="font-size: 1.1rem; width: 22px; text-align: center;">${getIconSymbol(item.id)}</span>
            <span data-i18n="${item.i18n}">${translations[lang][item.i18n] || item.id}</span>
            ${badgeHtml}
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

  const unreadNotifCount = (window.store && window.store.notifications)
    ? window.store.notifications.getUnreadCount(user.id)
    : ((window.DEMO_DATA && window.DEMO_DATA.notifications) || []).filter(
        (n) => (n.userId === user.id || n.userId === "all") && !n.read
      ).length;

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

    // Ensure notification bell container exists in incremental update
    if (!topbarEl.querySelector("#pharmaNotifWrapper")) {
      const actionsGroup = topbarEl.querySelector(".pharma-actions-group");
      if (actionsGroup) {
        const notifWrapper = document.createElement("div");
        notifWrapper.className = "pharma-notif-wrapper";
        notifWrapper.id = "pharmaNotifWrapper";
        notifWrapper.innerHTML = `
          <button class="pharma-action-btn pharma-notif-bell-btn" id="notifBellBtn" onclick="window.toggleWorkflowNotifDropdown(event)" title="${translations[lang]?.notifCenterTitle || (lang === 'ar' ? 'مركز الإشعارات' : 'Notifications')}" aria-label="Notifications">
            <span class="notif-bell-icon">🔔</span>
            <span class="badge rounded-pill bg-danger notif-unread-count-badge" id="topbarNotifBadge" style="${unreadNotifCount > 0 ? '' : 'display: none;'}">${unreadNotifCount > 99 ? '99+' : unreadNotifCount}</span>
          </button>
          <div class="pharma-notif-dropdown" id="workflowNotifDropdown" style="display: none;" onclick="event.stopPropagation()"></div>
        `;
        actionsGroup.insertBefore(notifWrapper, actionsGroup.firstChild);
      }
    }
    if (typeof window.updateWorkflowNotifUI === "function") {
      window.updateWorkflowNotifUI();
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
            const pCount = getNavPendingCount(item.id, user);
            const badge = pCount > 0 ? ` <span class="badge bg-danger rounded-pill nav-pending-badge ms-1" style="font-size: 0.65rem; padding: 1px 5px;">${pCount}</span>` : "";
            textEl.innerHTML = `${expectedText}${badge}`;
          }
        }
      });
    } else {
      let topNavLinksHtml = "";
      allTopNavItems.forEach((item) => {
        const isAct = item.id === activePage;
        const pCount = getNavPendingCount(item.id, user);
        const badge = pCount > 0 ? ` <span class="badge bg-danger rounded-pill nav-pending-badge ms-1" style="font-size: 0.65rem; padding: 1px 5px;">${pCount}</span>` : "";
        topNavLinksHtml += `
          <a href="${item.link}" class="pharma-nav-item ${isAct ? "active" : ""}">
            <span class="nav-item-icon">${getIconSymbol(item.id)}</span>
            <span class="nav-item-text">${translations[lang]?.[item.i18n] || item.id}${badge}</span>
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
        <!-- Live Workflow Notification Center Bell & Dropdown -->
        <div class="pharma-notif-wrapper" id="pharmaNotifWrapper">
          <button class="pharma-action-btn pharma-notif-bell-btn" id="notifBellBtn" onclick="window.toggleWorkflowNotifDropdown(event)" title="${translations[lang]?.notifCenterTitle || (lang === 'ar' ? 'مركز الإشعارات' : 'Notifications')}" aria-label="Notifications">
            <span class="notif-bell-icon">🔔</span>
            <span class="badge rounded-pill bg-danger notif-unread-count-badge" id="topbarNotifBadge" style="${unreadNotifCount > 0 ? '' : 'display: none;'}">${unreadNotifCount > 99 ? '99+' : unreadNotifCount}</span>
          </button>
          
          <div class="pharma-notif-dropdown" id="workflowNotifDropdown" style="display: none;" onclick="event.stopPropagation()"></div>
        </div>

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
// Section 8.5: Live Workflow Notification Center
// ============================================================================
window.formatWorkflowNotifTime = function (isoString, lang) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = Math.max(0, now - d);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (lang === "ar") {
      if (diffMins < 1) return "الآن";
      if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      if (diffDays === 1) return "أمس";
      if (diffDays < 7) return `منذ ${diffDays} أيام`;
      return d.toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
    } else {
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  } catch (e) {
    return "";
  }
};

window.currentNotifFilter = "all";

window.updateWorkflowNotifUI = function () {
  let user = window.checkAuth ? window.checkAuth() : null;
  if (!user && window.DEMO_DATA) user = window.DEMO_DATA.currentUser;
  const userId = user ? user.id : "rep1";

  const unread = (window.store && window.store.notifications)
    ? window.store.notifications.getUnreadCount(userId)
    : ((window.DEMO_DATA && window.DEMO_DATA.notifications) || []).filter(
        (n) => (n.userId === userId || n.userId === "all") && !n.read
      ).length;

  document.querySelectorAll("#topbarNotifBadge").forEach((badgeEl) => {
    badgeEl.textContent = unread > 99 ? "99+" : unread;
    badgeEl.style.display = unread > 0 ? "inline-flex" : "none";
  });

  const dropdown = document.getElementById("workflowNotifDropdown");
  if (dropdown && dropdown.style.display === "block") {
    window.renderWorkflowNotifContent(window.currentNotifFilter || "all");
  }
};

window.toggleWorkflowNotifDropdown = function (event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const dropdown = document.getElementById("workflowNotifDropdown");
  if (!dropdown) return;

  const isHidden = dropdown.style.display === "none" || !dropdown.style.display;
  if (isHidden) {
    window.renderWorkflowNotifContent(window.currentNotifFilter || "all");
    dropdown.style.display = "block";
  } else {
    dropdown.style.display = "none";
  }
};

window.renderWorkflowNotifContent = function (filter = "all") {
  window.currentNotifFilter = filter;
  const container = document.getElementById("workflowNotifDropdown");
  if (!container) return;

  const lang = window.getCurrentLang ? window.getCurrentLang() : "ar";
  const isAr = lang === "ar";
  let user = window.checkAuth ? window.checkAuth() : null;
  if (!user && window.DEMO_DATA) user = window.DEMO_DATA.currentUser;
  const userId = user ? user.id : "rep1";

  const allNotifs = (window.store && window.store.notifications)
    ? window.store.notifications.getForUser(userId)
    : ((window.DEMO_DATA && window.DEMO_DATA.notifications) || []).filter(
        (n) => n.userId === userId || n.userId === "all"
      );

  const unreadNotifs = allNotifs.filter((n) => !n.read);
  const unreadCount = unreadNotifs.length;
  const totalCount = allNotifs.length;

  const displayList = filter === "unread" ? unreadNotifs : allNotifs;

  let itemsHtml = "";
  if (displayList.length === 0) {
    itemsHtml = `
      <div class="notif-empty-state">
        <div style="font-size: 2.2rem; margin-bottom: 8px;">🔕</div>
        <div class="fw-bold fs-6 mb-1">${isAr ? "لا توجد إشعارات جديدة" : "No notifications"}</div>
        <div class="text-muted small" style="max-width: 260px; margin: 0 auto; line-height: 1.45;">
          ${isAr ? "ستظهر هنا إشعارات الاعتمادات، الرفض، والتوجيهات الميدانية فور حدوثها." : "Workflow approvals, rejections, and directives will appear here live."}
        </div>
      </div>
    `;
  } else {
    itemsHtml = displayList
      .map((item) => {
        const isUnread = !item.read;
        const title = isAr
          ? item.title || item.titleEn || "إشعار"
          : item.titleEn || item.title || "Notification";
        const msg = isAr
          ? item.message || item.messageEn || ""
          : item.messageEn || item.message || "";
        const timeStr = window.formatWorkflowNotifTime(item.createdAt, lang);

        let icon = item.icon || "🔔";
        let iconBg = "rgba(13, 110, 253, 0.12)";
        let iconColor = "#0d6efd";

        if (item.type && item.type.includes("approval")) {
          iconBg = "rgba(25, 135, 84, 0.14)";
          iconColor = "#198754";
          if (!item.icon) icon = "✅";
        } else if (
          item.type &&
          (item.type.includes("rejection") || item.type.includes("reject"))
        ) {
          iconBg = "rgba(220, 53, 69, 0.14)";
          iconColor = "#dc3545";
          if (!item.icon) icon = "❌";
        } else if (item.type && item.type.includes("leave")) {
          iconBg = "rgba(13, 202, 240, 0.14)";
          iconColor = "#0891b2";
          if (!item.icon) icon = "🏖️";
        } else if (item.type && item.type.includes("plan")) {
          iconBg = "rgba(111, 66, 193, 0.14)";
          iconColor = "#6f42c1";
          if (!item.icon) icon = "🗓️";
        }

        const safeTitle = window.escapeHtml ? window.escapeHtml(title) : title;
        const safeMsg = window.escapeHtml ? window.escapeHtml(msg) : msg;
        const noteHtml = item.note
          ? `
          <div class="notif-note-callout">
            <strong>💬 ${isAr ? "ملاحظة التوجيه:" : "Directive Note:"}</strong> "${window.escapeHtml ? window.escapeHtml(item.note) : item.note}"
          </div>
        `
          : "";

        const linkTarget = item.link || "#";

        return `
          <div class="notif-item ${isUnread ? "unread" : "read"}" onclick="window.handleWorkflowNotifClick('${item.id}', '${linkTarget}')">
            <div class="notif-item-icon" style="background: ${iconBg}; color: ${iconColor};">
              ${icon}
            </div>
            <div class="notif-item-body">
              <div class="notif-item-top">
                <span class="notif-item-title">
                  ${isUnread ? '<span class="notif-unread-dot"></span>' : ""}
                  ${safeTitle}
                </span>
                <span class="notif-item-time">${timeStr}</span>
              </div>
              <div class="notif-item-msg">${safeMsg}</div>
              ${noteHtml}
              <div class="notif-item-actions">
                ${
                  linkTarget !== "#"
                    ? `
                  <button type="button" class="notif-btn-open" onclick="event.stopPropagation(); window.handleWorkflowNotifClick('${item.id}', '${linkTarget}')">
                    ${isAr ? "فتح الصفحة" : "View"} ↗
                  </button>
                `
                    : "<span></span>"
                }
                <button type="button" class="notif-btn-delete" title="${isAr ? "حذف الإشعار" : "Delete"}" onclick="window.deleteWorkflowNotif(event, '${item.id}')">
                  🗑️
                </button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  container.innerHTML = `
    <div class="notif-dropdown-header">
      <h5>
        <span>🔔</span>
        <span>${isAr ? "مركز الإشعارات" : "Notifications"}</span>
        <span class="badge ${unreadCount > 0 ? "bg-danger" : "bg-secondary"} rounded-pill" style="font-size: 0.72rem; padding: 2px 7px;">
          ${unreadCount} ${isAr ? "جديد" : "New"}
        </span>
      </h5>
      <div style="display: flex; gap: 8px; align-items: center;">
        ${
          unreadCount > 0
            ? `
          <button type="button" class="btn btn-sm btn-link text-decoration-none p-0" style="font-size: 0.78rem; font-weight: 600; color: #2563eb;" onclick="window.markAllWorkflowNotifsRead(event)">
            ✓ ${isAr ? "تحديد الكل كمقروء" : "Mark all read"}
          </button>
        `
            : ""
        }
      </div>
    </div>

    <div class="notif-filter-tabs">
      <button type="button" class="notif-filter-btn ${filter === "all" ? "active" : ""}" onclick="window.renderWorkflowNotifContent('all')">
        ${isAr ? "الكل" : "All"} (${totalCount})
      </button>
      <button type="button" class="notif-filter-btn ${filter === "unread" ? "active" : ""}" onclick="window.renderWorkflowNotifContent('unread')">
        ${isAr ? "غير مقروء" : "Unread"} (${unreadCount})
      </button>
    </div>

    <div class="notif-list-container">
      ${itemsHtml}
    </div>

    ${
      totalCount > 0
        ? `
      <div class="notif-dropdown-footer">
        <span class="small text-muted">${totalCount} ${isAr ? "إشعار إجمالي" : "total"}</span>
        <button type="button" class="btn btn-sm btn-link text-danger text-decoration-none p-0 small" style="font-size: 0.75rem;" onclick="window.clearAllWorkflowNotifs(event)">
          🗑️ ${isAr ? "مسح الكل" : "Clear all"}
        </button>
      </div>
    `
        : ""
    }
  `;
};

window.handleWorkflowNotifClick = function (notifId, link) {
  if (window.store && window.store.notifications) {
    window.store.notifications.markAsRead(notifId);
  } else if (window.DEMO_DATA && window.DEMO_DATA.notifications) {
    const n = window.DEMO_DATA.notifications.find((item) => item.id === notifId);
    if (n) {
      n.read = true;
      if (typeof window.saveDataToStorage === "function") window.saveDataToStorage();
    }
  }
  window.updateWorkflowNotifUI();

  if (link && link !== "#") {
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    if (currentPath !== link) {
      window.location.href = link;
    } else {
      const dd = document.getElementById("workflowNotifDropdown");
      if (dd) dd.style.display = "none";
    }
  }
};

window.deleteWorkflowNotif = function (event, notifId) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  if (window.store && window.store.notifications) {
    window.store.notifications.remove(notifId);
  } else if (window.DEMO_DATA && window.DEMO_DATA.notifications) {
    window.DEMO_DATA.notifications = window.DEMO_DATA.notifications.filter(
      (n) => n.id !== notifId
    );
    if (typeof window.saveDataToStorage === "function") window.saveDataToStorage();
    window.updateWorkflowNotifUI();
  }
};

window.markAllWorkflowNotifsRead = function (event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  let user = window.checkAuth ? window.checkAuth() : null;
  if (!user && window.DEMO_DATA) user = window.DEMO_DATA.currentUser;
  const userId = user ? user.id : "rep1";

  if (window.store && window.store.notifications) {
    window.store.notifications.markAllAsRead(userId);
  } else if (window.DEMO_DATA && window.DEMO_DATA.notifications) {
    window.DEMO_DATA.notifications.forEach((n) => {
      if (n.userId === userId || n.userId === "all") n.read = true;
    });
    if (typeof window.saveDataToStorage === "function") window.saveDataToStorage();
    window.updateWorkflowNotifUI();
  }
};

window.clearAllWorkflowNotifs = function (event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  let user = window.checkAuth ? window.checkAuth() : null;
  if (!user && window.DEMO_DATA) user = window.DEMO_DATA.currentUser;
  const userId = user ? user.id : "rep1";

  if (window.store && window.store.notifications) {
    window.store.notifications.clearAll(userId);
  } else if (window.DEMO_DATA && window.DEMO_DATA.notifications) {
    window.DEMO_DATA.notifications = window.DEMO_DATA.notifications.filter(
      (n) => n.userId !== userId && n.userId !== "all"
    );
    if (typeof window.saveDataToStorage === "function") window.saveDataToStorage();
    window.updateWorkflowNotifUI();
  }
};

window.addWorkflowNotification = function (notif) {
  let created = null;
  if (window.store && window.store.notifications) {
    created = window.store.notifications.add(notif);
  } else if (window.DEMO_DATA) {
    if (!window.DEMO_DATA.notifications) window.DEMO_DATA.notifications = [];
    created = {
      id: "notif_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      createdAt: new Date().toISOString(),
      read: false,
      userId: notif.userId || "rep1",
      type: notif.type || "system",
      title: notif.title || "إشعار جديد",
      titleEn: notif.titleEn || notif.title || "Notification",
      message: notif.message || "",
      messageEn: notif.messageEn || notif.message || "",
      note: notif.note || null,
      link: notif.link || "#",
      icon: notif.icon || "🔔",
      badgeClass: notif.badgeClass || "bg-primary",
      actorName: notif.actorName || null,
      action: notif.action || null,
    };
    window.DEMO_DATA.notifications.unshift(created);
    if (typeof window.saveDataToStorage === "function") window.saveDataToStorage();
  }

  if (typeof window.updateWorkflowNotifUI === "function") {
    window.updateWorkflowNotifUI();
  }

  // Live Toast feedback if recipient matches current active user
  let user = window.checkAuth ? window.checkAuth() : null;
  if (!user && window.DEMO_DATA) user = window.DEMO_DATA.currentUser;
  if (user && (notif.userId === user.id || notif.userId === "all")) {
    const isAr = (window.getCurrentLang && window.getCurrentLang() === "ar");
    const toastMsg = isAr ? (notif.title || notif.message) : (notif.titleEn || notif.messageEn || notif.title);
    if (typeof window.showToast === "function") {
      window.showToast(`🔔 ${toastMsg}`, "info");
    }
  }

  return created;
};

// Global click outside and ESC listeners for notification dropdown
if (!window._workflowNotifListenersAttached) {
  window._workflowNotifListenersAttached = true;
  document.addEventListener("click", function (event) {
    const dropdown = document.getElementById("workflowNotifDropdown");
    const bellBtn = document.getElementById("notifBellBtn");
    if (dropdown && dropdown.style.display === "block") {
      if (!dropdown.contains(event.target) && (!bellBtn || !bellBtn.contains(event.target))) {
        dropdown.style.display = "none";
      }
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      const dropdown = document.getElementById("workflowNotifDropdown");
      if (dropdown && dropdown.style.display === "block") {
        dropdown.style.display = "none";
      }
    }
  });
}

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

function enforcePageRoleSecurity() {
  const user = checkAuth();
  if (!user) return;
  const path = (window.location.pathname.split("/").pop() || "index.html").split("?")[0].toLowerCase();
  const role = window.normalizeRole ? window.normalizeRole(user.role) : (user.role || "").toLowerCase();

  const restrictions = {
    "users.html": ["admin", "hr"],
    "distributors.html": ["admin"],
    "areas.html": ["admin", "hr"],
    "products.html": ["admin"],
    "plans-review.html": ["admin", "district_manager", "line_manager", "business_unit"],
  };

  if (restrictions[path] && !restrictions[path].includes(role)) {
    console.warn(`[RBAC] Access denied: role '${role}' cannot access '${path}'. Redirecting to index.html.`);
    sessionStorage.setItem("pharma_rbac_denied", "true");
    window.location.replace("index.html");
  }
}
window.enforcePageRoleSecurity = enforcePageRoleSecurity;

function requireAuth() {
  const user = checkAuth();
  if (!user && !window.location.href.includes("login.html")) {
    window.location.replace("login.html");
    return null;
  }
  enforcePageRoleSecurity();
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

function getVisitDisplayProducts(visit) {
  if (!visit) return [];
  if (Array.isArray(visit.productIds) && visit.productIds.length > 0) {
    const allLines = (window.store && window.store.productLines ? window.store.productLines.getAll() : (window.DEMO_DATA && window.DEMO_DATA.productLines) || []);
    const productMap = {};
    allLines.forEach((l) => {
      (l.products || []).forEach((p) => {
        const displayName = p.dosage && !p.name.toLowerCase().includes(p.dosage.toLowerCase())
          ? `${p.name} ${p.dosage}`
          : p.name;
        productMap[p.id] = displayName;
      });
    });
    const resolved = visit.productIds.map((id) => productMap[id] || id);
    if (resolved.length > 0) return resolved;
  }
  if (Array.isArray(visit.products) && visit.products.length > 0) {
    return visit.products;
  }
  return [];
}
window.getVisitDisplayProducts = getVisitDisplayProducts;

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

  if (sessionStorage.getItem("pharma_rbac_denied") === "true") {
    sessionStorage.removeItem("pharma_rbac_denied");
    const isAr = (getCurrentLang && getCurrentLang() === "ar");
    setTimeout(() => {
      if (typeof showToast === "function") {
        showToast(
          isAr
            ? "عفواً، لا تملك الصلاحية للوصول إلى هذه الصفحة."
            : "Access Denied: You do not have permission to view this page.",
          "error"
        );
      }
    }, 200);
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
