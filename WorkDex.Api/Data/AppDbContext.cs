using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Models;

namespace WorkDex.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<Project> Projects { get; set; }
    public DbSet<ProjectMember> ProjectMembers { get; set; }
    public DbSet<ProjectStage> ProjectStages { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<Expense> Expenses { get; set; }
    public DbSet<Material> Materials { get; set; }
    public DbSet<MaterialPurchase> MaterialPurchases { get; set; }
    public DbSet<Worker> Workers { get; set; }
    public DbSet<WorkerPayment> WorkerPayments { get; set; }
    public DbSet<ExtraWork> ExtraWorks { get; set; }
    public DbSet<ProjectTask> Tasks { get; set; }
    public DbSet<ProjectDocument> Documents { get; set; }
    public DbSet<ProjectPhoto> Photos { get; set; }
    public DbSet<ProjectUpdate> ProjectUpdates { get; set; }
    public DbSet<Agreement> Agreements { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);

            entity.Property(u => u.FirstName)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(u => u.LastName)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(200);

            entity.HasIndex(u => u.Email)
                .IsUnique()
                .HasDatabaseName("IX_Users_Email");

            entity.Property(u => u.PasswordHash)
                .IsRequired();

            entity.Property(u => u.PhoneNumber)
                .HasMaxLength(20);

            entity.Property(u => u.Role)
                .IsRequired();

            entity.Property(u => u.IsActive)
                .IsRequired()
                .HasDefaultValue(true);

            entity.Property(u => u.CreatedAt)
                .IsRequired();

            entity.Property(u => u.UpdatedAt)
                .IsRequired();

            entity.HasOne(u => u.CustomerProfile)
                .WithOne(c => c.User)
                .HasForeignKey<Customer>(c => c.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasKey(c => c.Id);

            entity.Property(c => c.FullName)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(c => c.PhoneNumber)
                .IsRequired()
                .HasMaxLength(20);

            entity.Property(c => c.Email)
                .HasMaxLength(200);

            entity.Property(c => c.Address)
                .HasMaxLength(500);

            entity.Property(c => c.Notes)
                .HasMaxLength(1000);

            entity.Property(c => c.CreatedAt)
                .IsRequired();

            entity.Property(c => c.UpdatedAt)
                .IsRequired();

            entity.HasMany(c => c.Projects)
                .WithOne(p => p.Customer)
                .HasForeignKey(p => p.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(p => p.Id);

            entity.Property(p => p.Name)
                .IsRequired()
                .HasMaxLength(300);

            entity.Property(p => p.Description)
                .HasMaxLength(2000);

            entity.Property(p => p.ProjectType)
                .HasMaxLength(200);

            entity.Property(p => p.ContractAmount)
                .IsRequired()
                .HasColumnType("numeric(18,2)");

            entity.Property(p => p.Budget)
                .IsRequired()
                .HasColumnType("numeric(18,2)");

            entity.Property(p => p.Currency)
                .IsRequired()
                .HasMaxLength(10)
                .HasDefaultValue("USD");

            entity.Property(p => p.ProgressPercent)
                .HasColumnType("numeric(5,2)")
                .HasDefaultValue(0);

            entity.Property(p => p.Location)
                .HasMaxLength(500);

            entity.Property(p => p.Notes)
                .HasMaxLength(2000);

            entity.Property(p => p.Status)
                .IsRequired();

            entity.Property(p => p.CreatedAt)
                .IsRequired();

            entity.Property(p => p.UpdatedAt)
                .IsRequired();

            entity.HasOne(p => p.CreatedByUser)
                .WithMany(u => u.CreatedProjects)
                .HasForeignKey(p => p.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(p => p.Status)
                .HasDatabaseName("IX_Projects_Status");

            entity.HasIndex(p => p.CustomerId)
                .HasDatabaseName("IX_Projects_CustomerId");

            entity.HasIndex(p => p.CreatedByUserId)
                .HasDatabaseName("IX_Projects_CreatedByUserId");
        });

        modelBuilder.Entity<ProjectMember>(entity =>
        {
            entity.HasKey(pm => pm.Id);

            entity.HasIndex(pm => new { pm.ProjectId, pm.UserId })
                .IsUnique()
                .HasDatabaseName("IX_ProjectMembers_ProjectId_UserId");

            entity.Property(pm => pm.RoleInProject)
                .IsRequired();

            entity.Property(pm => pm.AssignedAt)
                .IsRequired();

            entity.HasOne(pm => pm.Project)
                .WithMany(p => p.Members)
                .HasForeignKey(pm => pm.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(pm => pm.User)
                .WithMany(u => u.ProjectMemberships)
                .HasForeignKey(pm => pm.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProjectStage>(entity =>
        {
            entity.HasKey(s => s.Id);

            entity.Property(s => s.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(s => s.Description)
                .HasMaxLength(1000);

            entity.Property(s => s.IsCompleted)
                .HasDefaultValue(false);

            entity.Property(s => s.CreatedAt)
                .IsRequired();

            // Bir loyihada tartib indeksi unique bo'lishi kerak
            entity.HasIndex(s => new { s.ProjectId, s.OrderIndex })
                .IsUnique()
                .HasDatabaseName("IX_ProjectStages_ProjectId_OrderIndex");

            entity.HasOne(s => s.Project)
                .WithMany(p => p.Stages)
                .HasForeignKey(s => s.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(p => p.Id);

            entity.Property(p => p.Amount)
                .IsRequired()
                .HasColumnType("numeric(18,2)");

            entity.Property(p => p.Currency).IsRequired().HasMaxLength(3).HasDefaultValue("USD");
            entity.Property(p => p.ExchangeRate).HasColumnType("numeric(12,2)");
            entity.Property(p => p.OriginalAmount).HasColumnType("numeric(18,2)");

            entity.Property(p => p.Notes)
                .HasMaxLength(1000);

            entity.Property(p => p.PaymentDate)
                .IsRequired();

            entity.Property(p => p.CreatedAt)
                .IsRequired();

            entity.HasIndex(p => p.ProjectId)
                .HasDatabaseName("IX_Payments_ProjectId");

            entity.HasOne(p => p.Project)
                .WithMany()
                .HasForeignKey(p => p.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(p => p.ReceivedByUser)
                .WithMany()
                .HasForeignKey(p => p.ReceivedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Expense>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Amount)
                .IsRequired()
                .HasColumnType("numeric(18,2)");

            entity.Property(e => e.Description)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.Notes)
                .HasMaxLength(1000);

            entity.Property(e => e.ExpenseDate)
                .IsRequired();

            entity.Property(e => e.CreatedAt)
                .IsRequired();

            entity.HasIndex(e => e.ProjectId)
                .HasDatabaseName("IX_Expenses_ProjectId");

            entity.HasIndex(e => e.Category)
                .HasDatabaseName("IX_Expenses_Category");

            entity.HasOne(e => e.Project)
                .WithMany()
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Material>(entity =>
        {
            entity.HasKey(m => m.Id);

            entity.Property(m => m.Name)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(m => m.Unit)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(m => m.Description)
                .HasMaxLength(1000);

            entity.Property(m => m.CreatedAt)
                .IsRequired();
        });

        modelBuilder.Entity<MaterialPurchase>(entity =>
        {
            entity.HasKey(mp => mp.Id);

            entity.Property(mp => mp.Quantity)
                .IsRequired()
                .HasColumnType("numeric(18,2)");

            entity.Property(mp => mp.Unit)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(mp => mp.UnitPrice)
                .IsRequired()
                .HasColumnType("numeric(18,2)");

            entity.Property(mp => mp.TotalCost)
                .IsRequired()
                .HasColumnType("numeric(18,2)");

            entity.Property(mp => mp.Supplier)
                .HasMaxLength(200);

            entity.Property(mp => mp.ReceiptNumber)
                .HasMaxLength(100);

            entity.Property(mp => mp.Notes)
                .HasMaxLength(1000);

            entity.Property(mp => mp.PurchaseDate)
                .IsRequired();

            entity.Property(mp => mp.CreatedAt)
                .IsRequired();

            entity.HasIndex(mp => mp.ProjectId)
                .HasDatabaseName("IX_MaterialPurchases_ProjectId");

            entity.HasIndex(mp => mp.MaterialId)
                .HasDatabaseName("IX_MaterialPurchases_MaterialId");

            entity.HasOne(mp => mp.Project)
                .WithMany(p => p.MaterialPurchases)
                .HasForeignKey(mp => mp.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(mp => mp.Material)
                .WithMany(m => m.Purchases)
                .HasForeignKey(mp => mp.MaterialId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(mp => mp.CreatedByUser)
                .WithMany()
                .HasForeignKey(mp => mp.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Worker>(entity =>
        {
            entity.HasKey(w => w.Id);

            entity.Property(w => w.FullName)
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(w => w.PhoneNumber)
                .IsRequired()
                .HasMaxLength(20);

            entity.Property(w => w.Specialty)
                .HasMaxLength(200);

            entity.Property(w => w.Notes)
                .HasMaxLength(1000);

            entity.Property(w => w.CreatedAt)
                .IsRequired();
        });

        modelBuilder.Entity<WorkerPayment>(entity =>
        {
            entity.HasKey(wp => wp.Id);

            entity.Property(wp => wp.JobDescription)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(wp => wp.AgreedAmount)
                .IsRequired()
                .HasColumnType("numeric(18,2)");

            entity.Property(wp => wp.WorkAmount)
                .IsRequired()
                .HasColumnType("numeric(18,2)");

            entity.Property(wp => wp.PaidAmount)
                .IsRequired()
                .HasColumnType("numeric(18,2)");

            entity.Property(wp => wp.Notes)
                .HasMaxLength(1000);

            entity.Property(wp => wp.CreatedAt)
                .IsRequired();

            entity.HasIndex(wp => wp.ProjectId)
                .HasDatabaseName("IX_WorkerPayments_ProjectId");

            entity.HasIndex(wp => wp.WorkerId)
                .HasDatabaseName("IX_WorkerPayments_WorkerId");

            entity.HasOne(wp => wp.Project)
                .WithMany(p => p.WorkerPayments)
                .HasForeignKey(wp => wp.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(wp => wp.Worker)
                .WithMany(w => w.Payments)
                .HasForeignKey(wp => wp.WorkerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(wp => wp.CreatedByUser)
                .WithMany()
                .HasForeignKey(wp => wp.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ExtraWork>(entity =>
        {
            entity.HasKey(ew => ew.Id);

            entity.Property(ew => ew.Title)
                .IsRequired()
                .HasMaxLength(300);

            entity.Property(ew => ew.Description)
                .HasMaxLength(2000);

            entity.Property(ew => ew.CustomerAmount)
                .IsRequired()
                .HasColumnType("numeric(18,2)");

            entity.Property(ew => ew.ActualCost)
                .IsRequired()
                .HasColumnType("numeric(18,2)");

            entity.Property(ew => ew.Currency).IsRequired().HasMaxLength(3).HasDefaultValue("USD");
            entity.Property(ew => ew.ExchangeRate).HasColumnType("numeric(12,2)");
            entity.Property(ew => ew.OriginalCustomerAmount).HasColumnType("numeric(18,2)");
            entity.Property(ew => ew.OriginalActualCost).HasColumnType("numeric(18,2)");

            entity.Property(ew => ew.Notes)
                .HasMaxLength(1000);

            entity.Property(ew => ew.CreatedAt)
                .IsRequired();

            entity.HasIndex(ew => ew.ProjectId)
                .HasDatabaseName("IX_ExtraWorks_ProjectId");

            entity.HasOne(ew => ew.Project)
                .WithMany(p => p.ExtraWorks)
                .HasForeignKey(ew => ew.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ew => ew.CreatedByUser)
                .WithMany()
                .HasForeignKey(ew => ew.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProjectTask>(entity =>
        {
            entity.HasKey(t => t.Id);

            entity.Property(t => t.Title)
                .IsRequired()
                .HasMaxLength(300);

            entity.Property(t => t.Description)
                .HasMaxLength(2000);

            entity.Property(t => t.Weight)
                .HasDefaultValue(1);

            entity.Property(t => t.IsCompleted)
                .HasDefaultValue(false);

            entity.Property(t => t.CreatedAt)
                .IsRequired();

            entity.HasIndex(t => t.ProjectId)
                .HasDatabaseName("IX_Tasks_ProjectId");

            entity.HasIndex(t => t.StageId)
                .HasDatabaseName("IX_Tasks_StageId");

            entity.HasOne(t => t.Project)
                .WithMany(p => p.Tasks)
                .HasForeignKey(t => t.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(t => t.Stage)
                .WithMany(s => s.Tasks)
                .HasForeignKey(t => t.StageId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(t => t.AssignedToUser)
                .WithMany()
                .HasForeignKey(t => t.AssignedToUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ProjectDocument>(entity =>
        {
            entity.HasKey(d => d.Id);

            entity.Property(d => d.Title)
                .IsRequired()
                .HasMaxLength(300);

            entity.Property(d => d.FilePath)
                .IsRequired()
                .HasMaxLength(1000);

            entity.Property(d => d.FileType)
                .HasMaxLength(50);

            entity.Property(d => d.CreatedAt)
                .IsRequired();

            entity.HasIndex(d => d.ProjectId)
                .HasDatabaseName("IX_Documents_ProjectId");

            entity.HasOne(d => d.Project)
                .WithMany(p => p.Documents)
                .HasForeignKey(d => d.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(d => d.UploadedByUser)
                .WithMany()
                .HasForeignKey(d => d.UploadedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProjectPhoto>(entity =>
        {
            entity.HasKey(ph => ph.Id);

            entity.Property(ph => ph.PhotoUrl)
                .IsRequired()
                .HasMaxLength(1000);

            entity.Property(ph => ph.Caption)
                .HasMaxLength(1000);

            entity.Property(ph => ph.IsVisibleToCustomer)
                .HasDefaultValue(true);

            entity.Property(ph => ph.PhotoDate)
                .IsRequired();

            entity.Property(ph => ph.CreatedAt)
                .IsRequired();

            entity.HasIndex(ph => ph.ProjectId)
                .HasDatabaseName("IX_Photos_ProjectId");

            entity.HasIndex(ph => ph.StageId)
                .HasDatabaseName("IX_Photos_StageId");

            entity.HasOne(ph => ph.Project)
                .WithMany(p => p.Photos)
                .HasForeignKey(ph => ph.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ph => ph.Stage)
                .WithMany(s => s.Photos)
                .HasForeignKey(ph => ph.StageId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(ph => ph.UploadedByUser)
                .WithMany()
                .HasForeignKey(ph => ph.UploadedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProjectUpdate>(entity =>
        {
            entity.HasKey(pu => pu.Id);

            entity.Property(pu => pu.Message)
                .IsRequired()
                .HasMaxLength(2000);

            entity.Property(pu => pu.IsVisibleToCustomer)
                .HasDefaultValue(true);

            entity.Property(pu => pu.CreatedAt)
                .IsRequired();

            entity.HasIndex(pu => pu.ProjectId)
                .HasDatabaseName("IX_ProjectUpdates_ProjectId");

            entity.HasIndex(pu => pu.StageId)
                .HasDatabaseName("IX_ProjectUpdates_StageId");

            entity.HasOne(pu => pu.Project)
                .WithMany(p => p.Updates)
                .HasForeignKey(pu => pu.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(pu => pu.Stage)
                .WithMany(s => s.Updates)
                .HasForeignKey(pu => pu.StageId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(pu => pu.CreatedByUser)
                .WithMany()
                .HasForeignKey(pu => pu.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Agreement>(entity =>
        {
            entity.HasKey(a => a.Id);

            entity.Property(a => a.ProjectName)
                .IsRequired()
                .HasMaxLength(300);

            entity.Property(a => a.TotalAmountUZS)
                .HasColumnType("numeric(18,2)");

            entity.Property(a => a.AreaM2)
                .HasColumnType("numeric(10,2)");

            entity.Property(a => a.ExchangeRate)
                .HasColumnType("numeric(18,2)");

            entity.Property(a => a.ObjectAddress)
                .HasMaxLength(500);

            entity.Property(a => a.Block)
                .HasMaxLength(50);

            entity.Property(a => a.ApartmentNumber)
                .HasMaxLength(50);

            entity.Property(a => a.CreatedAt)
                .IsRequired();

            entity.HasOne(a => a.Customer)
                .WithMany()
                .HasForeignKey(a => a.CustomerId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(a => a.CreatedByUser)
                .WithMany()
                .HasForeignKey(a => a.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(a => a.Project)
                .WithMany()
                .HasForeignKey(a => a.ProjectId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(a => a.CompanyAdminId)
                .HasDatabaseName("IX_Agreements_CompanyAdminId");
        });
    }
}
