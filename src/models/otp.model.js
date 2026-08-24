import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
    },
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required'],
    },
    otphash: {
        type: String,
        required: [true, 'OTP hash is required'],
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300, // OTP expires after 5 minutes
    },
});

const otpModel = mongoose.model('OTP', otpSchema);
export default otpModel;