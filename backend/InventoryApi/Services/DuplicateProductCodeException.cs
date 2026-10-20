namespace InventoryApi.Services;

public class DuplicateProductCodeException : InvalidOperationException
{
    public DuplicateProductCodeException(string code)
        : base($"Ya existe un producto con el código '{code}'.")
    {
    }

    public DuplicateProductCodeException(string code, Exception innerException)
        : base($"Ya existe un producto con el código '{code}'.", innerException)
    {
    }
}
