import User from "../models/user.modals.js";
import createEvent from "./LoggerHelper.js";

/**
 * Check user attendance - run daily to detect absent users
 * If a user hasn't logged in for 24+ hours since last login, mark as absent
 * Notify both admin and the user about the absence
 */
export async function checkUserAttendance(io) {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayDayName = dayNames[today.getDay()];

    // Find all users (excluding admins) who haven't logged in today
    const users = await User.find({ role: "user" });

    // Get all admins for notifications
    const admins = await User.find({ role: "admin" }).select("_id");
    const adminIds = admins.map((a) => String(a._id));

    for (const user of users) {
      const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null;
      const lastLoginDay = lastLogin
        ? new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate())
        : null;

      // Skip new users who have never logged in (don't mark as absent)
      if (!lastLogin) {
        console.log(`ℹ️ Skipping new user ${user.name} (${user.email}) - No login history yet`);
        continue;
      }

      // Calculate hours since last login
      const hoursSinceLastLogin = (now - lastLogin) / (1000 * 60 * 60);

      // Check if user has already been marked for today
      const hasRecordToday = user.attendanceRecords.some(record => {
        const recordDate = new Date(record.date);
        const recordDay = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());
        return recordDay.getTime() === today.getTime();
      });

      // If no record for today, check attendance based on last login time
      if (!hasRecordToday) {
        // If user logged in within last 24 hours, mark present
        if (hoursSinceLastLogin <= 24) {
          user.attendanceRecords.push({
            date: today,
            day: todayDayName,
            status: "present"
          });
          
          await user.save();

          console.log(`✅ Marked user ${user.name} (${user.email}) as present for ${todayDayName} - Last login: ${hoursSinceLastLogin.toFixed(2)} hours ago`);
        } 
        // If user hasn't logged in for more than 24 hours, mark absent
        else if (hoursSinceLastLogin > 24) {
          // Mark today as absent
          user.attendanceRecords.push({
            date: today,
            day: todayDayName,
            status: "absent"
          });
          user.absentDays += 1;
          
          await user.save();

          // Create notification log for admin
          if (adminIds.length > 0) {
            const adminLog = await createEvent({
              type: "user_absent",
              actor: String(user._id),
              targets: adminIds,
              task: null,
              meta: {
                userName: user.name,
                userEmail: user.email,
                absentDate: today.toISOString(),
                absentDay: todayDayName,
                totalAbsentDays: user.absentDays,
                streakBroken: true
              },
              io,
            });
          }

          // Create notification log for the user
          const userLog = await createEvent({
            type: "user_absent",
            actor: null,
            targets: [String(user._id)],
            task: null,
            meta: {
              userName: user.name,
              absentDate: today.toISOString(),
              absentDay: todayDayName,
              totalAbsentDays: user.absentDays,
              message: "You were marked absent today. Please log in to maintain your streak!"
            },
            io,
          });

          // Emit real-time update to all connected clients
          if (io) {
            // Notify admins about the absence
            adminIds.forEach(adminId => {
              io.to(`user:${adminId}`).emit("user:attendance-update", {
                userId: String(user._id),
                userName: user.name,
                status: "absent",
                date: today,
                day: todayDayName,
                absentDays: user.absentDays
              });
            });

            // Notify the user about their absence
            io.to(`user:${String(user._id)}`).emit("user:attendance-update", {
              userId: String(user._id),
              status: "absent",
              date: today,
              day: todayDayName,
              absentDays: user.absentDays,
              message: "You were marked absent. Please log in regularly!"
            });
          }

          console.log(`✅ Marked user ${user.name} (${user.email}) as absent for ${todayDayName}`);
        }
      }
    }

    console.log(`📊 Attendance check completed at ${now.toISOString()}`);
  } catch (err) {
    console.error("❌ checkUserAttendance error:", err);
  }
}

export default checkUserAttendance;
