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
    const users = await User.find().select("name email _id absentDays attendanceRecords lastLoginDate").lean()

    const userTasks = await Task.find().populate("assignedTo", "name email _id")

    const userTaskMap = {}

    users.forEach((user) => {
      const presentDays = user.attendanceRecords?.filter(r => r.status === "present").length || 0;
      const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate).toLocaleString() : "Never";
      
      userTaskMap[user._id] = {
        name: user.name,
        email: user.email,
        taskCount: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
        presentDays: presentDays,
        absentDays: user.absentDays || 0,
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

    // Main Summary Sheet
    const worksheet = workbook.addWorksheet("User Summary")

    worksheet.columns = [
      { header: "User Name", key: "name", width: 30 },
      { header: "Email", key: "email", width: 40 },
      { header: "Total Tasks", key: "taskCount", width: 15 },
      { header: "Pending", key: "pendingTasks", width: 15 },
      { header: "In Progress", key: "inProgressTasks", width: 15 },
      { header: "Completed", key: "completedTasks", width: 15 },
      { header: "Present Days", key: "presentDays", width: 15 },
      { header: "Absent Days", key: "absentDays", width: 15 },
      { header: "Last Login", key: "lastLogin", width: 30 },
    ]

    // Style header row
    worksheet.getRow(1).font = { bold: true, size: 11 }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    Object.values(userTaskMap).forEach((user) => {
      worksheet.addRow(user)
    })

    // Create Present Records Sheet
    const presentSheet = workbook.addWorksheet("Present Records")
    
    presentSheet.columns = [
      { header: "User Name", key: "userName", width: 30 },
      { header: "Email", key: "userEmail", width: 40 },
      { header: "Date", key: "date", width: 20 },
      { header: "Day", key: "day", width: 15 },
    ]

    // Style header
    presentSheet.getRow(1).font = { bold: true, size: 11 }
    presentSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF90EE90' }
    }

    // Add present records
    users.forEach((user) => {
      if (user.attendanceRecords && user.attendanceRecords.length > 0) {
        user.attendanceRecords
          .filter(record => record.status === "present")
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .forEach((record) => {
            presentSheet.addRow({
              userName: user.name,
              userEmail: user.email,
              date: new Date(record.date).toLocaleDateString(),
              day: record.day,
            })
          })
      }
    })

    // Create Absent Records Sheet
    const absentSheet = workbook.addWorksheet("Absent Records")
    
    absentSheet.columns = [
      { header: "User Name", key: "userName", width: 30 },
      { header: "Email", key: "userEmail", width: 40 },
      { header: "Date", key: "date", width: 20 },
      { header: "Day", key: "day", width: 15 },
    ]

    // Style header
    absentSheet.getRow(1).font = { bold: true, size: 11 }
    absentSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF6B6B' }
    }

    // Add absent records
    users.forEach((user) => {
      if (user.attendanceRecords && user.attendanceRecords.length > 0) {
        user.attendanceRecords
          .filter(record => record.status === "absent")
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .forEach((record) => {
            absentSheet.addRow({
              userName: user.name,
              userEmail: user.email,
              date: new Date(record.date).toLocaleDateString(),
              day: record.day,
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