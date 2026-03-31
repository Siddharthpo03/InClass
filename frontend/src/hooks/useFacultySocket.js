import { useEffect, useRef, useCallback } from "react";
import io from "socket.io-client";

/**
 * useFacultySocket - Hook for managing Socket.io connection for faculty-specific events
 *
 * @param {Object} options - Configuration options
 * @param {number} options.facultyId - Faculty user ID
 * @param {number} options.collegeId - College ID (optional)
 * @param {number} options.departmentId - Department ID (optional)
 * @param {Function} options.onRegistrationCreated - Callback when new registration request is created
 * @param {Function} options.onAttendanceMarked - Callback when attendance is marked
 * @param {Function} options.onAttendanceUpdated - Callback when attendance is updated
 * @param {boolean} options.enabled - Whether socket connection is enabled
 *
 * @returns {Object} { socket, isConnected, emit, disconnect }
 */
const useFacultySocket = ({
  facultyId,
  collegeId,
  departmentId,
  onRegistrationCreated,
  onAttendanceMarked,
  onAttendanceUpdated,
  enabled = true,
}) => {
  const socketRef = useRef(null);
  const isConnectedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!enabled || !facultyId || socketRef.current?.connected) {
      return;
    }

    const token = localStorage.getItem("inclass_token");
    if (!token) {
      console.warn("[FacultySocket] No auth token found");
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
      console.log("[FacultySocket] Connected");
      isConnectedRef.current = true;
      reconnectAttemptsRef.current = 0;

      // Join faculty-specific rooms
      if (facultyId) {
        socket.emit("join:faculty", { facultyId });
      }
      if (collegeId) {
        socket.emit("join:college", { collegeId });
      }
      if (departmentId) {
        socket.emit("join:department", { departmentId });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("[FacultySocket] Disconnected:", reason);
      isConnectedRef.current = false;

      if (reason === "io server disconnect" || reason === "transport close") {
        reconnectAttemptsRef.current++;
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          console.log(
            `[FacultySocket] Reconnecting... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );
        }
      }
    });

    socket.on("connect_error", (error) => {
      console.error("[FacultySocket] Connection error:", error);
      isConnectedRef.current = false;
    });

    // Faculty-specific events
    socket.on("registration:created", (data) => {
      console.log("[FacultySocket] Registration created:", data);
      onRegistrationCreated?.(data);
    });

    socket.on("attendance:marked", (data) => {
      console.log("[FacultySocket] Attendance marked:", data);
      onAttendanceMarked?.(data);
    });

    socket.on("attendance:updated", (data) => {
      console.log("[FacultySocket] Attendance updated:", data);
      onAttendanceUpdated?.(data);
    });

    // Error handling
    socket.on("error", (error) => {
      console.error("[FacultySocket] Error:", error);
    });
  }, [
    enabled,
    facultyId,
    collegeId,
    departmentId,
    onRegistrationCreated,
    onAttendanceMarked,
    onAttendanceUpdated,
  ]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      if (facultyId) {
        socketRef.current.emit("leave:faculty", { facultyId });
      }
      if (collegeId) {
        socketRef.current.emit("leave:college", { collegeId });
      }
      if (departmentId) {
        socketRef.current.emit("leave:department", { departmentId });
      }
      socketRef.current.disconnect();
      socketRef.current = null;
      isConnectedRef.current = false;
    }
  }, [facultyId, collegeId, departmentId]);

  // Connect on mount or when dependencies change
  useEffect(() => {
    if (enabled && facultyId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, facultyId, connect, disconnect]);

  // Manual emit function for faculty actions
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn("[FacultySocket] Cannot emit - not connected");
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected: isConnectedRef.current,
    emit,
    disconnect,
  };
};

export default useFacultySocket;
