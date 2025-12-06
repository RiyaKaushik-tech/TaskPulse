import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { MdClose, MdMenu } from "react-icons/md";
import SideMenu from "./SideMenu";
import UserNotificationBell from "./userNotifications";
import AdminNotificationBell from "./adminNotification";

const Navbar = ({ activeMenu }) => {
  const [openSideMenu, setOpenSideMenu] = useState(false);
  
  // Check entire Redux state to find where user is stored
  const entireState = useSelector((state) => state);
  const user = useSelector((state) => state.user?.currentUser);
  const isAdmin = user?.role === "admin";
  


  return (
    <div className="bg-white shadow-sm sticky top-0 z-10 p-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button
          className="p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors lg:hidden"
          onClick={() => setOpenSideMenu(!openSideMenu)}
        >
          {openSideMenu ? (
            <MdClose className="text-2xl" />
          ) : (
            <MdMenu className="text-2xl" />
          )}
        </button>
      </div>
      
      <div className="flex justify-items-center">
        <img src="/logo.png" alt="logo" className="h-14 w-40 absolute right-12 top-1"/>
      </div>

      <div className="flex items-center gap-4">
        {console.log("Rendering bell - isAdmin:", isAdmin)}
        {isAdmin ? <AdminNotificationBell /> : <UserNotificationBell />}
      </div>

      {openSideMenu && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="relative z-50 w-72 h-full bg-white shadow-xl">
            <button
              className="absolute top-4 right-4 p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors"
              onClick={() => setOpenSideMenu(false)}
            >
              <MdClose className="text-2xl" />
            </button>

            <div className="pt-16">
              <SideMenu activeMenu={activeMenu} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
