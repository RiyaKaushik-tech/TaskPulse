import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosInstance from "../utils/axiosInstance";
import { getSocket } from "../utils/socket";
import { FaBell } from "react-icons/fa";

const UserNotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentEvents, setRecentEvents] = useState([]);
  const navigate = useNavigate();
  const user = useSelector((state) => state.user?.currentUser);

  useEffect(() => {
    fetchUnreadCount();
    fetchRecentEvents();

    const socket = getSocket();
    if (socket) {
      socket.on("notification:new", (data) => {
        setUnreadCount((prev) => prev + 1);
        setRecentEvents((prev) => [data, ...prev.slice(0, 4)]);
      });

      socket.on("notification:deleted", (data) => {
        setRecentEvents((prev) => prev.filter((e) => String(e._id || e.id) !== String(data.id)));
        fetchUnreadCount();
      });

      return () => {
        socket.off("notification:new");
        socket.off("notification:deleted");
      };
    }
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await axiosInstance.get("/logs/user/unread-count");
      setUnreadCount(res.data?.count || 0);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  };

  const fetchRecentEvents = async () => {
    try {
      const res = await axiosInstance.get("/logs/user");
      setRecentEvents((res.data?.events || []).slice(0, 5));
    } catch (err) {
      console.error("Failed to fetch recent events:", err);
    }
  };

  const getEventMessage = (event) => {
    const actorName = event.actor?.name || "Someone";
    const taskTitle = event.task?.title || "a task";

    switch (event.type) {
      case "task_created":
        return `${actorName} created "${taskTitle}"`;
      case "task_assigned":
        return `You were assigned to "${taskTitle}"`;
      case "task_completed":
        return `${actorName} completed "${taskTitle}"`;
      case "user_mentioned":
        return `${actorName} mentioned you`;
      default:
        return `New notification`;
    }
  };

  const handleViewAll = () => {
    setShowDropdown(false);
    navigate("/users/notifications");
  };

  const handleEventClick = (event) => {
    setShowDropdown(false);
    if (event.task?._id) {
      navigate(`/tasks/${event.task._id}`);
    } else {
      navigate("/users/notifications");
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition"
      >
        <FaBell className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-blue-600">{unreadCount} new</span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {recentEvents.length === 0 && (
              <p className="p-4 text-sm text-gray-500 text-center">No notifications</p>
            )}

            {recentEvents.map((event) => {
              const userId = String(user?._id || user?.id || "");
              const readByIds = (event.readBy || []).map(id => String(id));
              const isRead = readByIds.includes(userId);
              
              return (
                <div
                  key={event._id || event.id}
                  onClick={() => handleEventClick(event)}
                  className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                    !isRead ? "bg-blue-50" : ""
                  }`}
                >
                  <p className="text-sm text-gray-900">{getEventMessage(event)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(event.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="p-3 border-t border-gray-200">
            <button
              onClick={handleViewAll}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All Notifications
            </button>
          </div>
        </div>
      )}

      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        ></div>
      )}
    </div>
  );
};

export default UserNotificationBell;