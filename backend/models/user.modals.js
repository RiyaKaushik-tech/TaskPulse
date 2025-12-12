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
}, { timestamps: true });

export default mongoose.model("User", userSchema);