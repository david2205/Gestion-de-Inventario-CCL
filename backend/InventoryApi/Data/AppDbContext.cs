using InventoryApi.Models;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();

    public DbSet<Product> Products => Set<Product>();

    public DbSet<InventoryMovement> InventoryMovements => Set<InventoryMovement>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasIndex(user => user.Username).IsUnique();

            entity.Property(user => user.Id).HasColumnName("id");
            entity.Property(user => user.Username).HasColumnName("username");
            entity.Property(user => user.PasswordHash).HasColumnName("password_hash");
            entity.Property(user => user.FullName).HasColumnName("full_name");
            entity.Property(user => user.Role).HasColumnName("role");
            entity.Property(user => user.IsActive).HasColumnName("is_active");
            entity.Property(user => user.CreatedAt).HasColumnName("created_at");
            entity.Property(user => user.UpdatedAt).HasColumnName("updated_at");
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("products");
            entity.HasIndex(product => product.Code).IsUnique();

            entity.Property(product => product.Id).HasColumnName("id");
            entity.Property(product => product.Code).HasColumnName("code");
            entity.Property(product => product.Name).HasColumnName("name");
            entity.Property(product => product.Description).HasColumnName("description");
            entity.Property(product => product.Stock).HasColumnName("stock");
            entity.Property(product => product.MinStock).HasColumnName("min_stock");
            entity.Property(product => product.IsActive).HasColumnName("is_active");
            entity.Property(product => product.CreatedAt).HasColumnName("created_at");
            entity.Property(product => product.UpdatedAt).HasColumnName("updated_at");
        });

        modelBuilder.Entity<InventoryMovement>(entity =>
        {
            entity.ToTable("inventory_movements");

            entity.Property(movement => movement.Id).HasColumnName("id");
            entity.Property(movement => movement.ProductId).HasColumnName("product_id");
            entity.Property(movement => movement.MovementType).HasColumnName("movement_type");
            entity.Property(movement => movement.Quantity).HasColumnName("quantity");
            entity.Property(movement => movement.PreviousStock).HasColumnName("previous_stock");
            entity.Property(movement => movement.NewStock).HasColumnName("new_stock");
            entity.Property(movement => movement.Note).HasColumnName("note");
            entity.Property(movement => movement.UserId).HasColumnName("user_id");
            entity.Property(movement => movement.CreatedAt).HasColumnName("created_at");

            entity.HasOne(movement => movement.Product)
                .WithMany()
                .HasForeignKey(movement => movement.ProductId);

            entity.HasOne(movement => movement.User)
                .WithMany()
                .HasForeignKey(movement => movement.UserId);
        });
    }
}
