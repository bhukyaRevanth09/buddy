import { passwordHashing } from "../services/passwordService.js"
import redis from "../Config/redis.js"
import userModel from "../models/UserSchema.js"
import buddyModel from '../models/BuddySchema.js'
import{refreshTokenSetter,TokenSetter} from '../utils/tokenService.js'
import jwt from "jsonwebtoken";
import OTP from "../models/OTP.js"
import bcrypt from "bcryptjs"


export const userReg = async (req, res, next) => {
  console.log(req.body);
  try {
    const {
      name,
      email,
      password,
      phone,
      role = "user",
      isActive = true,
      walletBalance = 0,
      address,
      geoLocation, // expects { latitude, longitude } from frontend
    } = req.body;

    // 1️⃣ Validate required fields
    if (!name || !email || !password || !phone) {
      return next({ statusCode: 400, message: "Required fields missing" });
    }

    // 2️⃣ Check if user exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return next({ statusCode: 409, message: "User already exists" });
    }

    // 3️⃣ Hash password
    const hashedPassword = await passwordHashing(password);

    // 4️⃣ Prepare geoLocation for MongoDB
    let geoPoint = null;
    if (geoLocation?.latitude && geoLocation?.longitude) {
      geoPoint = {
        type: "Point",
        coordinates: [
          parseFloat(geoLocation.longitude), // longitude first
          parseFloat(geoLocation.latitude),  // latitude second
        ],
      };
    } else {
      // default fallback
      geoPoint = {
        type: "Point",
        coordinates: [0, 0],
      };
    }

    // 5️⃣ Create user
    const newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      isActive,
      walletBalance,
      address,
      geoLocation: geoPoint, // correct GeoJSON
    });

    if (!newUser) {
      return next({ statusCode: 500, message: "Failed to save user" });
    }

    // 6️⃣ Generate tokens
    const id = newUser._id;
    const accessToken = TokenSetter({ id, role });
    const refreshTokenValue = refreshTokenSetter({ id, role });

    // 7️⃣ Send response
    return res.status(201).json({
      success: true,
      accessToken,
     refreshToken: refreshTokenValue,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("User registration error:", error);
    return next({
      statusCode: 500,
      message: "Internal server error during registration",
    });
  }
};
export const userLoginPassword = async (req, res, next) => {
  

  try {
    const { email, password } = req.body;

    // 1. Validation
    if (!email || !password) {
      return next({ statusCode: 400, message: "Email and password are required" });
    }

    // 2. Find User + Select Password
    // Note: Use .select("+password") if your Schema has 'select: false'
    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
      return next({ statusCode: 404, message: "User not found" });
    }

    // 3. 🔹 CRITICAL MISSING STEP: Compare Passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next({ statusCode: 401, message: "Invalid credentials" });
    }

    // 4. Generate tokens
    const accessToken = TokenSetter({ id: user._id, role: user.role });
    const refreshToken = refreshTokenSetter({ id: user._id, role: user.role });

    // 5. Response (Don't send the password back!)
    const userResponse = user.toObject();
    delete userResponse.password;
      console.log("tokkkkkkkkken:",accessToken,refreshToken)
    res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken,
      user: userResponse, // Industry standard: Send user info back
      role: user.role
    });

  } catch (error) {
    console.error("User Login Error:", error);
    next({ statusCode: 500, message: "Login error" });
  }
};
export const userLoginOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    // 🔹 1. Validate input
    if (!phone || !otp) {
      return next({
        statusCode: 400,
        message: "Phone and OTP are required"
      });
    }

    // 🔹 2. Get latest OTP
    const record = await OTP.findOne({ contact: phone })
      .sort({ createdAt: -1 });

    if (!record) {
      return next({
        statusCode: 400,
        message: "OTP not found, please request again"
      });
    }

    // 🔹 3. Check expiry
    if (record.expiresAt < new Date()) {
      return next({
        statusCode: 400,
        message: "OTP expired"
      });
    }

  

     if(record.otp != otp){
    return next({
        statusCode: 400,
        message: "Invalid OTP"
      });
    }


    // 🔹 5. Find user
    const user = await userModel.findOne({ phone });

    if (!user) {
      return next({
        statusCode: 404,
        message: "User not found, please register"
      });
    }

    //  6. Generate tokens
    const accessToken = TokenSetter({
      id: user._id,
      role: user.role
    });

    const RefreshTkn = refreshTokenSetter({
      id: user._id,
      role: user.role
    });

    //  7. Delete OTP (prevent reuse)
    await OTP.deleteOne({ _id: record._id });

    //  8. Response
    res.status(200).json({
      success: true,
      message: "User login successful",
      accessToken,
      RefreshToken,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (error) {
    console.error(error);
    next({
      statusCode: 500,
      message: "OTP login error"
    });
  }
};

export const userProfile = async (req, res) => {
  try {
    // 1. Log for debugging (Remove in production)
    console.log(`[Profile Fetch]: User ID ${req.userId} accessed their profile.`);

    // 2. req.user is already populated by authMiddleware
    // It is already filtered to remove the password via .select("-password")
    if (!req.user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    // 3. Return the data
    return res.status(200).json({
      success: true,
      user: req.user,
    });
    
  } catch (error) {
    console.error(`[Profile Controller Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while fetching the profile.",
    });
  }
};


export const updateProfile = async (req, res) => {
  console.log("update userprofile !")
  try {
    const { name, phone, address } = req.body;
    const userId = req.userId; // Provided by authMiddleware

    // 1. Validation (Optional but recommended)
    if (phone && phone.length < 10) {
      return res.status(400).json({ success: false, message: "Invalid phone number." });
    }

    // 2. Find and Update
    // We use { new: true } to return the updated document
    // We use .select("-password") to ensure we don't send back sensitive data
    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { 
        $set: { 
          name, 
          phone, 
          address 
        } 
      },
      { new: true, runValidators: true }
    ).select("-password").lean();

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error(`[Update Profile Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile.",
    });
  }
};






export const getAccessTokenFromRefresh = async (req, res) => {

  try {

    const { refreshToken } = req.body;

    // check refresh token exists
    if (!refreshToken) {

      return res.status(401).json({

        message: "Refresh token required"

      });

    }

    // verify refresh token
    const decoded = jwt.verify(

      refreshToken,

      process.env.REFRESH_KEY

    );

    // create new access token
    const newAccessToken = TokenSetter({

      id: decoded.id,

      role: decoded.role

    });

    return res.status(200).json({

      accessToken: newAccessToken

    });

  } catch (error) {

    return res.status(403).json({

      message: "Refresh token expired, login again"

    });

  }

};
export const changePassword = async (req, res, next) => {
  console.log("revanth!!")
  try {
    // 🔹 FIX: Use req.user (matched to your updated middleware)
    const { id, role } = req.user; 
    const { oldPassword, newPassword } = req.body;

    // 1. Validate input
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old and new password are required"
      });
    }

    // 2. Select model based on role
    let Model = role === "user" ? userModel : role === "buddy" ? buddyModel : null;

    if (!Model) {
      return res.status(403).json({
        success: false,
        message: "Invalid role access"
      });
    }

    // 3. Find account
    const account = await Model.findById(id).select("+password"); // Ensure password field is selected

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found"
      });
    }

    // 4. Verify old password
    const isMatch = await bcrypt.compare(oldPassword, account.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect"
      });
    }

    // 5. Optional: Check if new password is same as old
    const isSame = await bcrypt.compare(newPassword, account.password);
    if (isSame) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as the old one"
      });
    }

    // 6. Hash and Update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    account.password = hashedPassword;
    await account.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (error) {
    console.error("Change Password Error:", error);
    next(error); // Passing to your global error handler
  }
};


export const resetPasswordOtp = async (req, res, next) => {

  try {
    const { email, otp, newPassword, role } = req.body;

    // 1. Validation
    if (!email || !otp || !newPassword || !role) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // 2. Identify Model
    const Model = role === "user" ? userModel : buddyModel;

    // 3. Find OTP in REDIS (Not MongoDB)
    const key = `otp:${email}`;
    const storedOtp = await redis.get(key);

    // 4. Verify Existence and Match
    if (!storedOtp) {
      return res.status(400).json({ success: false, message: "OTP expired or not found" });
    }

    if (String(storedOtp) !== String(otp)) {
      return res.status(400).json({ success: false, message: "Invalid OTP code" });
    }

    // 5. Find the User Account
    const account = await Model.findOne({ email: email.toLowerCase() });
    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    // 6. Hash New Password & Save
    const salt = await bcrypt.genSalt(10);
    account.password = await bcrypt.hash(newPassword, salt);
    await account.save();

    // 7. Cleanup: Delete used OTP from Redis
    await redis.del(key);

    res.status(200).json({ 
      success: true, 
      message: "Password updated successfully." 
    });

  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};









export const buddyReg = async (req, res, next) => {
  try {
    const { email, phone, password, geoLocation } = req.body;

    // 1. Check for existing Buddy
    const existingBuddy = await buddyModel.findOne({ $or: [{ email }, { phone }] });
    if (existingBuddy) {
      return res.status(409).json({ success: false, message: "Email or Phone already registered" });
    }

    // 2. Hash Password
    const hashedPassword = await passwordHashing(password);

    // 3. Create Buddy
    // Using a separate object ensures no unwanted data enters the DB
    const newBuddyData = {
      ...req.body,
      password: hashedPassword,
      skills: Array.isArray(req.body.skills) ? req.body.skills : [],
      interests: Array.isArray(req.body.interests) ? req.body.interests : [],
      accountStatus: "active",
      availabilityStatus: "available",
      isOnline: true,
      // Ensure this matches the GeoJSON structure
      geoLocation: {
        type: "Point",
        coordinates: geoLocation.coordinates 
      }
    };

    const buddy = await buddyModel.create(newBuddyData);

    // 4. Generate Tokens
    const accessToken = TokenSetter({ id: buddy._id, role: "buddy" });
    const refreshToken = refreshTokenSetter({ id: buddy._id, role: "buddy" });

    res.status(201).json({
      success: true,
      message: "Buddy registered successfully",
      accessToken,
      refreshToken,
      buddy: {
        id: buddy._id,
        name: buddy.name,
        email: buddy.email,
        role: "buddy"
      }
    });

     console.log(accessToken,refreshToken,buddy)

  } catch (error) {
    console.error("Buddy Reg Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
export const buddyLoginOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    // 🔹 1. Validate input
    if (!phone || !otp) {
      return next({
        statusCode: 400,
        message: "Phone and OTP are required"
      });
    }

    // 🔹 2. Get latest OTP
    const record = await OTP.findOne({ contact: phone })
      .sort({ createdAt: -1 });

    if (!record) {
      return next({
        statusCode: 400,
        message: "OTP not found, please request again"
      });
    }

    // 🔹 3. Check expiry
    if (record.expiresAt < new Date()) {
      return next({
        statusCode: 400,
        message: "OTP expired"
      });
    }

   

    if(record.otp != otp){
    return next({
        statusCode: 400,
        message: "Invalid OTP"
      });
    }

 

    // 🔹 5. Find buddy
    const buddy = await buddyModel.findOne({ phone });

    if (!buddy) {
      return next({
        statusCode: 404,
        message: "Buddy not found, please register"
      });
    }

    // 🔹 6. Generate tokens
    const token = TokenSetter({
      id: buddy._id,
      role: buddy.role
    });

    const RefreshTkn = refreshTokenSetter({
      id: buddy._id,
      role: buddy.role
    });

    // 🔹 7. Delete OTP (prevent reuse)
    await OTP.deleteOne({ _id: record._id });

    // 🔹 8. Response
    res.status(200).json({
      success: true,
      message: "Buddy login successful",
      token,
      RefreshTkn,
      buddy: {
        id: buddy._id,
        name: buddy.name,
        phone: buddy.phone,
        role: buddy.role
      }
    });

  } catch (error) {
    console.error(error);
    next({
      statusCode: 500,
      message: "OTP login error"
    });
  }
};


export const buddyLoginPassword = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // 1. Validation check
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // 2. Find buddy and include password
    const buddy = await buddyModel.findOne({ email }).select("+password");

    if (!buddy) {
      return res.status(404).json({ success: false, message: "Buddy not found" });
    }

    // 3. Validate Password
    const isMatch = await bcrypt.compare(password, buddy.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // 4. Generate Tokens
    // ⚠️ IMPORTANT: Ensure these functions return a string (JWT)
    const accessToken = TokenSetter({ id: buddy._id, role: "buddy" });
    const refreshToken = refreshTokenSetter({ id: buddy._id, role: "buddy" });

    // 5. Update Online Status
    buddy.isOnline = true;
    await buddy.save();

    // 6. Final Response
    // This structure allows 'const { accessToken, buddy } = res.data' to work on frontend
    return res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,    // Top level
      refreshToken,   // Top level
      buddy: {        // Profile object
        id: buddy._id,
        name: buddy.name,
        email: buddy.email,
        role: buddy.role || "buddy",
        isOnline: buddy.isOnline,
        category: buddy.category
      }
    });

  } catch (error) {
    console.error("Buddy Login Error:", error);
    res.status(500).json({ success: false, message: "Login server error" });
  }
};