# WorkDex — Qurilish va Ta'mirlash Loyihalarini Boshqarish Tizimi (Backend API)

ASP.NET Core 8 Web API, PostgreSQL, Entity Framework Core va JWT autentifikatsiyasiga asoslangan loyiha boshqaruvi tizimi.

---

## 🚀 Texnologik Stek
- **Platforma:** .NET 8 (ASP.NET Core Web API)
- **Ma'lumotlar bazasi:** PostgreSQL
- **ORM:** Entity Framework Core 8 (Code-First Migrations)
- **Xavfsizlik:** JWT Bearer Token, Role-Based Authorization
- **Hisobotlar:** ClosedXML (9 varaqli Excel eksport)
- **API Hujjatlari:** Swagger / OpenAPI 3.0

---

## 👥 Foydalanuvchi Rollari va Huquqlari
1. **Admin (1):** Barcha tizim funksiyalariga to'liq ruxsat.
2. **ProjectManager (2):** Loyihalar, bosqichlar, vazifalar, materiallar, xarajatlar va fotosuratlar boshqaruvi.
3. **FieldWorker (3):** Saha xodimi — vazifalarni bajarish, fotosuratlar va kunlik yangilanishlarni kiritish.
4. **Finance (4):** Moliyaviy operatsiyalar — mijoz to'lovlari, xarajatlar, usta to'lovlari va hisobotlar.
5. **Customer (5):** Mijoz portali — faqat o'z loyihasining holati, to'lovlari, fotosuratlari va progressini ko'rish (ichki xarajatlar yashiringan).

---

## 📦 Asosiy Modullar va API Endpointlar

### 1. Autentifikatsiya va Foydalanuvchilar (`/api/auth`, `/api/users`)
- `POST /api/auth/register` — Ro'yxatdan o'tish
- `POST /api/auth/login` — Tizimga kirish (JWT token olish)
- `GET /api/users/me` — Joriy profil ma'lumotlari
- `GET /api/users` — Barcha xodimlar ro'yxati

### 2. Mijozlar (`/api/customers`)
- `GET /api/customers` — Mijozlar ro'yxati
- `POST /api/customers` — Yangi mijoz qo'shish
- `GET /api/customers/{id}` — Mijoz profili va uning barcha loyihalari

### 3. Loyihalar va Bosqichlar (`/api/projects`)
- `GET /api/projects` — Loyihalar ro'yxati
- `POST /api/projects` — Yangi loyiha yaratish
- `GET /api/projects/{id}` — Loyiha to'liq ma'lumotlari
- `PATCH /api/projects/{id}/status` — Loyiha holatini o'zgartirish
- `GET /api/projects/{id}/summary` — Moliyaviy va umumiy xulosa
- `POST /api/projects/{id}/stages` — Bosqich qo'shish (Demontaj, Qurilish, Elektr va h.k.)
- `POST /api/projects/{id}/members` — Loyihaga xodimlarni biriktirish

### 4. Moliya va To'lovlar (`/api/projects/{id}/payments`, `/api/projects/{id}/expenses`)
- `POST /api/projects/{id}/payments` — Mijozdan to'lov qabul qilish (Bank, Naqd, Karta)
- `GET /api/projects/{id}/payments` — To'lovlar tarixi
- `POST /api/projects/{id}/expenses` — Xarajat kiritish (7 ta kategoriya: Labor, Material, Transport, Fuel, Subcontractor, Extra, Other)
- `GET /api/projects/{id}/expenses` — Xarajatlar ro'yxati (kategoriya bo'yicha filtr bilan)

### 5. Materiallar va Xaridlar (`/api/materials`, `/api/projects/{id}/material-purchases`)
- `GET /api/materials` — Umumiy materiallar katalogi
- `POST /api/materials` — Yangi material qo'shish (kg, m², dona, m³...)
- `POST /api/projects/{id}/material-purchases` — Loyihaga material xaridini biriktirish
- `GET /api/projects/{id}/materials-summary` — Qaysi materialdan jami qancha sarflangani tahlili

### 6. Ustalar va Ish haqlari (`/api/workers`, `/api/projects/{id}/worker-payments`)
- `GET /api/workers` — Ustalar katalogi (Kafelchi, Suvoqchi, Elektrik...)
- `POST /api/projects/{id}/worker-payments` — Loyihaga usta ishini biriktirish
- `PATCH /api/projects/{id}/worker-payments/{id}/work-amount` — Bajarilgan ish haqini tasdiqlash
- `PATCH /api/projects/{id}/worker-payments/{id}/pay` — Ustaga haq to'lash
- `GET /api/projects/{id}/workers-summary` — Ustalar bo'yicha qoldiq qarzdorlik balansi

### 7. Qo'shimcha Ishlar (`/api/projects/{id}/extra-works`)
- `POST /api/projects/{id}/extra-works` — Kutilmagan/qo'shimcha ish yaratish
- `PATCH /api/projects/{id}/extra-works/{id}/toggle-approval` — Mijoz tasdig'ini o'zgartirish

### 8. Vazifalar va Avtomatik Progress (`/api/projects/{id}/tasks`)
- `POST /api/projects/{id}/tasks` — Bosqichga vazifa qo'shish (og'irlik bilan)
- `PATCH /api/projects/{id}/tasks/{id}/toggle-complete` — Vazifani bajarildi deb belgilash
- **Avtomatik formula:** Bajarilgan vazifalar og'irligi asosida `ProgressPercent` avtomatik hisoblanadi.

### 9. Hujjatlar, Fotosuratlar va Yangilanishlar (`/api/projects/{id}/...`)
- `/documents` — Shartnomalar, hisob-fakturalar va chizmalar
- `/photos` — Progress fotosuratlari (`isVisibleToCustomer` filtri bilan)
- `/updates` — Saha xodimining kunlik/haftalik yangilanish xabarlari

### 10. Boshqaruv Dashboardi va Mijoz Portali (`/api/dashboard`, `/api/portal`)
- `GET /api/dashboard/stats` — Kompaniya umumiy daromad, xarajat, foyda va KPI statistikasi
- `GET /api/dashboard/recent-activities` — So'nggi operatsiyalar tasmasi
- `GET /api/portal/projects/{id}` — Mijoz uchun toza va xavfsiz portal

### 11. Excel Eksport (`/api/reports`)
- `GET /api/reports/projects/{id}/excel` — Loyiha bo'yicha 9 varaqli to'liq Excel hisoboti
- `GET /api/reports/all-projects/excel` — Barcha loyihalar konsolidatsiyalangan hisoboti

---

## 🛠️ Ishga tushirish (Setup)

1. **Repozitoriyani klonlash:**
   ```bash
   git clone <repo_url>
   cd WorkDex/WorkDex.Api
   ```

2. **Ma'lumotlar bazasini sozlash (`appsettings.Development.json`):**
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Host=localhost;Port=5432;Database=WorkDexDb;Username=postgres;Password=YOUR_PASSWORD"
   }
   ```

3. **Migratsiyalarni qo'llash:**
   ```bash
   dotnet ef database update
   ```

4. **Loyihani ishga tushirish:**
   ```bash
   dotnet run
   ```

5. **Swagger UI ga kirish:**
   Brauzeringizda oching: `http://localhost:5082/swagger`
