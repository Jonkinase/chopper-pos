const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

module.exports = {
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: [
          'http://localhost:5173',
          'https://chopper-pos.vercel.app',
          process.env.FRONTEND_URL
        ].filter(Boolean),
        methods: ["GET", "POST"]
      }
    });

    // Middleware de autenticación para WebSockets
    io.use((socket, next) => {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Autenticación denegada en WebSocket'));
      }
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
      } catch (err) {
        next(new Error('Token WebSocket inválido o expirado'));
      }
    });

    io.on('connection', (socket) => {
      // Unir al usuario a su sala personal exclusiva
      const roomId = `room_user_${socket.user.user_id}`;
      socket.join(roomId);
      
      console.log(`Usuario WS conectado: ${socket.user.user_id} - unido a ${roomId}`);

      socket.on('disconnect', () => {
        console.log(`Usuario WS desconectado: ${socket.user.user_id}`);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io no está inicializado!");
    }
    return io;
  }
};
