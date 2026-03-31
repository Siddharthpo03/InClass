import { useEffect, useRef, useCallback } from "react";
import io from "socket.io-client";

/**
 * useAdminSocket - Hook for managing Socket.io connection for admin-specific events
 * 
 * @param {Object} options - Configuration options
 * @param {number|string} options.adminId - Admin user ID
 * @param {Function} options.onAssistCreated - Callback when new assist request is created
 * @param {Function} options.onAssistAssigned - Callback when assist is assigned
 * @param {Function} options.onAssistCompleted - Callback when assist is completed
 * @param {Function} options.onAssistCancelled - Callback when assist is cancelled
 * @param {Function} options.onSessionStarted - Callback when attendance session starts
 * @param {Function} options.onAttendanceMarked - Callback when attendance is marked
 * @param {Function} options.onRegistrationCreated - Callback when new registration request is created
 * @param {boolean} options.enabled - Whether socket connection is enabled
 * 
 * @returns {Object} { socket, isConnected, emit, disconnect }
 */
const useAdminSocket = ({
  adminId,
  onAssistCreated,
  onAssistAssigned,
  onAssistCompleted,
  onAssistCancelled,
  onSessionStarted,
  onAttendanceMarked,
  onRegistrationCreated,
  enabled = true,
}) => {
  const socketRef = useRef(null);
  const isConnectedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!enabled || !adminId || socketRef.current?.connected) {
      return;
    }

    const token = localStorage.getItem("inclass_token");
    if (!token) {
      console.warn("[AdminSocket] No auth token found");
      return;
    }

    // Initialize socket connection
    const socket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:4000",
      {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: maxReconnectAttempts,
      }
    );

    socketRef.current = socket;

    // Connection events
    socket.on("connect", () => {
      console.log("[AdminSocket] Connected");
      isConnectedRef.current = true;
      reconnectAttemptsRef.current = 0;

      // Join admin-specific rooms
      if (adminId) {
        socket.emit("join:admin", { adminId });
      }
      // Join all colleges and departments for monitoring
      socket.emit("join:admin:all");
    });

    socket.on("disconnect", (reason) => {
      console.log("[AdminSocket] Disconnected:", reason);
      isConnectedRef.current = false;

      if (reason === "io server disconnect" || reason === "transport close") {
        reconnectAttemptsRef.current++;
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          console.log(
            `[AdminSocket] Reconnecting... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );
        }
      }
    });

    socket.on("connect_error", (error) => {
      console.error("[AdminSocket] Connection error:", error);
      isConnectedRef.current = false;
    });

    // Session events
    socket.on("session:started", (data) => {
      console.log("[AdminSocket] Session started:", data);
      onSessionStarted?.(data);
    });

    socket.on("attendance:marked", (data) => {
      console.log("[AdminSocket] Attendance marked:", data);
      onAttendanceMarked?.(data);
    });

    // Registration events
    socket.on("registration:created", (data) => {
      console.log("[AdminSocket] Registration created:", data);
      onRegistrationCreated?.(data);
    });

    // Error handling
    socket.on("error", (error) => {
      console.error("[AdminSocket] Error:", error);
    });
  }, [
    enabled,
    adminId,
    onAssistCreated,
    onAssistAssigned,
    onAssistCompleted,
    onAssistCancelled,
    onSessionStarted,
    onAttendanceMarked,
    onRegistrationCreated,
  ]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      if (adminId) {
        socketRef.current.emit("leave:admin", { adminId });
      }
      socketRef.current.emit("leave:admin:all");
      socketRef.current.disconnect();
      socketRef.current = null;
      isConnectedRef.current = false;
    }
  }, [adminId]);

  // Connect on mount or when dependencies change
  useEffect(() => {
    if (enabled && adminId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, adminId, connect, disconnect]);

  // Manual emit function for admin actions
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn("[AdminSocket] Cannot emit - not connected");
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected: isConnectedRef.current,
    emit,
    disconnect,
  };
};

export default useAdminSocket;









