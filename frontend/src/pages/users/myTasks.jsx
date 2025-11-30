import React, { useEffect, useState } from "react"
import DashboardLayout from "../../components/DashboardLayout"
import { useNavigate } from "react-router-dom"
import axiosInstance from "../../utils/axiosInstance"
import TaskStatusTabs from "../../components/TaskStatusTabs"
import { FaFileLines } from "react-icons/fa6"
import TaskCard from "../../components/TaskCard"
import toast from "react-hot-toast"

const MyTasks = () => {
  
  const [allTasks, setAllTasks] = useState([])
  const [tabs, setTabs] = useState("All")
  const [filterStatus, setFilterStatus] = useState("All")

  // ensure status labels map to backend values when filtering
 const STATUS_MAP = {
    All: "",
    pending: "pending",
    "In Progress": "in-progress",
    Completed: "completed",
  }

  const navigate = useNavigate()

 const getAllTasks = async () => {
    try {
      const response = await axiosInstance.get("/tasks", {
        params: { status: STATUS_MAP[filterStatus] ?? "" },
      })

      if (response?.data) {
        setAllTasks(response.data?.tasks?.length > 0 ? response.data.tasks : [])
      }

      const statusSummary = response.data?.statusSummary || {}

      const statusArray = [
        { label: "All", count: statusSummary.all || 0 },
        { label: "pending", count: statusSummary.pendingTasks || 0 },
        { label: "In Progress", count: statusSummary.inProgressTasks || 0 },
        { label: "Completed", count: statusSummary.completedTasks || 0 },
      ]

      setTabs(statusArray)
    } catch (error) {
      console.log("Error fetching tasks: ", error)
    }
  }

  const handleClick = (taskId) => {
    if (!taskId) {
      console.warn("Missing task _id");
      return;
    }
    navigate(`/tasks/${taskId}`);
  }

  const toggleTodo = async (taskId, index) => {
    const t = allTasks.find((x) => x._id === taskId);
    if (!t) return;
    const list = [...(t.todoCheckList || t.todoChecklist || [])];
    if (!list[index]) return;
    list[index].completed = !list[index].completed;

    try {
      const res = await axiosInstance.put(`/tasks/${taskId}/todo`, { todoCheckList: list });
      if (res.status === 200) {
        const returned = res.data?.task || res.data;
        // update local tasks list
        setAllTasks((prev) => prev.map((item) => (item._id === taskId ? { ...(item || {}), ...(returned || {}) } : item)));
      }
    } catch (err) {
      console.error("toggleTodo error:", err);
      // revert local change
      list[index].completed = !list[index].completed;
      setAllTasks((prev) => prev.map((item) => (item._id === taskId ? { ...(item || {}), todoCheckList: list } : item)));
    }
  };

  useEffect(() => {
    getAllTasks(filterStatus)

    return () => {}
  }, [filterStatus])

  return (
    <DashboardLayout activeMenu={"My Tasks"}>
      <div className="my-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <div className="flex items-center justify-between gap-4 w-full md:w-auto ">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
              My Tasks
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
           <TaskStatusTabs
                tabs={tabs}
                activeTab={filterStatus}
                setActiveTab={setFilterStatus}
              />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {allTasks?.length > 0 ? (
            allTasks.map((item) => (
              <TaskCard
                key={item._id}
                title={item.title}
                description={item.description}
                priority={item.priority}
                status={item.status}
                progress={item.progress}
                createdAt={item.createdAt}
                dueDate={item.dueDate}
                assignedTo={item.assignedTo?.map(u => u.profileImageUrl)}
                attachmentCount={item.attachments?.length || 0}
                completedTodoCount={item.completedTodoCount || 0}
                todoCheckList={item.todoCheckList || []} // match backend field name
                onClick={() => handleClick(item._id)}
                onToggleTodo={(taskId, index) => toggleTodo(taskId, index)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-gray-500">
                No tasks found. Create a new task to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default MyTasks
