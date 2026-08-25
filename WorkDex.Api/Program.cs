using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using WorkDex.Api.Data;
using WorkDex.Api.Filters;
using WorkDex.Api.Services;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://0.0.0.0:5082");

// =============================================
// CONFIGURATION
// =============================================
var configuration = builder.Configuration;
var jwtSettings = configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"];

// HMAC-SHA256 uchun kalit kamida 32 bayt bo'lishi kerak. Bo'sh yoki qisqa kalit
// bilan ishga tushishga yo'l qo'ymaymiz — aks holda tokenlarni oson qalbakilashtirish mumkin.
if (string.IsNullOrWhiteSpace(secretKey) || Encoding.UTF8.GetByteCount(secretKey) < 32)
{
    throw new InvalidOperationException(
        "JwtSettings:SecretKey sozlanmagan yoki juda qisqa (kamida 32 bayt kerak). " +
        "Uni user-secrets yoki JWTSETTINGS__SECRETKEY environment variable orqali bering.");
}

// =============================================
// DATABASE
// =============================================
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

// =============================================
// AUTHENTICATION — JWT
// =============================================
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
        ClockSkew = TimeSpan.Zero  // Token muddatini aniq belgilaymiz
    };
});

builder.Services.AddAuthorization();

// =============================================
// SERVICES
// =============================================
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

// =============================================
// CONTROLLERS
// =============================================
// Marshrutida projectId bo'lgan barcha endpointlarda loyiha egaligini tekshiramiz.
builder.Services.AddControllers(options =>
{
    options.Filters.Add<ProjectAccessFilter>();
});

// =============================================
// SWAGGER / OPENAPI
// =============================================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "WorkDex API",
        Version = "v1",
        Description = "WorkDex — Loyiha boshqaruvi tizimi API"
    });

    // Swagger orqali JWT token kiritish imkoniyati
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

// =============================================
// CORS
// =============================================
// Development'da lokal tarmoqdagi bir nechta qurilmadan kirish uchun ochiq qoldiramiz.
// Production'da esa faqat "Cors:AllowedOrigins" da sanalgan manzillar ruxsat oladi.
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

// =============================================
// BUILD
// =============================================
var app = builder.Build();

// =============================================
// MIDDLEWARE PIPELINE
// =============================================
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
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// =============================================
// DATABASE SEEDING
// =============================================
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    await DbInitializer.InitializeAsync(context, config);
}

app.Run();
