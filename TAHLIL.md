# WorkDex — Hujjat va kod bazasi tahlili

**Sana:** 2026-08-21
**Manba:** `WorkDex_Loyiha_Hujjati_Ozbekcha.pdf` (12 sahifa, 24 bo'lim) + `WorkDex` repozitoriysi (34 commit)

---

## Bir qarashda xulosa

Loyiha hujjatda ko'rsatilganidan ancha ilgarilab ketgan. Backend deyarli to'liq: hujjatda
talab qilingan **16 ta entity'ning 16 tasi ham** yozilgan, 19 controller, 14 servis, 6 migratsiya.
Frontend ham ishlaydi va TypeScript xatosiz kompilyatsiya bo'ladi.

Lekin uchta jiddiy muammo bor:

1. **Moliyaviy hisob-kitobda mantiqiy xato** — usta xarajati `PaidAmount` (to'langan pul)
   bo'yicha olinadi, `WorkAmount` (bajarilgan ish) bo'yicha emas. Natijada to'lanmagan usta
   haqi xarajatga kirmaydi va **foyda haqiqatdan yuqori ko'rinadi**.
2. **5 ta xavfsizlik teshigi**, ulardan ikkitasi tizimni to'liq egallashga imkon beradi.
3. **Mijoz portali frontendda umuman yo'q** — backend tayyor, UI yozilmagan.
   Bu hujjatning MVP ro'yxatidagi 13-band.

MVP bo'yicha holat: **16 banddan 11 tasi to'liq, 4 tasi yarim, 1 tasi yo'q.**

---

## 1. Hujjat nima talab qiladi

WorkDex — ta'mirlash kompaniyalari uchun **loyiha markazli** boshqaruv platformasi.
Markazda `Project` obyekti turadi; mijoz, to'lov, xarajat, material, usta, vazifa, hujjat,
foto va yangilanishlar shu loyihaga bog'lanadi.

Asosiy g'oya: rahbar bir ekranda loyihaga qancha pul kelgani, qancha qolgani, pul qayerga
ketgani, qaysi materialdan qancha ishlatilgani, ustalarga qancha to'langani va loyiha necha
foiz tugaganini ko'radi. Bularning barchasi Excel'ga chiqariladi.

## 2. Mavjud kod bazasi

| Qism | Texnologiya | Hajm |
|---|---|---|
| Backend | .NET 8 Web API, EF Core 8, PostgreSQL, JWT | 19 controller, 14 servis, 20 model, 6 migratsiya |
| Excel | ClosedXML 0.105.1 | 9 varaqli eksport |
| Frontend | React 19, Vite 8, React Router 7, Tailwind 3, axios | 11 sahifa, 3 komponent |
| Testlar | — | **0 ta** |

Barcha NuGet va npm paketlari aniq versiyaga qadalgan (pinned) — bu to'g'ri.
`dotnet` bu muhitda o'rnatilmagan, shuning uchun backend'ni kompilyatsiya qilib
tekshira olmadim. Frontend `npx tsc -b` — **xatosiz o'tdi**.

---

## 3. MVP talablari vs kod (hujjatning 20-bo'limi)

| # | Talab | Holat | Izoh |
|---|---|---|---|
| 1 | Login va rollar | ✅ | JWT + 6 rol (hujjatda 5 ta) |
| 2 | Mijozlarni boshqarish | ✅ | Frontendda tahrirlash/o'chirish yo'q |
| 3 | Loyiha yaratish | ⚠️ | Yaratish bor, lekin UI'da **tahrirlash, status o'zgartirish va o'chirish yo'q** |
| 4 | Loyiha moliyaviy xulosasi | ✅ | `/api/projects/{id}/summary` |
| 5 | To'lovlar | ✅ | 4 usul: naqd, bank, karta, boshqa |
| 6 | Xarajatlar | ⚠️ | Backend to'liq (7 kategoriya), lekin **UI'da xarajat tab'i yo'q** — modal yozilgan, uni ochadigan tugma yo'q (o'lik kod) |
| 7 | Materiallar va xaridlar | ✅ | Katalog + xarid + materiallar bo'yicha xulosa |
| 8 | Usta / hakediş | ✅ | Kelishilgan / bajarilgan / to'langan / qolgan |
| 9 | Qo'shimcha ishlar | ✅ | Mijoz tasdig'i bilan |
| 10 | Vazifalar va bosqichlar | ⚠️ | Vazifa to'liq. **Bosqich (stage) uchun UI yo'q** — `createStage`/`completeStage` hech qayerdan chaqirilmaydi |
| 11 | Progress foizi | ✅ | Og'irlik bo'yicha avtomatik — hujjatga to'g'ri mos |
| 12 | Dashboard | ⚠️ | KPI'lar bor, lekin oylik grafik **mock ma'lumot**; "yaqin topshiriladiganlar" yo'q |
| 13 | Mijoz portali | ❌ | **Backend tayyor, frontend UI umuman yo'q** |
| 14 | Foto va hujjat yuklash | ❌ | Haqiqiy fayl yuklash yo'q — faqat qo'lda URL yoziladi. Backendda `IFormFile` bitta ham yo'q |
| 15 | Asosiy hisobotlar | ✅ | |
| 16 | Alohida loyiha Excel | ✅ | 9 varaq |
| 17 | Barcha loyihalar Excel | ⚠️ | Bor, lekin **faqat 1 varaq** va **filtr yo'q** |

---

## 4. Ma'lumotlar modeli — 16/16 ✅

Hujjatning 14-bo'limidagi barcha obyektlar mavjud: `User`, `Customer`, `Project`,
`ProjectMember`, `ProjectStage`, `Task` (`ProjectTask` deb nomlangan), `Payment`, `Expense`,
`Material`, `MaterialPurchase`, `Worker`, `WorkerPayment`, `ExtraWork`, `Document`
(`ProjectDocument`), `ProjectPhoto`, `ProjectUpdate`.

Nomdagi farqlar: hujjatda "Shartnoma qiymati", kodda `ContractAmount`. `ProjectTask.Weight`
maydoni bor — progressni og'irlik bilan hisoblash uchun, bu hujjatga to'g'ri mos keladi.

Kichik kamchiliklar:
- `ProjectPhoto`'da "oldin / keyin" belgisi yo'q, garchi hujjatning 12-bo'limi buni talab qilsa.
- `ProjectStage`'da reja sana va og'irlik yo'q.
- `Project`'da `ActualCost` maydoni yo'q — har safar qaytadan hisoblanadi (bu o'zi yomon emas).

---

## 5. Avtomatik hisob-kitoblar (hujjatning 15-bo'limi)

| Hujjatdagi formula | Kodda | Baho |
|---|---|---|
| Qolgan to'lov = Shartnoma – olingan | `ContractAmount + tasdiqlangan qo'shimcha ishlar – totalPaid` | ✅ hatto yaxshiroq |
| Jami xarajat = material + mehnat + boshqa | material + mehnat + boshqa + qo'shimcha ish tannarxi | ✅ |
| Byudjetdan foydalanish | `TotalExpenses / Budget × 100` | ✅ |
| Yalpi natija = Daromad – xarajat | `GrossProfit` | ✅ |
| Qolgan usta haqi = hakediş – to'langan | ⚠️ **ikki joyda turlicha** | pastga qarang |
| Progress = bajarilgan og'irlik / jami og'irlik × 100 | aynan shunday | ✅ |
| Taxminiy natija | alohida maydon yo'q — `GrossProfit` bilan bir xil qiymat | ⚠️ |

### ❗ Asosiy moliyaviy xato

`ProjectService.GetSummaryAsync` ichida mehnat xarajati shunday olinadi:

```
laborExpenses = SUM(WorkerPayments.PaidAmount) + SUM(Expenses WHERE Category == Labor)
```

`PaidAmount` — ustaga **haqiqatda to'langan** pul. Lekin hujjatning 6-bo'limi
"hakediş summasi" (bajarilgan ish qiymati) va "qolgan summa"ni alohida talab qiladi,
15-bo'lim esa "Amaldagi tannarx = **tasdiqlangan** xarajatlarning yig'indisi" deydi.

Oqibati: usta 5 000 USD'lik ish bajargan, lekin hali 1 000 USD olgan bo'lsa — tizim
xarajatga faqat 1 000 USD yozadi. Natijada `TotalExpenses`, `GrossProfit`,
`RemainingBudget` va `BudgetUtilizationPercent` — to'rttasi ham noto'g'ri chiqadi va
**foyda 4 000 USD'ga oshib ketadi**. Rahbar buni ko'rib xato qaror qabul qilishi mumkin.

To'g'ri yechim: `WorkAmount` (yoki u nol bo'lsa `AgreedAmount`) bo'yicha hisoblash, va
to'lanmagan qismni alohida "usta qarzdorligi" ko'rsatkichi sifatida chiqarish.

### Ikkinchi nomuvofiqlik

Qolgan usta haqi ikki xil hisoblanadi:
- API (`/workers-summary`): `AgreedAmount – PaidAmount`
- Excel eksport: `(WorkAmount > 0 ? WorkAmount : AgreedAmount) – PaidAmount`

Ya'ni ekrandagi raqam bilan Excel'dagi raqam mos kelmasligi mumkin.

---

## 6. Excel hisobot (hujjatning 16-bo'limi)

Hujjat 9 varaqli tuzilma tavsiya qiladi: Projects, Finance, Expenses, Materials, Workers,
Extra Works, Tasks, **Customers**, Summary.

Kodda **alohida loyiha** eksporti 9 varaqli, lekin tuzilma boshqacha:

| Kodda | Hujjatdagi mos varaq |
|---|---|
| 1. Loyiha haqida | — |
| 2. Mijoz To'lovlari | Finance |
| 3. Xarajatlar | Expenses |
| 4. Materiallar Xaridi | Materials |
| 5. Usta va Ish Haqi | Workers |
| 6. Qo'shimcha Ishlar | Extra Works |
| 7. Vazifalar | Tasks |
| 8. Moliyaviy Xulosa | Summary |
| 9. Barcha Loyihalar Ro'yxati | Projects |

**Customers varag'i yo'q.**

Muhimi: **barcha loyihalar** eksporti faqat **1 varaqdan** iborat (15 ustun). Hujjat esa
"barcha loyihalar bo'yicha" hisobotni ham xuddi shu 9 varaqli tuzilmada kutadi —
mijozlar bo'yicha ko'rsatkichlar, kechikayotgan loyihalar ro'yxati va h.k.

Yana: hujjat "sana oralig'i, loyiha, mijoz, holat, xarajat turi bo'yicha filtr" talab qiladi.
Kodda **hech qanday query parametr yo'q** — filtr umuman qo'llanmagan.

---

## 7. Dashboard (hujjatning 9-bo'limi)

| Talab | Holat |
|---|---|
| Faol loyihalar | ✅ |
| Tugagan loyihalar | ✅ |
| Jami loyiha qiymati | ✅ |
| Jami olingan pul | ✅ |
| Jami qolgan qarzdorlik | ✅ |
| Jami xarajat | ✅ |
| Taxminiy foyda | ✅ |
| Xavfdagi loyihalar | ⚠️ faqat byudjet ≥90% bo'yicha; **kechikish xavfi hisoblanmaydi** va faqat son, ro'yxat yo'q |
| Yaqin topshiriladiganlar | ❌ yo'q — `EndDate` bo'yicha hech qanday so'rov yo'zilmagan |

Texnik muammolar: o'rtacha byudjet foydalanishi noto'g'ri hisoblanadi (bo'luvchi barcha
loyihalar, lekin ayirmaga faqat byudjeti bor loyihalar qo'shiladi), va har bir loyiha uchun
alohida so'rov yuboriladi (N+1). Frontendda oylik daromad/xarajat grafigi **qo'lda yozilgan
mock ma'lumot** — API'ga ulanmagan. `FinancePage`'dagi "Loyiha Majburiyatlari" paneli ham
qattiq `$0`.

---

## 8. Mijoz portali (hujjatning 11-bo'limi) — eng katta bo'shliq

Backend tayyor va **to'g'ri yozilgan**: `CustomerPortalService` faqat ruxsat berilgan
ma'lumotni qaytaradi — ichki xarajat, usta haqi, byudjet va qo'shimcha ish tannarxi
chiqarilmaydi. Egalik tekshiruvi ham bor.

Lekin frontendda **portal sahifasi umuman yo'q**. `portalApi.getProject` yozilgan, hech
qayerdan chaqirilmaydi. `Customer` roli bilan kirgan foydalanuvchi `DashboardPage`'ga
tushadi va 403 oladi — ya'ni mijoz tizimdan foydalana olmaydi.

Hujjatning asosiy savoli — "Uyimda hozir nima qilinyapti va keyin nima qilinadi?" — hozircha
javobsiz.

---

## 9. Bildirishnomalar (hujjatning 18-bo'limi) — 0/8

Hujjat 8 xil ogohlantirish talab qiladi: tugash sanasi yaqinlashdi, byudjet chegarasi oshdi,
mijoz to'lovi kechikdi, usta hakediși to'lanmagan, qo'shimcha ish tasdiq kutmoqda, vazifa
kechikmoqda, loyiha uzoq yangilanmadi, material xaridi kerak.

Kodda **hech biri yo'q**. Bildirishnoma modeli, `DbSet`, background servis, scheduler yoki
email/SMS paketi — bittasi ham mavjud emas. Frontendda faqat bezak qo'ng'iroq belgisi bor.

---

## 10. ❗ Xavfsizlik muammolari

Bular hujjatda ko'rsatilmagan, lekin ishlab chiqarishga chiqarishdan oldin hal qilinishi shart.

### 10.1 Anonim ro'yxatdan o'tish + istalgan rolni tanlash (jiddiy)

`POST /api/auth/register` autentifikatsiyasiz ishlaydi va `RegisterDto.Role`ni qabul qiladi.
Faqat `SuperAdmin` rad etiladi. Ya'ni **istalgan odam o'zini `Admin` yoki `Finance` qilib
ro'yxatdan o'tkazib**, barcha loyihalar va moliyaviy ma'lumotlarga kira oladi.
Frontend'ning login sahifasida bu rol tanlash hatto ochiq ko'rinadi.

### 10.2 SuperAdmin backdoor (jiddiy)

`AuthService.LoginAsync` ichida:

```
if (!isPasswordValid && user.Role == UserRole.SuperAdmin
    && (dto.Password == "superadmin" || dto.Password == "admin123"))
{
    user.PasswordHash = BCrypt.HashPassword("superadmin");
    user.IsActive = true;
    isPasswordValid = true;
}
```

`superadmin` yoki `admin123` parolini kiritgan har qanday odam mavjud SuperAdmin hisobiga
kiradi va **uning parolini o'zgartirib yuboradi**. Bu tizimni to'liq egallash.
Bu kod `da95e50` va `356da29` commitlarda "har qanday mashinada ishlashi uchun" qo'shilgan —
maqsad tushunarli, lekin yechim xavfli.

### 10.3 Kompaniyalar orasida izolyatsiya yo'q

Multi-tenancy yarim yozilgan: `GetAllAsync` va dashboard so'rovlarida `CompanyAdminId`
bo'yicha filtr bor, lekin `GetByIdAsync` va barcha ichki resurslar (to'lov, xarajat,
material, usta, vazifa) faqat `projectId` bo'yicha filtrlaydi. Natijada A kompaniyaning
xodimi B kompaniyaning loyiha GUID'ini bilsa, uning butun moliyasini o'qiy oladi.
Excel eksportining 9-varag'i ham butun `Projects` jadvalini oladi.

### 10.4 Mijoz yashirin fotolarni ko'ra oladi

`GET /api/projects/{id}/photos` va `/updates` `Customer` roliga ruxsat beradi, lekin
`onlyCustomerVisible` sukut bo'yicha `false` va egalik tekshiruvi yo'q. Ya'ni mijoz istalgan
loyihaning `IsVisibleToCustomer == false` bo'lgan ichki fotolarini ham ola oladi.
Bu hujjatning 11-bo'limiga to'g'ridan-to'g'ri qarshi. `GET /{id}/stages` ham rolsiz ochiq.

### 10.5 Maxfiy kalitlar git'da

`WorkDex.Api/appsettings.Development.json` git'da kuzatiladi va ichida to'ldirilgan
`JwtSettings:SecretKey` hamda `ConnectionStrings:DefaultConnection` (ma'lumotlar bazasi
paroli bilan) bor. JWT kalitini bilgan odam istalgan rol uchun o'zi token yasay oladi.
User-secrets, environment variable yoki key vault ishlatilmagan.

### Qo'shimcha

CORS `AllowAnyOrigin + AnyMethod + AnyHeader` — global. Token `localStorage`'da saqlanadi
(XSS'ga ochiq), API manzili qattiq `http://<host>:5082` — HTTPS emas, ya'ni token lokal
tarmoqda shifrlanmagan holda yuriladi. `DbInitializer` har ishga tushishda belgilangan
parolli demo hisoblarni yaratadi.

---

## 11. Hujjatdan chetlanish: SuperAdmin va multi-tenancy

Hujjatning 13-bo'limi **5 ta rol** belgilaydi: Admin, Loyiha menejeri, Saha xodimi,
Moliya, Mijoz. Kodda **6 ta** — ustiga `SuperAdmin = 0` qo'shilgan, hamda `CompanyAdminId`
orqali bir nechta kompaniyani boshqarish mexanizmi kiritilgan.

Bu hujjatda yo'q. Aslida hujjatning 21-bo'limi "bir nechta kompaniya / filiallarni
boshqarish"ni **keyingi bosqich** funksiyasi sifatida sanaydi. Ya'ni MVP tugamasdan
keyingi bosqich funksiyasi qo'shilgan, va u yarim holatda qolgani uchun 10.3-bandda
tasvirlangan xavfsizlik teshigini yuzaga keltirgan.

Bu o'z-o'zidan xato emas — agar bir nechta kompaniyaga xizmat qilish maqsad bo'lsa, to'g'ri
qaror. Lekin ikkitadan bittasini tanlash kerak: yo izolyatsiyani **oxirigacha** yozish,
yo hozircha olib qo'yib MVP'ni tugatish.

---

## 12. Kod sifati

**Testlar: 0 ta.** Test loyihasi, `.sln` fayli, xunit/nunit/vitest — hech biri yo'q.
Moliyaviy formulalar aynan test bilan qo'riqlanishi kerak bo'lgan joy, chunki xato
jimgina noto'g'ri raqam ko'rsatadi.

**O'lik kod (yozilgan, lekin chaqirilmaydi):**
`portalApi.getProject`, `getUpdates`/`createUpdate`, `createStage`/`completeStage`,
`createDocument`, `projectsApi.update`/`updateStatus`/`delete`, `customersApi.getById`,
`dashboardApi.getStatusDistribution`/`getRecentActivities`, xarajat qo'shish modali.
Backendda `ProjectMember` endpointlari uchun frontend wrapper'i umuman yo'q.

**Boshqa:**
- `TasksPage` har bir loyiha uchun ketma-ket so'rov yuboradi (N+1 waterfall).
- Frontend bitta 436 KB JS bo'lagi — code splitting yo'q.
- Rol bo'yicha route himoyasi yo'q: `/superadmin` manzilini istalgan foydalanuvchi ochadi
  (keyin 403 oladi, lekin sahifa ko'rinadi).
- 404 route yo'q — noto'g'ri manzil bo'sh sahifa beradi.
- `git status`: 6 migratsiya fayli va `.gitignore` o'zgartirilgan holda commit qilinmagan
  (`.gitignore`'da 484 satr o'zgargan — ehtimol qator oxiri CRLF/LF farqi).

---

## 13. Tavsiya etilgan ish tartibi

**Birinchi navbat — xavfsizlik (bir kunlik ish):**
1. `register`'dan rol tanlashni olib tashlash; yangi foydalanuvchini faqat Admin yaratsin.
2. SuperAdmin backdoor'ini o'chirish; boshlang'ich parolni environment variable'dan olish.
3. `appsettings.Development.json`'ni git'dan chiqarish, kalitlarni almashtirish
   (`git rm --cached` + user-secrets).
4. Har bir loyiha resursida egalik/kompaniya tekshiruvini markazlashtirish — bitta
   `EnsureProjectAccess(projectId, user)` yordamchisi orqali.
5. Foto/yangilanish endpointlarida mijoz uchun `IsVisibleToCustomer` filtrini majburiy qilish.

**Ikkinchi navbat — moliyaviy to'g'rilik:**
6. Mehnat xarajatini `WorkAmount` bo'yicha hisoblash, `PaidAmount` emas.
7. Qolgan usta haqi formulasini API va Excel'da bir xillashtirish.
8. `EstimatedProfit`ni `GrossProfit`dan ajratish (kutilayotgan xarajatni hisobga olib).
9. Shu 3 punkt uchun unit test yozish — birinchi testlar aynan shu joyda kerak.

**Uchinchi navbat — MVP'ni yopish:**
10. Mijoz portali sahifasi + `Customer` roli uchun route.
11. Fayl yuklash (`IFormFile` + static files) — foto va hujjat uchun.
12. Xarajatlar tab'i (modal allaqachon yozilgan, faqat tugma va tab kerak).
13. Bosqichlar (stage) uchun UI.
14. Loyihani tahrirlash / status o'zgartirish UI'i.

**To'rtinchi navbat:**
15. Dashboard'da kechikish xavfi va yaqin tugash sanalari.
16. Excel: barcha loyihalar uchun 9 varaqli tuzilma + Customers varag'i + filtrlar.
17. Bildirishnomalar (background servis).
18. Mock grafik ma'lumotlarini haqiqiy API'ga ulash.

---

## 14. Bajarilgan tuzatishlar (birinchi navbat)

Quyidagilar shu tahlildan keyin kodga kiritildi. Asosiy qoida: **ishlab turgan logika
o'zgartirilmadi** — faqat himoya qatlami qo'shildi va bir nomuvofiqlik to'g'rilandi.

### Xavfsizlik

**1. Rolni ko'tarib olish yo'li yopildi.** `POST /api/auth/register` avval anonim edi va
`dto.Role`ni so'zsiz qabul qilardi — ya'ni istalgan odam o'ziga `Admin` yozib yuborishi
mumkin edi. Endi endpoint `[Authorize(Roles = "SuperAdmin,Admin")]` bilan yopiq va
`AuthService.RegisterAsync` chaqiruvchining rolini tekshiradi: SuperAdmin faqat `Admin`
yaratadi, Admin esa `Admin`dan boshqa rollarni o'z kompaniyasida yaratadi. `SuperAdmin`
rolini hech kim yarata olmaydi. Yangi foydalanuvchining `CompanyAdminId` maydoni
chaqiruvchidan olinadi — qo'lda yuborilmaydi.

**2. Login backdoor'i o'chirildi.** Avval `superadmin` / `admin123` bilan kirilganda kod
saqlangan parol hashini qayta yozib yuborardi — ya'ni doimiy zaxira parol bor edi. Endi
`superadmin` taxallusi bilan kirish qoldi, lekin parol har doim odatdagidek
`BCrypt.Verify` orqali tekshiriladi. Seed paroli `Seed:SuperAdminPassword`dan olinadi va
mavjud SuperAdmin'ning hashi hech qachon qayta yozilmaydi.

**3. Loyiha egaligi tekshiruvi (tenant izolyatsiyasi).** Avval `GET /api/projects/{id}`
va loyihaning barcha ichki resurslari (to'lovlar, xarajatlar, materiallar, usta haqlari,
vazifalar, hujjatlar, fotolar, yangilanishlar, hisobotlar) faqat "loyiha mavjudmi?" deb
tekshirardi — boshqa kompaniyaning `Guid`ini bilgan har qanday tizimga kirgan foydalanuvchi
uning moliyasini o'qib olardi.

Yechim ikki qismdan iborat:

- `Services/ProjectAccessGuard.cs` — markazlashgan tekshiruv. Qoidalari
  `ProjectService.GetAllAsync` dagi filtrlar bilan **aynan bir xil**, shuning uchun
  ro'yxatda ko'rinadigan loyiha ochiladi, ko'rinmaydigani esa yo'q. Mijoz uchun qoida:
  `Customers.UserId == joriy foydalanuvchi && Customer.Id == project.CustomerId`.
- `Filters/ProjectAccessFilter.cs` — global MVC filtri. Marshrutida `projectId` bo'lgan
  **har qanday** endpointda avtomatik ishlaydi, shuning uchun 11 ta controller (~40
  endpoint) bittalab tahrirlanmadi. `ProjectsController` `{id}` ishlatgani uchun unda
  tekshiruv qo'lda qo'shildi (14 action'dan 12 tasiga; `GetAll` allaqachon filtrlangan,
  `Create`da hali loyiha yo'q).

Ruxsat bo'lmasa 403 emas, **404 "Loyiha topilmadi"** qaytadi — loyihaning mavjudligi ham
oshkor bo'lmasligi uchun.

**4. `GET /api/projects/{id}/stages` rolsiz edi** — endi `[Authorize(Roles = ...)]` bor.

**5. Kalitlar repozitoriydan chiqarildi.** `appsettings.Development.json` ichida JWT
imzo kaliti va PostgreSQL paroli ochiq turgan va git'ga tushgan edi. Fayl
`git rm --cached` bilan kuzatuvdan chiqarildi, `.gitignore`ga qo'shildi va
`appsettings.Development.json.example` namunasi yaratildi.

> **Diqqat:** eski qiymatlar git tarixida qolgan. JWT kalitini va DB parolini
> **almashtirish kerak** — buni faqat siz qila olasiz.

**6. Ishga tushishda JWT kaliti tekshiriladi.** `Program.cs` bo'sh yoki 32 baytdan qisqa
kalit bilan ishga tushishni rad etadi (HMAC-SHA256 uchun zaif kalit tokenni qalbakilashtirish
imkonini beradi).

**7. CORS production'da yopildi.** Development'da avvalgidek ochiq (lokal tarmoqdagi bir
nechta qurilmadan kirish uchun), production'da faqat `Cors:AllowedOrigins` ro'yxatidagi
manzillar.

### Moliya

**8. Qolgan usta haqi formulasi bir xillashtirildi.** Excel `(WorkAmount > 0 ? WorkAmount
: AgreedAmount) - PaidAmount`, API esa `AgreedAmount - PaidAmount` hisoblardi — bir xil
usta uchun ikki xil qarz raqami chiqardi. Excel API'ga moslashtirildi, chunki PDF §15
shunday belgilaydi: *"Qolgan usta haqi = Kelishilgan summa − To'langan summa"*.

Sizning ko'rsatmangizga ko'ra `TotalExpenses`, `GrossProfit`, `RemainingBudget` va
`BudgetUtilizationPercent` **tegilmadi** — ya'ni yuqoridagi 6-punkt (mehnat xarajatini
`WorkAmount` bo'yicha hisoblash) ataylab bajarilmadi, chunki u hisobotdagi foydani
o'zgartirib yuboradi.

### Tekshiruv holati

Frontend `tsc -b` bilan tekshirildi — xatosiz. Backend **kompilyatsiya qilinmagan**: bu
muhitda `dotnet` SDK yo'q va o'rnatish bloklangan (proxy 403, `sudo` taqiqlangan).
O'zgargan fayllarda qavs balansi, takrorlangan metod nomlari va filtr qamrovi skript bilan
tekshirildi, lekin buni kompilyator o'rnini bosuvchi deb hisoblamaslik kerak —
`dotnet build` ni o'zingiz ishga tushirishingiz kerak.

---

*Bu hujjat kodni o'qish orqali tuzilgan. Backend kompilyatsiya qilinmagan (`dotnet` mavjud
emas edi); frontend `tsc -b` bilan tekshirildi va xatosiz o'tdi.*

