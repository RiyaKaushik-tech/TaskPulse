import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import DashboardLayout from "../../components/DashboardLayout";
import DeleteAlert from "../../components/DeleteAlert";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { getSocket } from "../../utils/socket";
import { toast } from "react-toastify";

const Notifications = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();

    const socket = getSocket();
    if (socket) {
      socket.on("notification:new", (data) => {
        setEvents((prev) => [data, ...prev]);
      });

      socket.on("notification:deleted", (data) => {
        const deletedId = String(data.id);
        setEvents((prev) => prev.filter((e) => String(e._id) !== deletedId));
      });

      return () => {
        socket.off("notification:new");
        socket.off("notification:deleted");
      };
    }
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/logs/user");
      setEvents(res.data?.events || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axiosInstance.put(`/logs/${id}/read`);
      setEvents((prev) =>
        prev.map((e) =>
          String(e._id) === String(id) ? { ...e, readBy: [...(e.readBy || []), "current"] } : e
        )
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      const res = await axiosInstance.delete(`/logs/${deleteId}`);
      if (res.data?.success) {
        const deletedId = String(deleteId);
        setEvents((prev) => prev.filter((e) => String(e._id) !== deletedId));
        toast.success("Notification deleted successfully");
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
      toast.error(err?.response?.data?.message || "Failed to delete notification");
    } finally {
      setDeleteId(null);
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case "task_created":
        return "➕";
      case "task_assigned":
        return "📌";
      case "task_completed":
        return "✅";
      case "user_mentioned":
        return "💬";
      default:
        return "🔔";
    }
  };

  const getEventMessage = (event) => {
    const actorName = event.actor?.name || "Someone";
    const taskTitle = event.task?.title || "a task";

    switch (event.type) {
      case "task_created":
        return `${actorName} created "${taskTitle}"`;
      case "task_assigned":
        return `${actorName} assigned you to "${taskTitle}"`;
      case "task_completed":
        return `${actorName} completed "${taskTitle}"`;
      case "user_mentioned":
        return `${actorName} mentioned you in "${taskTitle}"`;
      default:
        return `New notification`;
    }
  };

  const handleEventClick = (event) => {
    if (event.task?._id) {
      markAsRead(event._id);
      navigate(`/tasks/${event.task._id}`);
    }
  };

  return (
    <DashboardLayout activeMenu="Notifications">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {events.length > 0 && (
            <button
              onClick={fetchEvents}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
            >
              Refresh
            </button>
          )}
        </div>

        {loading && <p className="text-gray-500">Loading...</p>}

        {!loading && events.length === 0 && (
          <div className="text-center py-12">
            <span className="text-6xl">🔔</span>
            <p className="text-gray-500 mt-4">No notifications yet</p>
          </div>
        )}

        <div className="space-y-3">
          {events.map((event) => {
            const isRead = event.readBy?.length > 0;
            return (
              <div
                key={event._id}
                className={`p-4 rounded-lg border transition-all ${
                  isRead ? "bg-white border-gray-200" : "bg-blue-50 border-blue-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getEventIcon(event.type)}</span>
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => handleEventClick(event)}
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {getEventMessage(event)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {moment(event.createdAt).fromNow()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isRead && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(event._id);
                      }}
                      className="text-red-500 hover:text-red-700 text-sm px-3 py-1 rounded hover:bg-red-50 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {deleteId && (
        <DeleteAlert
          message="Are you sure you want to delete this notification? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </DashboardLayout>
  );
};

export default Notifications;