using InventoryApi.Data;
using InventoryApi.DTOs;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using NpgsqlTypes;

namespace InventoryApi.Services;

public class InventoryService : IInventoryService
{
    private readonly AppDbContext _context;

    public InventoryService(AppDbContext context)
    {
        _context = context;
    }

    public async Task RegisterEntry(InventoryMovementRequest request, int userId)
    {
        var parameters = CreateMovementParameters(request, userId);

        try
        {
            await _context.Database.ExecuteSqlRawAsync(
                """
                CALL sp_register_entry(
                    p_product_id => @p_product_id,
                    p_quantity => @p_quantity,
                    p_note => @p_note,
                    p_user_id => @p_user_id)
                """, parameters);
        }
        catch (PostgresException exception)
        {
            throw CreateDatabaseException("registrar la entrada de inventario", exception);
        }
    }

    public async Task RegisterExit(InventoryMovementRequest request, int userId)
    {
        var parameters = CreateMovementParameters(request, userId);

        try
        {
            await _context.Database.ExecuteSqlRawAsync(
                """
                CALL sp_register_exit(
                    p_product_id => @p_product_id,
                    p_quantity => @p_quantity,
                    p_note => @p_note,
                    p_user_id => @p_user_id)
                """, parameters);
        }
        catch (PostgresException exception)
        {
            throw CreateDatabaseException("registrar la salida de inventario", exception);
        }
    }

    public async Task<List<InventoryItemResponse>> GetCurrentInventory()
    {
        try
        {
            return await _context.Database.SqlQueryRaw<InventoryItemResponse>(
                """
                SELECT product_id AS "ProductId",
                       product_code AS "ProductCode",
                       product_name AS "ProductName",
                       description AS "Description",
                       current_stock AS "CurrentStock",
                       min_stock AS "MinStock",
                       is_low_stock AS "IsLowStock",
                       last_entry_date AS "LastEntryDate",
                       last_exit_date AS "LastExitDate"
                FROM fn_current_inventory()
                """).ToListAsync();
        }
        catch (PostgresException exception)
        {
            throw CreateDatabaseException("consultar el inventario actual", exception);
        }
    }

    public async Task<List<MovementHistoryResponse>> GetMovementHistory(
        int? productId, string? movementType, DateTime? dateFrom, DateTime? dateTo)
    {
        if (movementType is not null && movementType is not ("IN" or "OUT"))
        {
            throw new ArgumentException("El tipo de movimiento debe ser IN u OUT.", nameof(movementType));
        }

        var fromUtc = ToUtc(dateFrom);
        var toUtc = ToUtc(dateTo);

        if (fromUtc.HasValue && toUtc.HasValue && fromUtc.Value > toUtc.Value)
        {
            throw new ArgumentException("La fecha inicial no puede ser posterior a la fecha final.", nameof(dateFrom));
        }

        var parameters = new object[]
        {
            new NpgsqlParameter("p_product_id", NpgsqlDbType.Integer)
            {
                Value = (object?)productId ?? DBNull.Value
            },
            new NpgsqlParameter("p_movement_type", NpgsqlDbType.Varchar)
            {
                Value = (object?)movementType ?? DBNull.Value
            },
            new NpgsqlParameter("p_date_from", NpgsqlDbType.TimestampTz)
            {
                Value = (object?)fromUtc ?? DBNull.Value
            },
            new NpgsqlParameter("p_date_to", NpgsqlDbType.TimestampTz)
            {
                Value = (object?)toUtc ?? DBNull.Value
            }
        };

        try
        {
            return await _context.Database.SqlQueryRaw<MovementHistoryResponse>(
                """
                SELECT movement_id AS "MovementId",
                       product_code AS "ProductCode",
                       product_name AS "ProductName",
                       movement_type AS "MovementType",
                       quantity AS "Quantity",
                       previous_stock AS "PreviousStock",
                       new_stock AS "NewStock",
                       note AS "Note",
                       username AS "Username",
                       created_at AS "CreatedAt"
                FROM fn_movement_history(@p_product_id, @p_movement_type, @p_date_from, @p_date_to)
                """, parameters).ToListAsync();
        }
        catch (PostgresException exception)
        {
            throw CreateDatabaseException("consultar el historial de movimientos", exception);
        }
    }

    private static object[] CreateMovementParameters(InventoryMovementRequest request, int userId)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(request.ProductId);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(request.Quantity);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(userId);

        return
        [
            new NpgsqlParameter("p_product_id", NpgsqlDbType.Integer) { Value = request.ProductId },
            new NpgsqlParameter("p_quantity", NpgsqlDbType.Integer) { Value = request.Quantity },
            new NpgsqlParameter("p_note", NpgsqlDbType.Text) { Value = (object?)request.Note ?? DBNull.Value },
            new NpgsqlParameter("p_user_id", NpgsqlDbType.Integer) { Value = userId }
        ];
    }

    private static DateTime? ToUtc(DateTime? value)
    {
        return value?.Kind switch
        {
            DateTimeKind.Local => value.Value.ToUniversalTime(),
            // Las fechas sin zona horaria se interpretan como UTC.
            DateTimeKind.Unspecified => DateTime.SpecifyKind(value.Value, DateTimeKind.Utc),
            _ => value
        };
    }

    private static InvalidOperationException CreateDatabaseException(string operation, PostgresException exception)
    {
        var reason = exception.SqlState switch
        {
            PostgresErrorCodes.RaiseException => exception.MessageText,
            PostgresErrorCodes.ForeignKeyViolation => "El producto o el usuario indicado no existe.",
            PostgresErrorCodes.CheckViolation => "Los datos no cumplen las restricciones de inventario.",
            PostgresErrorCodes.NotNullViolation => "Falta un dato obligatorio.",
            PostgresErrorCodes.UndefinedFunction => "La función o el procedimiento requerido no existe con la firma esperada.",
            _ => "Se produjo un error en PostgreSQL."
        };

        return new InvalidOperationException($"No se pudo {operation}: {reason}", exception);
    }
}
