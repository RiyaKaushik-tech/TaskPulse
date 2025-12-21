import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { IoFlameSharp, IoCheckmarkCircle, IoCloseCircle, IoCalendarOutline } from "react-icons/io5";
import { useAttendanceUpdates } from "../../utils/useAttendanceUpdates";

// User details page that fetches real data by id
const UserDetails = () => {
  const { id } = useParams();
  const [userInfo, setUserInfo] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Handle real-time attendance updates
  useAttendanceUpdates((data) => {
    // Update user info if it's for the current user
    if (userInfo && data.userId === id) {
      // Handle login event
      if (data.status === 'login') {
        setUserInfo(prev => ({
          ...prev,
          loginStreak: data.loginStreak,
          lastLoginDate: data.loginTime
        }));
      } else {
        // Handle attendance update (present/absent)
        setUserInfo(prev => ({
          ...prev,
          loginStreak: data.loginStreak,
          absentDays: data.absentDays,
          attendanceRecords: [
            ...(prev.attendanceRecords || []),
            {
              date: data.date,
              day: data.day,
              status: data.status
            }
          ]
        }));
      }
    }
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [userRes, tasksRes] = await Promise.all([
          axiosInstance.get(`/users/${id}`),
          axiosInstance.get("/tasks", { params: { assignedToUser: id } }),
        ]);

        setUserInfo(userRes?.data?.user || userRes?.data || null);
        setTasks(tasksRes?.data?.tasks || []);
      } catch (err) {
        console.error("Error loading user details:", err?.response?.data || err);
        setUserInfo(null);
        setTasks([]);
        setError("Failed to load user details");
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id]);

  const completedCount = useMemo(
    () => tasks.filter((t) => t.status === "completed").length,
    [tasks]
  );
  const pendingCount = useMemo(
    () => tasks.filter((t) => t.status === "pending").length,
    [tasks]
  );

  return (
    <div className="min-h-screen bg-white text-gray-900 px-6 py-8 md:px-10 lg:px-16">
      <div className="max-w-5xl mx-auto border border-gray-900 rounded-lg p-6 md:p-10 shadow-[8px_8px_0_#0f172a]">
        {loading && <div className="text-center text-gray-700">Loading user...</div>}
        {error && !loading && <div className="text-center text-red-600">{error}</div>}

        {!loading && userInfo && (
          <div className="flex flex-col md:flex-row md:items-start md:gap-8">
            <div className="flex justify-center md:block mb-6 md:mb-0">
              <div className="w-24 h-24 border-4 border-gray-900 rounded-full flex items-center justify-center overflow-hidden bg-gray-100">
                <img
                  src={userInfo?.profilePicUrl || "/defaultProfile.png"}
                  alt="profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="flex-1">
              <div className="border-2 border-gray-900 rounded-md px-6 py-4 mb-6">
                <p className="text-center text-xl font-semibold tracking-wide">
                  {userInfo?.name || "User Info"}
                </p>
                <p className="text-center text-sm text-gray-600 mt-1">
                  {userInfo?.email || "user@email.com"}
                </p>
              </div>

              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-red-600 tracking-wide">
                  Task Assigned
                </h2>

                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div
                      key={task._id || task.id}
                      className="border-b-4 border-gray-900 pb-2 flex items-center justify-between"
                    >
                      <span className="text-base font-medium">{task.title}</span>
                      <span
                        className={`text-sm font-semibold ${
                          task.status === "completed" ? "text-green-600" : "text-amber-600"
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <div className="text-sm text-gray-600">No tasks assigned.</div>
                  )}
                </div>

                    {
                        pendingCount ? ( 
                            <span className="text-amber-700">{pendingCount} task pending</span>
                        ) : (
                        <span className="text-green-700">All tasks completed</span>
                        )
                    }
                </div>

                {/* Attendance Stats Section */}
                <div className="mt-8 border-2 border-gray-900 rounded-md p-6">
                  <h2 className="text-xl font-semibold text-blue-600 tracking-wide mb-4">
                    Attendance Statistics
                  </h2>
                  
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 text-center">
                      <IoFlameSharp className="text-orange-500 text-3xl mx-auto mb-2" />
                      <p className="text-2xl font-bold text-orange-600">{userInfo?.loginStreak || 0}</p>
                      <p className="text-sm text-gray-600 font-medium mt-1">Day Streak</p>
                    </div>
                    
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center">
                      <IoCheckmarkCircle className="text-green-500 text-3xl mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">
                        {(userInfo?.attendanceRecords?.filter(r => r.status === "present").length) || 0}
                      </p>
                      <p className="text-sm text-gray-600 font-medium mt-1">Present Days</p>
                    </div>
                    
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center">
                      <IoCloseCircle className="text-red-500 text-3xl mx-auto mb-2" />
                      <p className="text-2xl font-bold text-red-600">{userInfo?.absentDays || 0}</p>
                      <p className="text-sm text-gray-600 font-medium mt-1">Absent Days</p>
                    </div>
                  </div>

                  {/* Attendance History */}
                  {userInfo?.attendanceRecords && userInfo.attendanceRecords.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <IoCalendarOutline className="text-gray-700 text-xl" />
                        <h3 className="text-lg font-semibold text-gray-800">Attendance History</h3>
                        <span className="text-xs text-gray-500 ml-auto">(Last 30 days)</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto bg-gray-50 border-2 border-gray-200 rounded-lg p-3 space-y-2">
                        {[...userInfo.attendanceRecords]
                          .sort((a, b) => new Date(b.date) - new Date(a.date))
                          .slice(0, 30)
                          .map((record, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                                record.status === "present"
                                  ? "bg-white border-l-4 border-green-500 hover:shadow-sm"
                                  : "bg-white border-l-4 border-red-500 hover:shadow-sm"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {record.status === "present" ? (
                                  <IoCheckmarkCircle className="text-green-500 text-xl" />
                                ) : (
                                  <IoCloseCircle className="text-red-500 text-xl" />
                                )}
                                <div>
                                  <p className="text-sm font-semibold text-gray-800">
                                    {new Date(record.date).toLocaleDateString("en-US", {
                                      weekday: "long",
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">{record.day}</p>
                                </div>
                              </div>
                              <span
                                className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                                  record.status === "present"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default UserDetails;
