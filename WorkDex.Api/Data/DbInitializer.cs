using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Models;

namespace WorkDex.Api.Data;

public static class DbInitializer
{
    // Faqat birinchi ishga tushirishda ishlatiladigan zaxira parol.
    // Haqiqiy parolni "Seed:SuperAdminPassword" konfiguratsiyasi (yoki
    // SEED__SUPERADMINPASSWORD environment variable) orqali bering.
    private const string DefaultSeedPassword = "ChangeMe!123";

    public static async Task InitializeAsync(AppDbContext context, IConfiguration configuration)
    {
        await context.Database.EnsureCreatedAsync();
        await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"CompanyName\" VARCHAR(200);");
        await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"CompanyAdminId\" UUID;");
        await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"Customers\" ADD COLUMN IF NOT EXISTS \"CompanyAdminId\" UUID;");
        await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"Materials\" ADD COLUMN IF NOT EXISTS \"CompanyAdminId\" UUID;");
        await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"Workers\" ADD COLUMN IF NOT EXISTS \"CompanyAdminId\" UUID;");
        await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"Projects\" ADD COLUMN IF NOT EXISTS \"CompanyAdminId\" UUID;");
        await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"Materials\" ADD COLUMN IF NOT EXISTS \"Brand\" VARCHAR(200);");
        await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"MaterialPurchases\" ADD COLUMN IF NOT EXISTS \"Brand\" VARCHAR(200);");
        await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"Expenses\" ALTER COLUMN \"ProjectId\" DROP NOT NULL;");
        await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"Expenses\" ADD COLUMN IF NOT EXISTS \"Frequency\" INTEGER DEFAULT 1;");
        await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"Expenses\" ADD COLUMN IF NOT EXISTS \"CompanyAdminId\" UUID;");

        // Mavjud namuna ma'lumotlarni 1-admin (Grand Stroy) ga bog'lash
        await context.Database.ExecuteSqlRawAsync("UPDATE \"Customers\" SET \"CompanyAdminId\" = (SELECT \"Id\" FROM \"Users\" WHERE \"Email\" = 'admin@wordex.uz' LIMIT 1) WHERE \"CompanyAdminId\" IS NULL;");
        await context.Database.ExecuteSqlRawAsync("UPDATE \"Workers\" SET \"CompanyAdminId\" = (SELECT \"Id\" FROM \"Users\" WHERE \"Email\" = 'admin@wordex.uz' LIMIT 1) WHERE \"CompanyAdminId\" IS NULL;");
        await context.Database.ExecuteSqlRawAsync("UPDATE \"Projects\" SET \"CompanyAdminId\" = (SELECT \"Id\" FROM \"Users\" WHERE \"Email\" = 'admin@wordex.uz' LIMIT 1) WHERE \"CompanyAdminId\" IS NULL;");
        await context.Database.ExecuteSqlRawAsync("UPDATE \"Materials\" SET \"CompanyAdminId\" = (SELECT \"Id\" FROM \"Users\" WHERE \"Email\" = 'admin@wordex.uz' LIMIT 1) WHERE \"CompanyAdminId\" IS NULL;");

        var configuredPassword = configuration["Seed:SuperAdminPassword"];
        var seedPassword = string.IsNullOrWhiteSpace(configuredPassword)
            ? DefaultSeedPassword
            : configuredPassword;

        // 1. Agar baza butunlay bo'sh bo'lsa, to'liq boshlang'ich ma'lumotlar yuklanadi
        if (!await context.Users.AnyAsync())
        {
            await SeedFullDataAsync(context, seedPassword);
            return;
        }

        // 2. Bazada foydalanuvchi bor, lekin SuperAdmin yo'q bo'lsa — faqat o'shanda yaratamiz.
        //    Mavjud SuperAdmin'ning paroli hech qachon qayta yozilmaydi.
        var superAdminExists = await context.Users.AnyAsync(u => u.Role == UserRole.SuperAdmin);
        if (!superAdminExists)
        {
            context.Users.Add(new User
            {
                Id = Guid.NewGuid(),
                FirstName = "Super",
                LastName = "Admin",
                Email = "superadmin@workdex.uz",
                CompanyName = "WorkDex Bosh Boshqaruvi",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(seedPassword),
                PhoneNumber = "+998900000001",
                Role = UserRole.SuperAdmin,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
            await context.SaveChangesAsync();
        }
    }

    public static async Task ResetAndSeedAsync(AppDbContext context, string? seedPassword = null)
    {
        await context.Database.EnsureCreatedAsync();

        // 1. Delete all existing data
        context.ProjectUpdates.RemoveRange(context.ProjectUpdates);
        context.Photos.RemoveRange(context.Photos);
        context.Documents.RemoveRange(context.Documents);
        context.Tasks.RemoveRange(context.Tasks);
        context.ExtraWorks.RemoveRange(context.ExtraWorks);
        context.WorkerPayments.RemoveRange(context.WorkerPayments);
        context.MaterialPurchases.RemoveRange(context.MaterialPurchases);
        context.Expenses.RemoveRange(context.Expenses);
        context.Payments.RemoveRange(context.Payments);
        context.ProjectStages.RemoveRange(context.ProjectStages);
        context.ProjectMembers.RemoveRange(context.ProjectMembers);
        context.Projects.RemoveRange(context.Projects);
        context.Workers.RemoveRange(context.Workers);
        context.Materials.RemoveRange(context.Materials);
        context.Customers.RemoveRange(context.Customers);
        context.Users.RemoveRange(context.Users);

        await context.SaveChangesAsync();

        await SeedFullDataAsync(context, seedPassword ?? DefaultSeedPassword);
    }

    private static async Task SeedFullDataAsync(AppDbContext context, string seedPassword)
    {
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(seedPassword);
        var superAdminHash = passwordHash;

        // 1. Super Admin (WorkDex Platform Egasi / Barcha adminlarni boshqaradi)
        var superAdmin = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "Super",
            LastName = "Admin",
            Email = "superadmin@workdex.uz",
            CompanyName = "WorkDex Bosh Boshqaruvi",
            PasswordHash = superAdminHash,
            PhoneNumber = "+998900000001",
            Role = UserRole.SuperAdmin,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // 2. Company Admin (Kompaniya rahbari)
        var adminUser = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "Hamidulloh",
            LastName = "Hakimov",
            Email = "admin@wordex.uz",
            CompanyName = "Grand Stroy Qurilish MCHJ",
            PasswordHash = passwordHash,
            PhoneNumber = "+998901234567",
            Role = UserRole.Admin,
            CreatedAt = DateTime.UtcNow
        };

        // 3. Project Manager
        var pmUser = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "Sanjar",
            LastName = "Rahimov",
            Email = "pm@workdex.uz",
            CompanyName = "Grand Stroy Qurilish MCHJ",
            PasswordHash = passwordHash,
            PhoneNumber = "+998902345678",
            Role = UserRole.ProjectManager,
            CompanyAdminId = adminUser.Id,
            CreatedAt = DateTime.UtcNow
        };

        // 4. Field Worker (Prorab / Usta boshqaruvchisi)
        var workerUser = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "Otabek",
            LastName = "Nazarov",
            Email = "worker@workdex.uz",
            CompanyName = "Grand Stroy Qurilish MCHJ",
            PasswordHash = passwordHash,
            PhoneNumber = "+998903456789",
            Role = UserRole.FieldWorker,
            CompanyAdminId = adminUser.Id,
            CreatedAt = DateTime.UtcNow
        };

        // 5. Finance (Buxgalter)
        var financeUser = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "Nodira",
            LastName = "Karimova",
            Email = "finance@workdex.uz",
            CompanyName = "Grand Stroy Qurilish MCHJ",
            PasswordHash = passwordHash,
            PhoneNumber = "+998904567890",
            Role = UserRole.Finance,
            CompanyAdminId = adminUser.Id,
            CreatedAt = DateTime.UtcNow
        };

        // 6. Customer (Mijoz)
        var customerUser = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "Ahmad",
            LastName = "Yusupov",
            Email = "customer@workdex.uz",
            PasswordHash = passwordHash,
            PhoneNumber = "+998901112233",
            Role = UserRole.Customer,
            CompanyAdminId = adminUser.Id,
            CreatedAt = DateTime.UtcNow
        };

        context.Users.AddRange(superAdmin, adminUser, pmUser, workerUser, financeUser, customerUser);
        await context.SaveChangesAsync();

        // Seed Customers
        var customer1 = new Customer
        {
            Id = Guid.NewGuid(),
            FullName = "Ahmad Yusupov",
            PhoneNumber = "+998901112233",
            Email = "customer@workdex.uz",
            Address = "Toshkent sh., Chilonzor tumani, 19-mavze",
            Notes = "Doimiy mijoz, to'lovlarni o'z vaqtida qiladi.",
            UserId = customerUser.Id,
            CompanyAdminId = adminUser.Id,
            CreatedAt = DateTime.UtcNow
        };

        var customer2 = new Customer
        {
            Id = Guid.NewGuid(),
            FullName = "Dilshod Aliyev",
            PhoneNumber = "+998935554433",
            Email = "dilshod@gmail.com",
            Address = "Toshkent sh., Yunusobod tumani, Amir Temur ko'chasi",
            Notes = "Yangi ofis loyihasi buyurtmachisi.",
            CreatedAt = DateTime.UtcNow
        };

        context.Customers.AddRange(customer1, customer2);
        await context.SaveChangesAsync();

        // Seed Materials
        var matKafel = new Material { Id = Guid.NewGuid(), Name = "Ispan kafeli 60x60", Unit = "m²", Description = "Yuqori sifatli pol kafeli", CreatedAt = DateTime.UtcNow };
        var matGips = new Material { Id = Guid.NewGuid(), Name = "Knauf Gipsokarton 12.5mm", Unit = "dona", Description = "Namlikka chidamli", CreatedAt = DateTime.UtcNow };
        var matSement = new Material { Id = Guid.NewGuid(), Name = "M-500 Sement", Unit = "qop", Description = "Portlend sement 50kg", CreatedAt = DateTime.UtcNow };
        var matKraska = new Material { Id = Guid.NewGuid(), Name = "Marshall devor bo'yog'i", Unit = "litr", Description = "Yuviladigan oq bo'yoq", CreatedAt = DateTime.UtcNow };
        var matKabel = new Material { Id = Guid.NewGuid(), Name = "Mis elektr kabeli 3x2.5", Unit = "metr", Description = "GOST mis sim", CreatedAt = DateTime.UtcNow };

        context.Materials.AddRange(matKafel, matGips, matSement, matKraska, matKabel);
        await context.SaveChangesAsync();

        // Seed Workers
        var workerHasan = new Worker { Id = Guid.NewGuid(), FullName = "Hasan Usta", PhoneNumber = "+998901234567", Specialty = "Kafelchi & Santexnik", Notes = "Tajribali usta, 10 yillik tajriba", CreatedAt = DateTime.UtcNow };
        var workerAkmal = new Worker { Id = Guid.NewGuid(), FullName = "Akmal Usta", PhoneNumber = "+998912345678", Specialty = "Elektrik & Montajchi", Notes = "Elektr montaj ishlari bo'yicha usta", CreatedAt = DateTime.UtcNow };
        var workerJamshid = new Worker { Id = Guid.NewGuid(), FullName = "Jamshid Usta", PhoneNumber = "+998933456789", Specialty = "Suvoqchi & Malyar", Notes = "Devor suvoq va bo'yash ustasi", CreatedAt = DateTime.UtcNow };

        context.Workers.AddRange(workerHasan, workerAkmal, workerJamshid);
        await context.SaveChangesAsync();

        // Seed Project 1: Ahmad Yusupov — Villa ta'miri (Active)
        var project1 = new Project
        {
            Id = Guid.NewGuid(),
            Name = "Ahmad Yusupov — Villa ta'miri",
            ProjectType = "Villa renovatsiyasi",
            Location = "Toshkent, Chilonzor tumani",
            ContractAmount = 50000,
            Budget = 35000,
            Currency = "USD",
            StartDate = new DateTime(2026, 8, 1, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2026, 10, 30, 0, 0, 0, DateTimeKind.Utc),
            Status = ProjectStatus.InProgress,
            ProgressPercent = 50,
            Notes = "PDF dagi asosiy namunaviy loyiha.",
            CustomerId = customer1.Id,
            CreatedByUserId = adminUser.Id,
            CreatedAt = DateTime.UtcNow
        };

        // Project 2: Dilshod Aliyev — Ofis loyihasi (Planning)
        var project2 = new Project
        {
            Id = Guid.NewGuid(),
            Name = "Dilshod Aliyev — Ofis loyihasi",
            ProjectType = "Tijorat / Ofis",
            Location = "Toshkent, Yunusobod tumani",
            ContractAmount = 30000,
            Budget = 20000,
            Currency = "USD",
            StartDate = new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2026, 11, 15, 0, 0, 0, DateTimeKind.Utc),
            Status = ProjectStatus.Planning,
            ProgressPercent = 0,
            Notes = "Yangi ofis ta'mirlash shartnomasi rejalashtirishda.",
            CustomerId = customer2.Id,
            CreatedByUserId = adminUser.Id,
            CreatedAt = DateTime.UtcNow
        };

        context.Projects.AddRange(project1, project2);
        await context.SaveChangesAsync();

        // Seed Project Stages for Project 1
        var stage1 = new ProjectStage { Id = Guid.NewGuid(), ProjectId = project1.Id, Name = "1. Demontaj va tayyorgarlik", OrderIndex = 1, IsCompleted = true, CompletedAt = new DateTime(2026, 8, 7, 0, 0, 0, DateTimeKind.Utc) };
        var stage2 = new ProjectStage { Id = Guid.NewGuid(), ProjectId = project1.Id, Name = "2. Santexnika va elektr montaji", OrderIndex = 2, IsCompleted = false };
        var stage3 = new ProjectStage { Id = Guid.NewGuid(), ProjectId = project1.Id, Name = "3. Pardozlash va kafel terish", OrderIndex = 3, IsCompleted = false };
        var stage4 = new ProjectStage { Id = Guid.NewGuid(), ProjectId = project1.Id, Name = "4. Yakuniy topshirish va tozalash", OrderIndex = 4, IsCompleted = false };

        context.ProjectStages.AddRange(stage1, stage2, stage3, stage4);
        await context.SaveChangesAsync();

        // Seed Tasks
        var task1 = new ProjectTask { Id = Guid.NewGuid(), ProjectId = project1.Id, StageId = stage1.Id, Title = "Oshxona devorini demontaj qilish", Weight = 2, IsCompleted = true, CompletedAt = new DateTime(2026, 8, 6, 0, 0, 0, DateTimeKind.Utc), DueDate = new DateTime(2026, 8, 7, 0, 0, 0, DateTimeKind.Utc), CreatedAt = DateTime.UtcNow };
        var task2 = new ProjectTask { Id = Guid.NewGuid(), ProjectId = project1.Id, StageId = stage2.Id, Title = "Elektr simlari va montaj qutilarini o'rnatish", Weight = 3, IsCompleted = true, CompletedAt = new DateTime(2026, 8, 14, 0, 0, 0, DateTimeKind.Utc), DueDate = new DateTime(2026, 8, 18, 0, 0, 0, DateTimeKind.Utc), CreatedAt = DateTime.UtcNow };
        var task3 = new ProjectTask { Id = Guid.NewGuid(), ProjectId = project1.Id, StageId = stage3.Id, Title = "Kafel yotqizish va tekislash", Weight = 3, IsCompleted = false, DueDate = new DateTime(2026, 9, 15, 0, 0, 0, DateTimeKind.Utc), CreatedAt = DateTime.UtcNow };
        var task4 = new ProjectTask { Id = Guid.NewGuid(), ProjectId = project1.Id, StageId = stage3.Id, Title = "Devorlarni shpaklyovka va bo'yash", Weight = 2, IsCompleted = false, DueDate = new DateTime(2026, 9, 28, 0, 0, 0, DateTimeKind.Utc), CreatedAt = DateTime.UtcNow };

        context.Tasks.AddRange(task1, task2, task3, task4);
        await context.SaveChangesAsync();

        // Seed Payments
        var pay1 = new Payment { Id = Guid.NewGuid(), ProjectId = project1.Id, Amount = 15000, PaymentMethod = PaymentMethod.BankTransfer, PaymentDate = new DateTime(2026, 8, 2, 10, 0, 0, DateTimeKind.Utc), Notes = "Boshlang'ich avans to'lovi (30%)", ReceivedByUserId = adminUser.Id, CreatedAt = DateTime.UtcNow };
        var pay2 = new Payment { Id = Guid.NewGuid(), ProjectId = project1.Id, Amount = 10000, PaymentMethod = PaymentMethod.Cash, PaymentDate = new DateTime(2026, 8, 15, 14, 0, 0, DateTimeKind.Utc), Notes = "2-bosqich boshlanishi uchun to'lov", ReceivedByUserId = adminUser.Id, CreatedAt = DateTime.UtcNow };

        context.Payments.AddRange(pay1, pay2);
        await context.SaveChangesAsync();

        // Seed Material Purchases
        var pur1 = new MaterialPurchase { Id = Guid.NewGuid(), ProjectId = project1.Id, MaterialId = matSement.Id, Quantity = 50, UnitPrice = 6, TotalCost = 300, Supplier = "Qurilish Bozori", PurchaseDate = new DateTime(2026, 8, 3, 0, 0, 0, DateTimeKind.Utc), CreatedByUserId = adminUser.Id, CreatedAt = DateTime.UtcNow };
        var pur2 = new MaterialPurchase { Id = Guid.NewGuid(), ProjectId = project1.Id, MaterialId = matKabel.Id, Quantity = 300, UnitPrice = 1.2m, TotalCost = 360, Supplier = "Elektro Mir", PurchaseDate = new DateTime(2026, 8, 5, 0, 0, 0, DateTimeKind.Utc), CreatedByUserId = adminUser.Id, CreatedAt = DateTime.UtcNow };
        var pur3 = new MaterialPurchase { Id = Guid.NewGuid(), ProjectId = project1.Id, MaterialId = matKafel.Id, Quantity = 80, UnitPrice = 25, TotalCost = 2000, Supplier = "Kerama Marazzi", PurchaseDate = new DateTime(2026, 8, 12, 0, 0, 0, DateTimeKind.Utc), CreatedByUserId = adminUser.Id, CreatedAt = DateTime.UtcNow };

        context.MaterialPurchases.AddRange(pur1, pur2, pur3);
        await context.SaveChangesAsync();

        // Seed Worker Payments
        var wp1 = new WorkerPayment { Id = Guid.NewGuid(), ProjectId = project1.Id, WorkerId = workerAkmal.Id, JobDescription = "Elektr montaj va kabel tortish", AgreedAmount = 1500, WorkAmount = 1500, PaidAmount = 1000, PaymentDate = new DateTime(2026, 8, 15, 0, 0, 0, DateTimeKind.Utc), CreatedByUserId = adminUser.Id, CreatedAt = DateTime.UtcNow };
        var wp2 = new WorkerPayment { Id = Guid.NewGuid(), ProjectId = project1.Id, WorkerId = workerHasan.Id, JobDescription = "Santexnika va kafel ishlari", AgreedAmount = 2500, WorkAmount = 1000, PaidAmount = 800, PaymentDate = new DateTime(2026, 8, 16, 0, 0, 0, DateTimeKind.Utc), CreatedByUserId = adminUser.Id, CreatedAt = DateTime.UtcNow };

        context.WorkerPayments.AddRange(wp1, wp2);
        await context.SaveChangesAsync();

        // Seed Direct Expenses
        var exp1 = new Expense { Id = Guid.NewGuid(), ProjectId = project1.Id, Category = ExpenseCategory.Transport, Amount = 150, Description = "Materiallarni yetkazib berish uchun yuk mashinasi", ExpenseDate = new DateTime(2026, 8, 4, 0, 0, 0, DateTimeKind.Utc), CreatedByUserId = adminUser.Id, CreatedAt = DateTime.UtcNow };
        var exp2 = new Expense { Id = Guid.NewGuid(), ProjectId = project1.Id, Category = ExpenseCategory.Fuel, Amount = 50, Description = "Generator va texnikalar uchun yoqilg'i", ExpenseDate = new DateTime(2026, 8, 6, 0, 0, 0, DateTimeKind.Utc), CreatedByUserId = adminUser.Id, CreatedAt = DateTime.UtcNow };
        var exp3 = new Expense { Id = Guid.NewGuid(), ProjectId = project1.Id, Category = ExpenseCategory.Labor, Amount = 500, Description = "Demontaj va chiqindilarni yuklash yordamchilari", ExpenseDate = new DateTime(2026, 8, 14, 0, 0, 0, DateTimeKind.Utc), CreatedByUserId = adminUser.Id, CreatedAt = DateTime.UtcNow };

        context.Expenses.AddRange(exp1, exp2, exp3);
        await context.SaveChangesAsync();

        // Seed Extra Work
        var extra1 = new ExtraWork { Id = Guid.NewGuid(), ProjectId = project1.Id, Title = "Balkonga qo'shimcha elektr va issiq pol montaji", Description = "Buyurtmachi iltimosiga ko'ra qo'shimcha montaj", CustomerAmount = 1500, ActualCost = 800, IsApprovedByCustomer = true, ApprovedAt = new DateTime(2026, 8, 10, 0, 0, 0, DateTimeKind.Utc), CreatedByUserId = adminUser.Id, CreatedAt = DateTime.UtcNow };

        context.ExtraWorks.Add(extra1);
        await context.SaveChangesAsync();

        // Seed Photos
        var photo1 = new ProjectPhoto { Id = Guid.NewGuid(), ProjectId = project1.Id, PhotoUrl = "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600", Caption = "Demontaj ishlari yakunlandi", IsVisibleToCustomer = true, PhotoDate = new DateTime(2026, 8, 6, 0, 0, 0, DateTimeKind.Utc), UploadedByUserId = adminUser.Id, CreatedAt = DateTime.UtcNow };
        var photo2 = new ProjectPhoto { Id = Guid.NewGuid(), ProjectId = project1.Id, PhotoUrl = "https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=600", Caption = "Elektr simlari va qutilar montaj qilindi", IsVisibleToCustomer = true, PhotoDate = new DateTime(2026, 8, 14, 0, 0, 0, DateTimeKind.Utc), UploadedByUserId = adminUser.Id, CreatedAt = DateTime.UtcNow };

        context.Photos.AddRange(photo1, photo2);
        await context.SaveChangesAsync();
    }
}
