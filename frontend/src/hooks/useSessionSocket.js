import { useEffect, useRef, useCallback } from "react";
import io from "socket.io-client";

/**
 * useSessionSocket - Hook for managing Socket.io connection for attendance sessions
 *
 * @param {string} sessionId - Current session ID
 * @param {Function} onAttendanceUpdate - Callback when attendance is updated
 * @param {Function} onSessionEnd - Callback when session ends
 * @param {boolean} [enabled=true] - Whether socket connection is enabled
 *
 * @returns {Object} { socket, isConnected, error }
 *
 * @example
 * const { socket, isConnected } = useSessionSocket(
 *   sessionId,
 *   (data) => updateAttendance(data),
 *   () => handleSessionEnd()
 * );
 */
const useSessionSocket = (
  sessionId,
  onAttendanceUpdate,
  onSessionEnd,
  enabled = true
) => {
  const socketRef = useRef(null);
  const isConnectedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!enabled || !sessionId || socketRef.current?.connected) {
      return;
    }

    const token = localStorage.getItem("inclass_token");
    if (!token) {
      console.warn("[Socket] No auth token found");
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
      console.log("[Socket] Connected");
      isConnectedRef.current = true;
      reconnectAttemptsRef.current = 0;

      // Join session room
      if (sessionId) {
        socket.emit("join:session", { sessionId });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
      isConnectedRef.current = false;

      // Attempt reconnection for unexpected disconnects
      if (reason === "io server disconnect" || reason === "transport close") {
        reconnectAttemptsRef.current++;
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          console.log(
            `[Socket] Reconnecting... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );
        }
      }
    });

    socket.on("connect_error", (error) => {
      console.error("[Socket] Connection error:", error);
      isConnectedRef.current = false;
    });

    // Session-specific events
    socket.on("attendance:marked", (data) => {
      console.log("[Socket] Attendance marked:", data);
      onAttendanceUpdate?.(data);
    });

    socket.on("attendance:updated", (data) => {
      console.log("[Socket] Attendance updated:", data);
      onAttendanceUpdate?.(data);
    });

    socket.on("session:ended", (data) => {
      console.log("[Socket] Session ended:", data);
      onSessionEnd?.(data);
    });

    // Error handling
    socket.on("error", (error) => {
      console.error("[Socket] Error:", error);
    });
  }, [sessionId, enabled, onAttendanceUpdate, onSessionEnd]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      if (sessionId) {
        socketRef.current.emit("leave:session", { sessionId });
      }
      socketRef.current.disconnect();
      socketRef.current = null;
      isConnectedRef.current = false;
    }
  }, [sessionId]);

  // Connect on mount or when dependencies change
  useEffect(() => {
    if (enabled && sessionId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, sessionId, connect, disconnect]);

  // Manual emit function for faculty actions
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn("[Socket] Cannot emit - not connected");
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected: isConnectedRef.current,
    emit,
    disconnect,
  };
};

export default useSessionSocket;



