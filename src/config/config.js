import dotenv from 'dotenv';

dotenv.config();

if (!process.env.MONGO_URI || !process.env.JWT_SECRET || !process.env.EMAIL_USER || !process.env.EMAIL_APP_PASS) {
    throw new Error("Missing required environment variables (MONGO_URI, JWT_SECRET)");
}

const config = {
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_APP_PASS: process.env.EMAIL_APP_PASS,
};

export default config;