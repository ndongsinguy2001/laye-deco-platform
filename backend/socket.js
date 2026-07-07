const { Server } = require('socket.io');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('🟢 Nouveau client connecté:', socket.id);

    socket.on('join-role', (role) => {
      socket.join(role);
      console.log(`📌 Client ${socket.id} a rejoint la salle: ${role}`);
    });

    socket.on('disconnect', () => {
      console.log('🔴 Client déconnecté:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO non initialisé !');
  }
  return io;
};

const sendNotification = (role, notification) => {
  const io = getIO();
  io.to(role).emit('notification', notification);
  if (role !== 'admin') {
    io.to('admin').emit('notification', notification);
  }
};

module.exports = { initSocket, getIO, sendNotification };