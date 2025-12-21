import Task from "../models/task.modal.js";
import excelJs from "exceljs"
import User from "../models/user.modals.js"

export const exportTaskReport = async (req, res, next) => {
  try {
    const tasks = await Task.find().populate("assignedTo", "name email")

    const workbook = new excelJs.Workbook()
    const worksheet = workbook.addWorksheet("Tasks Report")

    worksheet.columns = [
      { header: "Task Id", key: "_id", width: 25 },
      { header: "Title", key: "title", width: 30 },
      { header: "Description", key: "description", width: 50 },
      { header: "priority", key: "priority", width: 15 },
      { header: "Status", key: "status", width: 20 },
      { header: "Due Date", key: "dueDate", width: 20 },
      { header: "Assigned To", key: "assignedTo", width: 30 },
    ]

    tasks.forEach((task) => {
      const assignedTo = task.assignedTo
        .map((user) => `${user.name} (${user.email})`)
        .join(", ")

      worksheet.addRow({
        _id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate.toISOString().split("T")[0],
        assignedTo: assignedTo || "Unassigned",
      })
    })

    res.setHeader(
      "Content-Type",
      "attachment/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="tasks_report.xlsx"'
    )

    return workbook.xlsx.write(res).then(() => {
      res.end()
    })
  } catch (error) {
    next(error)
  }
}


export const exportUsersReport = async (req, res, next) => {
  try {
    const users = await User.find().select("name email _id loginStreak absentDays attendanceRecords lastLoginDate").lean()

    const userTasks = await Task.find().populate("assignedTo", "name email _id")

    const userTaskMap = {}

    users.forEach((user) => {
      const presentDays = user.attendanceRecords?.filter(r => r.status === "present").length || 0;
      const totalAttendanceDays = user.attendanceRecords?.length || 0;
      const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate).toLocaleString() : "Never";
      
      userTaskMap[user._id] = {
        name: user.name,
        email: user.email,
        taskCount: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
        loginStreak: user.loginStreak || 0,
        presentDays: presentDays,
        absentDays: user.absentDays || 0,
        totalAttendanceDays: totalAttendanceDays,
        lastLogin: lastLogin,
      }
    })

    userTasks.forEach((task) => {
      if (task.assignedTo) {
        task.assignedTo.forEach((assignedUser) => {
          if (userTaskMap[assignedUser._id]) {
            userTaskMap[assignedUser._id].taskCount += 1

            if (task.status === "pending") {
              userTaskMap[assignedUser._id].pendingTasks += 1
            } else if (task.status === "in-progress") {
              userTaskMap[assignedUser._id].inProgressTasks += 1
            } else if (task.status === "completed") {
              userTaskMap[assignedUser._id].completedTasks += 1
            }
          }
        })
      }
    })

    const workbook = new excelJs.Workbook()

    const worksheet = workbook.addWorksheet("User Task Report")

    worksheet.columns = [
      { header: "User Name", key: "name", width: 30 },
      { header: "Email", key: "email", width: 40 },
      { header: "Total Assigned Tasks", key: "taskCount", width: 20 },
      { header: "pending Tasks", key: "pendingTasks", width: 20 },
      { header: "In Progress Tasks", key: "inProgressTasks", width: 20 },
      { header: "Completed Tasks", key: "completedTasks", width: 20 },
      { header: "Login Streak (Days)", key: "loginStreak", width: 20 },
      { header: "Present Days", key: "presentDays", width: 20 },
      { header: "Absent Days", key: "absentDays", width: 20 },
      { header: "Total Attendance Days", key: "totalAttendanceDays", width: 20 },
      { header: "Last Login", key: "lastLogin", width: 30 },
    ]

    Object.values(userTaskMap).forEach((user) => {
      worksheet.addRow(user)
    })

    // Create a second sheet for detailed attendance records
    const attendanceSheet = workbook.addWorksheet("Attendance Records")
    
    attendanceSheet.columns = [
      { header: "User Name", key: "userName", width: 30 },
      { header: "Email", key: "userEmail", width: 40 },
      { header: "Date", key: "date", width: 20 },
      { header: "Day", key: "day", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ]

    // Add all attendance records
    users.forEach((user) => {
      if (user.attendanceRecords && user.attendanceRecords.length > 0) {
        user.attendanceRecords.forEach((record) => {
          attendanceSheet.addRow({
            userName: user.name,
            userEmail: user.email,
            date: new Date(record.date).toLocaleDateString(),
            day: record.day,
            status: record.status.charAt(0).toUpperCase() + record.status.slice(1),
          })
        })
      }
    })

    res.setHeader(
      "Content-Type",
      "attachment/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="users_report.xlsx"'
    )

    return workbook.xlsx.write(res).then(() => {
      res.end()
    })
  } catch (error) {
    next(error)
  }
}