import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
    name: { type: String, required: true },

    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    password: { type: String, required: true },

    profilePicUrl: {
        type: String,
        default:
            "https://www.shutterstock.com/image-vector/user-profile-icon-vector-avatar-600nw-2558760599.jpg",
    },

    role: { type: String, enum: ["admin", "user"], default: "user" },
    
    // Attendance tracking
    lastLoginDate: { type: Date, default: null },
    absentDays: { type: Number, default: 0 },
    attendanceRecords: [{
        date: { type: Date, required: true },
        day: { type: String, required: true }, // e.g., "Monday", "Tuesday"
        status: { type: String, enum: ["present", "absent"], required: true }
    }],
}, { timestamps: true });

// Index for performance
userSchema.index({ lastLoginDate: 1 });
userSchema.index({ role: 1 });

export default mongoose.model("User", userSchema);