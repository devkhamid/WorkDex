using Microsoft.EntityFrameworkCore;
using WorkDex.Api.Models;

namespace WorkDex.Api.Data;

public static class DbInitializer
{
    public static async Task ResetAndSeedAsync(AppDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        // 1. Delete all existing data from all tables
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

        // 2. Seed ONLY Admin User (password: admin123) for fresh clean testing
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("admin123");

        var adminUser = new User
        {
            Id = Guid.NewGuid(),
            FirstName = "Hamidulloh",
            LastName = "Hakimov",
            Email = "admin@wordex.uz",
            PasswordHash = passwordHash,
            PhoneNumber = "+998901234567",
            Role = UserRole.Admin,
            CreatedAt = DateTime.UtcNow
        };

        context.Users.Add(adminUser);
        await context.SaveChangesAsync();
    }
}
