import { passwordHashing } from "../services/passwordService.js"
import userModel from "../models/UserSchema.js"
import buddyModel from '../models/BuddySchema.js'
import { TokenSetter ,refreshToken} from "../utils/tokenService.js"
import OTP from "../models/OTP.js"


export const userReg =  async (req,res,next)=>{
   const {name,
          email,
          password,
          phone,
          role,
          isActive,
          walletBalance,
          address,
          geoLocation} = req.body


     try {
            const otpRecord = await OTP.findOne({
      contact: phone,
      verified: true
              });

    if (!otpRecord) {
      return next({
        statusCode: 400,
        message: "Please verify OTP first"
      });
    }


         const checkingData = await userModel?.findOne({email:email})
          
        if(checkingData){
         return next({statusCode:409 , message:' user already exist !!'})
        }


          if (!name || !email || !role ){
       return next({statusCode : 400 , message:"data not reached here "})

         }else{


          const hashed  = await passwordHashing(password)
  
         
             const settingData = await   userModel.create({
            name,
            email,
            password:hashed,
            phone,
            role,
            isActive,
            walletBalance,
            address,
            geoLocation

           })
               await OTP.deleteOne({ _id: otpRecord._id });

           if(settingData){
             const id = settingData._id
               const role = settingData.role
                const token =  TokenSetter({id,role})
                  const RefreshTkn =  refreshToken({id,role})
                    res.status(201).json({token,RefreshTkn})
           }else{
            return res.status(409).json('data not  saved in db !!')
           }
          
          
         }

        
         
        
     } catch (error) {
        console.error(error)
         return next({statusCode:500,message:"Errror at inter in registration "})
     }

    
}


export const userLoginPassword = async (req, res, next) => {
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

       if(record.otp != otp){
    return next({
        statusCode: 400,
        message: "Invalid OTP"
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










export const buddyReg = async(req,res,next)=>{

  
 const {name,
        email,
        password,
        phone,
        category,
        role,
        skills,
        experience,
        pricePerHour,
        address,
        geoLocation,
        availability,
        document,
        verificationStatus,
        rating,
        totalReview,
        totalBooking,
        isOnline,
        earning} = req?.body
  
    console.log(phone)
try {
    const otpRecord = await OTP.findOne({
  contact: phone,
  verified: true
});

if (!otpRecord) {
  return next({
    statusCode: 400,
    message: "Please verify OTP first"
  });
}
    
   if (!name || !email || !skills || !phone ){
      return next({statusCode:400,message:'data not reached here !'})
   }
   else if (! /^\d{10}$/.test(phone)){
      return next({statuscode:400,message:'phone number not reached here !'})
   }else{
      
      const checkingData = await buddyModel?.findOne({email:email})
      const phonenumberChecking = await buddyModel?.findOne({phone:phone})

      if (checkingData){
         
         return next({statusCode:409,message:"email already exsits"})
      }

      if(phonenumberChecking){
         return next({statusCode:409,message:"phonoe number is already used !!"})
      }

      const hashed = await passwordHashing(password)
   
        
      const settingData = await  buddyModel.create({
          name,
        email,
        password:hashed,
        phone,
        role,
        category,
        skills,
        experience,
        pricePerHour,
        address,
        geoLocation,
        availability,
        document,
        verificationStatus,
        rating,
        totalReview,
        totalBooking,
        isOnline,
        earning
      })

  await OTP.deleteOne({ _id: otpRecord._id });

     if(settingData){
       const id = settingData._id
       const role = settingData.role
        const token =  TokenSetter({id,role})
       const RefreshTkn =  refreshToken({id,role})
       res.status(201).json({token,RefreshTkn})
     }
   }
} catch (error) {
   console.log(error)
    return next({statusCode:500,message:'Internal server error buddy reg !'})
}     
}

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

export const buddyLoginPassword= async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    const buddy = await buddyModel.findOne({ phone });

    if (!buddy) {
      return next({ statusCode: 404, message: "Buddy not found" });
    }

    const isMatch = await bcrypt.compare(password, buddy.password);

    if (!isMatch) {
      return next({ statusCode: 400, message: "Invalid password" });
    }

    const token = TokenSetter({ id: buddy._id, role: buddy.role });
    const RefreshTkn = refreshToken({ id: buddy._id, role: buddy.role });

    res.status(200).json({ token, RefreshTkn });

  } catch (error) {
    next({ statusCode: 500, message: "Login error" });
  }
};

export const buddyProfile = async (req, res, next) => {
  const { id, role } = req.data;

  if (role !== "buddy") {
    return next({ statusCode: 403, message: "Access denied" });
  }

  try {
    const buddy = await buddyModel.findById(id);

    if (!buddy) {
      return next({ statusCode: 404, message: "Buddy not found" });
    }

    res.status(200).json(buddy);

  } catch (error) {
    next({ statusCode: 500, message: "Error fetching profile" });
  }
};