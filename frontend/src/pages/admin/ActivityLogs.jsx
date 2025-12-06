import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import DashboardLayout from "../../components/DashboardLayout";
import DeleteAlert from "../../components/DeleteAlert";
import moment from "moment";
import { getSocket } from "../../utils/socket";
import { toast } from "react-toastify";

const ActivityLogs = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  useEffect(() => {
    fetchEvents();

    const socket = getSocket();
    if (socket) {
      socket.on("notification:new", (data) => {
        setEvents((prev) => [data, ...prev]);
      });

      socket.on("notification:bulk-deleted", (data) => {
        const deletedIds = (data.ids || []).map((id) => String(id));
        setEvents((prev) => prev.filter((e) => !deletedIds.includes(String(e._id))));
        setSelectedIds([]);
      });

      return () => {
        socket.off("notification:new");
        socket.off("notification:bulk-deleted");
      };
    }
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/logs/admin");
      setEvents(res.data?.events || []);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      toast.error("Failed to fetch activity logs");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    console.log("handleBulkDelete called with IDs:", selectedIds);
    
    if (!selectedIds.length) {
      toast.warning("No logs selected");
      setShowBulkDelete(false);
      return;
    }

    try {
      console.log("Sending delete request for IDs:", selectedIds);
      const res = await axiosInstance.post("/logs/admin/bulk-delete", { ids: selectedIds });
      console.log("Delete response:", res.data);
      
      if (res.data?.success) {
        const deletedIds = selectedIds.map((id) => String(id));
        setEvents((prev) => prev.filter((e) => !deletedIds.includes(String(e._id))));
        toast.success(`${res.data.deletedCount || selectedIds.length} log(s) deleted successfully`);
        setSelectedIds([]);
      } else {
        toast.error("Delete operation failed");
      }
    } catch (err) {
      console.error("Failed to bulk delete:", err);
      console.error("Error response:", err?.response?.data);
      toast.error(err?.response?.data?.message || "Failed to delete logs");
    } finally {
      setShowBulkDelete(false);
    }
  };

  const toggleSelect = (id) => {
    console.log("Toggle select:", id);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredEvents.length && filteredEvents.length > 0) {
      console.log("Deselecting all");
      setSelectedIds([]);
    } else {
      const allIds = filteredEvents.map((e) => e._id);
      console.log("Selecting all:", allIds);
      setSelectedIds(allIds);
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
    const targetNames = (event.targets || []).map((t) => t?.name || t).join(", ") || "team";

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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Activity Logs</h1>
          {selectedIds.length > 0 && (
            <button
              onClick={() => {
                console.log("Delete button clicked, showing modal");
                setShowBulkDelete(true);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Delete Selected ({selectedIds.length})
            </button>
          )}
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {["all", "task_created", "task_assigned", "user_mentioned", "user_signup", "task_overdue"].map(
            (f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setSelectedIds([]);
                }}
                className={`px-4 py-2 rounded text-sm font-medium transition ${
                  filter === f
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {f === "all" ? "All" : f.replace(/_/g, " ")}
              </button>
            )
          )}
        </div>

        {/* Select All */}
        {filteredEvents.length > 0 && (
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filteredEvents.length > 0 && selectedIds.length === filteredEvents.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-sm text-gray-700">
                Select All ({filteredEvents.length} {filteredEvents.length === 1 ? 'log' : 'logs'})
              </span>
            </label>
          </div>
        )}

        {loading && <p className="text-gray-500">Loading...</p>}

        {!loading && filteredEvents.length === 0 && (
          <p className="text-gray-500">
            {filter === "all" ? "No activity logs yet" : `No ${filter.replace(/_/g, " ")} logs found`}
          </p>
        )}

        <div className="space-y-3">
          {filteredEvents.map((event) => (
            <div
              key={event._id}
              className="p-4 rounded-lg border bg-white border-gray-200 hover:shadow-md transition"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(event._id)}
                  onChange={() => toggleSelect(event._id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 w-4 h-4 cursor-pointer"
                />
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

      {showBulkDelete && (
        <DeleteAlert
          message={`Are you sure you want to delete ${selectedIds.length} log(s)? This action cannot be undone.`}
          onConfirm={() => {
            console.log("Confirm clicked in DeleteAlert");
            handleBulkDelete();
          }}
          onCancel={() => {
            console.log("Cancel clicked in DeleteAlert");
            setShowBulkDelete(false);
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default ActivityLogs;