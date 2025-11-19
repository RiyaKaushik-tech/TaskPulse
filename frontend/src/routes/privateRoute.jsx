import React from 'react'
import { Outlet } from "react-router-dom"

const PrivateRoute = ({ allowedRoles }) => {
  void allowedRoles;
  return (
    <Outlet />
  )
}

export default PrivateRoute
