-- ====================================================================
-- WORKDEX POSTGRESQL DATABASE BACKUP & SEED DATA SCRIPT
-- Ushbu SQL faylni pgAdmin yoki psql orqali to'g'ridan-to'g'ri run qilsangiz,
-- barcha jadvallar va to'liq ma'lumotlar avtomatik yuklanadi.
-- ====================================================================

-- 1. BAZA VA JADVALLAR STRUKTURASI
CREATE TABLE IF NOT EXISTS "Users" (
    "Id" UUID PRIMARY KEY,
    "FirstName" VARCHAR(100) NOT NULL,
    "LastName" VARCHAR(100) NOT NULL,
    "Email" VARCHAR(200) NOT NULL UNIQUE,
    "PasswordHash" TEXT NOT NULL,
    "PhoneNumber" VARCHAR(20),
    "CompanyName" VARCHAR(200),
    "Role" INTEGER NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Customers" (
    "Id" UUID PRIMARY KEY,
    "FullName" VARCHAR(200) NOT NULL,
    "PhoneNumber" VARCHAR(50) NOT NULL,
    "Email" VARCHAR(200),
    "Address" VARCHAR(500),
    "Notes" TEXT,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Projects" (
    "Id" UUID PRIMARY KEY,
    "Name" VARCHAR(200) NOT NULL,
    "ProjectType" VARCHAR(100) NOT NULL,
    "Location" VARCHAR(200),
    "ContractAmount" NUMERIC(18,2) NOT NULL,
    "Budget" NUMERIC(18,2) NOT NULL,
    "Currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
    "StartDate" TIMESTAMPTZ NOT NULL,
    "EndDate" TIMESTAMPTZ,
    "ActualEndDate" TIMESTAMPTZ,
    "Status" INTEGER NOT NULL DEFAULT 1,
    "ProgressPercent" INTEGER NOT NULL DEFAULT 0,
    "Notes" TEXT,
    "CustomerId" UUID REFERENCES "Customers"("Id") ON DELETE SET NULL,
    "CreatedByUserId" UUID NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ProjectStages" (
    "Id" UUID PRIMARY KEY,
    "ProjectId" UUID NOT NULL REFERENCES "Projects"("Id") ON DELETE CASCADE,
    "Name" VARCHAR(200) NOT NULL,
    "Description" TEXT,
    "OrderIndex" INTEGER NOT NULL DEFAULT 0,
    "IsCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "CompletedAt" TIMESTAMPTZ,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Tasks" (
    "Id" UUID PRIMARY KEY,
    "ProjectId" UUID NOT NULL REFERENCES "Projects"("Id") ON DELETE CASCADE,
    "StageId" UUID REFERENCES "ProjectStages"("Id") ON DELETE SET NULL,
    "Title" VARCHAR(200) NOT NULL,
    "Weight" INTEGER NOT NULL DEFAULT 1,
    "IsCompleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "CompletedAt" TIMESTAMPTZ,
    "DueDate" TIMESTAMPTZ,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Materials" (
    "Id" UUID PRIMARY KEY,
    "Name" VARCHAR(200) NOT NULL,
    "Unit" VARCHAR(50) NOT NULL,
    "Description" TEXT,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "MaterialPurchases" (
    "Id" UUID PRIMARY KEY,
    "ProjectId" UUID NOT NULL REFERENCES "Projects"("Id") ON DELETE CASCADE,
    "MaterialId" UUID NOT NULL REFERENCES "Materials"("Id") ON DELETE RESTRICT,
    "Quantity" NUMERIC(18,2) NOT NULL,
    "UnitPrice" NUMERIC(18,2) NOT NULL,
    "TotalCost" NUMERIC(18,2) NOT NULL,
    "Supplier" VARCHAR(200),
    "PurchaseDate" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "CreatedByUserId" UUID NOT NULL REFERENCES "Users"("Id") ON DELETE RESTRICT,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Workers" (
    "Id" UUID PRIMARY KEY,
    "FullName" VARCHAR(200) NOT NULL,
    "PhoneNumber" VARCHAR(50) NOT NULL,
    "Specialty" VARCHAR(100),
    "Notes" TEXT,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "WorkerPayments" (
    "Id" UUID PRIMARY KEY,
    "ProjectId" UUID NOT NULL REFERENCES "Projects"("Id") ON DELETE CASCADE,
    "WorkerId" UUID NOT NULL REFERENCES "Workers"("Id") ON DELETE RESTRICT,
    "JobDescription" VARCHAR(500) NOT NULL,
    "AgreedAmount" NUMERIC(18,2) NOT NULL,
    "WorkAmount" NUMERIC(18,2) NOT NULL DEFAULT 0,
    "PaidAmount" NUMERIC(18,2) NOT NULL DEFAULT 0,
    "PaymentDate" TIMESTAMPTZ,
    "Notes" TEXT,
    "CreatedByUserId" UUID NOT NULL REFERENCES "Users"("Id") ON DELETE RESTRICT,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Payments" (
    "Id" UUID PRIMARY KEY,
    "ProjectId" UUID NOT NULL REFERENCES "Projects"("Id") ON DELETE CASCADE,
    "Amount" NUMERIC(18,2) NOT NULL,
    "PaymentMethod" INTEGER NOT NULL,
    "PaymentDate" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "Notes" TEXT,
    "ReceivedByUserId" UUID NOT NULL REFERENCES "Users"("Id") ON DELETE RESTRICT,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Expenses" (
    "Id" UUID PRIMARY KEY,
    "ProjectId" UUID NOT NULL REFERENCES "Projects"("Id") ON DELETE CASCADE,
    "Category" INTEGER NOT NULL,
    "Amount" NUMERIC(18,2) NOT NULL,
    "Description" VARCHAR(500) NOT NULL,
    "ExpenseDate" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "CreatedByUserId" UUID NOT NULL REFERENCES "Users"("Id") ON DELETE RESTRICT,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ExtraWorks" (
    "Id" UUID PRIMARY KEY,
    "ProjectId" UUID NOT NULL REFERENCES "Projects"("Id") ON DELETE CASCADE,
    "Title" VARCHAR(200) NOT NULL,
    "Description" TEXT,
    "CustomerAmount" NUMERIC(18,2) NOT NULL,
    "ActualCost" NUMERIC(18,2) NOT NULL,
    "IsApprovedByCustomer" BOOLEAN NOT NULL DEFAULT FALSE,
    "ApprovedAt" TIMESTAMPTZ,
    "CreatedByUserId" UUID NOT NULL REFERENCES "Users"("Id") ON DELETE RESTRICT,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Photos" (
    "Id" UUID PRIMARY KEY,
    "ProjectId" UUID NOT NULL REFERENCES "Projects"("Id") ON DELETE CASCADE,
    "StageId" UUID REFERENCES "ProjectStages"("Id") ON DELETE SET NULL,
    "PhotoUrl" TEXT NOT NULL,
    "Caption" VARCHAR(500),
    "IsVisibleToCustomer" BOOLEAN NOT NULL DEFAULT TRUE,
    "PhotoDate" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "UploadedByUserId" UUID NOT NULL REFERENCES "Users"("Id") ON DELETE RESTRICT,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Documents" (
    "Id" UUID PRIMARY KEY,
    "ProjectId" UUID NOT NULL REFERENCES "Projects"("Id") ON DELETE CASCADE,
    "Title" VARCHAR(200) NOT NULL,
    "FilePath" TEXT NOT NULL,
    "FileType" VARCHAR(50),
    "UploadedByUserId" UUID NOT NULL REFERENCES "Users"("Id") ON DELETE RESTRICT,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ProjectUpdates" (
    "Id" UUID PRIMARY KEY,
    "ProjectId" UUID NOT NULL REFERENCES "Projects"("Id") ON DELETE CASCADE,
    "StageId" UUID REFERENCES "ProjectStages"("Id") ON DELETE SET NULL,
    "Notes" TEXT NOT NULL,
    "WeatherConditions" VARCHAR(100),
    "WorkersCount" INTEGER NOT NULL DEFAULT 0,
    "UpdateDate" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "CreatedByUserId" UUID NOT NULL REFERENCES "Users"("Id") ON DELETE RESTRICT,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ProjectMembers" (
    "Id" UUID PRIMARY KEY,
    "ProjectId" UUID NOT NULL REFERENCES "Projects"("Id") ON DELETE CASCADE,
    "UserId" UUID NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "RoleInProject" VARCHAR(100),
    "AssignedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 2. FOYDALANUVCHILARNI KIRITISH (Parol: admin123)
-- Hash: $2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
-- ====================================================================

INSERT INTO "Users" ("Id", "FirstName", "LastName", "Email", "PasswordHash", "PhoneNumber", "CompanyName", "Role", "IsActive", "CreatedAt", "UpdatedAt")
VALUES 
    ('534a7f7a-4869-41ce-9f3c-8643536ae3ef', 'Super', 'Admin', 'superadmin@workdex.uz', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+998900000001', 'WorkDex Bosh Boshqaruvi', 0, true, NOW(), NOW()),
    ('693f6821-a82d-45ad-8025-9822b4471b6b', 'Hamidulloh', 'Hakimov', 'admin@wordex.uz', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+998901234567', 'Grand Stroy Qurilish MCHJ', 1, true, NOW(), NOW()),
    ('4cc887c8-88c8-4769-8770-e6376275d9a5', 'Sanjar', 'Rahimov', 'pm@workdex.uz', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+998902345678', 'Grand Stroy Qurilish MCHJ', 2, true, NOW(), NOW()),
    ('8debaeab-5d1e-4b95-8bf0-905b77b44c2f', 'Otabek', 'Nazarov', 'worker@workdex.uz', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+998903456789', 'Grand Stroy Qurilish MCHJ', 3, true, NOW(), NOW()),
    ('f65e5e27-158c-4d2d-9bab-b6920369b5de', 'Nodira', 'Karimova', 'finance@workdex.uz', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+998904567890', 'Grand Stroy Qurilish MCHJ', 4, true, NOW(), NOW()),
    ('0dce7ab4-a2f2-4f6c-abd9-a56204a2d4f4', 'Ahmad', 'Yusupov', 'customer@workdex.uz', '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+998901112233', NULL, 5, true, NOW(), NOW())
ON CONFLICT ("Email") DO NOTHING;

-- ====================================================================
-- 3. MIJOZLAR (CUSTOMERS)
-- ====================================================================
INSERT INTO "Customers" ("Id", "FullName", "PhoneNumber", "Email", "Address", "Notes", "CreatedAt")
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Ahmad Yusupov', '+998901112233', 'customer@workdex.uz', 'Toshkent sh., Chilonzor tumani, 19-mavze', 'Doimiy mijoz', NOW()),
    ('22222222-2222-2222-2222-222222222222', 'Dilshod Aliyev', '+998935554433', 'dilshod@gmail.com', 'Toshkent sh., Yunusobod tumani', 'Yangi ofis buyurtmachisi', NOW())
ON CONFLICT ("Id") DO NOTHING;

-- ====================================================================
-- 4. MATERIALLAR KATALOGI
-- ====================================================================
INSERT INTO "Materials" ("Id", "Name", "Unit", "Description", "CreatedAt")
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Ispan kafeli 60x60', 'm²', 'Yuqori sifatli pol kafeli', NOW()),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Knauf Gipsokarton 12.5mm', 'dona', 'Namlikka chidamli', NOW()),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'M-500 Sement', 'qop', 'Portlend sement 50kg', NOW()),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Marshall devor bo''yog''i', 'litr', 'Yuviladigan oq bo''yoq', NOW()),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Mis elektr kabeli 3x2.5', 'metr', 'GOST mis sim', NOW())
ON CONFLICT ("Id") DO NOTHING;

-- ====================================================================
-- 5. USTALAR (WORKERS)
-- ====================================================================
INSERT INTO "Workers" ("Id", "FullName", "PhoneNumber", "Specialty", "Notes", "CreatedAt")
VALUES
    ('99999999-9999-9999-9999-999999999991', 'Hasan Usta', '+998901234567', 'Kafelchi & Santexnik', '10 yillik tajriba', NOW()),
    ('99999999-9999-9999-9999-999999999992', 'Akmal Usta', '+998912345678', 'Elektrik & Montajchi', 'Elektr ishlari bo''yicha usta', NOW()),
    ('99999999-9999-9999-9999-999999999993', 'Jamshid Usta', '+998933456789', 'Suvoqchi & Malyar', 'Devor suvoq ustasi', NOW())
ON CONFLICT ("Id") DO NOTHING;

-- ====================================================================
-- 6. LOYIHALAR (PROJECTS)
-- ====================================================================
INSERT INTO "Projects" ("Id", "Name", "ProjectType", "Location", "ContractAmount", "Budget", "Currency", "StartDate", "EndDate", "Status", "ProgressPercent", "Notes", "CustomerId", "CreatedByUserId", "CreatedAt")
VALUES
    ('77777777-7777-7777-7777-777777777771', 'Ahmad Yusupov — Villa ta''miri', 'Villa renovatsiyasi', 'Toshkent, Chilonzor tumani', 50000.00, 35000.00, 'USD', '2026-08-01 00:00:00+00', '2026-10-30 00:00:00+00', 2, 50, 'Asosiy namuna loyiha', '11111111-1111-1111-1111-111111111111', '693f6821-a82d-45ad-8025-9822b4471b6b', NOW()),
    ('77777777-7777-7777-7777-777777777772', 'Dilshod Aliyev — Ofis loyihasi', 'Tijorat / Ofis', 'Toshkent, Yunusobod tumani', 30000.00, 20000.00, 'USD', '2026-09-01 00:00:00+00', '2026-11-15 00:00:00+00', 1, 0, 'Rejalashtirish bosqichida', '22222222-2222-2222-2222-222222222222', '693f6821-a82d-45ad-8025-9822b4471b6b', NOW())
ON CONFLICT ("Id") DO NOTHING;

-- ====================================================================
-- 7. BOSQICHLAR (STAGES)
-- ====================================================================
INSERT INTO "ProjectStages" ("Id", "ProjectId", "Name", "OrderIndex", "IsCompleted", "CreatedAt")
VALUES
    ('88888888-8888-8888-8888-888888888881', '77777777-7777-7777-7777-777777777771', '1. Demontaj va tayyorgarlik', 1, true, NOW()),
    ('88888888-8888-8888-8888-888888888882', '77777777-7777-7777-7777-777777777771', '2. Santexnika va elektr montaji', 2, false, NOW()),
    ('88888888-8888-8888-8888-888888888883', '77777777-7777-7777-7777-777777777771', '3. Pardozlash va kafel terish', 3, false, NOW()),
    ('88888888-8888-8888-8888-888888888884', '77777777-7777-7777-7777-777777777771', '4. Yakuniy topshirish va tozalash', 4, false, NOW())
ON CONFLICT ("Id") DO NOTHING;

-- ====================================================================
-- 8. VAZIFALAR (TASKS)
-- ====================================================================
INSERT INTO "Tasks" ("Id", "ProjectId", "StageId", "Title", "Weight", "IsCompleted", "DueDate", "CreatedAt")
VALUES
    ('55555555-5555-5555-5555-555555555551', '77777777-7777-7777-7777-777777777771', '88888888-8888-8888-8888-888888888881', 'Oshxona devorini demontaj qilish', 2, true, '2026-08-07 00:00:00+00', NOW()),
    ('55555555-5555-5555-5555-555555555552', '77777777-7777-7777-7777-777777777771', '88888888-8888-8888-8888-888888888882', 'Elektr simlari va montaj qutilarini o''rnatish', 3, true, '2026-08-18 00:00:00+00', NOW()),
    ('55555555-5555-5555-5555-555555555553', '77777777-7777-7777-7777-777777777771', '88888888-8888-8888-8888-888888888883', 'Kafel yotqizish va tekislash', 3, false, '2026-09-15 00:00:00+00', NOW()),
    ('55555555-5555-5555-5555-555555555554', '77777777-7777-7777-7777-777777777771', '88888888-8888-8888-8888-888888888883', 'Devorlarni shpaklyovka va bo''yash', 2, false, '2026-09-28 00:00:00+00', NOW())
ON CONFLICT ("Id") DO NOTHING;

-- ====================================================================
-- 9. TO'LOVLAR (PAYMENTS - KIRIM)
-- ====================================================================
INSERT INTO "Payments" ("Id", "ProjectId", "Amount", "PaymentMethod", "PaymentDate", "Notes", "ReceivedByUserId", "CreatedAt")
VALUES
    ('44444444-4444-4444-4444-444444444441', '77777777-7777-7777-7777-777777777771', 15000.00, 2, '2026-08-02 10:00:00+00', 'Boshlang''ich avans (30%)', '693f6821-a82d-45ad-8025-9822b4471b6b', NOW()),
    ('44444444-4444-4444-4444-444444444442', '77777777-7777-7777-7777-777777777771', 10000.00, 1, '2026-08-15 14:00:00+00', '2-bosqich boshlanishi uchun to''lov', '693f6821-a82d-45ad-8025-9822b4471b6b', NOW())
ON CONFLICT ("Id") DO NOTHING;

-- ====================================================================
-- 10. MATERIALLAR XARIDLARI (PURCHASES)
-- ====================================================================
INSERT INTO "MaterialPurchases" ("Id", "ProjectId", "MaterialId", "Quantity", "UnitPrice", "TotalCost", "Supplier", "PurchaseDate", "CreatedByUserId", "CreatedAt")
VALUES
    ('33333333-3333-3333-3333-333333333331', '77777777-7777-7777-7777-777777777771', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 50.00, 6.00, 300.00, 'Qurilish Bozori', '2026-08-03 00:00:00+00', '693f6821-a82d-45ad-8025-9822b4471b6b', NOW()),
    ('33333333-3333-3333-3333-333333333332', '77777777-7777-7777-7777-777777777771', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 300.00, 1.20, 360.00, 'Elektro Mir', '2026-08-05 00:00:00+00', '693f6821-a82d-45ad-8025-9822b4471b6b', NOW()),
    ('33333333-3333-3333-3333-333333333333', '77777777-7777-7777-7777-777777777771', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 80.00, 25.00, 2000.00, 'Kerama Marazzi', '2026-08-12 00:00:00+00', '693f6821-a82d-45ad-8025-9822b4471b6b', NOW())
ON CONFLICT ("Id") DO NOTHING;

-- ====================================================================
-- 11. USTA ISH HAQI VA TO'LOVLAR (WORKER PAYMENTS)
-- ====================================================================
INSERT INTO "WorkerPayments" ("Id", "ProjectId", "WorkerId", "JobDescription", "AgreedAmount", "WorkAmount", "PaidAmount", "PaymentDate", "CreatedByUserId", "CreatedAt")
VALUES
    ('22222222-2222-2222-2222-222222222221', '77777777-7777-7777-7777-777777777771', '99999999-9999-9999-9999-999999999992', 'Elektr montaj va kabel tortish', 1500.00, 1500.00, 1000.00, '2026-08-15 00:00:00+00', '693f6821-a82d-45ad-8025-9822b4471b6b', NOW()),
    ('22222222-2222-2222-2222-222222222222', '77777777-7777-7777-7777-777777777771', '99999999-9999-9999-9999-999999999991', 'Santexnika va kafel ishlari', 2500.00, 1000.00, 800.00, '2026-08-16 00:00:00+00', '693f6821-a82d-45ad-8025-9822b4471b6b', NOW())
ON CONFLICT ("Id") DO NOTHING;

-- ====================================================================
-- 12. 7-KATEGORIYA XARAJATLARI (EXPENSES)
-- ====================================================================
INSERT INTO "Expenses" ("Id", "ProjectId", "Category", "Amount", "Description", "ExpenseDate", "CreatedByUserId", "CreatedAt")
VALUES
    ('11111111-1111-1111-1111-111111111101', '77777777-7777-7777-7777-777777777771', 3, 150.00, 'Materiallarni yetkazib berish uchun yuk mashinasi', '2026-08-04 00:00:00+00', '693f6821-a82d-45ad-8025-9822b4471b6b', NOW()),
    ('11111111-1111-1111-1111-111111111102', '77777777-7777-7777-7777-777777777771', 4, 50.00, 'Generator va texnikalar uchun yoqilg''i', '2026-08-06 00:00:00+00', '693f6821-a82d-45ad-8025-9822b4471b6b', NOW()),
    ('11111111-1111-1111-1111-111111111103', '77777777-7777-7777-7777-777777777771', 1, 500.00, 'Demontaj va chiqindilarni yuklash yordamchilari', '2026-08-14 00:00:00+00', '693f6821-a82d-45ad-8025-9822b4471b6b', NOW())
ON CONFLICT ("Id") DO NOTHING;

-- ====================================================================
-- 13. QO'SHIMCHA ISHLAR (EXTRA WORKS)
-- ====================================================================
INSERT INTO "ExtraWorks" ("Id", "ProjectId", "Title", "Description", "CustomerAmount", "ActualCost", "IsApprovedByCustomer", "ApprovedAt", "CreatedByUserId", "CreatedAt")
VALUES
    ('66666666-6666-6666-6666-666666666661', '77777777-7777-7777-7777-777777777771', 'Balkonga qo''shimcha elektr va issiq pol montaji', 'Buyurtmachi iltimosiga ko''ra qo''shimcha montaj', 1500.00, 800.00, true, '2026-08-10 00:00:00+00', '693f6821-a82d-45ad-8025-9822b4471b6b', NOW())
ON CONFLICT ("Id") DO NOTHING;
