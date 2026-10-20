using InventoryApi.DTOs;

namespace InventoryApi.Services;

public interface IAuthService
{
    Task<AuthResponse> Login(LoginRequest request);

    Task<AuthResponse> Register(RegisterRequest request);
}
