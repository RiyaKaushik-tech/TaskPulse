import React, { useEffect, useState } from "react"
import axiosInstance from "../utils/axiosInstance"
import { useDispatch, useSelector } from "react-redux"
import { signOutSuccess } from "../redux/slice/userSlice"
import { useNavigate } from "react-router-dom"
import { SIDE_MENU_DATA, USER_SIDE_MENU_DATA } from "../utils/data"
import toast from "react-hot-toast"
import { FaHandSparkles } from "react-icons/fa"

const SideMenu = ({ activeMenu }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [SideMenuData, setSideMenuData] = useState([])
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const { currentUser } = useSelector((state) => state.user)

  const handleClick = (route) => {
    // console.log(route)

    if (route === "logout") {
      setShowLogoutModal(true)
      return
    }

    navigate(route)
  }

  const handleLogout = async () => {
    const logoutToast = toast.loading("🔐 Signing out...")
    try {
      const response = await axiosInstance.post("/auth/sign-out")

      if (response.data) {
        dispatch(signOutSuccess())
        toast.success("Logged out successfully!", { id: logoutToast })
        // console.log("logout : ",response.data)
        setTimeout(() => navigate("/login"), 1000)
      }
    } catch (error) {
      console.log(error)
      toast.error(" Error logging out. Please try again!", { id: logoutToast })
    }
  }

  const confirmLogout = () => {
    setShowLogoutModal(false)
    handleLogout()
  }

  const cancelLogout = () => {
    setShowLogoutModal(false)
    toast.success(" Logout cancelled", { duration: 1500 })
  }

  useEffect(() => {
    if (currentUser) {
      setSideMenuData(
        currentUser?.role === "admin" ? SIDE_MENU_DATA : USER_SIDE_MENU_DATA
      )
    }

    return () => {}
  }, [currentUser])

  return (
    <div className="w-64 p-6 h-full flex flex-col lg:border-r lg:border-gray-200">
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden mb-4 border-2 border-blue-200">
          <img
            src={currentUser?.profilePicUrl || "/defaultProfile.png"}
            alt="Profile Image"
            className="w-full h-full object-cover"
          />
        </div>

        {currentUser?.role === "admin" && (
          <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2">
            Admin
          </div>
        )}

        <h5 className="text-lg font-semibold text-gray-800">
          {currentUser?.name || ""}
        </h5>

        <p className="text-sm text-gray-500">{currentUser?.email || ""}</p>
      </div>

      <div className="flex-1 overscroll-y-auto">
        {SideMenuData.map((item, index) => (
          <button
            key={`menu_${index}`}
            className={`w-full flex items-center gap-4 text-[15px] ${
              activeMenu === item.label
                ? "text-blue-500 bg-linear-to-r from-blue-50/40 to-blue-100/50"
                : ""
            } py-3 px-6 mb-3 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors`}
            onClick={() => handleClick(item.path)}
          >
            <item.icon className="text-2xl" />
            {item.label}
          </button>
        ))}
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm shadow-2xl transform transition-all">
            <div className="text-center">
              <span className="text-5xl mb-4 block">👋</span>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Sign Out?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to sign out from your account? You'll need to log back in to continue.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelLogout}
                className="flex-1 px-4 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-all transform hover:scale-105 font-semibold"
              >
                 Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all transform hover:scale-105 font-semibold"
              >
               Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SideMenu
