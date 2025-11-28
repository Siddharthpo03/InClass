let io = null;

module.exports = {
  init: (server, options = {}) => {
    const { Server } = require("socket.io");
    io = new Server(server, {
      cors: {
        origin: options.origin || "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    io.on("connection", (socket) => {
      console.log(`🔌 Socket connected: ${socket.id}`);

      // Join a session room (for faculty monitoring attendance)
      socket.on("joinSession", (data) => {
        const { sessionId, userRole } = data || {};
        if (sessionId) {
          const room = `session_${sessionId}`;
          socket.join(room);
          console.log(`Socket ${socket.id} joined room ${room} (Role: ${userRole || "unknown"})`);
          
          // Acknowledge join
          socket.emit("sessionJoined", { sessionId, room });
        }
      });

      // Join a class room (for faculty to monitor all sessions in a class)
      socket.on("joinClass", (data) => {
        const { classId, userRole } = data || {};
        if (classId) {
          const room = `class_${classId}`;
          socket.join(room);
          console.log(`Socket ${socket.id} joined class room ${room} (Role: ${userRole || "unknown"})`);
          
          // Acknowledge join
          socket.emit("classJoined", { classId, room });
        }
      });

      // Leave a session room
      socket.on("leaveSession", (sessionId) => {
        if (sessionId) {
          const room = `session_${sessionId}`;
          socket.leave(room);
          console.log(`Socket ${socket.id} left room ${room}`);
        }
      });

      // Leave a class room
      socket.on("leaveClass", (classId) => {
        if (classId) {
          const room = `class_${classId}`;
          socket.leave(room);
          console.log(`Socket ${socket.id} left class room ${room}`);
        }
      });

      // Handle disconnection
      socket.on("disconnect", (reason) => {
        console.log(`🔌 Socket disconnected: ${socket.id} (Reason: ${reason})`);
      });

      // Error handling
      socket.on("error", (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized. Call init() first.");
    }
    return io;
  },
};
