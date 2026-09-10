# WorkDex — To'liq kod tahlili (boshidan oxirigacha)

> Bu hujjat `TAHLIL.md` ning davomi emas, balki **boshqa kesim**. `TAHLIL.md` — PDF
> texnik topshiriq bilan kod o'rtasidagi farqlar ro'yxati. Bu hujjat esa kodning
> o'zini qatlam-baqatlam o'qib chiqib yozilgan: har bir fayl, har bir metod, har bir
> so'rov zanjiri. Ikkisi bir-birini takrorlamaydi.
>
> **Tahlil sanasi:** 2026-09-05
> **Tahlil qilingan commit:** `fed3bc2` (2026-08-28), jami 36 commit
> **Muhim:** `TAHLIL.md` 2026-08-21 da yozilgan. Undan keyin kodga yangi narsalar
> qo'shilgan (ofis xarajatlari, SuperAdmin sahifasi). Shu sababli quyidagi hamma
> topilma qaytadan, joriy kod ustida tekshirilgan — eski hujjatdan ko'chirilmagan.

---

## 1. Eng muhim xulosalar

Kodni to'liq o'qib chiqqandan keyin eng katta muammo alohida bir bug emas, balki
**ma'lumotlar bazasi sxemasining uch xil, bir-biriga mos kelmaydigan ta'rifi**
bir vaqtda mavjudligi. Loyihada EF Core migratsiyalari bor, lekin ular hech qachon
ishlatilmaydi; sxema `EnsureCreatedAsync()` bilan yaratiladi; ustiga yana qo'lda
yozilgan `ALTER TABLE` buyruqlari har safar dastur ishga tushganda bajariladi; va
bundan tashqari repozitoriyada uchinchi, mustaqil `database_backup.sql` yotadi.
Bu uchtasi hozir bir-biridan farq qiladi. Batafsil — 4-bo'limda.

Ikkinchi darajali, lekin amaliy zarari aniq bo'lgan narsalar:

Ofis xarajatini o'chirish endpointi (`DELETE /api/office-expenses/{id}`) hech qanday
kompaniya tekshiruvidan o'tmaydi — GUID ni bilgan har qanday Admin yoki Finance
foydalanuvchisi **boshqa kompaniyaning** xarajatini o'chirib tashlashi mumkin.

Har bir startupda `DbInitializer` `CompanyAdminId IS NULL` bo'lgan barcha mijoz,
usta, loyiha va materialni `admin@wordex.uz` ga **yozib qo'yadi**. Ya'ni tenancy
maydonisiz yaratilgan har qanday yozuv dastur qayta ishga tushganda avtomatik
ravishda Grand Stroy kompaniyasiga o'tadi.

`ProjectStatus` enum qiymatlari backend va frontendda **almashib ketgan**:
backendda `OnHold=3, Completed=4, Cancelled=5`, frontendda esa `Completed=3,
OnHold=4` va `Cancelled` umuman yo'q. Raqamli qiymat esa yorliq rangini,
matnini va status filtrini haqiqatan boshqaradi — ya'ni yakunlangan loyiha
interfeysda "Kechikkan" bo'lib ko'rinadi. Hozircha yashiringan, sababi
9.1-bo'limda.

Ofis xarajatining sanasi server vaqt mintaqasiga bog'lab saqlanadi: frontend
xom `"2026-09-05"` yuboradi, backend uni server lokal vaqti deb hisoblab UTC ga
o'giradi. Xuddi shu endpointga loyiha xarajati esa to'g'ri UTC instant
yuboradi. Natijada bitta maydonda ikki xil semantika — batafsil 9.2 da.

`Frequency` (Bir marta / Kunlik / Oylik) maydoni faqat yorliq — takrorlanuvchi
xarajatni haqiqatda yaratadigan hech qanday mexanizm yo'q, shuning uchun "oylik"
deb belgilangan xarajat hisobotlarda faqat **bir marta** hisoblanadi.

Interfeysning eng katta bo'shlig'i — **tuzatish imkoniyati yo'qligi**: 18
`DELETE` endpointdan 16 tasi va 7 `PUT` dan 6 tasi uchun hech qanday tugma
yo'q. Foydalanuvchi ma'lumot kirita oladi, lekin xato kiritsa faqat baza
orqali tuzatiladi (7.4, 7.5).

Va `Customer` roli uchun interfeys butunlay yo'q — mijoz tizimga kirsa
kompaniya boshqaruv paneliga tushadi va `403` oladi, holbuki backend portali
to'liq yozilgan va ishlaydi (8.2, 9.3).

---

## 2. Repozitoriya holati

| Ko'rsatkich | Qiymat |
|---|---|
| Backend C# (migratsiyalarsiz) | 8 483 qator |
| Frontend `src/` | 5 954 qator |
| Kontrollerlar | 19 |
| Servislar | 16 ta interfeys + 16 ta implementatsiya (hammasi DI ga ro'yxatdan o'tgan) |
| Modellar / enumlar | 22 fayl |
| DTO fayllari | 28 |
| EF migratsiyalari | 7 (**hech biri ishlatilmaydi**) |
| Testlar | 0 |

Eng katta fayllar: `ExcelExportService.cs` 732, `AppDbContext.cs` 631,
`ProjectService.cs` 473, `WorkerService.cs` 422; frontendda
`ProjectDetailPage.tsx` 2 047, `DashboardPage.tsx` 517, `api/services.ts` 419,
`types/index.ts` 390.

`ProjectDetailPage.tsx` — 2 047 qator bitta faylda, 8 ta tab, 65 ta `useState`
chaqiruvi. Bu fayl loyihaning eng katta texnik qarzi.

---

## 3. Ishga tushish zanjiri — `Program.cs` (190 qator)

Tartib quyidagicha: `UseUrls("http://0.0.0.0:5082")` → JWT kaliti uzunligi tekshiruvi
→ `AddDbContext` (Npgsql) → JWT autentifikatsiyasi → 16 ta servis → kontrollerlar +
global `ProjectAccessFilter` → Swagger → CORS → `Build()` → (Development bo'lsa Swagger UI)
→ `UseCors` → `UseAuthentication` → `UseAuthorization` → `MapControllers` →
`DbInitializer.InitializeAsync` → `app.Run()`.

Bu zanjirda diqqat qilish kerak bo'lgan joylar:

**Port va manzil kodga qotib qolgan.** `builder.WebHost.UseUrls("http://0.0.0.0:5082")`
`launchSettings.json`, `ASPNETCORE_URLS` va konfiguratsiyani ham bekor qiladi. Portni
o'zgartirish uchun kodni qayta kompilyatsiya qilish kerak. HTTPS umuman yo'q va
`UseHttpsRedirection` ham chaqirilmagan — ya'ni JWT token tarmoqda ochiq matnda yuradi.
Lokal ishlash uchun muammo emas, lekin real serverga chiqarishdan oldin oldida reverse
proxy (nginx/Caddy) turishi shart.

**CORS himoyasi muhitga emas, konfiguratsiya mavjudligiga bog'langan.** Shart
`if (IsDevelopment() || allowedOrigins.Length == 0)` — ya'ni Production'da ham, agar
`Cors:AllowedOrigins` massivi to'ldirilmagan bo'lsa, `AllowAnyOrigin()` ishlaydi.
Xavf katta emas (token `localStorage` da, cookie ishlatilmaydi, shuning uchun klassik
CSRF yo'q), lekin himoya "sozlamani esdan chiqarsa o'chib qoladigan" holatda.

**Global xatolik ushlovchi yo'q.** `UseExceptionHandler` yoki `ProblemDetails`
middleware'i qo'shilmagan. Har bir kontroller o'zi `try/catch` qiladi. Qaerda
`try/catch` qo'yilmagan bo'lsa — masalan `OfficeExpensesController.GetAll` —
kutilmagan xatolik to'g'ridan-to'g'ri 500 va stack trace bo'lib chiqadi.

**Rate limiting, health check, response compression, `UseStaticFiles` — hech biri yo'q.**
`UseStaticFiles` yo'qligi tasodifiy emas: loyihada fayl yuklash umuman qilinmagan,
foto va hujjatlar faqat matnli URL sifatida saqlanadi.

**Seeding `app.Run()` dan oldin, sinxron bajariladi.** Baza ishga tushish paytida
mavjud bo'lmasa, dastur ko'tarilmaydi va qayta urinish (retry) mexanizmi yo'q.

**`ClockSkew = TimeSpan.Zero`** — token muddati sekundma-sekund qat'iy. Bu to'g'ri
tanlov, lekin server va klient vaqti farq qilsa foydalanuvchi kutilmaganda chiqib
ketadi. Ishlab chiqarishda odatda 30 sekund qoldiriladi.

---

## 4. Ma'lumot qatlami — eng katta strukturaviy muammo

### 4.1. Sxema uch xil joyda, uch xil ta'riflangan

Loyihada ma'lumotlar bazasi sxemasi bir vaqtning o'zida uchta mustaqil manbadan
kelib chiqadi va bu uchtasi hozir bir-biriga mos kelmaydi.

**Birinchi manba — EF Core modeli.** `AppDbContext.OnModelCreating` (631 qator)
16 ta entity ni to'liq, batafsil sozlagan: `numeric(18,2)` pul maydonlari, satr
uzunliklari, 20 dan ortiq nomlangan indeks, o'chirish qoidalari. Bu qism sifatli
yozilgan — bu yerda tanqid qiladigan narsa kam.

**Ikkinchi manba — 7 ta EF migratsiyasi.** Oxirgisi
`20260819050646_RenameHakedisToWorkAmount`, ya'ni 2026-08-19. Ular **hech qachon
bajarilmaydi**, chunki dastur `Database.Migrate()` emas, `Database.EnsureCreatedAsync()`
chaqiradi (`DbInitializer.cs:15` va `:71`). `EnsureCreated` migratsiya tizimini
butunlay chetlab o'tadi: `__EFMigrationsHistory` jadvali yaratilmaydi. Natijada:

- Migratsiyalar papkasi — o'lik kod. Modelga qo'shilgan barcha keyingi o'zgarish
  (`CompanyAdminId`, `Frequency`, `Brand`, `Expenses.ProjectId` ning nullable
  bo'lishi) migratsiyalarda **umuman yo'q** — tekshirdim, `grep` bo'sh natija beradi.
- `dotnet ef database update` ni bu bazada endi ishlatib bo'lmaydi: EF birinchi
  migratsiyani qo'llashga urinadi va "relation already exists" bilan yiqiladi.
- `EnsureCreated` mavjud bazani **yangilamaydi** — u faqat baza bo'lmasa yaratadi.
  Ya'ni modelga yangi maydon qo'shilsa, eski bazada u paydo bo'lmaydi.

**Uchinchi manba — qo'lda yozilgan `ALTER TABLE` lar.** Yuqoridagi muammoni yopish
uchun `DbInitializer.InitializeAsync` da 11 ta xom SQL buyrug'i bor va ular **har
safar dastur ishga tushganda** bajariladi (`DbInitializer.cs:16-26`): `CompanyName`,
5 ta jadvalga `CompanyAdminId`, 2 ta jadvalga `Brand`, `Expenses.ProjectId DROP NOT NULL`,
`Expenses.Frequency`, `Expenses.CompanyAdminId`. Bu — qo'lda yozilgan mini-migratsiya
tizimi. Ishlaydi, lekin: versiyalanmaydi, orqaga qaytarilmaydi, kim qachon nima
qo'shganini ko'rsatmaydi va ro'yxatga qo'shishni esdan chiqarsa jimgina buziladi
(masalan `UpdatedAt` va `Projects.Description` ro'yxatda yo'q — pastda ko'ring).

**To'rtinchi, mustaqil manba — `database_backup.sql`.** 316 qator, 16 ta
`CREATE TABLE IF NOT EXISTS` + INSERT lar. Fayl boshida shunday deyilgan:
*"Ushbu SQL faylni pgAdmin yoki psql orqali to'g'ridan-to'g'ri run qilsangiz, barcha
jadvallar va to'liq ma'lumotlar avtomatik yuklanadi."* **Bu da'vo endi to'g'ri emas.**

### 4.2. `database_backup.sql` bilan kod o'rtasidagi aniq farqlar

Agar kimdir loyihani fayl aytganidek o'rnatsa — avval `database_backup.sql` ni
`psql` da bajarib, keyin API ni ishga tushirsa — quyidagi maydonlar bazada
**yaratilmaydi** va `DbInitializer` ning `ALTER` ro'yxatida ham yo'q, ya'ni
birinchi so'rovda `42703: column ... does not exist` xatosi chiqadi:

| Jadval | Modelda bor, backupda yo'q, ALTER ham qilinmaydi |
|---|---|
| `Customers` | `UpdatedAt` |
| `Projects` | `Description`, `UpdatedAt` |
| `Expenses` | `Notes` |

Bundan tashqari tiplar mos kelmaydi:

| Maydon | `database_backup.sql` | EF modeli | Oqibati |
|---|---|---|---|
| `Projects.ProgressPercent` | `INTEGER` | `numeric(5,2)` | 66.67% → 67 ga yumaqlanadi, vaznli progress aniqligi yo'qoladi |
| `Projects.Name` | `VARCHAR(200)` | 300 | 200 belgidan uzun nom xatolik beradi |
| `Projects.ProjectType` | `VARCHAR(100) NOT NULL` | nullable, 200 | turi ko'rsatilmagan loyiha yaratilmaydi |
| `Projects.CustomerId` | `ON DELETE SET NULL` | `Restrict`, ustun **NOT NULL** | mijoz o'chirilsa NULL yozishga urinadi va yiqiladi |
| `Projects.CreatedByUserId` | `ON DELETE CASCADE` | `Restrict` | teskari ma'no: foydalanuvchi o'chirilsa uning barcha loyihalari o'chib ketadi |
| `Customers.PhoneNumber` | `VARCHAR(50)` | 20 | mos kelmaslik, lekin zararsiz |
| `Expenses.ProjectId` | `NOT NULL` | nullable | `ALTER ... DROP NOT NULL` bilan yamalgan |

**Xulosa:** hozir loyihani ishga tushirishning **yagona to'g'ri yo'li** — bo'sh
bazani `EnsureCreated` ga yaratdirish. `database_backup.sql` faqat namuna
ma'lumotlarning arxivi sifatida qiymatga ega; sxema manbasi sifatida ishlatilmasligi
kerak yoki yangilanishi kerak. Loyihani boshqa odam (o'qituvchi, sherik, kelgusi
o'zingiz) o'rnatishga urinsa — eng ko'p vaqt shu yerda yo'qoladi.

### 4.3. Ko'p-kompaniyalilik (tenancy) modeli yarim qurilgan

`CompanyAdminId` (`Guid?`) 6 ta modelda bor: `User`, `Customer`, `Material`,
`Worker`, `Project`, `Expense`. Bolalar jadvallari (to'lovlar, materiallar xaridi,
usta haqlari, vazifalar, hujjatlar, fotolar, yangilanishlar) o'z kompaniyasini
`Project` orqali "meros" qilib oladi — bu to'g'ri yondashuv.

Lekin `CompanyAdminId` `OnModelCreating` da **umuman sozlanmagan** va navigatsiya
xossasi ham yo'q. EF uni oddiy skalyar ustun deb qabul qiladi. Demak:

- **Tashqi kalit yo'q.** Loyiha o'chirilgan adminga ishora qilib qolishi mumkin,
  baza buni to'xtatmaydi.
- **Indeks yo'q.** Har bir tenancy filtri (`WHERE "CompanyAdminId" = ...`) —
  `Projects`, `Customers`, `Materials`, `Workers`, `Expenses` bo'yicha ketma-ket
  skanerlash. Hozir ma'lumot kam, sezilmaydi; bir necha ming loyihada sezilади.
- **EF global query filter ishlatilmagan.** `HasQueryFilter` bilan bu butun sinf
  xatolar bir joyda yopilishi mumkin edi. Uning o'rniga har bir servis o'zi qo'lda
  filtrlaydi — va aynan shu sababli 5-bo'limdagi teshiklar paydo bo'lgan.

### 4.4. Har startupda ma'lumotni o'zgartiruvchi 4 ta `UPDATE`

`DbInitializer.cs:29-32` da to'rtta buyruq bor va ular **har safar dastur ishga
tushganda** bajariladi:

```sql
UPDATE "Customers" SET "CompanyAdminId" =
  (SELECT "Id" FROM "Users" WHERE "Email" = 'admin@wordex.uz' LIMIT 1)
WHERE "CompanyAdminId" IS NULL;
-- xuddi shu narsa Workers, Projects, Materials uchun ham
```

Maqsadi tushunarli: eski namuna ma'lumotlarni birinchi kompaniyaga bog'lash. Lekin
shart `WHERE "CompanyAdminId" IS NULL` — vaqt bilan cheklanmagan, faqat bir marta
bajarilishi ta'minlanmagan. Oqibati:

**`CompanyAdminId` si to'ldirilmagan holda yaratilgan har qanday yangi yozuv
dastur qayta ishga tushganda avtomatik ravishda Grand Stroy kompaniyasiga o'tadi.**

Bu nazariy emas. Masalan SuperAdmin sifatida yaratilgan loyiha yoki mijoz, yoki
tenancy maydonini o'rnatmagan biror kod yo'li — hammasi shu tuzoqqa tushadi.
Ikkinchi kompaniya qo'shilgan zahoti bu jimgina ma'lumot aralashuviga aylanadi va
buni loglardan sezish deyarli imkonsiz.

Yana bir tafsilot: elektron pochta `admin@wordex.uz` — **`workdex` emas, `wordex`**.
Qolgan barcha seed foydalanuvchilar `@workdex.uz` da. Fayl ichida bu izchil
(seed ham xuddi shu xato bilan yozadi), shuning uchun hozir ishlaydi, lekin bu
harf tushib qolishi 4 ta `UPDATE` da tayanch nuqta bo'lib turadi. Kimdir adminning
emailini "to'g'rilasa", to'rtta `UPDATE` jimgina hech narsa qilmay qo'yadi.

### 4.5. Seed ma'lumoti

`SeedFullDataAsync` faqat `Users` jadvali butunlay bo'sh bo'lganda ishlaydi. 6 ta
foydalanuvchi (har rol uchun bittasi), 2 mijoz, 5 material, 3 usta, 2 loyiha,
4 bosqich, 4 vazifa, 2 to'lov, 3 material xaridi, 2 usta haqi, 3 xarajat,
1 qo'shimcha ish, 2 foto yaratiladi. PDF dagi namunaviy villa loyihasi aynan
takrorlangan — bu yaxshi, demo ishonchli ko'rinadi.

Ikki e'tibor:

**Oltita foydalanuvchining paroli bitta.** `passwordHash` bir marta hisoblanadi va
`superAdminHash = passwordHash` bilan SuperAdmin ham xuddi shu parolni oladi.
`Seed:SuperAdminPassword` sozlanmasa, zaxira qiymat `"ChangeMe!123"` — ya'ni
SuperAdmin, Admin, Finance, PM, Ishchi va Mijoz hammasi ma'lum parol bilan kiradi.
Kodda bu ochiq yozilgan, demak repozitoriyani ko'rgan har kim biladi.

**Ikkinchi mijoz (`Dilshod Aliyev`) va barcha materiallar/ustalar
`CompanyAdminId` siz yaratiladi** — keyin 4.4 dagi `UPDATE` ular uchun ishlaydi.
Ya'ni seed to'g'ri natija beradi, lekin faqat o'sha `UPDATE` hisobidan. Bu
bog'liqlik hech qayerda yozilmagan.

`ResetAndSeedAsync` esa 16 ta jadvalni `RemoveRange` bilan to'liq tozalab, hammasini
qaytadan yozadi. Bu metod hozir hech qanday endpointdan chaqirilmaydi (tekshirdim) —
ya'ni foydalanilmayotgan, lekin xavfli qurol turibdi. Kimdir uni kontrollerga
ulab qo'ysa, bitta so'rov bilan butun baza o'chadi.

---

## 5. Xavfsizlik va ruxsatlar — hozirgi holat

### 5.1. Qamrov hisobi

Jami **87 endpoint** (19 kontroller). Ularning taqsimoti:

**43 endpoint** marshrutida `{projectId}` bor va shu sababli global `ProjectAccessFilter`
ularni avtomatik tekshiradi — to'lovlar (4), xarajatlar (4), materiallar xaridi (5),
usta haqlari (7), qo'shimcha ishlar (6), vazifalar (6), hujjatlar (3), fotolar (3),
yangilanishlar (3), bitta loyiha Excel hisoboti (1), mijoz portali (1).

**14 endpoint** `ProjectsController` da va `{id}` ishlatadi, ya'ni filtr ularni
qamrab olmaydi. 12 tasida `EnsureAccessAsync(id)` qo'lda chaqiriladi; qolgan 2 tasi
— `GetAll` (o'zi filtrlaydi) va `Create` (hali loyiha yo'q) — tekshiruvga muhtoj emas.

**Qolganlari** — mustaqil obyektlar (mijozlar, materiallar, ustalar, foydalanuvchilar,
dashboard, ofis xarajatlari, umumiy Excel). Bularni tekshirish servis ichida
bajarilishi kerak. Tekshirdim: `CustomerService`, `MaterialService`, `WorkerService`,
`UserService`, `DashboardService`, `ExcelExportService` — hammasi
`requestingUserId` + `requestingUserRole` parametrlarini oladi va `CompanyAdminId`
bo'yicha filtrlaydi. `ExcelExportService.ExportAllProjectsToExcelAsync` ham
avval ruxsat etilgan loyiha ID larini yig'ib oladi, ya'ni **umumiy Excel
hisobotida begona kompaniya ma'lumoti chiqmaydi**. Bu joy to'g'ri qilingan.

### 5.2. Qolgan teshik: ofis xarajatini o'chirish

`ExpenseService.DeleteOfficeExpenseAsync(Guid expenseId)` — imzosida `userId` ham,
`role` ham yo'q:

```csharp
public async Task DeleteOfficeExpenseAsync(Guid expenseId)
{
    var expense = await _context.Expenses
        .FirstOrDefaultAsync(e => e.Id == expenseId && e.ProjectId == null);
    if (expense is null) throw new KeyNotFoundException("Xarajat topilmadi.");
    _context.Expenses.Remove(expense);
    await _context.SaveChangesAsync();
}
```

Marshrut `DELETE /api/office-expenses/{id}` — `projectId` yo'q, demak global filtr
ham yordam bermaydi. Natija: **GUID ni bilgan har qanday Admin yoki Finance
foydalanuvchisi boshqa kompaniyaning ofis xarajatini o'chirib tashlashi mumkin.**
Bu yagona qolgan ochiq tenancy teshigi. Tuzatish oson: metodga `requestingUserId`
va `requestingUserRole` qo'shib, `GetOfficeExpensesAsync` dagi aynan shu
`companyAdminId` hisoblash mantiqini takrorlash kifoya — mavjud logika o'zgarmaydi.

Yonida ikkinchi, kichikroq nuqson: `GetAll` va `Create` da `try/catch` yo'q
(`OfficeExpensesController`), ya'ni kutilmagan xatolik 500 va stack trace bo'lib
qaytadi. `Create` da `catch (Exception)` bor, lekin u har qanday xatoni 400 ga
aylantiradi — validatsiya xatosi bilan baza xatosi bir xil ko'rinadi.

### 5.3. SuperAdmin ruxsatlari izchil emas

`SuperAdmin` roli 87 endpointning faqat bir qismida ko'rsatilgan va tanlov
tizimsiz. Eng ko'zga tashlanadigan misol `ProjectsController` da:

| Endpoint | SuperAdmin |
|---|---|
| `GET /api/projects` | ✅ ruxsat |
| `GET /api/projects/{id}` | ❌ **403** |
| `GET /api/projects/{id}/summary` | ❌ 403 |
| `GET /api/projects/{id}/stages` | ✅ ruxsat |
| `DELETE /api/projects/{id}` | ✅ ruxsat |

Ya'ni SuperAdmin loyihalar ro'yxatini ko'radi va loyihani o'chirib tashlashi
mumkin, lekin **uni ochib ko'ra olmaydi**. Amalda bu hozir kamdan-kam sezilади,
chunki `App.tsx` SuperAdmin ga faqat bitta tab (`/superadmin`) ko'rsatadi va
loyiha kartalari bo'lgan sahifaga olib boradigan havola bermaydi. Lekin
frontendda **route darajasida rol tekshiruvi yo'q** (8.1-bo'lim), shuning uchun
SuperAdmin `/projects/<id>` manzilini qo'lda yozsa yoki eski havolani ochsa —
sahifa `GET /api/projects/{id}` ni chaqiradi va 403 oladi.

Xuddi shu naqsh boshqa joylarda ham: `MaterialsController` va `WorkersController`
da SuperAdmin **yaratishi** mumkin, lekin **tahrirlashi** mumkin emas. Barcha
loyiha-ichki moliyaviy endpointlar (to'lov, xarajat, usta haqi, material xaridi)
SuperAdmin ni umuman kiritmagan, lekin `DashboardController`, `ReportsController`
va `OfficeExpensesController` kiritgan. `CustomerPortalController` ham SuperAdmin ni
qoldirmagan.

Bu xavfsizlik teshigi emas — teskarisi, ruxsat kamligi. Lekin mahsulot xatti-harakati
sifatida chalkash: SuperAdmin nima qila oladi degan savolga kodda yagona javob yo'q.
Rol matritsasini bitta joyda (policy sifatida) belgilash kerak.

---

## 6. Servis qatlami — 16 ta servis, 4 102 qator

Bu bo'lim har bir servisning ichki mantiqini ko'rib chiqadi. Umumiy naqsh izchil:
kontroller yupqa, biznes mantiq servisda, servis `AppDbContext` ni to'g'ridan-to'g'ri
ishlatadi. Repository qatlami yo'q — EF Core ning o'zi repository sifatida
ishlatilgan. Bu hajmdagi loyiha uchun to'g'ri tanlov, ortiqcha abstraksiya yo'q.

### 6.1. `AuthService` (113 qator) — eng puxta yozilgan servis

`RegisterAsync` da kim kimni yaratishi mumkinligi qat'iy belgilangan:
SuperAdmin → faqat `Admin` (yangi kompaniya ildizi, `CompanyAdminId = null`);
Admin → `ProjectManager`, `FieldWorker`, `Finance`, `Customer` (`CompanyAdminId = callerId`);
boshqa rollar → umuman yo'q. `dto.Role == SuperAdmin` alohida bloklangan, ya'ni
ikkinchi SuperAdmin yaratib bo'lmaydi. Ochiq (anonim) ro'yxatdan o'tish yo'q —
`AuthController.Register` da `[Authorize(Roles = "SuperAdmin,Admin")]` turadi.
Bu qism xatosiz.

`LoginAsync` da `"superadmin"` va `"super admin"` taxalluslari bilan kirish
mumkin. **Bu zaxira parol emas** — `BCrypt.Verify` har holatda bajariladi, ya'ni
xavfsizlik teshigi yo'q. Ikki kichik izoh: `IsActive` tekshiruvi paroldan **keyin**
turadi (o'chirilgan hisob egasiga "parol to'g'ri, lekin hisob faol emas" degan
ma'lumot beriladi — bu qasddan qilingan bo'lishi mumkin, UX uchun qulay);
va `u.Email.ToLower() == searchInput` solishtiruvi `Email` ustunidagi indeksdan
foydalanmaydi, chunki `LOWER()` funksiyasi indeksni buzadi. Hozir zararsiz.

### 6.2. `JwtService` (61 qator)

Token 9 ta claim bilan tuziladi: `sub`, `email`, `jti`, `NameIdentifier`, `Name`,
`ClaimTypes.Role`, va qulaylik uchun takrorlangan `role`, `userId`, `fullName`.
`HmacSha256`, muddati `JwtSettings:ExpirationHours` (zaxira 24 soat).

Bitta strukturaviy kamchilik: **tokenda kompaniya (`CompanyAdminId`) yo'q.**
Shu sababli deyarli har bir servis tenancy ni aniqlash uchun
`_context.Users.FindAsync(requestingUserId)` ni qayta bajaradi — har so'rovda
qo'shimcha bitta `SELECT`. Bu ma'lumot tokenga qo'shilsa, o'nlab so'rov yo'qoladi.
Hozirgi hajmda sezilmaydi, lekin bu 6.7 dagi N+1 muammosi bilan bir turkumdan.

### 6.3. `ProjectAccessGuard` (75 qator) — ruxsat mantiqining yagona manbasi

Qoidalar `ProjectService.GetAllAsync` dagi filtrlar bilan **bir xil** (kod
izohida ham shu yozilgan va tekshirdim — mos): SuperAdmin hammasini; `Customer`
faqat `Customers.UserId == userId` bog'lanishi orqali; `Admin` o'zi yaratgan yoki
`CompanyAdminId` o'ziga teng yoki yaratuvchisi o'z xodimi bo'lgan loyihalarni;
qolgan rollar kompaniya bo'yicha yoki `ProjectMembers` a'zoligi bo'yicha.

Muhim detal: ruxsat bo'lmasa `403` emas, `KeyNotFoundException` → **404**
qaytariladi. Bu ataylab — begona loyihaning mavjudligini oshkor qilmaslik uchun.
To'g'ri yondashuv.

`AsNoTracking()` ishlatilgan, ya'ni guard EF change tracker ini
ifloslantirmaydi. Lekin har chaqiruvda 2–3 ta alohida so'rov ketadi va natija
keshlanmaydi: bitta so'rov ichida guard ham, keyin servis ham xuddi shu loyihani
qaytadan o'qiydi.

### 6.4. `ProjectService` (473 qator) — loyihaning yuragi

14 ta ommaviy metod: CRUD, holat o'zgartirish, moliyaviy xulosa, a'zolar (3),
bosqichlar (4).

**Kirish filtri (`GetAllAsync`).** Uch shoxli: SuperAdmin — filtrsiz; Admin —
`CreatedByUserId == me || CompanyAdminId == me || CreatedByUser.CompanyAdminId == me`;
qolganlar — `CreatedByUserId == me || CompanyAdminId == myCompany || Members.Any(...)`.
`ProjectAccessGuard` bilan bir xil, ya'ni "ro'yxatda ko'rinsa — ochish mumkin"
qoidasi buzilmaydi.

**Yaratish (`CreateAsync`).** Mijozning begona kompaniyaga tegishli emasligi
tekshiriladi (`customer.CompanyAdminId != companyAdminId` → xato). Yangi loyiha
har doim `Status = Planning`, `ProgressPercent = 0` bilan boshlanadi. `Currency`
bo'sh bo'lsa `"USD"`. Bu yerda hammasi joyida.

**Yangilash (`UpdateAsync`).** Yangi mijoz ham kompaniya tekshiruvidan o'tadi.
Diqqat: `Status` va `ProgressPercent` bu metodda **o'zgartirilmaydi** — ular
alohida yo'llar bilan boshqariladi. To'g'ri.

**`GetSummaryAsync` — butun moliyaning markazi.** 8 ta alohida `SUM` so'rovi
bajariladi va shunday hisoblanadi:

```
Shartnoma  = ContractAmount + Σ ExtraWork.CustomerAmount (faqat tasdiqlangan)
Material   = Σ MaterialPurchase.TotalCost + Σ Expense(Material).Amount
Ish haqi   = Σ WorkerPayment.PaidAmount   + Σ Expense(Labor).Amount
Boshqa     = Σ Expense(Material va Labor dan tashqari).Amount
Jami xarajat = Material + Ish haqi + Boshqa + Σ ExtraWork.ActualCost (tasdiqlangan)
Foyda      = Shartnoma − Jami xarajat
Byudjet%   = Jami xarajat / Budget × 100
```

Ikki mazmuniy kuzatuv (ikkisi ham sizning ko'rsatmangiz bo'yicha **o'zgartirilmagan**):

Ish haqi xarajati `PaidAmount` (to'langan pul) bo'yicha olinadi, `WorkAmount`
(ishlab bo'lingan, ya'ni qarz bo'lib turgan haq) bo'yicha emas. Demak ustaga
qarz turgan summa xarajat sifatida ko'rinmaydi va foyda haqiqiydan yuqori
chiqadi. Muhim: bu qiymat **uch joyda ham bir xil** — `ProjectService`,
`DashboardService` va `ExcelExportService` hammasi `PaidAmount` ni ishlatadi,
ya'ni nomuvofiqlik yo'q, faqat tanlangan hisob yuritish uslubi shunday
(kassa usuli, accrual emas).

Tasdiqlanmagan qo'shimcha ishning `ActualCost` i xarajatga kirmaydi. Ya'ni
mijoz hali tasdiqlamagan qo'shimcha ishga sarflangan haqiqiy pul hisobotda
ko'rinmaydi.

**`DeleteAsync` — qo'lda kaskad.** 11 ta bola jadval ketma-ket
`RemoveRange` qilinadi, keyin loyihaning o'zi, hammasi bitta `SaveChangesAsync`
ichida — ya'ni bitta tranzaksiya, yarim o'chirish holati bo'lmaydi. Bu to'g'ri
yozilgan. Lekin soft-delete yo'q: to'lovlar, xarajatlar va usta haqlari butunlay
yo'qoladi, moliyaviy tarix tiklanmaydi.

**Bosqichlar.** `AddStageAsync` `OrderIndex` takrorlanmasligini dastur ichida
tekshiradi, `AppDbContext` da esa `IX_ProjectStages_ProjectId_OrderIndex`
`IsUnique()` indeksi bor — ya'ni ikki qatlamli himoya, poyga holatida ham baza
tutib qoladi. `CompleteStageAsync` aslida **toggle** qiladi (nomi "Complete",
lekin ikkinchi chaqiruv bekor qiladi) — bu frontend bilan mos, lekin nom
chalg'ituvchi.

### 6.5. `WorkerService` (422 qator) — validatsiyasi eng qattiq servis

Ustalar katalogi (5 metod, `EnsureSameCompanyAsync` bilan tenancy himoyasi) va
loyiha-ichki usta ishlari (7 metod) shu servisda.

Uch bosqichli pul modeli izchil ishlangan: `AgreedAmount` (kelishildi) →
`WorkAmount` (ishlab bo'lindi) → `PaidAmount` (to'landi). Har o'zgarishda
chegaralar tekshiriladi:

| Amal | Tekshiruv |
|---|---|
| Ish yaratish | `WorkAmount ≤ AgreedAmount`, `PaidAmount ≤ AgreedAmount` |
| `PATCH .../work-amount` | `WorkAmount ≤ AgreedAmount` **va** `WorkAmount ≥ PaidAmount` |
| `PATCH .../pay` | `AgreedAmount − PaidAmount > 0`, `Amount ≤ qolgan ruxsat` |

Xato xabarlari foydalanuvchiga tushunarli, aniq summalar bilan yozilgan
(`$1,500` formatida). Bu servis butun loyihada eng ehtiyotkor yozilgani.

Bir kichik nuqson: `PayWorkerAsync` va `UpdateWorkAmountAsync` izohni
`Notes` maydoniga **qo'shib boradi** (`"eski | To'lov: $500 (izoh)"`). Ya'ni
to'lov tarixi alohida jadvalda emas, bitta matn maydonida to'planadi. Ko'p
to'lovdan keyin bu maydon o'qib bo'lmas holga keladi va 1000 belgi cheklovi
(`MaxLength`) bir kun to'lib qolishi mumkin — u paytda to'lov `DbUpdateException`
bilan yiqiladi. Hozircha nazariy.

`GetProjectWorkersSummaryAsync` guruhlab `TotalAgreedAmount`, `TotalWorkAmount`,
`TotalPaidAmount`, `JobCount` qaytaradi — qoldiq qarzni **hisoblamaydi**, uni
frontend va Excel o'zi hisoblaydi. Tekshirdim: ikkisi ham `Agreed − Paid`
formulasini ishlatadi (`ProjectDetailPage.tsx:990` va
`ExcelExportService.cs:461`), ya'ni **bir xil**. Excelda buning yonida
"API'dagi `WorkerPaymentDto.RemainingAmount` bilan bir xil formula" izohi ham
turadi. Bu joy avvalroq muvofiqlashtirilgan va hozir izchil.

### 6.6. `ExpenseService` (182 qator)

Loyiha xarajatlari (4 metod) va ofis xarajatlari (3 metod). Ikki topilma:

`DeleteOfficeExpenseAsync` da tenancy tekshiruvi yo'q — 5.2-bo'limda batafsil.

`CreateOfficeExpenseAsync` javobni `MapToDto` bilan qaytaradi, lekin
`CreatedByUser` navigatsiyasini yuklamaydi, holbuki loyiha xarajati uchun
(`AddExpenseAsync`) `Entry(...).Reference(...).LoadAsync()` chaqirilgan. Natijada
yangi yaratilgan ofis xarajatining `createdByName` maydoni bo'sh satr bo'lib
qaytadi va jadvalda kim kiritganini ko'rsatuvchi ustun sahifa qayta
yuklanmaguncha bo'sh turadi.

Butun backendda `ToUniversalTime()` faqat shu servisda, ikki joyda ishlatilgan
(34 va 138-qatorlar). Bu tasodifiy emas — 9-bo'limdagi sana muammosining
sababi shunda.

### 6.7. `DashboardService` (233 qator) — eng og'ir ishlaydigan kod

Har uch metod ham avval `GetAccessibleProjectIdsAsync` bilan ruxsat etilgan
loyiha ID larini yig'adi, keyin `accessibleIds.Contains(...)` bilan filtrlaydi.
Tenancy jihatidan **to'g'ri** — begona kompaniya raqamlari qo'shilmaydi.

Lekin `GetStatsAsync` ichida shunday tsikl bor:

```csharp
foreach (var p in projects)          // har bir loyiha uchun
{
    ... await _context.Expenses.Where(e => e.ProjectId == p.Id ...).SumAsync(...)   // 1
    ... await _context.Expenses.Where(e => e.ProjectId == p.Id ...).SumAsync(...)   // 2
    ... await _context.Expenses.Where(e => e.ProjectId == p.Id ...).SumAsync(...)   // 3
}
```

Ya'ni **har bir loyiha uchun 3 ta alohida bazaga so'rov**. 5 ta loyihada — 15 ta
qo'shimcha so'rov, 100 ta loyihada — 300 ta. Klassik N+1 muammosi va butun
backenddagi eng katta ishlash muammosi. Yuqoridagi 8 ta umumiy `SUM` allaqachon
bajarilgan, ya'ni bu ma'lumot bir marta guruhlab olinishi mumkin edi. Bosh
sahifa har ochilganda shu tsikl ishlaydi.

Shu tsiklda matematik xato ham bor:

```csharp
if (p.Budget > 0) { totalBudgetUtilization += util; ... }      // faqat Budget>0 qo'shiladi
var avgUtilization = totalProjects > 0
    ? Math.Round(totalBudgetUtilization / totalProjects, 2) : 0;   // lekin HAMMASIGA bo'linadi
```

Byudjeti belgilanmagan (`Budget = 0`) loyihalar yig'indiga qo'shilmaydi, lekin
bo'luvchida qoladi. Ikki loyiha bo'lsa — biri byudjetsiz, ikkinchisi 80% da —
o'rtacha 80% emas, **40%** ko'rsatiladi. Byudjetsiz loyiha qancha ko'p bo'lsa,
ko'rsatkich shuncha past chiqadi.

`AtRiskProjectsCount` faqat byudjet bo'yicha (`utilization ≥ 90%`) hisoblanadi.
Muddat bo'yicha xavf — `EndDate` o'tgan, lekin `Completed` bo'lmagan loyihalar —
umuman hisoblanmaydi; butun servisda `EndDate` bilan solishtirish yo'q.

`GetRecentActivitiesAsync` da o'lik shox bor: xarajatlar `e.ProjectId != null`
sharti bilan filtrlanadi, keyin `e.Project != null ? e.Project.Name : "Ofis"`
deb yozilgan — `"Ofis"` yorlig'i hech qachon chiqmaydi. Amaliy ma'nosi: ofis
xarajatlari faoliyat oqimida umuman ko'rinmaydi.

`GetStatusDistributionAsync` `GroupBy` qiladi, ya'ni bitta ham loyihasi yo'q
holat javobda **umuman bo'lmaydi** (nol emas, yo'q). Frontend buni hisobga
olishi kerak.

### 6.8. `TaskService` (221 qator) — progress hisoblagichi

PDF ning 8 va 15-bo'limlaridagi vaznli progress formulasi shu yerda, va **to'g'ri
ishlangan**:

```csharp
var totalWeight     = tasks.Sum(t => t.Weight);
var completedWeight = tasks.Where(t => t.IsCompleted).Sum(t => t.Weight);
project.ProgressPercent = Math.Round((decimal)completedWeight / totalWeight * 100, 2);
```

`RecalculateProjectProgressAsync` vazifa yaratilganda, tahrirlanganda,
belgilanganda va o'chirilganda — to'rt joyda ham chaqiriladi, ya'ni progress
hech qachon eskirib qolmaydi. `(decimal)` ga o'girish butun sonli bo'lishdan
saqlaydi, natija 2 xona aniqlikda. `Weight ≤ 0` bo'lsa 1 ga majburlanadi.

Bitta izchillik masalasi: **bosqich (`ProjectStage`) belgilanganda progress
qayta hisoblanmaydi.** Progressning yagona manbasi — vazifalar. Ya'ni barcha
bosqichni "bajarildi" deb belgilash progressni 0% dan siljitmaydi. Formula
PDF ga mos, lekin interfeysda bosqich va progress bir-biriga bog'liq ko'rinadi,
holbuki bog'liq emas.

### 6.9. `PaymentService` (118 qator) — validatsiyasi eng bo'sh servis

`AddPaymentAsync` faqat ikki narsani tekshiradi: loyiha bor, foydalanuvchi bor.
**Shartnoma summasidan oshiq to'lov qabul qilinishini to'xtatadigan hech narsa
yo'q.** Ya'ni 50 000 lik shartnomaga 500 000 to'lov kiritish mumkin va
`RemainingPayment` minusga o'tib ketadi.

Bu `WorkerService` bilan solishtirganda ko'zga tashlanadi: usta tomonida har
sent tekshiriladi, mijoz to'lovi tomonida hech narsa tekshirilmaydi. Ikkisi
bir xil mahsulotning ikki tomoni, lekin qat'iylik darajasi butunlay boshqa.

### 6.10. `MaterialService` (324 qator), `ExtraWorkService` (147), `ProjectMediaService` (289)

`MaterialService` — katalog (5 metod) + loyiha xaridlari (5 metod). Ijobiy:
`TotalCost = Math.Round(dto.Quantity * dto.UnitPrice, 2)` **serverda**
hisoblanadi, klientdan kelgan summaga ishonilmaydi. `Brand` xaridda
ko'rsatilmasa katalogdagi brenddan olinadi. Zaxira/ombor (stock) hisobi umuman
yo'q — material faqat narx katalogi, qoldiq miqdor kuzatilmaydi.

`ExtraWorkService` — `IsApprovedByCustomer` o'zgarganda `ApprovedAt` ni to'g'ri
qo'yadi va bekor qilinganda `null` ga qaytaradi. `CustomerAmount` (mijozga
qo'shimcha hisob) va `ActualCost` (haqiqiy xarajat) alohida saqlanadi — bu
to'g'ri model. Tasdiqlashning kim tomonidan qilinganini yozib qo'yish yo'q
(`ApprovedByUserId` maydoni mavjud emas).

`ProjectMediaService` — hujjat, foto, yangilanish (har biri 3 metod).
`IsVisibleToCustomer` bayrog'i foto va yangilanishda qo'llab-quvvatlanadi.
`PhotoUrl` va hujjat manzili — oddiy `string`, `Trim()` bilan saqlanadi.
**Haqiqiy fayl yuklash yo'q:** `IFormFile` butun loyihada uchramaydi, ya'ni
foydalanuvchi faylni avval boshqa joyga (masalan Google Drive ga) yuklab, keyin
havolasini qo'lga kiritishi kerak.

### 6.11. `CustomerService` (152), `UserService` (217)

Ikkisi ham `requestingUserId` + `requestingUserRole` oladi va `CompanyAdminId`
bo'yicha filtrlaydi; topilmasa `403` emas, `KeyNotFoundException` qaytaradi —
`ProjectAccessGuard` bilan bir xil uslub. Tenancy jihatidan bu ikkisi to'g'ri.

Eng muhim funksional kamchilik shu yerda: **`Customer.UserId` hech qachon
o'rnatilmaydi.** `CreateCustomerDto` da bu maydon yo'q, `CustomerService` unga
qiymat bermaydi. Butun kodda `Customer.UserId` ga yozish faqat bitta joyda —
`DbInitializer.cs:202`, ya'ni namuna ma'lumotida. Oqibati 9-bo'limda: mijoz
portali faqat seed qilingan demo mijoz uchun ishlaydi, ilova orqali yaratilgan
mijoz uchun **hech qachon** ishlamaydi.

### 6.12. `ExcelExportService` (732 qator) — eng katta fayl

Ikki hisobot: bitta loyiha uchun batafsil kitob va barcha loyihalar bo'yicha
umumiy kitob. ClosedXML ishlatilgan, ustun kengliklari, ranglar, `numeric`
formatlar qo'lda sozlangan — natija chiroyli chiqadi.

Tenancy jihatidan tekshirdim: `ExportAllProjectsToExcelAsync` avval ruxsat
etilgan loyiha ID larini aniqlaydi va faqat shularni yuklaydi. **Begona
kompaniya ma'lumoti umumiy Excelga tushmaydi** — bu joy to'g'ri qilingan.

Formulalar `ProjectService.GetSummaryAsync` bilan mos: ish haqi xarajati
`PaidAmount` (173-qator), usta qoldiq qarzi `AgreedAmount − PaidAmount`
(461-qator, yonida shu haqda izoh ham bor). Ya'ni Excel va API bir xil raqam
beradi.

Kamchilik — hajm: 732 qator ichida ustun sarlavhalari, ranglar va formulalar
aralash. Yangi ustun qo'shish uchun `ws.Cell(row, N)` indekslarini qo'lda
surish kerak. Bu fayl kelgusida eng ko'p xato chiqaradigan joy.

---

## 7. To'liq API katalogi — 87 endpoint

Quyidagi jadvallarda har bir endpoint, unga ruxsat etilgan rollar va **frontendda
ishlatilishi** ko'rsatilgan. "UI" ustuni: ✅ — interfeysdan chaqiriladi;
`—` — backendda bor, lekin hech qanday sahifa uni chaqirmaydi;
`◐` — `api/services.ts` da funksiya yozilgan, lekin hech bir komponent uni
chaqirmaydi (o'lik kod).

Rollar qisqartmalari: **SA** SuperAdmin, **A** Admin, **F** Finance,
**PM** ProjectManager, **FW** FieldWorker, **C** Customer.

### 7.1. Autentifikatsiya, foydalanuvchilar, bosh sahifa, hisobotlar

| Endpoint | Rollar | UI |
|---|---|---|
| `POST /api/auth/login` | anonim | ✅ |
| `POST /api/auth/register` | SA, A | ✅ |
| `GET /api/users/me` | har qanday login | ✅ |
| `GET /api/users` | SA, A | ✅ |
| `GET /api/users/{id}` | SA, A | — |
| `PUT /api/users/{id}` | SA, A | — |
| `PATCH /api/users/{id}/toggle-active` | SA, A | ✅ |
| `DELETE /api/users/{id}` | **faqat SA** | ✅ |
| `GET /api/dashboard/stats` | SA, A, F, PM | ✅ |
| `GET /api/dashboard/status-distribution` | SA, A, F, PM | ✅ |
| `GET /api/dashboard/recent-activities` | SA, A, F, PM | ✅ |
| `GET /api/reports/projects/{projectId}/excel` | SA, A, F, PM | ✅ |
| `GET /api/reports/all-projects/excel` | SA, A, F, PM | ✅ |
| `GET /api/office-expenses` | SA, A, F | ✅ |
| `POST /api/office-expenses` | SA, A, F | ✅ |
| `DELETE /api/office-expenses/{id}` | SA, A, F | ✅ |
| `GET /api/portal/projects/{projectId}` | A, F, PM, FW, C | ◐ |

E'tibor: `DELETE /api/users/{id}` faqat SuperAdmin uchun, lekin
`PATCH .../toggle-active` Admin uchun ham ochiq — ya'ni Admin xodimni
o'chira olmaydi, lekin bloklay oladi. Bu mantiqiy.

`GET /api/portal/...` — mijoz portali endpointi ishlaydi, lekin frontendda
uni chaqiradigan sahifa yo'q (`portalApi.getProject` funksiyasi yozilgan,
hech qayerdan chaqirilmaydi).

### 7.2. Loyihalar (`ProjectsController` — 14 endpoint)

| Endpoint | Rollar | UI |
|---|---|---|
| `GET /api/projects` | SA, A, PM, F, FW | ✅ |
| `GET /api/projects/{id}` | A, PM, F, FW | ✅ |
| `POST /api/projects` | A, PM | ✅ |
| `PUT /api/projects/{id}` | A, PM | ✅ |
| `PATCH /api/projects/{id}/status` | A, PM | ◐ |
| `GET /api/projects/{id}/summary` | A, F, PM | ✅ |
| `GET /api/projects/{id}/members` | A, PM | — |
| `POST /api/projects/{id}/members` | A, PM | — |
| `DELETE /api/projects/{id}/members/{userId}` | A, PM | — |
| `GET /api/projects/{id}/stages` | SA, A, PM, F, FW, C | ✅ |
| `POST /api/projects/{id}/stages` | A, PM | ✅ |
| `PATCH /api/projects/{id}/stages/{stageId}/complete` | A, PM, FW | ✅ |
| `DELETE /api/projects/{id}/stages/{stageId}` | A, PM | — |
| `DELETE /api/projects/{id}` | SA, A | ◐ |

Bu jadval 5.3-bo'limdagi izchillik muammosini yaqqol ko'rsatadi: `GET /projects`
va `GET /projects/{id}/stages` da SuperAdmin bor, `GET /projects/{id}` da yo'q;
loyihani **o'chirish** SuperAdmin ga ruxsat etilgan, **ochish** esa yo'q.

Loyiha a'zolari (`members`) uchun uchta to'liq ishlaydigan endpoint bor, lekin
interfeysda jamoa biriktirish oynasi umuman yo'q. Holbuki `ProjectService`
a'zolikni kirish huquqi hisoblashda ishlatadi (`Members.Any(m => m.UserId == me)`)
— ya'ni FieldWorker ni loyihaga biriktirish mumkin bo'lgan yagona yo'l API ni
qo'lda chaqirish.

### 7.3. Mustaqil kataloglar

| Endpoint | Rollar | UI |
|---|---|---|
| `GET /api/customers` | SA, A, PM, F | ✅ |
| `GET /api/customers/{id}` | SA, A, PM, F | ◐ |
| `POST /api/customers` | SA, A, PM | ✅ |
| `PUT /api/customers/{id}` | A, PM | — |
| `DELETE /api/customers/{id}` | **faqat A** | — |
| `GET /api/materials` | SA, A, F, PM, FW | ✅ |
| `GET /api/materials/{id}` | SA, A, F, PM, FW | — |
| `POST /api/materials` | SA, A, PM, F | ✅ |
| `PUT /api/materials/{id}` | A, PM, F | — |
| `DELETE /api/materials/{id}` | **faqat A** | — |
| `GET /api/workers` | SA, A, F, PM, FW | ✅ |
| `GET /api/workers/{id}` | SA, A, F, PM, FW | — |
| `POST /api/workers` | SA, A, PM, F | ✅ |
| `PUT /api/workers/{id}` | A, PM, F | — |
| `DELETE /api/workers/{id}` | **faqat A** | — |

Naqsh takrorlanadi: SuperAdmin material va ustani **yaratishi** mumkin, lekin
**tahrirlashi** mumkin emas (`PUT` da SA yo'q). Mijoz, material va usta
tahrirlash/o'chirish uchun 12 ta endpoint bor — **hech biri interfeysga
ulanmagan**.

### 7.4. Loyiha ichidagi endpointlar (43 ta — global filtr qamrab oladi)

Hammasi `api/projects/{projectId}/...` ostida, ya'ni `ProjectAccessFilter`
avtomatik tekshiradi.

| Guruh | Endpoint | Rollar | UI |
|---|---|---|---|
| To'lovlar | `GET payments` | A, F, PM | ✅ |
| | `GET payments/{id}` | A, F, PM | — |
| | `POST payments` | A, F | ✅ |
| | `DELETE payments/{id}` | faqat A | — |
| Xarajatlar | `GET expenses` (`?category=`) | A, F, PM, FW | ✅ |
| | `GET expenses/{id}` | A, F, PM, FW | — |
| | `POST expenses` | A, F, PM | ✅ |
| | `DELETE expenses/{id}` | A, F | — |
| Material xaridi | `GET material-purchases` | A, F, PM, FW | ✅ |
| | `GET material-purchases/{id}` | A, F, PM, FW | — |
| | `POST material-purchases` | A, F, PM | ✅ |
| | `DELETE material-purchases/{id}` | A, F | — |
| | `GET materials-summary` | A, F, PM | ✅ |
| Usta haqlari | `GET worker-payments` | A, F, PM, FW | ✅ |
| | `GET worker-payments/{id}` | A, F, PM, FW | — |
| | `POST worker-payments` | A, F, PM | ✅ |
| | `PATCH .../work-amount` | A, F, PM | ✅ |
| | `PATCH .../pay` | A, F | ✅ |
| | `DELETE worker-payments/{id}` | faqat A | — |
| | `GET workers-summary` | A, F, PM | ✅ |
| Qo'shimcha ish | `GET extra-works` | A, F, PM, FW | ✅ |
| | `GET extra-works/{id}` | A, F, PM, FW | — |
| | `POST extra-works` | A, PM | ✅ |
| | `PUT extra-works/{id}` | A, PM | — |
| | `PATCH .../toggle-approval` | A, PM | ✅ |
| | `DELETE extra-works/{id}` | faqat A | — |
| Vazifalar | `GET tasks` | A, F, PM, FW | ✅ |
| | `GET tasks/{id}` | A, F, PM, FW | — |
| | `POST tasks` | A, PM | ✅ |
| | `PUT tasks/{id}` | A, PM | — |
| | `PATCH .../toggle-complete` | A, PM, FW | ✅ |
| | `DELETE tasks/{id}` | A, PM | — |
| Hujjatlar | `GET documents` | A, F, PM, FW | ✅ |
| | `POST documents` | A, F, PM | ✅ |
| | `DELETE documents/{id}` | A, PM | — |
| Fotolar | `GET photos` | A, F, PM, FW, **C** | ✅ |
| | `POST photos` | A, PM, FW | ✅ |
| | `DELETE photos/{id}` | A, PM | — |
| Yangilanishlar | `GET updates` | A, F, PM, FW, **C** | ◐ |
| | `POST updates` | A, PM, FW | ◐ |
| | `DELETE updates/{id}` | A, PM | — |

Rol taqsimoti bu bo'limda **izchil va o'ylangan**: pul kiritish Finance/Admin da,
ish jarayoni PM/FieldWorker da, o'chirish deyarli hamma joyda faqat Admin da.
Bu qism loyihaning eng yaxshi loyihalashtirilgan tomonlaridan biri.

### 7.5. Qamrov hisobi

| Ko'rsatkich | Son |
|---|---|
| Jami endpoint | 87 |
| Interfeysdan chaqiriladi | 50 |
| `services.ts` da bor, lekin chaqirilmaydi (◐) | 6 |
| Interfeysda umuman yo'q (—) | 31 |
| Shundan `DELETE` | 16 ta 18 tadan |
| Shundan `PUT` (tahrirlash) | 6 ta 7 tadan |

O'lik `services.ts` funksiyalari (◐) aynan shular: `portalApi.getProject`,
`customersApi.getById`, `projectsApi.updateStatus`, `projectsApi.delete`,
`projectsApi.getUpdates`, `projectsApi.createUpdate`. Ya'ni **loyiha holatini
o'zgartirish va loyihani o'chirish uchun API funksiyalari yozilgan, lekin
tugma qo'yilmagan** — ish deyarli tugallangan, faqat interfeys qismi qolgan.

Ya'ni **backend API ning uchdan biri interfeysdan foydalanilmaydi**, va bu
tasodifiy taqsimlanmagan: yo'q bo'lgan qism deyarli butunlay **o'chirish va
tahrirlash**. Foydalanuvchi ma'lumot kirita oladi, lekin xato kiritsa
tuzata olmaydi. Amaliy jihatdan bu hozirgi eng katta funksional bo'shliq —
xavfsizlik teshigidan ham ko'proq sezilaydi.

---

## 8. Frontend — 5 954 qator, 21 fayl

Tuzilma sodda va tushunarli: `api/` (client + servislar), `context/AuthContext`,
`components/` (Sidebar, Header, NewProjectModal), `pages/` (12 sahifa),
`types/index.ts` (390 qator, backend DTO larining TypeScript ko'chirmasi).

Holat boshqaruvi kutubxonasi yo'q (Redux/Zustand yo'q), ma'lumot yuklash
kutubxonasi ham yo'q (React Query/SWR yo'q). Hamma narsa `useState` +
`useEffect` + `axios`. Bu hajmda ishlaydi, lekin 8.4 dagi oqibatlarga olib keladi.

### 8.1. Marshrutlash va ruxsat — route darajasida rol tekshiruvi yo'q

`App.tsx` da yagona himoya:

```tsx
if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
```

**Rol tekshiruvi yo'q.** Ya'ni tizimga kirgan har qanday foydalanuvchi
`/finance`, `/reports`, `/office` kabi manzillarni qo'lda yozib ochishi mumkin.
Sahifa ochiladi, so'ngra API `403` qaytaradi va sahifa bo'sh yoki xato bilan
ko'rinadi. Ma'lumot oqmaydi (backend to'sadi), lekin xatti-harakat noto'g'ri:
foydalanuvchi ruxsati yo'q joyga kirib, tushunarsiz bo'sh ekran ko'radi.

Ikkinchi masala — **navigatsiya ikki xil joyda, ikki xil ro'yxat bilan
ta'riflangan**:

| Manba | Elementlar |
|---|---|
| `App.tsx` → `navTabs` (yuqori tab qatori) | 7 ta: `/`, `/projects`, `/workers`, `/finance`, `/tasks`, `/reports`, `/office` |
| `Sidebar.tsx` → `navItems` (chap panel) | 9 ta: yuqoridagilar + `/customers` + `/materials` |

Mijozlar va Materiallar sahifalariga faqat chap paneldan borish mumkin, yuqori
tab qatorida ular yo'q. Yangi sahifa qo'shilganda ikki joyni ham yangilash
kerakligi hech qayerda yozilmagan.

`Routes` da 404 uchun `path="*"` yo'q — mavjud bo'lmagan manzil bo'sh sahifa
beradi (sidebar va header ko'rinadi, o'rtasi bo'sh).

### 8.2. `Customer` roli uchun interfeys umuman yo'q

Bu eng katta funksional bo'shliq. Mijoz tizimga kirsa:

`/` marshruti `isSuperAdmin ? <SuperAdminPage/> : <DashboardPage/>` — ya'ni mijoz
**`DashboardPage`** ga tushadi. `GET /api/dashboard/stats` esa
`[Authorize(Roles = "SuperAdmin,Admin,Finance,ProjectManager")]` — mijozga
ruxsat yo'q. Natija: `403`, bo'sh boshqaruv paneli. Yuqori tab qatorida mijozga
ham xuddi kompaniya xodimlariga beriladigan 7 ta tab ko'rinadi, ularning
deyarli hammasi `403` beradi.

Holbuki backend tomonda hammasi tayyor: `CustomerPortalController`
(`GET /api/portal/projects/{projectId}`) ishlaydi, mijozga faqat ko'rsatishga
ruxsat berilgan foto va yangilanishlarni filtrlab beradi, xarajat va foyda
raqamlarini yashiradi. `services.ts` da `portalApi.getProject` funksiyasi ham
yozilgan. **Faqat `/portal` sahifasi va marshruti yo'q.**

Ikkinchi qatlam muammo: hatto sahifa yozilsa ham, ilova orqali yaratilgan mijoz
uchun ishlamaydi. `ProjectAccessGuard` va `CustomerPortalService` mijozni
`Customers.UserId == userId` orqali topadi, `Customer.UserId` esa faqat
`DbInitializer` da to'ldiriladi (6.11-bo'lim). Ya'ni portal hozir **faqat seed
qilingan demo mijoz** uchun ishlashi mumkin.

### 8.3. `AuthContext` — 85 qator, ikkita nozik nuqta

Sxema to'g'ri: token `localStorage` da (`workdex_token`), `useEffect([token])`
o'zgarganda `GET /api/auth/me` chaqiriladi, xato bo'lsa token o'chirilib
chiqarib yuboriladi. Rol contextdan `user.role` sifatida olinadi — tokendan
o'qilmaydi, ya'ni JWT ni brauzerda parslash yo'q (yaxshi).

**a) `login()` ichidagi `await fetchUser()` bekor ish bajaradi.**

```tsx
const login = async (email, pass) => {
  const res = await authApi.login(email, pass);
  localStorage.setItem('workdex_token', res.token);
  setToken(res.token);
  await fetchUser();     // <- bu paytda closure dagi `token` hali eski (null)
};
```

`fetchUser` ichida `if (token)` — bu `token` login boshlangan paytdagi
qiymat, ya'ni `null`. Shuning uchun `authApi.getMe()` chaqirilmaydi, faqat
`setIsLoading(false)` ishlaydi. Foydalanuvchi ma'lumoti keyin
`useEffect([token])` orqali yuklanadi, shuning uchun **xato ko'rinmaydi** —
o'zini o'zi tuzatadi. Ammo kod o'quvchini chalg'itadi va `isLoading` bir zumga
noto'g'ri `false` bo'ladi.

**b) `logout()` server tomonga xabar bermaydi** — token faqat brauzerdan
o'chiriladi. Backendda ham `revoke`/`blacklist` yo'q (6.2), ya'ni chiqib
ketilgan token amal qilish muddati tugagunga qadar (7 kun) haqiqiy qoladi.

### 8.4. `client.ts` — 44 qator, muhit sozlamasi yo'q

```ts
export const getApiBaseUrl = (): string => {
  const hostname = window.location.hostname;
  if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:5082/api`;
  }
  return 'http://localhost:5082/api';
};
```

Uchta oqibat:

1. **`import.meta.env` umuman ishlatilmagan** (butun `src/` da bitta ham
   yo'q — tekshirildi). Ya'ni `.env` fayl yoki `VITE_API_URL` bilan boshqa
   manzilga o'tish imkoni yo'q; deployda kod o'zgartirish kerak.
2. **`http://` qattiq yozilgan.** Sayt HTTPS da joylashtirilsa, brauzer
   mixed-content sababli hamma so'rovni bloklaydi.
3. **Port `5082` qattiq yozilgan** va API frontend bilan bir xil hostda
   deb taxmin qilinadi — reverse proxy sxemasi (`/api` bir xil portda)
   ishlamaydi.

Interceptorda **faqat `401`** ishlanadi (token o'chirilib `/login` ga
yo'naltiriladi). `403` ishlanmaydi — 8.1 dagi ruxsatsiz sahifa muammosi shu
sababdan foydalanuvchiga hech qanday tushuntirish bermaydi. Yana bir mayda
narsa: `localStorage.removeItem('workdex_user')` — `workdex_user` kaliti butun
loyihada **hech qachon yozilmaydi**, faqat shu bitta joyda o'chiriladi.

### 8.5. Xabar berish tizimi: `alert()`

| Usul | Soni |
|---|---|
| `alert(...)` | 27 |
| `confirm(...)` | 2 |
| toast / snackbar / modal xabar komponenti | 0 |

Muvaffaqiyat ham, xato ham brauzerning modal `alert()` i bilan ko'rsatiladi
(eng ko'p `ProjectDetailPage` da — 17 ta). Backend `InvalidOperationException`
matnlari (masalan `WorkerService` ning batafsil moliyaviy xabarlari — 6.5)
foydalanuvchiga shu yo'l bilan yetadi, ya'ni backend xabarlari ko'rinadi, lekin
ko'rinishi qo'pol. `confirm()` faqat 2 joyda — qolgan o'chirish amallari
tasdiqlashsiz bajariladi.

`App.tsx:130` da loyiha yaratilgandan keyin:

```tsx
onSuccess={() => { window.location.reload(); }}
```

To'liq sahifa qayta yuklanadi — SPA mantiqiga qarshi, barcha holat yo'qoladi
va butun ilova qaytadan yuklanadi.

### 8.6. Bezak uchun qo'yilgan, ishlamaydigan elementlar

Prototipdan ko'chirilgan, hech qanday `onClick`/`onChange` biriktirilmagan:

| Element | Joy | Holati |
|---|---|---|
| ⌘K "Tezkor qidiruv" inputi | `Sidebar.tsx:92-97` | `value`/`onChange` yo'q — matn kiritiladi, hech narsa bo'lmaydi |
| `Grid` tugmasi (logo yonida) | `Sidebar.tsx:83-85` | `onClick` yo'q |
| Sana filtri "1 Avgust — 31 Avgust 2026" | `Header.tsx:27-30` | Matn qattiq yozilgan, tugma ishlamaydi |
| Bildirishnoma qo'ng'irog'i + qizil nuqta | `Header.tsx:33-36` | `onClick` yo'q; qizil nuqta doimo ko'rinadi |

Sidebar da `ExternalLink` importi ishlatilmaydi (`Sidebar.tsx:12`).

Sidebar ning "FAOL LOYIHALAR" ro'yxati aslida faol emas: `projectsApi.getAll()`
natijasining birinchi 5 tasi olinadi (`data.slice(0, 5)`), status bo'yicha
filtr yo'q — yakunlangan loyiha ham "faol" ro'yxatda turadi. Bundan tashqari
`useEffect` shartsiz ishlaydi (`Sidebar.tsx:33`), rol tekshiruvi esa faqat
ko'rsatishda (`:128`) — ya'ni SuperAdmin uchun ham `GET /api/projects`
yuboriladi, natijasi esa hech qachon ko'rsatilmaydi.

### 8.7. `ProjectDetailPage.tsx` — 2 047 qator

Butun frontend kodining 34 % i (5 954 qatordan 2 047) shu bitta faylda. O'lchovlar:

| Ko'rsatkich | Qiymat |
|---|---|
| Qatorlar | 2 047 |
| `useState` | 65 |
| Tab | 8 (`overview`, `finance`, `tasks`, `materials`, `workers`, `extraworks`, `photos`, `documents`) |
| `alert()` | 17 |

`loadAllData` bitta funksiyada **15 ta parallel so'rov** yuboradi
(`Promise.all`), va u 13 xil mutatsiya ishlovchisidan qayta chaqiriladi. Ya'ni
bitta vazifani belgilash ham 15 ta so'rovni qaytadan yuboradi. Ma'lumot
kutubxonasi (React Query) bo'lsa bu tabiiy tarzda hal bo'lardi; hozir esa
har bir amal butun sahifani qaytadan yuklaydi.

---

## 9. Frontend ↔ backend muvofiqligi

`frontend/src/types/index.ts` (390 qator) backend DTO larining qo'lda
ko'chirilgan nusxasi. Kod generatsiyasi yo'q (NSwag/OpenAPI generator yo'q),
shuning uchun har bir enum va maydon qo'lda mos kelishi kerak. To'rtta enum
tekshirildi — `UserRole` (0–5), `PaymentMethod` (1–4), `ExpenseCategory`
(1–17), `ExpenseFrequency` (1–3) — hammasi backend bilan **aynan bir xil**.
Beshinchisi esa mos kelmaydi.

### 9.1. 🔴 `ProjectStatus` enum qiymatlari almashib ketgan

Bu tahlilda topilgan eng aniq, foydalanuvchiga ko'rinadigan xato.

```csharp
// WorkDex.Api/Models/ProjectStatus.cs
public enum ProjectStatus { Planning = 1, InProgress = 2, OnHold = 3, Completed = 4, Cancelled = 5 }
```

```ts
// frontend/src/types/index.ts
export enum ProjectStatus { Planning = 1, InProgress = 2, Completed = 3, OnHold = 4 }
```

| Qiymat | Backend | Frontend | Natija |
|---:|---|---|---|
| 1 | Planning | Planning | ✅ mos |
| 2 | InProgress | InProgress | ✅ mos |
| **3** | **OnHold** | **Completed** | ❌ almashgan |
| **4** | **Completed** | **OnHold** | ❌ almashgan |
| **5** | **Cancelled** | *(yo'q)* | ❌ frontendda umuman yo'q |

Bu shunchaki e'tiborsizlik emas, chunki **raqamli qiymat interfeysni haqiqatan
boshqaradi**. Tekshirilgan chaqiruv joylari:

| Fayl | Qator | Nima qiladi |
|---|---|---|
| `ProjectsPage.tsx` | 33–46 | `getStatusPill` — status yorlig'i rangi va matni |
| `DashboardPage.tsx` | 205–218 | `getStatusPill` — xuddi shu |
| `Sidebar.tsx` | 57–65 | `getStatusDot` — yon paneldagi rangli nuqta |
| `ProjectsPage.tsx` | 81–84 | Status bo'yicha filtr `<option value={ProjectStatus.X}>` |

Amaldagi oqibatlar:

- Backendda **Yakunlangan** (4) loyiha interfeysda **"Kechikkan"** (OnHold
  rangi/matni) bo'lib ko'rinadi.
- Backendda **To'xtatilgan** (3) loyiha interfeysda **"Yakunlangan"** bo'lib
  ko'rinadi.
- Backendda **Bekor qilingan** (5) loyihada hech qanday yorliq chiqmaydi
  (`default` shoxiga tushadi).
- Loyihalar sahifasidagi "Yakunlangan" filtri `?status=3` yuboradi — ya'ni
  **to'xtatilgan** loyihalarni qaytaradi. Filtr ishlaydi, lekin noto'g'ri
  guruhni ko'rsatadi.

Bir joyda ziddiyat ham bor: matn ba'zi joylarda backend bergan `statusName`
satridan olinadi (`DashboardPage.tsx:395`, `FinancePage.tsx:160`,
`ProjectDetailPage.tsx:601`), ba'zi joylarda esa raqamdan hisoblanadi. Ya'ni
bitta ekranda bitta loyiha "Completed" deb yozilib, yonida "Kechikkan"
yorlig'i turishi mumkin.

**Nima uchun hozirgacha sezilmagan:** seed qilingan ikkita demo loyihaning
statuslari `InProgress` (2) va `Planning` (1) — `DbInitializer.cs:251,271`
va `database_backup.sql:246–247`. Bu ikki qiymat ikki enumda ham bir xil.
Xato faqat kimdir loyihani **Yakunlangan** yoki **To'xtatilgan** qilib
belgilaganda ko'rinadi. Bu esa hozircha interfeysdan mumkin emas, chunki
`PUT /api/projects/{id}/status` uchun UI yo'q (7.4). Ya'ni ikki nuqson bir-birini
yashirib turgan: status o'zgartirish tugmasi qo'shilgan kunning ertasi
enum xatosi darhol ko'rinadi.

Tuzatish arzon va xavfsiz — faqat frontend enumini backendga moslash va
`Cancelled = 5` ni qo'shish, hamda ikkita `getStatusPill` va `getStatusDot`
ga to'xtatilgan/bekor qilingan shoxlarini kiritish. Ma'lumotlar bazasi
o'zgarmaydi, ishlash mantig'i o'zgarmaydi.

### 9.2. 🟠 Sana yuborishning ikki xil usuli — bir xil endpointga

Bitta `ExpenseService.CreateOfficeExpenseAsync`/`AddExpenseAsync` juftligiga
frontend ikki xil formatda sana yuboradi:

```tsx
// ProjectDetailPage.tsx:280  — to'liq UTC instant
expenseDate: new Date(newExpDate).toISOString()    // "2026-09-05T00:00:00.000Z"

// OfficeExpensesPage.tsx:67  — <input type="date"> ning xom qiymati
expenseDate                                        // "2026-09-05"
```

Backendda ikkalasi ham shu qatordan o'tadi (`ExpenseService.cs:34` va `:138` —
butun backenddagi yagona ikki `ToUniversalTime()` chaqirig'i):

```csharp
ExpenseDate = dto.ExpenseDate.ToUniversalTime(),
```

Farq:

| Yuborilgan | `DateTime.Kind` | `ToUniversalTime()` nima qiladi | Bazaga tushadigan qiymat (server UTC+5) |
|---|---|---|---|
| `2026-09-05T00:00:00.000Z` | `Utc` | hech narsa (no-op) | `2026-09-05 00:00Z` |
| `2026-09-05` | `Unspecified` | **server mahalliy vaqti** deb qabul qiladi | `2026-09-04 19:00Z` |

Ya'ni foydalanuvchi bir xil kunni tanlaydi, lekin bazada 5 soat farq bilan
ikki xil instant saqlanadi. Bu ikki narsani buzadi:

1. **Deploy muhitiga bog'liqlik.** Xuddi shu ofis xarajati dev mashinada
   (Asia/Tashkent) va Docker konteynerida (odatda UTC) **turli qiymat** bilan
   yozildi — kod bir xil, natija boshqa. Bu takrorlanmaydigan xatolarning
   klassik manbasi.
2. **Ko'rsatishda kun siljishi.** Frontend `formatDate` da
   `new Date(dateStr).getDate()` ishlatadi (`OfficeExpensesPage.tsx:94-97`),
   ya'ni brauzer mahalliy vaqtiga o'giradi. Server UTC+5 da yozgan
   `2026-09-04 19:00Z` ni UTC yoki Evropa vaqt mintaqasidagi brauzer
   **04.09.2026** deb ko'rsatadi — bir kun oldin. Server va brauzer bir xil
   mintaqada bo'lganda (hozirgi holat) o'girish o'zaro qisqaradi va to'g'ri
   ko'rinadi, shuning uchun xato hozircha yashiringan.

Muhim nuqta: `ToUniversalTime()` o'zi tasodifiy qo'yilmagan — u **kerak**,
chunki Npgsql `timestamptz` ustuniga `Kind=Unspecified` bo'lgan `DateTime` ni
yozishga ruxsat bermaydi va istisno tashlaydi. Ya'ni bu qator
`OfficeExpensesPage` ning xom sanasi tufayli qo'yilgan vaqtinchalik yechim.
To'g'ri tuzatish — frontendda bir xil format ishlatish (`.toISOString()`),
yoki `ExpenseDate` ni `DateOnly` ga o'tkazish (bu esa mantiqni o'zgartiradi,
shuning uchun tavsiya birinchi variant).

### 9.3. 🟠 Mijoz portali strukturaviy jihatdan ishga tushmaydi

Uchta bo'g'in kerak, ikkitasi bor, biri yo'q:

| Bo'g'in | Holati |
|---|---|
| `CustomerPortalController` + `CustomerPortalService` | ✅ yozilgan, ishlaydi, xarajat/foyda maydonlarini yashiradi |
| `services.ts` → `portalApi.getProject` | ✅ yozilgan |
| `/portal` sahifasi va marshruti | ❌ **yo'q** |

Va hatto sahifa yozilganda ham hozircha ishlamaydi, chunki avtorizatsiya
`Customers.UserId == userId` ga tayanadi (`ProjectAccessGuard`), `Customer.UserId`
esa faqat `DbInitializer.cs:202` da to'ldiriladi. `CreateCustomerDto` da bunday
maydon yo'q, `CustomerService` ham uni hech qachon o'rnatmaydi. Ya'ni
ilova orqali yaratilgan **hech bir mijoz** o'z loyihasini ko'ra olmaydi
(6.11-bo'lim).

### 9.4. Mayda nomuvofiqliklar

**Vazifa yaratish formasi DTO ning yarmini yubormaydi.** `CreateTaskDto` da
6 maydon bor (`Title`, `StageId`, `Description`, `AssignedToUserId`, `Weight`,
`DueDate`), `services.ts:254-260` da hammasi e'lon qilingan, lekin
`ProjectDetailPage` formasida faqat **uchtasi** bor:

```tsx
// ProjectDetailPage.tsx:241-243 — yuborilayotgan hammasi shu
title: newTaskTitle,
weight: Number(newTaskWeight) || 1,
stageId: newTaskStageId || undefined,
```

Ya'ni `dueDate`, `assignedToUserId` va `description` hech qachon
yuborilmaydi. Oqibati ko'rinadigan: vazifalar jadvalidagi **"Muddat"**
ustuni (`:714`) va vazifa kartasidagi muddat matni (`:853`)
`formatDateUz(t.dueDate)` ni chaqiradi, `formatDateUz` esa `undefined` uchun
`'-'` qaytaradi (`:36`) — ya'ni ustun **doim bo'sh chiziqcha** ko'rsatadi.
Backendda `ThenBy(t => t.DueDate)` tartiblash ham ta'sirsiz qoladi (hamma
qiymat `null`), va "kechikkan vazifa" tushunchasi amalda mavjud emas.

**`ExpenseFrequency` — faqat yorliq.** `OfficeExpensesPage` "Bir martalik /
Kunlik / Oylik" ni tanlashga ruxsat beradi va KPI kartalarida ularni
guruhlab yig'indi ko'rsatadi. Lekin backendda hech qanday rejalashtiruvchi
(`BackgroundService`/`IHostedService`) yo'q — "Oylik" deb belgilangan xarajat
keyingi oy avtomatik takrorlanmaydi. Ya'ni maydon niyatni yozib qo'yadi,
hech narsa bajarmaydi.

**POST javobida `createdByName` bo'sh keladi.** `CreateOfficeExpenseAsync`
`MapToDto(expense)` ni qaytaradi, `expense.CreatedByUser` navigatsiyasi esa
yuklanmagan → `CreatedByName = ""` (`ExpenseService.cs:178`). Interfeysda
ko'rinmaydi, chunki `OfficeExpensesPage` yaratgandan keyin darhol
`loadExpenses()` chaqiradi va `GET` da `.Include(e => e.CreatedByUser)` bor
(`:114`). Ya'ni latent nomuvofiqlik — API ni boshqa mijoz ishlatsa ko'rinadi.

**Kompaniya nomi tokenda yo'q, `user.companyName` esa Sidebar da
ko'rsatiladi** (`Sidebar.tsx:162`) — `GET /api/auth/me` javobidan keladi,
ya'ni har sahifa yuklanishida qo'shimcha so'rov kerak. Bu ishlaydi, faqat
6.2 da yozilgan "tokenda kompaniya da'vosi yo'q" holatining natijasi.

---

## 10. Barcha topilmalar — jiddiylik bo'yicha

Belgilar: 🔴 kritik (ma'lumot yoki ishonch yo'qolishi) · 🟠 yuqori
(noto'g'ri natija yoki muhim bo'shliq) · 🟡 o'rta (texnik qarz, sezilarli
lekin xavfsiz) · 🟢 past (kosmetik).

### 10.1. 🔴 Kritik

| # | Topilma | Joy | Bo'lim |
|---|---|---|---|
| K1 | `DeleteOfficeExpenseAsync(Guid expenseId)` — `userId` ham, rol ham, `CompanyAdminId` ham tekshirilmaydi. Boshqa kompaniyaning ofis xarajatini ID bilan o'chirish mumkin. Bu backendda qolgan **yagona ochiq ko'p-tenantlik teshigi**. | `ExpenseService.cs:151` | 5.2, 6.6 |
| K2 | JWT imzo kaliti va PostgreSQL paroli `appsettings.json` da, repozitoriyaga kiritilgan holda. Kod tuzatib bo'lmaydi — **kalit va parolni almashtirish sizning zimmangizda**. | `appsettings.json` | 5.1 |
| K3 | `ProjectStatus` enum qiymatlari almashgan: backend `OnHold=3, Completed=4, Cancelled=5`, frontend `Completed=3, OnHold=4`, `Cancelled` yo'q. Yakunlangan loyiha "Kechikkan" bo'lib ko'rinadi, filtr noto'g'ri guruh qaytaradi. | `types/index.ts` ↔ `Models/ProjectStatus.cs` | 9.1 |
| K4 | 87 endpointdan 31 tasi interfeyssiz; shu jumladan **18 `DELETE` dan 16 tasi** va **7 `PUT` dan 6 tasi**. Foydalanuvchi ma'lumot kiritadi, lekin xato kiritsa tuzata olmaydi — faqat baza orqali. | butun `pages/` | 7.4, 7.5 |

### 10.2. 🟠 Yuqori

| # | Topilma | Joy | Bo'lim |
|---|---|---|---|
| Y1 | Frontendda **route darajasida rol tekshiruvi yo'q** — har qanday kirgan foydalanuvchi `/finance`, `/office` ni manzil satridan ochadi, API `403` beradi, ekran bo'sh qoladi. `client.ts` `403` ni ishlamaydi. | `App.tsx:37-39`, `client.ts:35` | 8.1, 8.4 |
| Y2 | `Customer` roli uchun interfeys yo'q: mijoz `DashboardPage` ga tushadi va `403` oladi. Backend portali (`CustomerPortalController`) va `portalApi.getProject` tayyor, faqat `/portal` sahifasi yozilmagan. | `App.tsx:111` | 8.2, 9.3 |
| Y3 | Portal hatto sahifa yozilganda ham ishlamaydi: avtorizatsiya `Customers.UserId` ga tayanadi, u esa faqat `DbInitializer.cs:202` da to'ldiriladi. Ilova orqali yaratilgan mijozda `UserId` doim `null`. | `CustomerService.cs` | 6.11, 9.3 |
| Y4 | `DashboardService` da o'rtacha byudjet foizi **noto'g'ri bo'linadi**: yig'indi faqat `Budget > 0` bo'lgan loyihalar ustidan olinadi, bo'luvchi esa `totalProjects` (hammasi). Byudjeti kiritilmagan loyiha bo'lsa o'rtacha pasayadi. | `DashboardService.cs:104-127` | 6.7 |
| Y5 | `DashboardService` N+1: har bir loyiha uchun `foreach` ichida 3 ta alohida `SumAsync` — 20 loyihada bitta panel yuklanishiga 60+ so'rov. | `DashboardService.cs:104-125` | 6.7 |
| Y6 | `PaymentService.AddPaymentAsync` da **ortiqcha to'lov nazorati yo'q** — mijoz shartnoma summasidan ko'p to'lov kiritish mumkin. `WorkerService` da xuddi shu joyda qat'iy tekshiruv bor (6.5), ya'ni nomuvofiqlik ataylab emas. | `PaymentService.cs` | 6.9 |
| Y7 | Sana yuborishning ikki xil usuli bir endpointga: `ProjectDetailPage` `.toISOString()`, `OfficeExpensesPage` xom `"YYYY-MM-DD"`. Ikkinchisi server vaqt mintaqasiga bog'liq instant yozadi — deploy muhitiga qarab qiymat o'zgaradi. | `OfficeExpensesPage.tsx:67`, `ExpenseService.cs:34,138` | 9.2 |
| Y8 | EF migratsiyalari o'lik kod: `Program.cs` `EnsureCreatedAsync()` chaqiradi, `Database.Migrate()` emas. 7 ta migratsiya hech qachon qo'llanilmaydi va `dotnet ef database update` boshqa ishlamaydi. Sxema o'zgarishi qo'lda SQL talab qiladi. | `Program.cs` | 3, 4.2 |
| Y9 | Haqiqiy fayl yuklash yo'q — `IFormFile` butun backendda mavjud emas, faqat URL matni saqlanadi. Foto va hujjat bo'limlari tashqi havolaga tayanadi. | `ProjectMediaService.cs` | 6.10 |
| Y10 | Bildirishnoma tizimi umuman yo'q — texnik topshiriqdagi 8 turdan **0 tasi**. `Header` dagi qo'ng'iroq bezak. | — | 8.6 |
| Y11 | Testlar yo'q — birorta test loyihasi, birorta test fayli yo'q. Moliyaviy hisob-kitoblar (6.4, 6.5, 6.12) hech qachon avtomatik tekshirilmagan. | — | 2 |
| Y12 | `client.ts` da `http://` va port `5082` qattiq yozilgan, `import.meta.env` umuman ishlatilmagan. HTTPS da mixed-content bloklanadi, deployda kod tahriri kerak. | `client.ts:3-13` | 8.4 |

### 10.3. 🟡 O'rta

| # | Topilma | Joy | Bo'lim |
|---|---|---|---|
| O1 | `CompanyAdminId` — 6 ta jadvalda oddiy `Guid?` skalyar: FK yo'q, **indeks yo'q**, navigatsiya yo'q, EF `HasQueryFilter` yo'q. Har bir servis filtrni qo'lda yozadi (shu sabab K1 yuzaga kelgan). | `Models/*.cs`, `AppDbContext.cs` | 4.3, 5.2 |
| O2 | Bosqich yakunlanganda loyiha progressi qayta hisoblanmaydi — `RecalculateProjectProgressAsync` faqat vazifa amallaridan chaqiriladi (4 joy). | `ProjectStageService.cs` | 6.8 |
| O3 | Ofis xarajatlari faoliyat lentasida hech qachon ko'rinmaydi: so'rov `e.ProjectId != null` bilan filtrlanadi, keyin `e.Project != null ? ... : "Ofis"` yoziladi — `"Ofis"` shoxi **erishib bo'lmaydigan o'lik kod**. | `DashboardService.cs:189-198` | 6.7 |
| O4 | `loadAllData` bitta chaqiruvda **15 parallel so'rov** yuboradi va 13 xil mutatsiya ishlovchisidan qayta chaqiriladi — bitta belgilash 15 so'rovni takrorlaydi. | `ProjectDetailPage.tsx:164-218` | 8.7 |
| O5 | Vazifa formasi `CreateTaskDto` ning 6 maydonidan 3 tasini yuboradi. "Muddat" ustuni doim `-`, mas'ul shaxs biriktirilmaydi, tavsif yozilmaydi. | `ProjectDetailPage.tsx:241-243` | 9.4 |
| O6 | `ExpenseFrequency` ("Kunlik/Oylik") faqat yorliq — takrorlash uchun `BackgroundService` yo'q, xarajat avtomatik yaratilmaydi. | `OfficeExpensesPage.tsx` | 9.4 |
| O7 | Materiallarda **ombor qoldig'i yuritilmaydi** — `Material` da miqdor maydoni yo'q, faqat xarid yozuvlari. Qolgan material hisobi mumkin emas. | `MaterialService.cs` | 6.10 |
| O8 | Bosqichlar (`ProjectStage`) uchun interfeys yo'q — vazifa formasida bosqich tanlanadi, lekin bosqichning o'zini yaratish/tahrirlash sahifasi yo'q. | `pages/` | 7.4 |
| O9 | `alert()` — 27 ta, `confirm()` — 2 ta, toast/modal komponenti 0. Barcha muvaffaqiyat va xato xabarlari brauzer modali orqali. O'chirish amallarining ko'pi tasdiqlashsiz. | butun `pages/` | 8.5 |
| O10 | `logout()` faqat brauzerdan tokenni o'chiradi. Serverda revoke/blacklist yo'q — chiqib ketilgan token 7 kun amal qiladi. | `AuthContext.tsx:52`, `JwtService.cs` | 6.2, 8.3 |
| O11 | `login()` ichidagi `await fetchUser()` bekor ish — closure dagi `token` hali eski. O'zini `useEffect([token])` tuzatadi, lekin `isLoading` bir zumga noto'g'ri `false` bo'ladi. | `AuthContext.tsx:45-50` | 8.3 |
| O12 | Loyiha o'chirish 11 ta bola jadvalni qo'lda `RemoveRange` qiladi. Bitta tranzaksiya — to'g'ri, lekin yangi bola jadval qo'shilganda bu ro'yxatni yangilash esdan chiqishi mumkin (kaskad EF konfiguratsiyasida emas). Soft delete yo'q. | `ProjectService.cs` `DeleteAsync` | 6.4 |
| O13 | `AtRiskProjectsCount` faqat byudjet foiziga qaraydi (`>= 90 %`). Muddat kechikishi (`EndDate` bo'yicha xavf) hech qayerda hisoblanmaydi. | `DashboardService.cs:123` | 6.7 |

### 10.4. 🟢 Past

| # | Topilma | Joy |
|---|---|---|
| P1 | Ishlamaydigan bezak elementlar: ⌘K qidiruv inputi (`onChange` yo'q), `Grid` tugmasi, "1 Avgust — 31 Avgust 2026" qattiq yozilgan sana filtri, doimiy qizil nuqtali bildirishnoma qo'ng'irog'i. | `Sidebar.tsx:83,92`, `Header.tsx:27,33` |
| P2 | Navigatsiya ikki joyda ikki xil ro'yxat bilan: `App.tsx` da 7 element, `Sidebar.tsx` da 9 (`/customers`, `/materials` qo'shimcha). Mijozlar va Materiallar yuqori tab qatorida yo'q. | `App.tsx:58-70`, `Sidebar.tsx:41-55` |
| P3 | `Routes` da `path="*"` yo'q — mavjud bo'lmagan manzil bo'sh sahifa beradi. | `App.tsx:110-122` |
| P4 | "FAOL LOYIHALAR" ro'yxati status bo'yicha filtrlanmaydi (`data.slice(0, 5)`) — yakunlangan loyiha ham "faol" bo'lib turadi. `useEffect` SuperAdmin uchun ham so'rov yuboradi, natija esa ko'rsatilmaydi. | `Sidebar.tsx:33-37,128` |
| P5 | Loyiha yaratilgandan keyin `window.location.reload()` — butun SPA qaytadan yuklanadi. | `App.tsx:130` |
| P6 | `localStorage.removeItem('workdex_user')` — bu kalit loyihada hech qachon **yozilmaydi**. | `client.ts:37` |
| P7 | Ishlatilmagan import: `ExternalLink`. | `Sidebar.tsx:12` |
| P8 | `POST /api/office-expenses` javobida `createdByName` bo'sh (`CreatedByUser` yuklanmagan). Interfeysda ko'rinmaydi, chunki darhol `GET` qayta chaqiriladi. | `ExpenseService.cs:148,178` |
| P9 | `services.ts` da yozilgan, lekin hech qachon chaqirilmagan 6 funksiya: `portalApi.getProject`, `customersApi.getById`, `projectsApi.updateStatus`, `projectsApi.delete`, `projectsApi.getUpdates`, `projectsApi.createUpdate`. | `api/services.ts` |

---

## 11. Tavsiya etilgan tuzatish tartibi

Tartib "arzon va xavfsiz" dan "qimmat va mantiqqa tegadigan" tomon
qurilgan. Har bir bosqichda **mantiqni o'zgartirmaydigan** ishlar oldinda —
sizning "logika o'zgarmasin" shartiga mos.

### 11.1. Bosqich 0 — faqat sizga tegishli (kod bilan hal bo'lmaydi)

`appsettings.json` repozitoriyaga JWT imzo kaliti va PostgreSQL paroli bilan
kiritilgan (K2). Kodni qanday tuzatsak ham, git tarixida qolgan sirlar
kuchsizlanmaydi. Shuning uchun **kalitni va bazadan parolni almashtirish, va
yangi qiymatlarni faqat muhit o'zgaruvchisi orqali berish** — sizning
qadamingiz. Kod tomonda bunga hech narsa qo'shish kerak emas:
`WebApplication.CreateBuilder` standart konfiguratsiya iyerarxiyasida muhit
o'zgaruvchilari `appsettings.json` dan **ustun turadi**, ya'ni

```
JwtSettings__SecretKey=<yangi kalit>
ConnectionStrings__DefaultConnection=<yangi ulanish satri>
```

o'rnatilsa, fayldagi qiymatlar avtomatik almashtiriladi
(`Program.cs:17,33` shu kalitlarni o'qiydi). `Program.cs:25` da kalit
uzunligini tekshiruv ham bor — sozlanmagan yoki 32 baytdan qisqa bo'lsa
ilova ishga tushmaydi, ya'ni xato jimgina o'tib ketmaydi.

### 11.2. Bosqich 1 — mantiq o'zgarmaydi, xatoni to'g'ridan-to'g'ri yopadi

Bu to'rttasi eng yuqori foyda / eng past xavf nisbatiga ega.

1. **K1 — `DeleteOfficeExpenseAsync` ga tenantlik tekshiruvi.** Metodga
   `Guid requestingUserId, UserRole requestingUserRole` qo'shib, xuddi
   `GetOfficeExpensesAsync:96-111` dagi `companyAdminId` hisoblashni
   takrorlash va `e.CompanyAdminId == companyAdminId` shartini qo'shish.
   Boshqa hech narsa o'zgarmaydi — mavjud xatti-harakat o'z kompaniyasi
   ichida bir xil qoladi, faqat begona yozuv `404` oladi. Controller
   allaqachon `User` claim laridan foydalanadi, ya'ni o'zgarish 2 fayl.
2. **K3 — `ProjectStatus` enumini moslash.** `types/index.ts` da
   `OnHold = 3, Completed = 4, Cancelled = 5` qilib yozish, so'ng
   `ProjectsPage.tsx:33-46`, `DashboardPage.tsx:205-218`,
   `Sidebar.tsx:57-65` ga `Cancelled` shoxini qo'shish. Baza tegilmaydi,
   backend tegilmaydi.
3. **Y7 — sana formatini birlashtirish.** `OfficeExpensesPage.tsx:67` ni
   `expenseDate: new Date(expenseDate).toISOString()` qilish. Bir qatorli
   o'zgarish; `ExpenseService.cs:34,138` dagi `ToUniversalTime()` shundan
   keyin no-op bo'lib qoladi va olib tashlashga hojat yo'q (xavfsizlik uchun
   qolsin).
4. **Y1 — `403` ni ishlash + route himoyasi.** `client.ts` interceptoriga
   `403` shoxini qo'shib tushunarli xabar ko'rsatish, va `App.tsx` da
   `<Route>` larni ruxsat etilgan rollar ro'yxati bilan o'rash. Backend
   ruxsatlari o'zgarmaydi — faqat interfeys ular bilan mos keladi.

### 11.3. Bosqich 2 — aniq xato tuzatishlari (tasdiq talab qiladi)

Bular hisob-kitob natijasini **ataylab o'zgartiradi**, shuning uchun
avval sizdan so'raladi:

- **Y4** — o'rtacha byudjet foizi bo'luvchisini `Budget > 0` bo'lgan
  loyihalar soniga o'zgartirish. Panelda ko'rinadigan raqam o'zgaradi.
- **Y6** — `PaymentService.AddPaymentAsync` ga ortiqcha to'lov tekshiruvi.
  Hozir qabul qilinadigan yozuv keyin rad etiladi.
- **O2** — bosqich yakunlanganda progressni qayta hisoblash.
- **O3** — faoliyat lentasiga ofis xarajatlarini kiritish (`e.ProjectId != null`
  filtrini olib tashlash).
- **O13** — `AtRiskProjectsCount` ga muddat kechikishi mezonini qo'shish.

Eslatma: `TotalExpenses`, `GrossProfit`, `RemainingBudget` va
`BudgetUtilizationPercent` bu ro'yxatda **yo'q** — ular sizning ko'rsatmangizga
ko'ra tegilmaydi. Excel ↔ API mos kelishi allaqachon o'z joyida
(`ExcelExportService.cs:459-461` va `ProjectDetailPage.tsx:990` ikkalasi ham
`Agreed − Paid`, mehnat xarajati esa uchta iste'molchida ham `PaidAmount`),
ya'ni 6.12 da yozilgani faqat kassa-asosli hisob tanlovi, nomuvofiqlik emas.

### 11.4. Bosqich 3 — texnik qarz, natija o'zgarmaydi

- **Y8** — `EnsureCreatedAsync()` → `Database.Migrate()` ga o'tish. Mavjud
  bazada bu bir marta qo'lda `__EFMigrationsHistory` to'ldirishni talab
  qiladi (baseline), shuning uchun rejalashtirib bajarish kerak.
- **O1** — `CompanyAdminId` ga indeks qo'shish (`HasIndex`). So'rov natijasi
  bir xil, faqat tezlashadi.
- **Y5 / O4** — `DashboardService` dagi `foreach` ni bitta guruhlangan
  so'rovga aylantirish, `loadAllData` ni mutatsiyadan keyin qisman
  yangilashga o'tkazish. Natija bir xil, so'rov soni tushadi.
- **Y12** — `import.meta.env.VITE_API_URL` ni joriy qilish, `http://` ni
  `window.location.protocol` ga bog'lash.
- **P1–P7** — bezak elementlarni yoki ishlatish, yoki olib tashlash;
  navigatsiya ro'yxatini bitta manbaga keltirish; `path="*"` qo'shish.

### 11.5. Bosqich 4 — yetishmayotgan funksiyalar (yangi ish)

Hajm bo'yicha tartiblangan, eng ko'p qiymat beradigani birinchi:

1. **K4 — tahrirlash va o'chirish interfeyslari.** 16 `DELETE` + 6 `PUT`
   endpoint tayyor turibdi; ularga tugma va tasdiq dialogi qo'shish kifoya.
   Yangi backend kodi kerak emas. Foydalanuvchi uchun eng sezilarli yaxshilanish.
2. **Y2 + Y3 — mijoz portali.** `/portal` sahifasi, `Customer` roli uchun
   alohida navigatsiya, va `Customer.UserId` ni to'ldirish yo'li
   (`CreateCustomerDto` ga maydon yoki mijoz ro'yxatdan o'tishida bog'lash).
3. **Y9 — haqiqiy fayl yuklash.** `IFormFile` endpoint + `wwwroot` statik
   fayllar yoki S3-mos xotira.
4. **O8 — bosqichlar interfeysi**, keyin **O5** (vazifa formasiga muddat,
   mas'ul, tavsif).
5. **Y10 — bildirishnomalar** (8 turdan boshlab eng kerakli 2-3 tasi).
6. **O7 — ombor qoldig'i**, **O6 — takrorlanuvchi xarajat rejalashtiruvchisi**.
7. **Y11 — testlar.** Eng avval moliyaviy hisob-kitoblar uchun:
   `ProjectService.GetSummaryAsync`, `WorkerService.PayWorkerAsync`,
   `TaskService.RecalculateProjectProgressAsync`, `ExcelExportService`.
   Bu ro'yxatda oxirgi o'rinda emas — aksincha, Bosqich 2 ga kirishdan
   oldin shu to'rtta joyni testga o'rab olish o'zgarishlarni ancha xavfsiz
   qiladi.

### 11.6. Nima yaxshi ishlangan

Tahlil davomida ataylab qidirilgan, lekin topilmagan muammolar — bu ham
natija:

- **SQL injection yo'q** — hamma so'rov LINQ/EF orqali, xom SQL faqat
  `database_backup.sql` da.
- **Parol xeshlash to'g'ri** — BCrypt, ishchi omil standart, xeş hech qayerda
  javobga chiqmaydi.
- **Ro'yxatdan o'tish iyerarxiyasi zich** — `AuthService` da kim kimni
  yaratishi mumkinligi to'liq tekshirilgan; `"superadmin"` login taxallusi
  ham BCrypt tekshiruvidan o'tadi, ya'ni bypass emas (6.1).
- **`ProjectAccessFilter`** — 43 endpointni 11 kontrollerni tahrirlamasdan
  himoyalaydi va ataylab `404` qaytaradi (mavjudlikni oshkor qilmaslik
  uchun). Bu loyihadagi eng chiroyli arxitektura qarori (6.3).
- **`WorkerService` moliyaviy validatsiyasi** — `Work ≤ Agreed`,
  `Paid ≤ Agreed`, `Work ≥ Paid`, qoldiqdan oshiq to'lov rad etiladi, xato
  xabarlari summalar bilan. Butun kodda eng qat'iy joy (6.5).
- **Progress formulasi** — og'irlikka asoslangan hisob to'g'ri yozilgan va
  4 nuqtadan izchil chaqiriladi (6.8).
- **Excel eksporti** — `ClosedXML` bilan puxta yozilgan, API bilan bir xil
  formulalardan foydalanadi (6.12).
- **Enumlarning 4 tasi frontend bilan aynan mos** — faqat `ProjectStatus`
  chetga chiqqan (9-bo'lim).

---

*Tahlil tugadi. 87 endpoint, 21 frontend fayl, 16 servis, 7 migratsiya,
5 954 qator frontend va backendning to'liq qatlamlari ko'rib chiqildi.
Har bir topilma fayl va qator raqami bilan tekshirilishi mumkin.*
