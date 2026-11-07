# دليل الانتقال إلى باك إند مخصص
# (Frontend to Dedicated Backend Migration Roadmap)

> **وثيقة معمارية مرجعية:** هذا الملف يشرح بدقة كل ما سيتم تغييره أو حذفه في ملفات الـ Frontend الحالية عندما تبدأ في بناء الـ Backend المخصص (Node.js / Express / NestJS / Python / FastAPI / PHP Laravel أو أي تقنية تختارها).

---

## 🎯 الفكرة الجوهرية (The Golden Rule)

النظام حالياً مبني وفق نمط **Store / Repository Pattern**.  
هذا يعني أن **شاشات الـ HTML والـ CSS (أكثر من 15 شاشة) لن يتغير فيها سطر كود واحد خاص بالواجهة (UI)!**

* الشاشات لا تعرف فايربيز ولا تعرف السيرفر، بل تتحدث دائماً مع كائن وسيط: `window.store`.
* عندما تبني الـ Backend، التغيير سينحصر فقط في **طبقة الوسيط (`store.js` و `auth-service.js`)** لتحويلها من القراءة والكتابة في `localStorage` إلى إرسال واستقبال طلبات شبكة (`fetch` / `axios`).

---

## 📂 1. خريطة الملفات: ما الذي سيُحذف وما الذي سيُعدل؟

### أ) ملفات سيتم حذفها نهائياً (Files to Delete):
عندما يصبح لديك سيرفر خاص، لن تحتاج إلى فايربيز نهائياً:
1. `js/firebase-config.js` ❌ (يُحذف - لا حاجة لمفاتيح فايربيز).
2. `js/firebase-sync.js` ❌ (يُحذف - انتهت مهمة رفع الـ Document الواحد).
3. سكريبتات فايربيز في ترويسات الـ HTML:
   ```html
   <!-- هذه الأسطر تُحذف من جميع صفحات الـ HTML -->
   <script src="https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore-compat.js"></script>
   <script src="js/firebase-config.js"></script>
   <script src="js/firebase-sync.js"></script>
   ```

---

### ب) ملفات سيتم تعديلها داخلياً فقط (Files to Refactor):

#### 1. `js/store.js` (قلب النظام - أكبر تعديل)
* **الوضع الحالي:** يقرأ ويكتب البيانات في `localStorage` ومصفوفات `DEMO_DATA`.
* **الوضع الجديد مع الـ Backend:** تحويل كل دالة إلى دالة غير متزامنة (`async`) تستدعي الـ API.
* **مثال عملي (Before & After):**

```javascript
// ==========================================
// الوضع الحالي في js/store.js (Local):
// ==========================================
visits: {
  getAll() {
    return window.DEMO_DATA.visits || [];
  },
  add(visitObj) {
    window.DEMO_DATA.visits.unshift(visitObj);
    localStorage.setItem("pharma_master_data", JSON.stringify(window.DEMO_DATA));
    return visitObj;
  }
}

// ==========================================
// الوضع الجديد مع الـ Backend (REST API):
// ==========================================
visits: {
  async getAll(filters = {}) {
    const query = new URLSearchParams(filters).toString();
    const res = await apiRequest(`/api/visits?${query}`);
    return res.data; // مصفوفة الزيارات القادمة من قاعدة البيانات
  },
  async add(visitObj) {
    const res = await apiRequest("/api/visits", "POST", visitObj);
    return res.data; // الزيارة بعد حفظها وتوليد الـ ID في السيرفر
  }
}
```

---

#### 2. `js/auth-service.js` (الأمان والجلسات)
* **الوضع الحالي:** يفحص دور المستخدم محلياً ويعتمد على توقيع Salt بسيط في المتصفح.
* **الوضع الجديد مع الـ Backend:**
  1. استقبال **JWT Access Token** عند تسجيل الدخول وحفظه في الذاكرة أو `HttpOnly Cookie`.
  2. كل طلب للباك إند يرسل التوكن تلقائياً في الـ Headers:
     ```javascript
     headers: {
       "Authorization": `Bearer ${token}`,
       "Content-Type": "application/json"
     }
     ```
  3. حماية المسارات: عند فتح أي صفحة، فحص صلاحية التوكن عبر طلب خفيف: `GET /api/auth/me`. إذا انتهت الجلسة يتم التحويل لصفحة `login.html`.

---

#### 3. `js/login.js` (تسجيل الدخول)
* **الوضع الحالي:** يبحث عن الإيميل والباسورد داخل مصفوفة المستخدمين المحملة في المتصفح.
* **الوضع الجديد مع الـ Backend:**
  إرسال بيانات الاعتماد للسيرفر فقط:
  ```javascript
  // في دالة handleLogin داخل login.js:
  async function handleLogin(email, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Login failed');

      // حفظ التوكن وبيانات المستخدم المسجلة
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));

      // التوجيه للصفحة المناسبة حسب الدور
      window.location.href = data.user.role === 'admin' ? 'users.html' : 'dashboard.html';
    } catch (err) {
      showLoginError(err.message);
    }
  }
  ```

---

#### 4. `js/app.js` (تنظيف الداتا الوهمية)
* **الوضع الحالي:** يحتوي على كائن `DEMO_DATA` ضخم (أطباء وهميين، صيدليات، مستخدمين).
* **الوضع الجديد مع الـ Backend:**
  * حذف كائن `DEMO_DATA` تماماً.
  * البيانات تأتي مباشرة من الـ Database عبر الـ API.

---

## 🌐 2. خريطة الـ Endpoints المطلوبة في الـ Backend

هذه قائمة الـ API Endpoints المعيارية التي ستحتاج لبنائها في السيرفر لخدمة الـ Frontend:

### 🔐 Auth & Identity (المصادقة والمستخدمين)
* `POST /api/auth/login` ➔ تسجيل الدخول والتحقق من كلمة المرور وإرجاع JWT Token.
* `POST /api/auth/logout` ➔ إنهاء الجلسة وإلغاء التوكن.
* `GET  /api/auth/me` ➔ جلب بيانات المستخدم الحالي وصلاحياته.
* `GET  /api/users` ➔ جلب قائمة المستخدمين (للأدمن والمديرين).
* `POST /api/users` ➔ إضافة موظف جديد وتعيين خطوط البيع والمدير المباشر.
* `PUT  /api/users/:id` ➔ تعديل بيانات الموظف (التارجت اليومي، الرصيد، الصلاحية).

### 🩺 Doctors & Directory (الدليل الطبي)
* `GET  /api/doctors` ➔ قائمة الأطباء (يدعم الفلترة بالمنطقة والخط والكلاس والمندوب).
* `POST /api/doctors` ➔ إضافة طبيب جديد.
* `PUT  /api/doctors/:id` ➔ تعديل بيانات طبيب أو موقعه الجغرافي (GPS Pin).
* `GET  /api/hospitals` ➔ قائمة المستشفيات والمراكز الطبية.
* `GET  /api/pharmacies` ➔ قائمة الصيدليات الشريكة.

### 🚗 Visits & Field Operations (الزيارات الميدانية)
* `GET  /api/visits` ➔ قائمة الزيارات (مع بارامترات التاريخ، المندوب، الحالة).
* `POST /api/visits` ➔ تسجيل زيارة فعلية مع فحص المسافة الجغرافية (GPS Validation).
* `PUT  /api/visits/:id` ➔ اعتماد الزيارة أو تعديل ملاحظات الكول.
* `GET  /api/visits/backlog-check` ➔ التحقق من سماحية تسجيل زيارة بأثر رجعي.

### 🌴 Leaves & Activities (الإجازات والأنشطة)
* `GET  /api/leaves` ➔ قائمة الإجازات الخاصة بالمستخدم أو فريقه.
* `POST /api/leaves` ➔ طلب إجازة جديدة مع فحص التداخل مع العطلات الرسمية.
* `PUT  /api/leaves/:id/status` ➔ موافقة أو رفض الإجازة من المدير أو HR.
* `GET  /api/activities` ➔ الأنشطة اليومية وأعمال المكتب والمؤتمرات.
* `POST /api/activities` ➔ تسجيل نشاط ميداني أو مشاركة في مؤتمر.

### 📊 Sales & Reports (المبيعات والـ SOPs)
* `GET  /api/sales/distributors` ➔ جلب مبيعات الموزعين وشيتات السيلز.
* `GET  /api/reports/sops` ➔ تقرير الـ SOPs مجمعاً من السيرفر (Working days, Target, Actual).
* `GET  /api/reports/coverage` ➔ حسابات التغطية والفريكونسي ومعدل الدوران.

---

## 🗄️ 3. تصميم قاعدة البيانات المقترح (Database Schema Blueprint)

بدلاً من ملف الـ `master_data.json` المجمع، ستقوم بإنشاء الجداول / المجموعات التالية في قاعدة بياناتك:

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │◀─────▶│  user_lines  │◀─────▶│ product_lines│
└──────────────┘       └──────────────┘       └──────────────┘
       ▲                      ▲
       │                      │
       ▼                      ▼
┌──────────────┐       ┌──────────────┐
│    visits    │──────▶│   doctors    │
└──────────────┘       └──────────────┘
       │                      │
       ▼                      ▼
┌──────────────┐       ┌──────────────┐
│  activities  │       │  territories │
└──────────────┘       └──────────────┘
```

1. **`users`**: `id`, `name`, `email`, `password_hash`, `role`, `manager_id`, `daily_target`, `status`.
2. **`doctors`**: `id`, `name`, `specialty`, `class` (A/B), `lat`, `lng`, `territory_id`, `brick`.
3. **`visits`**: `id`, `rep_id`, `doctor_id`, `date`, `time`, `status` (completed/planned), `type` (single/double), `gps_status`, `feedback`.
4. **`leaves`**: `id`, `user_id`, `start_date`, `end_date`, `type` (annual/casual/sick), `status`, `days_count`.
5. **`activities`**: `id`, `user_id`, `date`, `period` (AM/PM), `type` (office/conference/training), `status`.
6. **`company_settings`**: `weekend_policy`, `default_daily_target`, `gps_max_distance_meters`.

---

## 🚀 4. خطوات تنفيذ التحويل متى قررت البدء (Migration Steps)

عندما تقرر بدء بناء الـ Backend، اتبع هذا الترتيب المنطقي:

1. **الخطوة الأولى (إنشاء السيرفر وقاعدة البيانات):**
   * جهز الـ Backend والـ Database بناءً على الـ Endpoints والـ Schema الموضحة أعلاه.
   * برمج عمليات الـ Auth وتشفير الباسوردات بـ `bcrypt`.

2. **الخطوة الثانية (إنشاء ملف `js/api-client.js`):**
   * أنشئ ملفاً بسيطاً لإدارة الـ HTTP Requests وإضافة الـ JWT Token تلقائياً في الـ Header والتعامل مع أخطاء الشبكة.

3. **الخطوة الثالثة (ربط `store.js` بالـ API):**
   * عدّل الدوال داخل `store.js` لتنادي `apiClient` بدلاً من `localStorage`.

4. **الخطوة الرابعة (حذف الفايربيز والداتا الوهمية):**
   * احذف ملفات `firebase-*.js`.
   * احذف مصفوفة `DEMO_DATA` من `app.js`.

5. **الخطوة الخامسة (الاختبار والتأكيد):**
   * جرّب تسجيل الدخول بحساب حقيقي من الـ Database.
   * سجّل زيارة من صفحة الزيارات وتأكد من حفظها في جدول `visits` بالسيرفر.

---

> 💡 **ملاحظة للمستقبل:** هذا الملف محفوظ الآن داخل جذر المشروع باسم `BACKEND_MIGRATION_ROADMAP.md` ليكون دليلك الشامل عند اتخاذ قرار بناء السيرفر المخصص في أي وقت.
