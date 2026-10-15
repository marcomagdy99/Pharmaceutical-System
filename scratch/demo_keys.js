const data = {
  currentUser: {
    id: "u1790626000010",
    email: "admin@pharmacare.com",
    name: "System Admin",
    nameAr: "System Admin",
    role: "admin",
    employeeCode: "ADM-001",
    photoURL: "",
    lang: "en",
    hireDate: "2021-01-01",
    leaveBalance: {
      annual: 21,
      sick: 7,
      emergency: 6,
      unpaid: 0,
      maternity: 90,
    },
  },
  users: [
    {
        "id": "u1790626000010",
        "name": "System Admin",
        "nameAr": "System Admin",
        "role": "admin",
        "employeeCode": "ADM-001",
        "areaIds": [],
        "area": null,
        "areaId": null,
        "hireDate": "2021-01-01",
        "email": "admin@pharmacare.com",
        "phone": "+20100111222",
        "status": "Active"
    },
    {
        "id": "u1790626000011",
        "name": "George Marzok",
        "nameAr": "George Marzok",
        "role": "business_unit",
        "employeeCode": "BU-001",
        "managerId": "u1790626000010",
        "areaIds": [],
        "area": null,
        "areaId": null,
        "hireDate": "2021-06-01",
        "email": "bu@pharmacare.com",
        "phone": "+20100222333",
        "lineId": "line1",
        "lineIds": [
            "line1",
            "line2"
        ],
        "status": "Active",
        "code": "BU-001",
        "productIds": [],
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        }
    },
    {
        "id": "u1790626000012",
        "name": "John Mahfouz",
        "nameAr": "John Mahfouz",
        "role": "line_manager",
        "employeeCode": "LM-001",
        "managerId": "u1790626000011",
        "lineId": "line1",
        "lineIds": [
            "line1",
            "line2"
        ],
        "areaIds": [],
        "area": null,
        "areaId": null,
        "hireDate": "2022-01-15",
        "email": "lm@pharmacare.com",
        "phone": "+20100333444",
        "status": "Active",
        "code": "LM-001",
        "productIds": [],
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        }
    },
    {
        "id": "u1790626000013",
        "name": "Mario Magdy",
        "nameAr": "Mario Magdy",
        "role": "line_manager",
        "employeeCode": "LM-002",
        "managerId": "u1790626000011",
        "lineId": "line_1790626036368",
        "lineIds": [
            "line_1790626036368"
        ],
        "areaIds": [],
        "area": null,
        "areaId": null,
        "email": "lm2@pharmacare.com",
        "code": "LM-002",
        "phone": "+20100444555",
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "hireDate": "2022-03-01",
        "status": "Active",
        "productIds": []
    },
    {
        "id": "u1790626000014",
        "name": "Amir Ayoup",
        "nameAr": "Amir Ayoup",
        "role": "district_manager",
        "employeeCode": "DM-001",
        "managerId": "u1790626000012",
        "lineId": "line1",
        "lineIds": [
            "line1",
            "line2"
        ],
        "areaIds": [],
        "area": null,
        "areaId": null,
        "hireDate": "2023-01-10",
        "email": "dm@pharmacare.com",
        "phone": "+20100555666",
        "status": "Active",
        "code": "DM-001",
        "productIds": [],
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        }
    },
    {
        "id": "u1790626000015",
        "name": "Jonathan Erian",
        "nameAr": "Jonathan Erian",
        "role": "district_manager",
        "employeeCode": "DM-002",
        "managerId": "u1790626000012",
        "lineId": "line1",
        "lineIds": [
            "line1",
            "line2"
        ],
        "areaIds": [],
        "area": null,
        "areaId": null,
        "hireDate": "2023-02-15",
        "email": "dm2@pharmacare.com",
        "phone": "+20100666777",
        "status": "Active",
        "code": "DM-002",
        "productIds": [],
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        }
    },
    {
        "id": "u1790626000016",
        "name": "Marian Magdy",
        "nameAr": "Marian Magdy",
        "role": "district_manager",
        "employeeCode": "DM-003",
        "managerId": "u1790626000013",
        "lineId": "line_1790626036368",
        "lineIds": [
            "line_1790626036368"
        ],
        "areaIds": [],
        "area": null,
        "areaId": null,
        "email": "dm3@pharmacare.com",
        "code": "DM-003",
        "phone": "+20100777888",
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "hireDate": "2023-05-01",
        "status": "Active",
        "productIds": []
    },
    {
        "id": "u1790626000001",
        "name": "Marco Magdy",
        "nameAr": "Marco Magdy",
        "role": "medical_rep",
        "employeeCode": "REP-001",
        "managerId": "u1790626000014",
        "areaId": "area1",
        "lineId": "line1",
        "lineIds": [
            "line1"
        ],
        "email": "rep@pharmacare.com",
        "code": "REP-001",
        "phone": "+201001234567",
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "area": "Mohndseen, Bolak El Dakror",
        "areaIds": [
            "area1",
            "area_line1_1790688157353"
        ],
        "hireDate": "2024-01-15",
        "status": "Active",
        "productIds": []
    },
    {
        "id": "u1790626000002",
        "name": "Kerolos Boules",
        "nameAr": "Kerolos Boules",
        "role": "medical_rep",
        "employeeCode": "REP-002",
        "managerId": "u1790626000015",
        "areaId": "area_line1_1790674637363",
        "lineId": "line1",
        "lineIds": [
            "line1"
        ],
        "areaIds": [
            "area_line1_1790674637363"
        ],
        "area": "Giza",
        "hireDate": "2024-02-01",
        "email": "rep2@pharmacare.com",
        "phone": "+201001234568",
        "status": "Active",
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "code": "REP-002",
        "productIds": []
    },
    {
        "id": "u1790626000003",
        "name": "Mina Mikhael",
        "nameAr": "Mina Mikhael",
        "role": "medical_rep",
        "employeeCode": "REP-003",
        "managerId": "u1790626000015",
        "areaId": "area_line1_1790674718201",
        "lineId": "line1",
        "lineIds": [
            "line1"
        ],
        "areaIds": [
            "area_line1_1790674718201"
        ],
        "area": "Fisal",
        "hireDate": "2024-03-10",
        "email": "rep3@pharmacare.com",
        "phone": "+201001234569",
        "status": "Active",
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "code": "REP-003",
        "productIds": []
    },
    {
        "id": "u1790626000004",
        "name": "David Emad",
        "nameAr": "David Emad",
        "role": "medical_rep",
        "employeeCode": "REP-004",
        "managerId": "u1790626000014",
        "areaId": "area_line2_1790674745627",
        "lineId": "line2",
        "lineIds": [
            "line2"
        ],
        "areaIds": [
            "area_line2_1790674745627",
            "area_line2_1790688168385"
        ],
        "area": "Mohndseen, Bolak El Dakror",
        "hireDate": "2024-04-01",
        "email": "rep4@pharmacare.com",
        "phone": "+201001234570",
        "status": "Active",
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "code": "REP-004",
        "productIds": []
    },
    {
        "id": "u1790626000017",
        "name": "Fatma El-Sherif",
        "nameAr": "Fatma El-Sherif",
        "role": "hr",
        "employeeCode": "HR-001",
        "email": "hr@pharmacare.com",
        "managerId": "u1790626000010",
        "areaIds": [],
        "area": null,
        "areaId": null,
        "hireDate": "2021-02-01",
        "phone": "+20100888999",
        "status": "Active",
        "leaveBalance": {
            "annual": 21,
            "sick": 7,
            "emergency": 6,
            "unpaid": 0,
            "maternity": 90
        }
    },
    {
        "id": "u1790626000018",
        "name": "Mina Kadry",
        "nameAr": "Mina Kadry",
        "role": "product_manager",
        "employeeCode": "PM-001",
        "email": "pm@pharmacare.com",
        "phone": "+20100999111",
        "managerId": "u1790626000011",
        "lineId": "line1",
        "lineIds": [
            "line1"
        ],
        "productIds": [
            "prod1",
            "prod2",
            "prod3",
            "prod4",
            "prod_1790625546491",
            "prod_1790625561525",
            "prod_1790625585077",
            "prod_1790625595399",
            "prod_1790625604666",
            "prod_1790625614666",
            "prod_1790625622736",
            "prod_1790625631058"
        ],
        "status": "Active",
        "hireDate": "2023-01-01",
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "areaIds": [],
        "area": null,
        "areaId": null,
        "code": "PM-001"
    },
    {
        "id": "u1790626000005",
        "name": "Mohamed Ramadan",
        "nameAr": "Mohamed Ramadan",
        "role": "medical_rep",
        "employeeCode": "REP-005",
        "email": "rep5@pharmacare.com",
        "phone": "+20100999222",
        "managerId": "u1790626000015",
        "lineId": "line1",
        "lineIds": [
            "line1"
        ],
        "productIds": [],
        "status": "Active",
        "hireDate": "2023-06-01",
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "areaIds": [
            "area_line1_1790674592471",
            "area_line1_1790688137857"
        ],
        "area": "Dokki, Haram",
        "areaId": "area_line1_1790674592471",
        "code": "REP-005"
    },
    {
        "id": "u1790626000019",
        "name": "Fady Adel",
        "nameAr": "Fady Adel",
        "email": "pm2@pharmacare.com",
        "code": "PM-002",
        "employeeCode": "PM-002",
        "role": "product_manager",
        "passwordHash": "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
        "phone": "",
        "hireDate": "2026-09-28",
        "managerId": "u1790626000011",
        "status": "Active",
        "lineIds": [
            "line2"
        ],
        "lineId": "line2",
        "productIds": [
            "prod5",
            "prod6"
        ],
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "area": null,
        "areaId": null,
        "areaIds": []
    },
    {
        "id": "u1790626669586",
        "name": "Mark Michel",
        "email": "rep7@pharmacare.com",
        "code": "REP-007",
        "employeeCode": "REP-007",
        "role": "medical_rep",
        "passwordHash": "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
        "phone": "",
        "hireDate": "2026-09-28",
        "managerId": "u1790626000016",
        "status": "Active",
        "lineIds": [
            "line_1790626036368"
        ],
        "lineId": "line_1790626036368",
        "productIds": [],
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "area": "Shobra",
        "areaId": "area_line_1790626036368_1790674874231",
        "areaIds": [
            "area_line_1790626036368_1790674874231"
        ]
    },
    {
        "id": "u1790626607816",
        "name": "Ahmed Harb",
        "email": "rep6@pharmacare.com",
        "code": "REP-006",
        "employeeCode": "REP-006",
        "role": "medical_rep",
        "passwordHash": "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
        "phone": "01202379833",
        "hireDate": "2026-09-28",
        "managerId": "u1790626000015",
        "status": "Active",
        "lineIds": [
            "line2"
        ],
        "lineId": "line2",
        "productIds": [],
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "area": "Giza",
        "areaId": "area_line2_1790674781879",
        "areaIds": [
            "area_line2_1790674781879"
        ]
    },
    {
        "id": "u1790687949946",
        "name": "Mina Samir",
        "email": "rep9@pharmacare.com",
        "code": "REP-009",
        "employeeCode": "REP-009",
        "role": "medical_rep",
        "passwordHash": "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
        "phone": "+201001234567",
        "hireDate": "2026-09-29",
        "managerId": "u1790626000016",
        "status": "Active",
        "lineIds": [
            "line_1790626036368"
        ],
        "lineId": "line_1790626036368",
        "productIds": [],
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "area": "Mohndseen",
        "areaId": "area_line_1790626036368_1790687909664",
        "areaIds": [
            "area_line_1790626036368_1790687909664"
        ]
    },
    {
        "id": "u1790688369929",
        "name": "Marina Shobra",
        "email": "rep11@pharmacare.com",
        "code": "REP-011",
        "employeeCode": "REP-011",
        "role": "medical_rep",
        "passwordHash": "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
        "phone": "",
        "hireDate": "2026-09-29",
        "managerId": "u1790626000014",
        "status": "Active",
        "lineIds": [
            "line1"
        ],
        "lineId": "line1",
        "productIds": [],
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "area": "Shobra",
        "areaId": "area_line1_1790688305597",
        "areaIds": [
            "area_line1_1790688305597"
        ]
    },
    {
        "id": "u1790688412219",
        "name": "Monica Shobra",
        "email": "rep12@pharmacare.com",
        "code": "REP-012",
        "employeeCode": "REP-012",
        "role": "medical_rep",
        "passwordHash": "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
        "phone": "",
        "hireDate": "2026-09-29",
        "managerId": "u1790626000014",
        "status": "Active",
        "lineIds": [
            "line2"
        ],
        "lineId": "line2",
        "productIds": [],
        "leaveBalance": {
            "annual": 21,
            "casual": 6,
            "emergency": 6,
            "sick": 7,
            "unpaid": 0,
            "maternity": 90
        },
        "area": "Shobra",
        "areaId": "area_line2_1790688317554",
        "areaIds": [
            "area_line2_1790688317554"
        ]
    }
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
    { id: "area1", name: "Nasr City", code: "CAI-N01", repId: "u1790626000001", lineId: "line1" },
    { id: "area2", name: "Heliopolis", code: "CAI-H01", repId: "u1790626000002", lineId: "line1" },
    { id: "area3", name: "Nasr City", code: "CAI-N01", repId: "u1790626000004", lineId: "line2" },
    { id: "area4", name: "Maadi", code: "CAI-M01", repId: null, lineId: "line2" },
  ],
  productLines: [
    {
      id: "line1",
      name: "Cardio Line",
      nameAr: "خط الكارديو (Cardio)",
      status: "Active",
      lineManagerId: "u1790626000012",
      lineManagerName: "Line Manager",
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
      nameAr: "خط النيورو (Neuro)",
      status: "Active",
      lineManagerId: "u1790626000013",
      lineManagerName: "Line Manager",
      callFrequency: { classA: 4, classB: 2, classC: 1 },
      products: [
        { id: "prod5", name: "Pregabalin 75mg", dosage: "75mg", form: "Capsule" },
        { id: "prod6", name: "Carbamazepine 200mg", dosage: "200mg", form: "Tablet" },
      ],
    },
  ],
  doctors: [],
  hospitals: [],
  pharmacies: [
  {
    "id": "p1",
    "name": "Al-Ezaby Pharmacy",
    "nameAr": "صيدلية العزبي",
    "address": "15 Abbas Al-Akkad, Nasr City",
    "phone": "01001112233",
    "contactPerson": "Mohamed Ibrahim",
    "areaId": "area1",
    "repId": "u1790626000001",
    "lineId": "line1",
    "area": "Mohndseen"
  },
  {
    "id": "p2",
    "name": "Seif Pharmacy",
    "nameAr": "صيدلية سيف",
    "address": "28 Mostafa El-Nahas, Nasr City",
    "phone": "01009998877",
    "contactPerson": "Youssef Ahmed",
    "areaId": "area1",
    "repId": "u1790626000001",
    "lineId": "line1",
    "area": "Mohndseen"
  },
  {
    "id": "p3",
    "name": "Roshdy Pharmacy",
    "nameAr": "صيدلية رشدي",
    "address": "5 Tayaran St, Nasr City",
    "phone": "01155566677",
    "contactPerson": "Ramy Adel",
    "areaId": "area1",
    "repId": "u1790626000001",
    "lineId": "line1",
    "area": "Mohndseen"
  },
  {
    "id": "p4",
    "name": "19011 Pharmacy",
    "nameAr": "صيدلية 19011",
    "address": "42 Makram Ebeid, Nasr City",
    "phone": "01234567890",
    "contactPerson": "Sara Maher",
    "areaId": "area1",
    "repId": "u1790626000001",
    "lineId": "line1",
    "area": "Mohndseen"
  },
  {
    "id": "p5",
    "name": "Misr Pharmacy",
    "nameAr": "صيدلية مصر",
    "address": "18 Al-Ahram St, Heliopolis",
    "phone": "01099887766",
    "contactPerson": "Hazem Tarek",
    "areaId": "area2",
    "repId": null,
    "lineId": "line1",
    "area": "Heliopolis"
  },
  {
    "id": "p6",
    "name": "El-Tarshouby Pharmacy",
    "nameAr": "صيدلية الطرشوبي",
    "address": "10 Abbas Al-Akkad, Nasr City",
    "phone": "01223344556",
    "contactPerson": "Mina Magdy",
    "areaId": "area1",
    "repId": "u1790626000001",
    "lineId": "line1",
    "area": "Mohndseen"
  },
  {
    "id": "p7",
    "name": "Dawaee Pharmacy",
    "nameAr": "صيدلية دوائي",
    "address": "25 Beirut St, Heliopolis",
    "phone": "01122334455",
    "contactPerson": "Hoda Sameh",
    "areaId": "area2",
    "repId": null,
    "lineId": "line1",
    "area": "Heliopolis"
  }
],
  visits: [],
  leaves: [],
  sales: [],
  announcements: [
    {
      id: "ann1",
      title: "Ramadan Working Hours",
      titleAr: "مواعيد العمل في رمضان",
      body: "Please note that working hours during Ramadan will be from 9 AM to 3 PM starting next week.",
      bodyAr:
        "يرجى العلم أن مواعيد العمل خلال شهر رمضان ستكون من 9 صباحاً حتى 3 عصراً بدءاً من الأسبوع القادم.",
      priority: "high",
      createdBy: "u1790626000017",
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
      createdBy: "u1790626000017",
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
      createdBy: "u1790626000017",
      createdAt: "2026-08-25",
      read: false,
    },
  ],
  notifications: [
    {
      id: "notif_rep_1",
      userId: "u1790626000001",
      type: "plan_approval",
      title: "Field Plan Approved",
      message: "District Manager approved your field plan for 2026-09-20.",
      link: "calendar.html",
      read: false,
      createdAt: "2026-09-17T15:30:00Z",
      icon: "🗓️",
      badgeClass: "bg-success",
      actorName: "District Manager",
      action: "approved",
    },
    {
      id: "notif_rep_2",
      userId: "u1790626000001",
      type: "leave_approval",
      title: "Leave Request Approved",
      message: "HR Department approved your annual leave request.",
      link: "leaves.html",
      read: false,
      createdAt: "2026-09-17T14:15:00Z",
      icon: "🏖️",
      badgeClass: "bg-success",
      actorName: "HR Department",
      action: "approved",
    },
    {
      id: "notif_rep_3",
      userId: "u1790626000001",
      type: "visit_rejection",
      title: "Visit Directive / Rejection",
      message: "Visit for Dr. Ahmed Mostafa rejected with note: Please reschedule to morning period.",
      note: "Please reschedule to morning period",
      link: "visits.html",
      read: false,
      createdAt: "2026-09-17T11:00:00Z",
      icon: "❌",
      badgeClass: "bg-danger",
      actorName: "District Manager",
      action: "rejected",
    },
    {
      id: "notif_dm_1",
      userId: "u1790626000014",
      type: "plan_submission",
      title: "Field Plan for Review",
      message: "Medical Rep submitted a new field plan for your review.",
      link: "plans-review.html",
      read: false,
      createdAt: "2026-09-17T13:00:00Z",
      icon: "📋",
      badgeClass: "bg-primary",
      actorName: "Medical Rep",
      action: "submitted",
    },
    {
      id: "notif_dm_2",
      userId: "u1790626000014",
      type: "leave_submission",
      title: "New Leave Request",
      message: "Annual leave request submitted (2 days) awaiting your approval.",
      link: "leaves.html",
      read: false,
      createdAt: "2026-09-17T10:00:00Z",
      icon: "🏖️",
      badgeClass: "bg-warning",
      actorName: "Medical Rep",
      action: "submitted",
    },
    {
      id: "notif_hr_1",
      userId: "u1790626000017",
      type: "leave_submission",
      title: "Leave Request Final Approval",
      message: "Line Manager approved leave, awaiting HR final confirmation.",
      link: "leaves.html",
      read: false,
      createdAt: "2026-09-17T12:30:00Z",
      icon: "🏖️",
      badgeClass: "bg-info",
      actorName: "Line Manager",
      action: "approved",
    },
  ],
  distributors: [
    { id: "dist1", name: "Ibn Sina Pharma", type: "commercial", columnMap: null },
    { id: "dist2", name: "United Company of Pharmacists (UCP)", type: "commercial", columnMap: null },
    { id: "dist3", name: "Overseas", type: "commercial", columnMap: null },
  ],
  pharmacyOverrides: [],
  publicHolidays: [{ date: "2026-10-06", title: "Armed Forces Day", titleAr: "عيد القوات المسلحة" }],
};; console.log(Object.keys(data));