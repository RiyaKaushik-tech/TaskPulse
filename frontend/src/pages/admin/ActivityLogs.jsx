import React, { useEffect, useState, useCallback } from "react";
import axiosInstance from "../../utils/axiosInstance";
import DashboardLayout from "../../components/DashboardLayout";
import DeleteAlert from "../../components/DeleteAlert";
import moment from "moment";
import { getSocket } from "../../utils/socket";
import toast from "react-hot-toast";

const ActivityLogs = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showFilter, setShowFilter] = useState("all"); // all, unread, read
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  useEffect(() => {
    fetchEvents();
    setupSocketListeners();
  }, []);

  const setupSocketListeners = () => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("notification:new", (data) => {
      setEvents((prev) => {
        const exists = prev.findIndex((e) => String(e._id) === String(data._id));
        if (exists !== -1) {
          const updated = [...prev];
          updated[exists] = { ...updated[exists], ...data };
          return updated;
        }
        toast.success("🆕 New activity logged", { duration: 2000 });
        return [data, ...prev];
      });
    });

    socket.on("notification:updated", (data) => {
      setEvents((prev) =>
        prev.map((e) =>
          String(e._id) === String(data._id)
            ? { ...e, isRead: data.isRead !== undefined ? data.isRead : e.isRead }
            : e
        )
      );
    });

    socket.on("notification:bulk-deleted", (data) => {
      const deletedIds = (data.ids || []).map((id) => String(id));
      setEvents((prev) => prev.filter((e) => !deletedIds.includes(String(e._id))));
      setSelectedIds([]);
    });

    socket.on("notification:deleted", (data) => {
      const deletedId = String(data.id);
      setEvents((prev) => prev.filter((e) => String(e._id) !== deletedId));
    });

    return () => {
      socket.off("notification:new");
      socket.off("notification:updated");
      socket.off("notification:bulk-deleted");
      socket.off("notification:deleted");
    };
  };

  const fetchEvents = async () => {
    setLoading(true);
    const loadingToast = toast.loading("📊 Loading activity logs...");
    try {
      const res = await axiosInstance.get("/logs/admin");
      const eventsData = res.data?.events || [];
      setEvents(eventsData);
      toast.success(`✅ Loaded ${eventsData.length} logs`, { id: loadingToast, duration: 2000 });
    } catch (err) {
      console.error("Error fetching logs:", err);
      toast.error("❌ Failed to load activity logs", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = useCallback(async (eventId) => {
    const readToast = toast.loading("📝 Marking as read...");

    try {
      const response = await axiosInstance.put(`/logs/${eventId}/read`);

      if (response.data.success) {
        setEvents((prev) =>
          prev.map((e) =>
            String(e._id) === String(eventId)
              ? { ...e, isRead: true }
              : e
          )
        );
        toast.success("✅ Marked as read", { id: readToast, duration: 2000 });
      }
    } catch (error) {
      console.error("Error marking as read:", error);
      toast.error("❌ Failed to mark as read", { id: readToast });
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    const unreadEvents = filteredByStatus.filter(e => !e.isRead);
    if (unreadEvents.length === 0) {
      toast.error("⚠️ No unread logs to mark");
      return;
    }

    const unreadIds = unreadEvents.map(e => String(e._id));
    const readToast = toast.loading(`📝 Marking ${unreadIds.length} log(s) as read...`);

    try {
      const response = await axiosInstance.post(`/logs/admin/bulk-read`, {
        ids: unreadIds,
      });

      if (response.data.success) {
        setEvents((prev) =>
          prev.map((e) =>
            unreadIds.includes(String(e._id))
              ? { ...e, isRead: true }
              : e
          )
        );
        toast.success(
          `✅ ${response.data.modifiedCount || unreadIds.length} log(s) marked as read`,
          { id: readToast, duration: 2000 }
        );
      }
    } catch (error) {
      console.error("Error marking as read:", error);
      toast.error("❌ Failed to mark logs as read", { id: readToast });
    }
  }, [events, filter, showFilter]);

  const handleBulkMarkAsRead = useCallback(async () => {
    if (!selectedIds.length) {
      toast.error("⚠️ No logs selected");
      return;
    }

    const readToast = toast.loading(`📝 Marking ${selectedIds.length} log(s) as read...`);

    try {
      const response = await axiosInstance.post(`/logs/admin/bulk-read`, {
        ids: selectedIds,
      });

      if (response.data.success) {
        setEvents((prev) =>
          prev.map((e) =>
            selectedIds.includes(String(e._id))
              ? { ...e, isRead: true }
              : e
          )
        );
        setSelectedIds([]);
        toast.success(
          `✅ ${response.data.modifiedCount || selectedIds.length} log(s) marked as read`,
          { id: readToast, duration: 2000 }
        );
      }
    } catch (error) {
      console.error("Error marking as read:", error);
      toast.error("❌ Failed to mark logs as read", { id: readToast });
    }
  }, [selectedIds]);

  const handleBulkDelete = async () => {
    if (!selectedIds.length) {
      toast.error("⚠️ No logs selected");
      setShowBulkDelete(false);
      return;
    }

    const deleteRequest = axiosInstance.post("/logs/admin/bulk-delete", {
      ids: selectedIds,
    });

    toast.promise(
      deleteRequest,
      {
        loading: `🗑️ Deleting ${selectedIds.length} log(s)...`,
        success: (res) => {
          setEvents((prev) =>
            prev.filter((e) => !selectedIds.includes(String(e._id)))
          );
          setSelectedIds([]);
          setShowBulkDelete(false);
          return `✅ ${res.data.deletedCount || selectedIds.length} log(s) deleted`;
        },
        error: (err) => {
          setShowBulkDelete(false);
          return `❌ ${err?.response?.data?.message || "Failed to delete"}`;
        },
      },
      {
        success: { duration: 3000, icon: "🎉" },
        error: { duration: 4000, icon: "🚫" },
      }
    );
  };

  const handleDeleteSingle = async (eventId) => {
    const deleteToast = toast.loading("🗑️ Deleting log...");
    try {
      const response = await axiosInstance.delete(`/logs/${eventId}`);
      if (response.data.success) {
        setEvents((prev) => prev.filter((e) => String(e._id) !== String(eventId)));
        toast.success("✅ Log deleted", { id: deleteToast, duration: 2000 });
      }
    } catch (error) {
      console.error("Error deleting log:", error);
      toast.error("❌ Failed to delete log", { id: deleteToast });
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredByStatus.length && filteredByStatus.length > 0) {
      setSelectedIds([]);
      toast.success("❎ Deselected all", { duration: 1500 });
    } else {
      const allIds = filteredByStatus.map((e) => String(e._id));
      setSelectedIds(allIds);
      toast.success(`✅ Selected ${allIds.length} logs`, { duration: 1500 });
    }
  };

  const filteredByType = events.filter((e) => {
    if (filter === "all") return true;
    return e.type === filter;
  });

  const filteredByStatus = filteredByType.filter((e) => {
    if (showFilter === "all") return true;
    if (showFilter === "unread") return !e.isRead;
    if (showFilter === "read") return e.isRead;
    return true;
  });

  const unreadCount = events.filter((e) => !e.isRead).length;

  const getEventIcon = (type) => {
    const icons = {
      task_created: "➕",
      task_assigned: "📌",
      task_completed: "✅",
      user_mentioned: "💬",
      user_signup: "👤",
      task_overdue: "⚠️",
    };
    return icons[type] || "🔔";
  };

  const getEventMessage = (event) => {
    const actorName = event.actor?.name || "System";
    const taskTitle = event.task?.title || "a task";
    const targetNames = (event.targets || [])
      .map((t) => t?.name || t)
      .join(", ") || "team";

    const messages = {
      task_created: `${actorName} created "${taskTitle}" → ${targetNames}`,
      task_assigned: `${actorName} assigned "${taskTitle}" → ${targetNames}`,
      task_completed: `${actorName} completed "${taskTitle}"`,
      user_mentioned: `${actorName} mentioned ${targetNames} in "${taskTitle}"`,
      user_signup: `${event.meta?.userName} (${event.meta?.userEmail}) signed up`,
      task_overdue: `"${taskTitle}" is overdue (due: ${moment(event.meta?.dueDate).format(
        "MMM D, YYYY"
      )})`,
    };
    return messages[event.type] || `Event: ${event.type}`;
  };

  return (
    <DashboardLayout activeMenu="Activity Logs">
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">📊 Activity Logs</h1>
            <p className="text-gray-500 mt-1">
              {events.length} total events
              {unreadCount > 0 && (
                <span className="ml-2 inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                  🔴 {unreadCount} unread
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-md hover:shadow-lg hover:bg-green-700 transition-all transform hover:scale-105 font-medium"
              >
                ✅ Mark All as Read
              </button>
            )}
            {selectedIds.length > 0 && (
              <>
                <button
                  onClick={handleBulkMarkAsRead}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:shadow-lg hover:bg-blue-700 transition-all transform hover:scale-105 font-medium"
                >
                  ✅ Mark Selected ({selectedIds.length})
                </button>
                <button
                  onClick={() => setShowBulkDelete(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:shadow-lg hover:bg-red-700 transition-all transform hover:scale-105 font-medium"
                >
                  🗑️ Delete ({selectedIds.length})
                </button>
              </>
            )}
          </div>
        </div>

        {/* Read/Unread Filter */}
        <div className="mb-4 flex gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-700 py-2">Show:</span>
          {["all", "unread", "read"].map((sf) => (
            <button
              key={sf}
              onClick={() => {
                setShowFilter(sf);
                setSelectedIds([]);
                toast.success(`🔍 Showing: ${sf}`, { duration: 1500 });
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105 ${
                showFilter === sf
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {sf === "all" ? "All" : sf === "unread" ? "🔴 Unread" : "✅ Read"}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-700 py-2">Type:</span>
          {[
            "all",
            "task_created",
            "task_assigned",
            "task_completed",
            "user_mentioned",
            "user_signup",
            "task_overdue",
          ].map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setSelectedIds([]);
                toast.success(`🔍 Filter: ${f.replace(/_/g, " ")}`, {
                  duration: 1500,
                });
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105 ${
                filter === f
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {f === "all" ? "All" : f.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {filteredByStatus.length > 0 && (
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={
                  filteredByStatus.length > 0 &&
                  selectedIds.length === filteredByStatus.length
                }
                onChange={toggleSelectAll}
                className="w-4 h-4 cursor-pointer text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                ✅ Select All ({filteredByStatus.length}{" "}
                {filteredByStatus.length === 1 ? "log" : "logs"})
              </span>
            </label>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading activity logs...</p>
          </div>
        )}

        {!loading && filteredByStatus.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <span className="text-6xl">📋</span>
            <p className="text-gray-500 mt-4 text-lg">
              {showFilter === "unread" ? "No unread logs" : showFilter === "read" ? "No read logs" : "No logs found"}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {filteredByStatus.map((event) => (
            <div
              key={event._id}
              className={`p-4 rounded-lg border transition-all transform hover:scale-[1.01] ${
                event.isRead
                  ? "bg-white border-gray-200 hover:shadow-md"
                  : "bg-blue-50 border-blue-300 shadow-md hover:shadow-lg"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(String(event._id))}
                  onChange={() => toggleSelect(String(event._id))}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 w-4 h-4 cursor-pointer text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-2xl">{getEventIcon(event.type)}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {getEventMessage(event)}
                    </p>
                    {!event.isRead && (
                      <span
                        className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0"
                        title="Unread"
                      ></span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {moment(event.createdAt).format("MMM D, YYYY h:mm A")} (
                    {moment(event.createdAt).fromNow()})
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {!event.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(String(event._id))}
                      className="text-blue-500 hover:text-blue-700 text-sm px-2 py-1 rounded-lg hover:bg-blue-50 transition-all font-medium whitespace-nowrap"
                      title="Mark as read"
                    >
                      ✅ Read
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteSingle(String(event._id))}
                    className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded-lg hover:bg-red-50 transition-all font-medium whitespace-nowrap"
                    title="Delete this log"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showBulkDelete && (
        <DeleteAlert
          message={`Are you sure you want to delete ${selectedIds.length} log(s)? This action cannot be undone.`}
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkDelete(false)}
        />
      )}
    </DashboardLayout>
  );
};

export default ActivityLogs;