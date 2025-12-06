import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import DashboardLayout from "../../components/DashboardLayout";
import moment from "moment";
import { useNavigate } from "react-router-dom";

const Notifications = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axiosInstance.get("/logs/user");
      setEvents(res.data?.events || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axiosInstance.put(`/logs/${id}/read`);
      setEvents((prev) =>
        prev.map((e) =>
          e._id === id ? { ...e, readBy: [...(e.readBy || []), "current"] } : e
        )
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
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
      navigate(`/users/tasks/${event.task._id}`);
    }
  };

  return (
    <DashboardLayout activeMenu="Notifications">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Notifications</h1>

        {loading && <p className="text-gray-500">Loading...</p>}

        {!loading && events.length === 0 && (
          <p className="text-gray-500">No notifications yet</p>
        )}

        <div className="space-y-3">
          {events.map((event) => {
            const isRead = event.readBy?.length > 0;
            return (
              <div
                key={event._id}
                onClick={() => handleEventClick(event)}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  isRead ? "bg-white border-gray-200" : "bg-blue-50 border-blue-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getEventIcon(event.type)}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {getEventMessage(event)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {moment(event.createdAt).fromNow()}
                    </p>
                  </div>
                  {!isRead && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-1"></span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Notifications;