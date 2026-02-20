import React, { useEffect, useState } from "react"
import DashboardLayout from "../../components/DashboardLayout"
import { useNavigate } from "react-router-dom"
import axiosInstance from "../../utils/axiosInstance.js"
import TaskStatusTabs from "../../components/TaskStatusTabs"
import SearchAndFilterPanel from "../../components/SearchAndFilterPanel"
import { FaFileLines } from "react-icons/fa6"
import TaskCard from "../../components/TaskCard"
import toast from "react-hot-toast"

const ManageTasks = () => {
  const [allTasks, setAllTasks] = useState([])
  const [tabs, setTabs] = useState("All")
  const [filterStatus, setFilterStatus] = useState("All")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("")
  const [sortOrder, setSortOrder] = useState("asc")
  const [tags, setTags] = useState("")
  const [assignedToUser, setAssignedToUser] = useState("")
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  })
  const [currentPage, setCurrentPage] = useState(1)

  const navigate = useNavigate()

  const getAllTasks = async () => {
    // const loadingToast = toast.loading(" Loading tasks...")
    try {
      const params = { 
        status: STATUS_MAP[filterStatus] ?? "",
        page: currentPage,
        limit: 20,
      }
      
      if (searchTerm) params.search = searchTerm
      if (sortBy) {
        params.sortBy = sortBy
        params.sortOrder = sortOrder
      }
      if (tags) params.tags = tags
      if (assignedToUser) params.assignedToUser = assignedToUser

      const response = await axiosInstance.get("/tasks", { params })

      if (response?.data) {
        setAllTasks(response.data?.tasks?.length > 0 ? response.data.tasks : [])
        if (response.data?.pagination) {
          setPagination(response.data.pagination)
        }
        // toast.success(` ${response.data?.tasks?.length || 0} tasks loaded`, { id: loadingToast })
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
      toast.error(" Error loading tasks. Please try again!", { id: loadingToast })
    }
  }

  const handleClick = (taskData) => {
    toast.success(" Opening task details...", { duration: 1500 })
    navigate("/admin/create-task", { state: { taskId: taskData._id } })
  }

  const handleDownloadReport = async () => {
    const downloadToast = toast.loading("📥 Downloading report...")
    try {
      const response = await axiosInstance.get("/report/export/task", {
        responseType: "blob",
      })

      // create a url for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")

      link.href = url

      link.setAttribute("download", "tasks_details.xlsx")
      document.body.appendChild(link)

      link.click()

      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success(" Report downloaded successfully!", { id: downloadToast })
    } catch (error) {
      console.log("Error downloading task-details report: ", error)
      toast.error(" Error downloading task-details report. Please try again!", { id: downloadToast })
    }
  }

  const STATUS_MAP = {
    All: "",
    pending: "pending",
    "In Progress": "in-progress",
    Completed: "completed",
  }

  // replace existing getUsers() with this robust version
  const getUsers = async () => {
    // const usersLoadingToast = toast.loading("👥 Loading users...")
    try {
      // try a few likely endpoints (axiosInstance already prefixes /api)
      const candidates = [
        "/users/get-users",
        "/users",
        "/users/list",
        "/users/all",
      ];

      let res = null;
      for (const ep of candidates) {
        try {
          res = await axiosInstance.get(ep);
          if (res && (res.status === 200 || res.status === 201)) break;
        } catch (e) {
          // ignore and try next candidate
        }
      }

      if (!res) {
        throw new Error(
          `No users endpoint responded. Tried: ${candidates.join(", ")}`
        );
      }

      // support multiple response shapes
      const payload = res.data || {};
      const users =
        Array.isArray(payload.users) && payload.users.length
          ? payload.users
          : Array.isArray(payload.data) && payload.data.length
          ? payload.data
          : Array.isArray(payload)
          ? payload
          : [];

      setUsers(Array.isArray(users) ? users : []);
      // toast.success(` ${us/ers.length} users loaded`, { id: usersLoadingToast })
    } catch (err) {
      console.error("Error fetching users:", err, err?.response?.data);
      setUsers([]);
      toast.error(" Error loading users", { id: usersLoadingToast })
    }
  };

  useEffect(() => {
    getUsers()
  }, [])

  useEffect(() => {
    getAllTasks()

    return () => {}
  }, [filterStatus, searchTerm, sortBy, sortOrder, tags, assignedToUser, currentPage])

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <DashboardLayout activeMenu={"Manage Task"}>
      <div className="my-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <div className="flex items-center justify-between gap-4 w-full md:w-auto ">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
              My Tasks
            </h2>

            <button
              className="md:hidden px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium shadow-sm hover:shadow-md cursor-pointer"
              onClick={handleDownloadReport}
              type="button"
            >
              📥 Download
            </button>
          </div>

          {allTasks?.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <TaskStatusTabs
                tabs={tabs}
                activeTab={filterStatus}
                setActiveTab={setFilterStatus}
              />

              {/* <button
                className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
                onClick={handleDownloadReport}
                type="button"
              >
                <FaFileLines className="text-lg" />
                <span>📥 Download Report</span>
              </button> */}
            </div>
          )}
        </div>

        <SearchAndFilterPanel
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          tags={tags}
          onTagsChange={setTags}
          assignedToUser={assignedToUser}
          onAssignedToUserChange={setAssignedToUser}
          users={users}
          showUserFilter={true}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {allTasks?.map((item, index) => (
            <TaskCard
              key={item._id}
              title={item.title}
              description={item.description}
              priority={item.priority}
              status={item.status}
              progress={item.progress}
              createdAt={item.createdAt}
              dueDate={item.dueDate}
              assignedTo={item.assignedTo?.map((item) => item.profilePicUrl)}
              attachmentCount={item.attachments?.length || 0}
              completedTodoCount={item.completedTodoCount || 0}
              todoCheckList={item.todoCheckList || []}
              onClick={() => handleClick(item)}
            />
          ))}
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            
            <div className="flex gap-1">
              {[...Array(pagination.totalPages)].map((_, idx) => {
                const pageNum = idx + 1
                // Show first 2, last 2, and current +/- 1
                if (
                  pageNum === 1 ||
                  pageNum === pagination.totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 rounded-lg transition ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                } else if (
                  pageNum === currentPage - 2 ||
                  pageNum === currentPage + 2
                ) {
                  return <span key={pageNum} className="px-2">...</span>
                }
                return null
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>

            <span className="ml-4 text-sm text-gray-600">
              Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total)
            </span>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default ManageTasks
