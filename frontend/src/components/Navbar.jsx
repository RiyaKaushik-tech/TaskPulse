import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { MdClose, MdMenu } from "react-icons/md";
import SideMenu from "./SideMenu";
import UserNotificationBell from "./userNotifications";
import AdminNotificationBell from "./adminNotification";
import ThemeToggle from "./ThemeToggle";

const Navbar = ({ activeMenu }) => {
  const [openSideMenu, setOpenSideMenu] = useState(false);
  
  // Check entire Redux state to find where user is stored
  const entireState = useSelector((state) => state);
  const user = useSelector((state) => state.user?.currentUser);
  const isAdmin = user?.role === "admin";
  


  return (
    <div
      className="shadow-sm sticky top-0 z-10 p-4 flex items-center justify-between"
      style={{
        backgroundColor: "var(--navbar-bg)",
        borderBottom: "1px solid var(--navbar-border)",
      }}
    >
      <div className="flex items-center space-x-4">
        <button
          className="p-2 rounded-md transition-colors lg:hidden"
          style={{
            color: "var(--text-primary)",
            backgroundColor: "var(--bg-tertiary)",
          }}
          onClick={() => setOpenSideMenu(!openSideMenu)}
        >
          {openSideMenu ? (
            <MdClose className="text-2xl" />
          ) : (
            <MdMenu className="text-2xl" />
          )}
        </button>
      </div>
      {/* <div className="flex">
        <img src="/logo.png" alt="logo" className="h-16 w-64 absolute left-4 top-0"/>
      </div> */}

      <div className="flex items-center gap-4">
        {/* {console.log("Rendering bell - isAdmin:", isAdmin)} */}
      <div className="flex absolute right-12 ">
        <ThemeToggle />
      </div>
        {isAdmin ? <AdminNotificationBell /> : <UserNotificationBell />}
      </div>

      {openSideMenu && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="relative z-50 w-72 h-full shadow-xl"
            style={{
              backgroundColor: "var(--sidebar-bg)",
              borderRight: "1px solid var(--border-color)",
            }}
          >
            <button
              className="absolute top-4 right-4 p-2 rounded-md transition-colors"
              style={{
                color: "var(--text-primary)",
                backgroundColor: "var(--bg-tertiary)",
              }}
              onClick={() => setOpenSideMenu(false)}
            >
              <MdClose className="text-2xl" />
            </button>
            <SideMenu activeMenu={activeMenu} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
