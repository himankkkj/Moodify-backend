import { Router } from "express";
import * as authController from  '../controllers/auth.controller.js';
const authRouter = Router();

/**
 * @POST /api/auth/register
 * description: Register a new user
 */
authRouter.post('/register', authController.registerUser)

/**
 * @POST /api/auth/login
 * description: Login a user and create a new session
 */
authRouter.post('/login', authController.loginUser)


/**
 * @GET /api/auth/get-me
 * description: Get the current logged in user
 */
authRouter.get('/get-me', authController.getMe)

/**
 * @POST /api/auth/refresh-token
 * description: Refresh the access token using the refresh token
 */
authRouter.post('/refresh-token', authController.refreshToken)


/**
 * @POST /api/auth/logout
 * description: Logout the user and clear the refresh token cookie
 */
authRouter.post('/logout', authController.logout)

/**
 * @POST /api/auth/logout-all
 * description: Logout the user from all sessions and clear the refresh token cookie
 */
authRouter.post('/logout-all', authController.logoutAllSessions)

/**
 * @POST /api/auth/verify-email
 * description: Verify the email address of the user
 */
authRouter.post('/verify-email', authController.verifyEmail)

/**
 * @POST /api/auth/resend-otp
 * description: Resend the OTP to the user's email address
 */
authRouter.post('/resend-otp', authController.resendOtp)

export default authRouter;