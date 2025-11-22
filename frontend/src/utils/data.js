
import {
  MdAddTask,
  MdDashboardCustomize,
  MdLogout,
  MdManageHistory,
  MdOutlineTaskAlt,
  MdPeopleAlt,
} from "react-icons/md"

export const SIDE_MENU_DATA = [
  {
    id: 1,
    label: "Dashboard",
    icon: MdDashboardCustomize,
    path: "/admin/dashboard",
  },
  {
    id: 2,
    label: "Manage Task",
    icon: MdManageHistory,
    path: "/admin/manageTasks",
  },
  {
    id: 3,
    label: "Create Task",
    icon: MdAddTask,
    path: "/admin/createTasks",
  },
  {
    id: 4,
    label: "Team Members",
    icon: MdPeopleAlt,
    path: "/admin/manageUsers",
  },
  {
    id: 5,
    label: "Logout",
    icon: MdLogout,
    path: "logout",
  },
]

export const USER_SIDE_MENU_DATA = [
  {
    id: 1,
    label: "Dashboard",
    icon: MdDashboardCustomize,
    path: "/users/userDashboard",
  },
  {
    id: 2,
    label: "My Tasks",
    icon: MdOutlineTaskAlt,
    path: "/users/myTasks",
  },
  {
    id: 3,
    label: "Logout",
    icon: MdLogout,
    path: "logout",
  },
]

export const priority_DATA = [
  { label: "low", value: "low" },
  { label: "medium", value: "medium" },
  { label: "high", value: "high" },
]

export const STATUS_DATA = [
  { label: "pending", value: "pending" },
  { label: "In Progress", value: "In Progress" },
  { label: "Completed", value: "Completed" },
]
