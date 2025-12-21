import { useEffect } from 'react';
import { getSocket } from './socket';
import toast from 'react-hot-toast';

/**
 * Hook to listen for real-time attendance updates via socket
 * @param {Function} onUpdate - Callback function when attendance is updated
 */
export const useAttendanceUpdates = (onUpdate) => {
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleAttendanceUpdate = (data) => {
      // Show toast notification based on status
      if (data.status === 'present') {
        toast.success(`${data.userName || 'User'} marked present`, {
          duration: 3000,
        });
      } else if (data.status === 'absent') {
        toast.error(`${data.userName || 'User'} marked absent`, {
          duration: 4000,
        });
      }

      // Call the onUpdate callback with the data
      if (onUpdate && typeof onUpdate === 'function') {
        onUpdate(data);
      }
    };

    const handleUserLogin = (data) => {
      // Show toast notification for user login
      toast.success(`${data.userName || 'User'} logged in`, {
        duration: 2000,
      });

      // Call the onUpdate callback if needed
      if (onUpdate && typeof onUpdate === 'function') {
        onUpdate({ ...data, status: 'login' });
      }
    };

    // Listen for attendance updates and logins
    socket.on('user:attendance-update', handleAttendanceUpdate);
    socket.on('user:login', handleUserLogin);

    // Cleanup
    return () => {
      socket.off('user:attendance-update', handleAttendanceUpdate);
      socket.off('user:login', handleUserLogin);
    };
  }, [onUpdate]);
};

export default useAttendanceUpdates;
