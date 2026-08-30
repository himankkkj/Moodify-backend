import dotenv from 'dotenv';

dotenv.config();

if (!process.env.MONGO_URI || !process.env.JWT_SECRET || !process.env.EMAIL_FROM || !process.env.EMAIL_FROM_NAME || !process.env.BREVO_API_KEY) {
    throw new Error("Missing required environment variables (MONGO_URI, JWT_SECRET, EMAIL_FROM, EMAIL_FROM_NAME, BREVO_API_KEY)");
}

const config = {
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
    BREVO_API_KEY: process.env.BREVO_API_KEY,
};

export default config;