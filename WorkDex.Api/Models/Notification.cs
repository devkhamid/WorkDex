namespace WorkDex.Api.Models;

public enum NotificationAction
{
    Created = 1,
    Updated = 2,
    Deleted = 3
}

/// <summary>
/// Kompaniya ichidagi o'zgarishlar lentasi. Bitta yozuv butun kompaniya uchun
/// (CompanyAdminId bo'yicha) — har bir foydalanuvchining o'qilgan holati
/// <see cref="NotificationReadState"/> da saqlanadi.
/// </summary>
public class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyAdminId { get; set; }
    public Guid ActorUserId { get; set; }
    public string ActorName { get; set; } = string.Empty;
    public NotificationAction Action { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public Guid? ProjectId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class NotificationReadState
{
    public Guid UserId { get; set; }
    public DateTime LastReadAt { get; set; }
}
