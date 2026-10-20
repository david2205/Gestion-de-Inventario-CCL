namespace InventoryApi.Services;

public class DuplicateUsernameException : InvalidOperationException
{
    public DuplicateUsernameException()
        : base("El nombre de usuario ya está registrado.")
    {
    }

    public DuplicateUsernameException(Exception innerException)
        : base("El nombre de usuario ya está registrado.", innerException)
    {
    }
}
