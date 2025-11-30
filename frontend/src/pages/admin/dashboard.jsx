import React, { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import DashboardLayout from "../../components/DashboardLayout"
import axiosInstance from "../../utils/axiosInstance"
import moment from "moment"
import { useNavigate } from "react-router-dom"
import RecentTasks from "../../components/RecentTask"
import CustomPieChart from "../../components/CustomPieChart"
import CustomBarChart from "../../components/CustomBarGraph"

const COLORS = ["#FF6384", "#36A2EB", "#FFCE56"]

const Dashboard = () => {
  const navigate = useNavigate()

  const { currentUser } = useSelector((state) => state.user)

  // make this null so conditional rendering is correct
  const [dashboardData, setDashboardData] = useState(null)
  const [pieChartData, setPieChartData] = useState([])
  const [barChartData, setBarChartData] = useState([])

  // normalize charts and return an object with safe keys
  const prepareChartData = (charts = {}) => {
    const dist = charts.taskDistribution || {}
    const priorityLevels = charts.taskPriorityLevel || {}

    const all = Number(dist.All ?? dist.all ?? dist.total ?? 0)
    const pending = Number(dist.pending ?? dist.Pending ?? 0)
    const inProgress = Number(
      dist["in-progress"] ?? dist.inProgress ?? dist.InProgress ?? dist["In Progress"] ?? 0
    )
    const completed = Number(dist.completed ?? dist.Completed ?? 0)

    setPieChartData([
      { status: "pending", count: pending },
      { status: "In Progress", count: inProgress },
      { status: "Completed", count: completed },
    ])

    const priorityLevelData = ["low", "medium", "high"].map((p) => ({
      priority: p,
      count: Number(priorityLevels[p] ?? priorityLevels[p.toLowerCase()] ?? 0),
    }))
    setBarChartData(priorityLevelData)

    // return normalized charts shape for UI cards
    return {
      taskDistribution: { All: all, pending, inProgress, completed },
      taskPriorityLevel: priorityLevels,
    }
  }

  const getDashboardData = async () => {
    try {
      const response = await axiosInstance.get("/tasks/dashboard-data")
      const raw = response?.data ?? {}

      // backend may wrap charts directly or return top-level charts; normalize both cases
      const charts = raw.charts ?? raw
      const recentTasks = raw.recentTasks || raw.recentTasks || raw.recent || []

      const normalized = prepareChartData(charts)

      setDashboardData({
        charts: normalized,
        recentTasks,
      })
    } catch (error) {
      console.log("Error fetching dashboard data: ", error)
    }
  }
  useEffect(() => {
    getDashboardData()

    return () => {}
  }, [])

  return (
    <DashboardLayout activeMenu={"Dashboard"}>
      <div className="p-6 space-y-6">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 shadow-lg text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">
                Welcome! {currentUser?.name}
              </h2>

              <p className="text-blue-100 mt-1">
                {moment().format("dddd Do MMMM YYYY")}
              </p>
            </div>

            <div className="mt-4 md:mt-0">
              <button
                className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-md"
                onClick={() => navigate("/admin/create-tasks")}
              >
                Create New Task
              </button>
            </div>
          </div>
        </div>

        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
              <h3 className="text-gray-500 text-sm font-medium">Total Tasks</h3>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {dashboardData?.charts?.taskDistribution?.All ?? 0}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
              <h3 className="text-gray-500 text-sm font-medium">Pending Tasks</h3>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {dashboardData?.charts?.taskDistribution?.pending ?? 0}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
              <h3 className="text-gray-500 text-sm font-medium">In Progress Tasks</h3>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {dashboardData?.charts?.taskDistribution?.inProgress ?? 0}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500">
              <h3 className="text-gray-500 text-sm font-medium">Completed Tasks</h3>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {dashboardData?.charts?.taskDistribution?.completed ?? 0}
              </p>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Task Distribution
            </h3>

            <div className="h-64">
              <CustomPieChart
                data={pieChartData}
                label="Total Balance"
                colors={COLORS}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Task priority Levels
            </h3>

            <div className="h-64">
              <CustomBarChart data={barChartData} />
            </div>
          </div>
        </div>

        {/* Recent Task Section */}
        <RecentTasks tasks={dashboardData?.recentTasks || []} />
      </div>
    </DashboardLayout>
  )
}

export default Dashboard