using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Security.Claims;
using System.Text;
using WorkDex.Api.Data;
using WorkDex.Api.Filters;
using WorkDex.Api.Services;

var builder = WebApplication.CreateBuilder(args);
var port = Environment.GetEnvironmentVariable("PORT") ?? "5082";
builder.WebHost.UseUrls($"http://*:{port}");

var configuration = builder.Configuration;
var jwtSettings = configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];

if (string.IsNullOrWhiteSpace(secretKey) || Encoding.UTF8.GetByteCount(secretKey) < 32)
{
    throw new InvalidOperationException(
        "JwtSettings:SecretKey sozlanmagan yoki juda qisqa (kamida 32 bayt kerak). " +
        "Uni user-secrets yoki JWTSETTINGS__SECRETKEY environment variable orqali bering.");
}

var connectionString = configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    connectionString = Environment.GetEnvironmentVariable("DATABASE_URL");
}

if (!string.IsNullOrWhiteSpace(connectionString) &&
    (connectionString.StartsWith("postgres://") || connectionString.StartsWith("postgresql://")))
{
    var uri = new Uri(connectionString);
    var userInfo = uri.UserInfo.Split(':', 2);
    connectionString = new Npgsql.NpgsqlConnectionStringBuilder
    {
        Host = uri.Host,
        Port = uri.Port > 0 ? uri.Port : 5432,
        Username = Uri.UnescapeDataString(userInfo[0]),
        Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : null,
        Database = uri.AbsolutePath.TrimStart('/'),
    }.ConnectionString;
}

if (string.IsNullOrWhiteSpace(connectionString) ||
    string.IsNullOrWhiteSpace(new Npgsql.NpgsqlConnectionStringBuilder(connectionString).Host))
{
    throw new InvalidOperationException(
        "Database ulanishi sozlanmagan (Host yo'q). DATABASE_URL yoki CONNECTIONSTRINGS__DEFAULTCONNECTION environment variable bering.");
}

builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton<NotificationInterceptor>();
builder.Services.AddDbContext<AppDbContext>((sp, options) =>
    options.UseNpgsql(connectionString)
        .AddInterceptors(sp.GetRequiredService<NotificationInterceptor>()));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero    };
    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = async context =>
        {
            var principal = context.Principal;
            var userIdValue = principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? principal?.FindFirst("sub")?.Value;
            if (!Guid.TryParse(userIdValue, out var userId))
            {
                context.Fail("Token foydalanuvchi identifikatori noto'g'ri.");
                return;
            }

            var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
            var user = await db.Users
                .AsNoTracking()
                .Where(candidate => candidate.Id == userId)
                .Select(candidate => new { candidate.IsActive, candidate.Role })
                .SingleOrDefaultAsync(context.HttpContext.RequestAborted);
            if (user is null || !user.IsActive)
            {
                context.Fail("Foydalanuvchi faol emas.");
                return;
            }

            var tokenRole = principal?.FindFirst(ClaimTypes.Role)?.Value;
            if (!string.Equals(tokenRole, user.Role.ToString(), StringComparison.Ordinal))
                context.Fail("Foydalanuvchi roli token bilan mos kelmadi.");
        }
    };
});

builder.Services.AddAuthorization();

builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IProjectAccessGuard, ProjectAccessGuard>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IExpenseService, ExpenseService>();
builder.Services.AddScoped<IMaterialService, MaterialService>();
builder.Services.AddScoped<IWorkerService, WorkerService>();
builder.Services.AddScoped<IExtraWorkService, ExtraWorkService>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<IProjectMediaService, ProjectMediaService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<ICustomerPortalService, CustomerPortalService>();
builder.Services.AddScoped<IExcelExportService, ExcelExportService>();
builder.Services.AddScoped<IAgreementService, AgreementService>();
builder.Services.AddSingleton<ICurrencyService, CurrencyService>();
builder.Services.AddScoped<IAiAnalysisService, AiAnalysisService>();
builder.Services.AddHttpClient("Groq", c => c.Timeout = TimeSpan.FromSeconds(120));
builder.Services.AddHttpClient("CBU", c => c.Timeout = TimeSpan.FromSeconds(15));

builder.Services.AddControllers(options =>
{
    options.Filters.Add<ProjectAccessFilter>();
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "WorkDex API",
        Version = "v1",
        Description = "WorkDex — Loyiha boshqaruvi tizimi API"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT tokeningizni kiriting. Misol: Bearer {token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("WorkDexCors", policy =>
    {
        if (builder.Environment.IsDevelopment() || allowedOrigins.Length == 0)
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
        else
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "WorkDex API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseCors("WorkDexCors");
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/uploads", StringComparison.OrdinalIgnoreCase))
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        return;
    }

    await next();
});
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapFallbackToFile("index.html");

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    await DbInitializer.InitializeAsync(context, config);
}

app.Run();
