import { passwordHashing } from "../services/passwordService.js"
import userModel from "../models/UserSchema.js"
import buddyModel from '../models/BuddySchema.js'
import { TokenSetter ,refreshToken} from "../utils/tokenService.js"
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
    const token = TokenSetter({ id, role });
    const refreshTokenValue = refreshToken({ id, role });

    // 7️⃣ Send response
    return res.status(201).json({
      success: true,
      token,
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
  console.log("userLOginPAssowrd:: ",req.body)
  try {
    const { phone, password } = req.body;

    // 🔹 1. Validate input
    if (!phone || !password) {
      return next({
        statusCode: 400,
        message: "Phone and password are required"
      });
    }

    // 🔹 2. Find user
    const user = await userModel.findOne({ phone });

    if (!user) {
      return next({
        statusCode: 404,
        message: "User not found"
      });
    }

      
 

    // 🔹 4. Generate tokens
    const token = TokenSetter({
      id: user._id,
      role: user.role
    });

    const RefreshTkn = refreshToken({
      id: user._id,
      role: user.role
    });

    // 🔹 5. Send response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      RefreshTkn
     
    });

  } catch (error) {
    console.error(error);
    next({
      statusCode: 500,
      message: "Login error"
    });
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
    const token = TokenSetter({
      id: user._id,
      role: user.role
    });

    const RefreshTkn = refreshToken({
      id: user._id,
      role: user.role
    });

    //  7. Delete OTP (prevent reuse)
    await OTP.deleteOne({ _id: record._id });

    //  8. Response
    res.status(200).json({
      success: true,
      message: "User login successful",
      token,
      RefreshTkn,
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

export const userProfile = async (req, res, next) => {
  const { id, role } = req.data;

  // 🔒 Role check
  if (role !== "user") {
    return next({ statusCode: 403, message: "Access denied" });
  }

  try {
    const user = await userModel.findById(id);

    if (!user) {
      return next({
        statusCode: 404,
        message: "User not found"
      });
    }

    // ✅ Only return user data
    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    console.error(error);
    next({
      statusCode: 500,
      message: "Error fetching user profile"
    });
  }
};





 

export const changePassword = async (req, res, next) => {
  try {
    const { id, role } = req.data; // from auth middleware
    const { oldPassword, newPassword } = req.body;

    // 🔹 1. Validate input
    if (!oldPassword || !newPassword) {
      return next({
        statusCode: 400,
        message: "Old and new password are required"
      });
    }

    // 🔹 2. Select model based on role
    let Model;

    if (role === "user") {
      Model = userModel;
    } else if (role === "buddy") {
      Model = buddyModel;
    } else {
      return next({
        statusCode: 403,
        message: "Invalid role"
      });
    }

    // 🔹 3. Find account
    const account = await Model.findById(id);

    if (!account) {
      return next({
        statusCode: 404,
        message: "Account not found"
      });
    }

    // 🔹 4. Verify old password
    const isMatch = await bcrypt.compare(oldPassword, account.password);

    if (!isMatch) {
      return next({
        statusCode: 400,
        message: "Old password is incorrect"
      });
    }

    // 🔹 5. Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 🔹 6. Update password
    account.password = hashedPassword;
    await account.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (error) {
    console.error(error);
    next({
      statusCode: 500,
      message: "Change password error"
    });
  }
};
export const resetPasswordOtp = async (req, res, next) => {
  try {
    const { phone, otp, newPassword, role } = req.body;

    let Model = role === "user" ? userModel : buddyModel;

    const record = await OTP.findOne({ contact: phone });

    if (!record || record.otp !== otp) {
      return next({ statusCode: 400, message: "Invalid OTP" });
    }

    if (record.expiresAt < new Date()) {
      return next({ statusCode: 400, message: "OTP expired" });
    }

    const account = await Model.findOne({ phone });

    if (!account) {
      return next({ statusCode: 404, message: "Account not found" });
    }

    account.password = await bcrypt.hash(newPassword, 10);
    await account.save();

    await OTP.deleteOne({ _id: record._id });

    res.status(200).json({ message: "Password reset successful" });

  } catch (error) {
    next({ statusCode: 500, message: "Reset error" });
  }
};










export const buddyReg = async (req, res, next) => {
  console.log(req?.body)
  const {
    name,
    email,
    password,
    phone,
    role = "buddy",
    gender,
    category,
    skills,
    interests,
    education,
    pricePerHour,
    address,
    geoLocation,
     availabilityStatus,
    rating = 0,
    totalReview = 0,
    totalBooking = 0,
    isOnline = false,
    earning = { total: 0, today: 0, thisMonth: 0 },
    accountStatus 
  } = req?.body;

  try {
    // 🔹 Validate required fields
    if (!name || !email || !skills || !phone) {
      return next({ statusCode: 400, message: "Required data missing!" });
    } else if (!/^\d{10}$/.test(phone)) {
      return next({ statusCode: 400, message: "Invalid phone number!" });
    }

    // 🔹 Check for duplicates
    const emailExists = await buddyModel?.findOne({ email });
    const phoneExists = await buddyModel?.findOne({ phone });

    if (emailExists) {
      return next({ statusCode: 409, message: "Email already exists" });
    }

    if (phoneExists) {
      return next({ statusCode: 409, message: "Phone number is already used" });
    }

    // 🔹 Hash password
    const hashed = await passwordHashing(password);

    // 🔹 Create Buddy
    const settingData = await buddyModel.create({
      name,
      email,
      password: hashed,
      phone,
      role,
      gender,
      category,
      skills,
      interests,
      education,
      pricePerHour,
      address,
      geoLocation,
      availabilityStatus,
      rating,
      totalReview,
      totalBooking,
      isOnline,
      earning,
      accountStatus 
    });

    // 🔹 Generate tokens
    if (settingData) {
      const id = settingData._id;
      const role = settingData.role;
      const token = TokenSetter({ id, role });
      const RefreshTkn = refreshToken({ id, role });
      res.status(201).json({ token, RefreshTkn, message: "Buddy registered successfully" });
    }
  } catch (error) {
    console.log(error);
    return next({
      statusCode: 500,
      message: "Internal server error during buddy registration!"
    });
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

    const RefreshTkn = refreshToken({
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
  console.log(req?.body)
  try {
    const { email, phone, password } = req.body;

    //  Validate
    if ((!email && !phone) || !password) {
      return next({
        statusCode: 400,
        message: "Email/Phone and password required",
      });
    }

    //  Find user
    const buddy = await buddyModel.findOne({
      $or: [{ phone }, { email }],
    }).select("+password");

    if (!buddy) {
      return next({
        statusCode: 401,
        message: "Invalid credentials",
      });
    }

    //  Compare password
    const isMatch = await bcrypt.compare(password, buddy.password);

    if (!isMatch) {
      return next({
        statusCode: 401,
        message: "Invalid credentials",
      });
    }

    // 🔐 Tokens
    const accessToken = TokenSetter({
      id: buddy._id,
      role: buddy.role,
    });

    const refreshTokenToken = refreshToken({
      id: buddy._id,
      role: buddy.role,
    });

    // ✅ Response
    res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken: refreshTokenToken,
      role: buddy.role,
    });

  } catch (error) {
    console.log(error);
    next({ statusCode: 500, message: "Login error" });
  }
};