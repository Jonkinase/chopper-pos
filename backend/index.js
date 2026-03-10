require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor Chopper POS corriendo en puerto ${PORT}`);
});

const cors = require('cors');

const allowedOrigins = [
  'http://localhost:5173',                    // desarrollo local
  'https://chopper-pos.vercel.app',          // tu URL de Vercel (reemplazar)
  process.env.FRONTEND_URL,                  // variable de entorno (opcional)
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
