# PharmaCare Backend (Supabase + Vercel Free Stack)

باك إند منفصل تماماً عن ملفات الفرونت إند الحالية — يعتمد على:
- **Node.js + Express** (يعمل محلياً أو كـ Serverless على **Vercel Free**).
- **Supabase PostgreSQL** (500MB مجاناً).
- **Supabase Storage** (1GB مجاناً لرفع صور فواتير المصاريف ومرفقات الإجازات حتى 5MB للملف).

## خطوات التشغيل السريعة (5 دقائق)

### 1. تجهيز Supabase (مجاني بدون فيزا)
1. أنشئ مشروعاً جديداً على [supabase.com](https://supabase.com).
2. افتح **SQL Editor** والصق محتوى ملف `supabase/schema.sql` واضغط **Run**.
3. افتح **Storage** ← **New Bucket** باسم `pharmacare-uploads` (اجعله **Private** لأن السيرفر يولّد Signed URLs آمنة).
4. من **Project Settings → Database** انسخ رابط الاتصال (`Connection string` - Transaction Pooler) ومن **Project Settings → API** انسخ `SUPABASE_URL` و `service_role` key.

### 2. التشغيل المحلي للتجربة
```bash
cd backend
cp .env.example .env
# عدّل القيم داخل .env
npm install
npm run dev
```
اختبر الصحة عبر: `GET http://localhost:4000/api/health`

### 3. ترحيل بياناتك الحالية من Firestore (اختياري)
```bash
FIREBASE_API_KEY=... FIREBASE_ADMIN_EMAIL=admin@pharmacare.com FIREBASE_ADMIN_PASSWORD=... npm run migrate:firestore
```

### 4. الرفع مجاناً على Vercel
- أنشئ مشروعاً جديداً على Vercel واجعل **Root Directory** = `backend` (أو نفّذ `vercel` من داخل مجلد `backend`).
- أضف متغيرات `.env` في **Vercel Environment Variables** وانشر!

## الـ Endpoints المتوفرة حالياً
- `GET  /api/health` — فحص اتصال السيرفر وPostgreSQL.
- `POST /api/auth/login` — تسجيل دخول بالبريد + bcrypt + Rate Limit (5 محاولات/15 دقيقة).
- `GET  /api/auth/me` — بيانات المستخدم الحالي من JWT.
- `PUT  /api/auth/password` — تغيير كلمة المرور للمستخدم الحالي.
- `POST /api/auth/confirm-reset` — تفعيل كلمة المرور الجديدة برمز الاستعادة.
- `GET/POST /api/users` — إدارة الموظفين (Admin/HR فقط للإضافة، مقيد بالشجرة للمديرين).
- `POST /api/users/:id/reset-password` — إصدار رابط/رمز استعادة مؤقت (30 دقيقة) وتسجيله في `audit_logs`.
- `GET/POST /api/visits` — تسجيل وجلب الزيارات مع `idempotencyKey` ومنع كتابة `general_manager`.
- `POST /api/uploads/receipts` — رفع صور الفواتير/PDF (حد 5MB) إلى Supabase Storage.
- `GET/POST /api/leaves` و `PUT /api/leaves/:id/decision` — إدارة الإجازات والاعتمادات المتسلسلة (منع الموافقة الذاتية + GM عرض فقط).
- `GET/POST /api/expenses` و `PUT /api/expenses/:id/decision` — المصاريف بآلة حالات صارمة (`approve` / `reject` / `disburse`).
- `GET/POST /api/services` و `PUT /api/services/:id/decision` — الخدمات والخدمات المشتركة داخل Database Transactions ذرية.
- `GET /api/reports/achievements` و `GET /api/reports/costing` — تقارير الإنجازات (بـ `territory_history` SCD Type 2) والتكاليف (مع حظر HR).
