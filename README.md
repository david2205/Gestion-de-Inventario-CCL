# Gestión de Inventario - CCL

Sistema web para la gestión de inventario que permite registrar entradas y salidas de productos, consultar el inventario actual y visualizar el historial de movimientos.

## Tecnologías

### Backend
- **C# / .NET 8** - ASP.NET Core Web API
- **Entity Framework Core** - ORM para acceso a datos
- **PostgreSQL 18** - Base de datos relacional
- **JWT Bearer** - Autenticación con tokens
- **BCrypt** - Hash seguro de contraseñas
- **Swagger / OpenAPI** - Documentación interactiva de la API

### Frontend
- **React 18** - Biblioteca de interfaz de usuario
- **Vite** - Bundler y servidor de desarrollo
- **React Bootstrap** - Componentes UI responsivos
- **Axios** - Cliente HTTP
- **React Router** - Enrutamiento SPA
- **React Toastify** - Notificaciones

### Base de Datos
- **PostgreSQL** con stored procedures y functions para operaciones de inventario

## Estructura del Proyecto

```
Gestion-de-Inventario-CCL/
├── backend/
│   └── InventoryApi/          # API REST en .NET 8
│       ├── Controllers/       # Controladores (Auth, Products, Inventory)
│       ├── Data/              # DbContext y configuración de EF Core
│       ├── DTOs/              # Objetos de transferencia de datos
│       ├── Middleware/        # Middleware global de excepciones
│       ├── Models/            # Entidades (User, Product, InventoryMovement)
│       ├── Services/          # Lógica de negocio
│       ├── Program.cs         # Configuración de la aplicación
│       └── appsettings.json   # Configuración (conexión BD, JWT)
├── frontend/                  # Aplicación React + Vite
│   └── src/
│       ├── api/               # Configuración de Axios
│       ├── components/        # Componentes reutilizables (Navbar, ProtectedRoute)
│       ├── context/           # Contexto de autenticación
│       └── pages/             # Páginas (Login, Register, Inventory, Products, Movements)
├── db/                        # Scripts SQL
│   ├── 01_schema.sql          # Creación de tablas e índices
│   ├── 02_stored_procedures.sql # Stored procedures y functions
│   └── 03_seed.sql            # Datos de prueba
└── docs/                      # Capturas de pantalla
```

## Requisitos Previos

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org)
- [PostgreSQL 15+](https://www.postgresql.org/download/)

## Instalación y Ejecución

### 1. Base de Datos

1. Instalar PostgreSQL y crear la base de datos:
   ```sql
   CREATE DATABASE inventory_db;
   ```

2. Conectarse a `inventory_db` y ejecutar los scripts SQL en orden:
   ```
   db/01_schema.sql
   db/02_stored_procedures.sql
   db/03_seed.sql
   ```

### 2. Backend

1. Navegar a la carpeta del backend:
   ```bash
   cd backend/InventoryApi
   ```

2. Configurar la cadena de conexión en `appsettings.json`:
   ```json
   "ConnectionStrings": {
       "DefaultConnection": "Host=localhost;Port=5432;Database=inventory_db;Username=postgres;Password=TU_PASSWORD"
   }
   ```

3. Restaurar paquetes y ejecutar:
   ```bash
   dotnet restore
   dotnet run
   ```

4. La API estará disponible en `http://localhost:5026`
5. Documentación Swagger en `http://localhost:5026/swagger`

### 3. Frontend

1. Navegar a la carpeta del frontend:
   ```bash
   cd frontend
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Ejecutar:
   ```bash
   npm run dev
   ```

4. La aplicación estará disponible en `http://localhost:5173`

## Funcionalidades

### Autenticación
- Registro de usuarios con roles (admin / operator)
- Login con generación de token JWT
- Protección de rutas en frontend y backend

### Gestión de Productos
- Crear, editar y eliminar productos (soft delete)
- Código SKU único por producto
- Stock mínimo configurable por producto

### Inventario
- Consulta del inventario actual en tiempo real
- Indicador visual de stock bajo
- Búsqueda y filtrado por nombre o código
- Fechas de última entrada y salida por producto

### Movimientos de Inventario
- Registro de entradas con actualización automática de stock
- Registro de salidas con validación de stock suficiente
- Historial completo de movimientos con filtros
- Auditoría: stock anterior y nuevo en cada movimiento

## Stored Procedures

| Nombre | Tipo | Descripción |
|--------|------|-------------|
| `sp_register_entry` | PROCEDURE | Registra entrada de inventario y actualiza stock |
| `sp_register_exit` | PROCEDURE | Registra salida validando stock disponible |
| `fn_current_inventory` | FUNCTION | Retorna inventario actual con indicadores |
| `fn_movement_history` | FUNCTION | Retorna historial filtrable de movimientos |

## API Endpoints

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/login` | Iniciar sesión | No |
| POST | `/api/auth/register` | Registrar usuario | No |
| GET | `/api/products` | Listar productos | Sí |
| POST | `/api/products` | Crear producto | Sí |
| PUT | `/api/products/{id}` | Actualizar producto | Sí |
| DELETE | `/api/products/{id}` | Eliminar producto | Sí |
| GET | `/api/inventory/current` | Inventario actual | Sí |
| POST | `/api/inventory/entries` | Registrar entrada | Sí |
| POST | `/api/inventory/exits` | Registrar salida | Sí |
| GET | `/api/inventory/movements` | Historial de movimientos | Sí |

## Credenciales de Prueba

Después de ejecutar el seed, registra un usuario desde la aplicación o Swagger:
```json
{
  "username": "admin",
  "password": "Admin123!",
  "fullName": "Administrador",
  "role": "admin"
}
```

## Autor

David - Prueba Técnica CCL