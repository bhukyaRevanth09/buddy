import jwt  from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config({quiet:true})

export const tokenMiddleware = (req,res,next)=>{
   const authHeader = req.headers.authorization
    
 console.log(authHeader)
   if(!authHeader){
     return next({statusCode:401,message:'token not provided !'}) 
   }

    

    try {
         const token = authHeader?.split(" ")[1]
         console.log(token)
        const decode = jwt.verify(token ,process.env.JWT_KEY)
        req.data = decode 

        next()
    } catch (error) {
       if (error.name = "TokenExpiredError"){
        return next({statusCode:401,message:"token is expired !"})
       }
    }


}



export const tokenRefreshWare = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next({ statusCode: 401, message: "No token provided" });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return next({ statusCode: 401, message: "Invalid token format" });
  }

  try {
    const token = authHeader.split(" ")[1];

    if (!token) {
      return next({ statusCode: 401, message: "Token missing" });
    }

    console.log("TOKEN:", token);

    const decoded = jwt.verify(token, process.env.REFRESH_KEY);

    req.data = decoded;
    next();

  } catch (error) {
    console.log("VERIFY ERROR:", error.message);

    return next({
      statusCode: 401,
      message: "Invalid or expired refresh token"
    });
  }
};
