import express from "express";
import { userLoginOtp,userReg,userLoginPassword,userProfile, updateProfile } from "../Controllers/auth.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { getSkills} from "../Controllers/user.js";
import { getInterests } from "../Controllers/user.js";
import { getCategories } from "../Controllers/user.js";
import { getNearestBuddies } from "../Controllers/user.js";
const userRouter = express.Router();
// register
userRouter.post("/user-register", userReg);

//  Login
userRouter.post("/user-login-otp", userLoginOtp);   // OTP login
userRouter.post("/user-login", userLoginPassword);          // Password login

//  Profile
userRouter.get("/user-profile",authMiddleware, userProfile);
userRouter.put("/update-userprofile",authMiddleware,updateProfile)

userRouter.get("/categories", getCategories);
userRouter.get("/skills/:categoryId", getSkills);
userRouter.get("/interests", getInterests);

userRouter.get("/nearest-buddy",getNearestBuddies)


export default userRouter;