import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: [true, 'Username is required'],
        trim: true,
    },
    email: {
        type: String,
        unique: true,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
    },
    verified: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

const userModel = mongoose.model('User', userSchema);
export default userModel;