# 🛒 Chopper POS

Chopper POS es un completo Sistema de Punto de Venta (Point of Sale) multi-sucursal especializado en la venta de productos a granel (líquidos, alimentos y secos). Ofrece una interfaz moderna, robusta y optimizada (React + Vite) respaldada por un motor eficiente (Node.js + PostgreSQL) con control de roles, inventarios y analíticas avanzadas.

---

## 📋 Requisitos Previos

Asegúrate de tener instalados los siguientes programas en tu entorno local antes de comenzar:

- **Node.js**: v18.0 o superior (Recomendado v20 LTS).
- **PostgreSQL**: v14.0 o superior.
- **Git**: Para clonar el repositorio.

---

## 🚀 Instalación Paso a Paso

Sigue estas instrucciones para levantar el sistema en una PC nueva.

### 1. Clonar el repositorio
Abre tu terminal y ejecuta:
```bash
git clone https://github.com/[usuario]/chopper-pos.git
cd chopper-pos
```

### 2. Configurar el Backend
Navega a la carpeta del servidor e instala sus dependencias:
```bash
cd backend
cp .env.example .env
```
Abre el archivo `.env` en tu editor de código favorito y ajusta las variables de conexión a tu base de datos local (ver sección *Variables de Entorno*).

```bash
npm install
```

### 3. Crear la Base de Datos
Debes crear la base de datos y su estructura en PostgreSQL:
1. Abre tu cliente SQL (pgAdmin, DBeaver o `psql`) y crea la base de datos:
   ```sql
   CREATE DATABASE chopper_pos_dev;
   ```
2. Ejecuta los scripts de inicialización que se encuentran en `backend/src/database/` (puedes usar el atajo de npm si tienes `psql` configurado en tu variable de entorno PATH):
   ```bash
   npm run db:migrate   # Ejecuta schema.sql para crear todas las tablas
   npm run db:seed      # Ejecuta seed.sql para cargar datos iniciales
   ```

### 4. Levantar el Backend
Con la base de datos lista, inicia el servidor en modo desarrollo:
```bash
npm run dev
```
*(El servidor quedará escuchando en `http://localhost:3000`)*

### 5. Configurar y Levantar el Frontend
En una nueva pestaña de la terminal, navega a la carpeta del cliente:
```bash
cd frontend
cp .env.example .env
```
Asegúrate de que el archivo `.env` contenga `VITE_API_URL=http://localhost:3000/api`.

```bash
npm install
npm run dev
```
*(La aplicación web estará disponible en `http://localhost:5173`)*

---

## 🔑 Credenciales de Prueba

Al ejecutar el script `seed.sql`, se crea automáticamente un usuario con acceso total al sistema:

- **Email**: `admin@chopper.com`
- **Password**: `admin123`
- **Rol**: Administrador Global

---

## ⚙️ Variables de Entorno (Backend)

Aquí tienes la explicación de las variables requeridas en el archivo `backend/.env`:

| Variable | Descripción | Valor por Defecto |
| :--- | :--- | :--- |
| `PORT` | Puerto donde corre el servidor backend | `3000` |
| `NODE_ENV` | Entorno de ejecución | `development` |
| `DB_HOST` | Host de la base de datos PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_USER` | Usuario de PostgreSQL | `postgres` |
| `DB_PASSWORD` | Contraseña del usuario PostgreSQL | *Tu contraseña local* |
| `DB_NAME` | Nombre de la base de datos | `chopper_pos_dev` |
| `JWT_SECRET` | Llave secreta para firmar tokens de acceso | *Cadena alfanumérica segura* |
| `JWT_ACCESS_EXPIRES_IN` | Tiempo de expiración del token de acceso | `8h` |
| `JWT_REFRESH_SECRET` | Llave secreta para firmar tokens de refresco | *Cadena alfanumérica segura* |
| `JWT_REFRESH_EXPIRES_IN`| Tiempo de expiración del token de refresco| `7d` |

---

## 📂 Estructura del Proyecto

```text
chopper-pos/
├── backend/                  # Servidor Node.js + Express
│   ├── src/
│   │   ├── config/           # Configuración de base de datos (Pool)
│   │   ├── database/         # Scripts SQL (schema, seeds)
│   │   ├── helpers/          # Lógica compartida (cálculo de precios, etc.)
│   │   ├── middleware/       # Autenticación, Roles, Control de Errores
│   │   └── modules/          # Controladores, Servicios y Rutas por dominio
│   ├── .env                  # Variables locales del backend
│   └── package.json          # Dependencias y scripts
│
├── frontend/                 # Aplicación React + Vite + Tailwind CSS v4
│   ├── src/
│   │   ├── api/              # Cliente Axios con interceptores JWT
│   │   ├── components/       # Componentes de UI reutilizables (Modals, Tablas)
│   │   ├── layouts/          # Estructura visual de la App (Sidebar, Header)
│   │   ├── pages/            # Vistas agrupadas por cada módulo del sistema
│   │   ├── router/           # Enrutador React con protección de rutas
│   │   ├── store/            # Estado global con Zustand (Auth, Sucursal Activa)
│   │   └── utils/            # Funciones utilitarias (Formateo de moneda, fecha)
│   ├── .env                  # Variables locales del frontend
│   └── package.json          # Dependencias y scripts
│
└── docker-compose.yml        # Archivo opcional para despliegue automatizado
```

---

## 🧩 Módulos del Sistema

El sistema cuenta con una arquitectura modular orientada a dominios:

1. **🔐 Autenticación (`auth`)**: Login, manejo de sesión y refresco automático de tokens JWT.
2. **👥 Usuarios (`users`)**: Gestión de personal y definición estricta de roles (Admin, Encargado, Cajero).
3. **🏢 Sucursales (`branches`)**: Administración de franquicias o locales, cada uno con aislamiento de datos propio.
4. **📦 Productos (`products`)**: Catálogo maestro de productos (líquidos, secos, alimentos).
5. **🗃️ Inventario (`inventory`)**: Control de stock por sucursal, alertas visuales y kardex de movimientos.
6. **🛒 Ventas (`sales`)**: Punto de Venta (POS) avanzado con cálculo en tiempo real por peso/cantidad o monto.
7. **📄 Presupuestos (`quotes`)**: Creación de cotizaciones con flujo de aprobación, conversión a venta y generación de PDF.
8. **🤝 Clientes (`clients`)**: Directorio de consumidores.
9. **💳 Cuentas Corrientes (`accounts`)**: Gestión de fiados, créditos y registro de pagos parciales/totales.
10. **📊 Métricas (`metrics`)**: Dashboard analítico con gráficos interactivos sobre ventas, productos estrella y rentabilidad.
