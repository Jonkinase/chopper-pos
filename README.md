# Chopper POS

Sistema de Punto de Venta (POS) multi-sucursal especializado en la venta de productos a granel.

## Requisitos

- Node.js (v18+)
- PostgreSQL (v14+)
- Docker (Opcional, para levantar todo rápido)

## Instalación Local

### 1. Base de Datos
Crea una base de datos en PostgreSQL llamada `chopper_pos_dev`.

### 2. Backend
```bash
cd backend
cp .env.example .env
# Configura tus variables en el .env (credenciales de DB, JWT secrets, etc)
npm install
npm run db:migrate  # Ejecuta el schema
npm run db:seed     # Crea el admin inicial y sucursal de prueba
npm run dev         # Levanta el servidor en puerto 3000
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env
# Configura VITE_API_URL si es distinto a localhost:3000
npm install
npm run dev         # Levanta Vite
```

## Uso con Docker

En la raíz del proyecto, ejecuta:
```bash
docker-compose up -d --build
```
Esto levantará:
- PostgreSQL en el puerto 5432 (con volumen persistente)
- Backend en el puerto 3000
- Frontend en el puerto 5173

> **Nota:** La primera vez que uses Docker, deberás cargar el schema y seed manualmente o mediante un script de inicialización de la DB.

## Credenciales Iniciales
- **Email:** admin@chopper.com
- **Password:** admin123
