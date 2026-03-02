# Configuración de Chopper POS - Backend

Este documento detalla los pasos para poner en marcha el servidor de desarrollo de Chopper POS.

## 1. Requisitos Previos

- **Node.js**: v14 o superior.
- **PostgreSQL**: Instalado y corriendo en tu máquina local.
- **Git**: (Opcional) para manejo de versiones.

## 2. Configuración de la Base de Datos

Sigue estos pasos para inicializar la base de datos PostgreSQL:

1. **Crear la Base de Datos**:
   Abre una terminal de PostgreSQL (`psql`) o tu herramienta favorita (como pgAdmin o DBeaver) y ejecuta:
   ```sql
   CREATE DATABASE chopper_pos;
   ```

2. **Ejecutar el Esquema Inicial**:
   Navega a la carpeta `backend/` y ejecuta el archivo `schema.sql`:
   ```bash
   psql -h localhost -U postgres -d chopper_pos -f src/database/schema.sql
   ```

3. **Ejecutar Actualizaciones de Esquema**:
   Ejecuta el script de actualización para los módulos de inventario y sucursales:
   ```bash
   psql -h localhost -U postgres -d chopper_pos -f src/database/update_schema_p3.sql
   ```

4. **Cargar Datos Semilla (Seeds)**:
   Carga los datos iniciales (admin y sucursal de ejemplo):
   ```bash
   psql -h localhost -U postgres -d chopper_pos -f src/database/seed.sql
   ```

## 3. Configuración de Variables de Entorno

1. En la carpeta `backend/`, crea un archivo llamado `.env` copiando el contenido de `.env.example`:
   ```bash
   cp .env.example .env
   ```
2. Edita el archivo `.env` con tus credenciales locales de PostgreSQL. Ejemplo:
   ```env
   DB_USER=postgres
   DB_PASSWORD=tu_password_aqui
   DB_NAME=chopper_pos
   DB_HOST=localhost
   DB_PORT=5432
   JWT_SECRET=super_secret_key_123
   JWT_REFRESH_SECRET=refresh_super_secret_456
   ```

## 4. Instalación de Dependencias

Ejecuta el siguiente comando dentro de la carpeta `backend/`:
```bash
npm install
```

## 5. Levantar el Servidor

Para iniciar el servidor en modo desarrollo (con recarga automática mediante `nodemon`):
```bash
npm run dev
```

El servidor estará disponible en: `http://localhost:3000`

---
### Credenciales de Acceso Iniciales (Seed)
- **Email**: `admin@chopper.com`
- **Password**: `admin123`
- **Rol**: `admin`
