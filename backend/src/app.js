require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const branchesRoutes = require('./modules/branches/branches.routes');
const productsRoutes = require('./modules/products/products.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const salesRoutes = require('./modules/sales/sales.routes');
const clientsRoutes = require('./modules/clients/clients.routes');
const accountsRoutes = require('./modules/accounts/accounts.routes');
const quotesRoutes = require('./modules/quotes/quotes.routes');
const metricsRoutes = require('./modules/metrics/metrics.routes');
const configRoutes = require('./modules/config/config.routes');

const errorMiddleware = require('./middleware/error.middleware');

const app = express();

// Global Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
const allowedOrigins = [
  'http://localhost:5173',
  'https://chopper-pos.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));
app.use(express.json());

// Static Assets
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/branches', branchesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/quotes', quotesRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/config', configRoutes);

// Global Error Handler
app.use(errorMiddleware);

module.exports = app;
