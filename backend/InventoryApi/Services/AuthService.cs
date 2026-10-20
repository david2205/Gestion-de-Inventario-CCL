using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using InventoryApi.Data;
using InventoryApi.DTOs;
using InventoryApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;

namespace InventoryApi.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly SigningCredentials _signingCredentials;

    public AuthService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;

        var key = GetRequiredSetting(configuration, "Jwt:Key");
        _issuer = GetRequiredSetting(configuration, "Jwt:Issuer");
        _audience = GetRequiredSetting(configuration, "Jwt:Audience");

        var keyBytes = Encoding.UTF8.GetBytes(key);
        if (keyBytes.Length < 32)
        {
            throw new InvalidOperationException("Jwt:Key debe tener al menos 32 bytes para firmar con HS256.");
        }

        _signingCredentials = new SigningCredentials(
            new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256);
    }

    public async Task<AuthResponse> Login(LoginRequest request)
    {
        var user = await _context.Users.AsNoTracking()
            .SingleOrDefaultAsync(user => user.Username == request.Username);

        if (user is null)
        {
            throw new UnauthorizedAccessException("El usuario no existe.");
        }

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("La contraseña es incorrecta.");
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("El usuario está inactivo.");
        }

        return CreateAuthResponse(user);
    }

    public async Task<AuthResponse> Register(RegisterRequest request)
    {
        if (await _context.Users.AnyAsync(user => user.Username == request.Username))
        {
            throw new InvalidOperationException("El nombre de usuario ya está registrado.");
        }

        var now = DateTime.UtcNow;
        var user = new User
        {
            Username = request.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName,
            Role = string.IsNullOrWhiteSpace(request.Role) ? "operator" : request.Role,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.Users.Add(user);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException exception) when (
            exception.InnerException is PostgresException
            {
                SqlState: PostgresErrorCodes.UniqueViolation,
                ConstraintName: "IX_users_username"
            })
        {
            _context.Entry(user).State = EntityState.Detached;
            throw new InvalidOperationException("El nombre de usuario ya está registrado.", exception);
        }

        return CreateAuthResponse(user);
    }

    private AuthResponse CreateAuthResponse(User user)
    {
        var now = DateTime.UtcNow;
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString(CultureInfo.InvariantCulture)),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            notBefore: now,
            expires: now.AddHours(24),
            signingCredentials: _signingCredentials);

        return new AuthResponse
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            Username = user.Username,
            Role = user.Role
        };
    }

    private static string GetRequiredSetting(IConfiguration configuration, string name)
    {
        var value = configuration[name];
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException($"La configuración '{name}' es obligatoria.");
        }

        return value;
    }
}
