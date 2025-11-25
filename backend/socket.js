let io = null;

module.exports = {
  init: (server, options = {}) => {
    const { Server } = require("socket.io");
    io = new Server(server, {
      cors: {
        origin: options.origin || "*",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log(`🔌 Socket connected: ${socket.id}`);

      socket.on("joinSession", (sessionId) => {
        const room = `session_${sessionId}`;
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
      });

      socket.on("leaveSession", (sessionId) => {
        const room = `session_${sessionId}`;
        socket.leave(room);
        console.log(`Socket ${socket.id} left room ${room}`);
      });

      socket.on("disconnect", () => {
        console.log(`🔌 Socket disconnected: ${socket.id}`);
      });
    });

    return io;
  },
  getIO: () => io,
};
