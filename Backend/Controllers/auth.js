import { passwordHashing } from "../services/passwordService.js"
import userModel from "../models/UserSchema.js"
import buddyModel from '../models/BuddySchema.js'
import { TokenSetter ,refreshToken} from "../utils/tokenService.js"


export const userReg=  async (req,res,next)=>{
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
         const checkingData = await userModel?.findOne({email:email})
          
        if(checkingData){
         return next({statusCode:409 , message:'user not data here !!'})
        }


          if (!name || !email || !role ){
       return next({statusCode : 400 , message:"data not reached here "})

         }else{


          const hashed  = await passwordHashing(password)
  
         
             const settingData = await   User.create({
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
          
          return res.status(201).json('save in db')
         }

        
         
        
     } catch (error) {
        console.error(error)
         return next({statusCode:500,message:"Errror at inter in registration "})
     }

    
}

export const userLog = async (req,res,next)=>{
   const {id,role} = req.data

   if (id && role == "user"){
      try {
         const obtainedData = await userModel.findById({id:id})

         if(!obtainedData){
            return next({statusCode:404,message:"user not Founded!"})
         }

        if(req.method === "POST"){
          const id = obtainedData?.id
         const role = obtainedData?.role
         const token = TokenSetter({id,role})
         const RefreshTkn = refreshToken({id,role})
         res.status(201).json({token,RefreshTkn})
        }else{
         res.status(201).json(obtainedData)
        }
      

      } catch (error) {
         console.log("error at login user",error.name)
      }
   }
}

export const buddyReg = async(req,res,next)=>{

  
 const {name,
        email,
        password,
        phone,
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
    
    
   if (!name || !email || !skills || !phone ){
      return next({statusCode:400,message:'data not reached here !'})
   }
   else if (! /^\d{10}$/.test(phone)){
      return next({statuscode:400,message:'phone number not reached here !'})
   }else{
      const checkingData = await buddy?.findOne({email:email})
      if (checkingData){
         
         return next({statusCode:409,message:"email already exsits"})
      }

      const hashed = await passwordHashing(password)
   
        
      const settingData = await  buddyModel.create({
          name,
        email,
        password:hashed,
        phone,
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
        earning
      })


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



export const buddyLog = async (req,res,next)=>{
   const {id,role} = req.data
  console.log('reached here !' ,req?.method)
   if (id && role == "buddy"){
      try {
         const obtainedData = await buddyModel.findById(id)
          
           if(!obtainedData){
            return next({statusCode:404,message:"user not Founded!"})
         }

        if(req.method === "POST"){
          const id = obtainedData?.id
         const role = obtainedData?.role
         const token = TokenSetter({id,role})
         const RefreshTkn = refreshToken({id,role})
         res.status(201).json({token,RefreshTkn})
        }else{
         res.status(201).json(obtainedData)
        }
      } catch (error) {
         console.log("error at login user",error.name)
      }
   }
}

