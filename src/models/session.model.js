import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
    },
    ip:{
        type: String,
        required: [true, 'IP address is required'],
    },
    refreshTokenHash: {
        type: String,
        required: [true, 'Refresh token hash is required'],
    },
    userAgent: {
        type: String,
        required: [true, 'User agent is required'],
    },
    revoke:{
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

const sessionModel = mongoose.model('Session', sessionSchema);
export default sessionModel;