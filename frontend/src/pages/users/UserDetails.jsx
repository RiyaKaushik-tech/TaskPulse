import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";

// User details page that fetches real data by id
const UserDetails = () => {
  const { id } = useParams();
  const [userInfo, setUserInfo] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
              <div className="border-2 border-gray-900 rounded-md px-4 py-3 mb-8">
                <p className="text-center text-xl font-semibold tracking-wide">
                  {userInfo?.name || "User Info"}
                </p>
                <p className="text-center text-sm text-gray-600 mt-1">
                  {userInfo?.email || "user@email.com"}
                </p>
              </div>

              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-red-600 tracking-wide">
                  task assigned
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

                {/* <div className="border-t-4 border-gray-900 pt-4 flex items-center justify-center gap-6 text-lg font-semibold"> */}
                    {
                        pendingCount?( 
                            <span className="text-amber-700">{pendingCount} task pending</span>
                        ):(
                        <span className="text-green-700">all task completed</span>
                        )
                    }
                 
                </div>
              </div>
            </div>
        //   </div>
        )}
      </div>
    </div>
  );
};

export default UserDetails;
