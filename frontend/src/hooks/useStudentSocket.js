import { useEffect, useRef, useCallback } from "react";
import io from "socket.io-client";

/**
 * useStudentSocket - Hook for managing Socket.io connection for students
 * 
 * Automatically connects on mount, joins course rooms, and listens for session events.
 * 
 * @param {Array<number>} enrolledCourseIds - Array of course IDs the student is enrolled in
 * @param {Function} onSessionStarted - Callback when a session starts
 * @param {Function} onSessionEnded - Callback when a session ends
 * @param {Function} onAttendanceUpdate - Callback when attendance is updated
 * @param {boolean} [enabled=true] - Whether socket connection is enabled
 * 
 * @returns {Object} { socket, isConnected, error }
 * 
 * @example
 * const { socket, isConnected } = useStudentSocket(
 *   [1, 2, 3], // enrolled course IDs
 *   (data) => console.log("Session started:", data),
 *   (data) => console.log("Session ended:", data),
 *   (data) => console.log("Attendance updated:", data)
 * );
 */
const useStudentSocket = (
  enrolledCourseIds = [],
  onSessionStarted,
  onSessionEnded,
  onAttendanceUpdate,
  enabled = true
) => {
  const socketRef = useRef(null);
  const isConnectedRef = useRef(false);
  const errorRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!enabled || socketRef.current?.connected) {
      return;
    }

    const token = localStorage.getItem("inclass_token");
    if (!token) {
      console.warn("[StudentSocket] No auth token found");
      errorRef.current = "No authentication token";
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
    errorRef.current = null;

    // Connection events
    socket.on("connect", () => {
      console.log("[StudentSocket] Connected");
      isConnectedRef.current = true;
      reconnectAttemptsRef.current = 0;
      errorRef.current = null;

      // Join course rooms
      enrolledCourseIds.forEach((courseId) => {
        socket.emit("join:course", { courseId });
        console.log(`[StudentSocket] Joined course room: course_${courseId}`);
      });

      // Also join global college room if available (for broader notifications)
      // This would require college_id from user profile
    });

    socket.on("disconnect", (reason) => {
      console.log("[StudentSocket] Disconnected:", reason);
      isConnectedRef.current = false;

      // Attempt reconnection for unexpected disconnects
      if (reason === "io server disconnect" || reason === "transport close") {
        reconnectAttemptsRef.current++;
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          console.log(
            `[StudentSocket] Reconnecting... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );
        } else {
          errorRef.current = "Failed to reconnect to server";
        }
      }
    });

    socket.on("connect_error", (error) => {
      console.error("[StudentSocket] Connection error:", error);
      isConnectedRef.current = false;
      errorRef.current = error.message || "Connection failed";
    });

    // Session events
    socket.on("session:started", (data) => {
      console.log("[StudentSocket] Session started:", data);
      onSessionStarted?.(data);
    });

    socket.on("session:ended", (data) => {
      console.log("[StudentSocket] Session ended:", data);
      onSessionEnded?.(data);
    });

    // Attendance events
    socket.on("attendance:marked", (data) => {
      console.log("[StudentSocket] Attendance marked:", data);
      onAttendanceUpdate?.(data);
    });

    socket.on("attendance:updated", (data) => {
      console.log("[StudentSocket] Attendance updated:", data);
      onAttendanceUpdate?.(data);
    });

    // Error handling
    socket.on("error", (error) => {
      console.error("[StudentSocket] Error:", error);
      errorRef.current = error.message || "Socket error";
    });
  }, [
    enabled,
    enrolledCourseIds,
    onSessionStarted,
    onSessionEnded,
    onAttendanceUpdate,
  ]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      // Leave course rooms
      enrolledCourseIds.forEach((courseId) => {
        socketRef.current.emit("leave:course", { courseId });
      });

      socketRef.current.disconnect();
      socketRef.current = null;
      isConnectedRef.current = false;
    }
  }, [enrolledCourseIds]);

  // Connect on mount or when dependencies change
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // Manual emit function
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn("[StudentSocket] Cannot emit - not connected");
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected: isConnectedRef.current,
    error: errorRef.current,
    emit,
    disconnect,
  };
};

export default useStudentSocket;


