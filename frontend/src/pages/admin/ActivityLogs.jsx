import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import DashboardLayout from "../../components/DashboardLayout";
import moment from "moment";

const ActivityLogs = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axiosInstance.get("/logs/admin");
      setEvents(res.data?.events || []);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((e) => {
    if (filter === "all") return true;
    return e.type === filter;
  });

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
      case "user_signup":
        return "👤";
      case "task_overdue":
        return "⚠️";
      default:
        return "🔔";
    }
  };

  const getEventMessage = (event) => {
    const actorName = event.actor?.name || "System";
    const taskTitle = event.task?.title || "a task";
    const targetNames = (event.targets || []).map((t) => t.name).join(", ");

    switch (event.type) {
      case "task_created":
        return `${actorName} created "${taskTitle}" and assigned to ${targetNames}`;
      case "task_assigned":
        return `${actorName} assigned "${taskTitle}" to ${targetNames}`;
      case "task_completed":
        return `${actorName} completed "${taskTitle}"`;
      case "user_mentioned":
        return `${actorName} mentioned ${targetNames} in "${taskTitle}"`;
      case "user_signup":
        return `${event.meta?.userName} (${event.meta?.userEmail}) signed up`;
      case "task_overdue":
        return `Task "${taskTitle}" is overdue (due: ${moment(event.meta?.dueDate).format("MMM D, YYYY")})`;
      default:
        return `Event: ${event.type}`;
    }
  };

  return (
    <DashboardLayout activeMenu="Activity Logs">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Activity Logs</h1>

        {/* Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {["all", "task_created", "task_assigned", "task_completed", "user_mentioned", "user_signup", "task_overdue"].map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded text-sm font-medium transition ${
                  filter === f
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {f === "all" ? "All" : f.replace("_", " ")}
              </button>
            )
          )}
        </div>

        {loading && <p className="text-gray-500">Loading...</p>}

        {!loading && filteredEvents.length === 0 && (
          <p className="text-gray-500">No activity logs yet</p>
        )}

        <div className="space-y-3">
          {filteredEvents.map((event) => (
            <div
              key={event._id}
              className="p-4 rounded-lg border bg-white border-gray-200 hover:shadow-md transition"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getEventIcon(event.type)}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {getEventMessage(event)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {moment(event.createdAt).format("MMM D, YYYY h:mm A")} ({moment(event.createdAt).fromNow()})
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ActivityLogs;