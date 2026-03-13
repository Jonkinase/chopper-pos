require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const socketConfig = require('./src/config/socket');
const cronConfig = require('./src/config/cron');

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Inicializar Socket.io
socketConfig.init(server);

// Inicializar Tareas Programadas
cronConfig.initCron();

server.listen(PORT, () => {
  console.log(`Servidor Chopper POS corriendo en puerto ${PORT} con WebSockets habilitados`);
});

