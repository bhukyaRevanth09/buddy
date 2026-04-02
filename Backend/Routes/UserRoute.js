import express from "express";
import { userLoginOtp,userReg,userLoginPassword,userProfile } from "../Controllers/auth.js";
import { changePassword } from "../Controllers/auth.js";
import authMiddleware from "../middleware/authMiddleware.js";


const userRouter = express.Router();
// register
userRouter.post("/user-register", userReg);

//  Login
userRouter.post("/user-login-otp", userLoginOtp);   // OTP login
userRouter.post("/user-login", userLoginPassword);          // Password login

//  Profile
userRouter.get("/user-profile", authMiddleware, userProfile);

//  Change Password
userRouter.post("/change-password", authMiddleware, changePassword);

export default userRouter;