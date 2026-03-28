import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'


dotenv.config({quiet:true})

export const TokenSetter = (data) => {
     
try {
       const {id,role} = data
    console.log(process.env.JWT_KEY)
  if (!id || !role) {
    throw new Error("user details not reached here !")
  }

   return  jwt.sign(
    {id,role},
    process.env.JWT_KEY,
    {expiresIn:'3h'}
  )


} catch (error) {
     console.log(error)
     // throw new Error('error at token Genration') 
}
}


export const refreshToken = (data)=>{
try {
          const {id,role} = data
           console.log(id,role)
  console.log(process.env.REFRESH_KEY)
      if (!id || !role ){
          throw new Error("user not  founded ! please Register")
      }

     return jwt.sign(
          {id,role},
          process.env.REFRESH_KEY,
          {expiresIn:'40d'}
     )
     
} catch (error) {
     console.log(error)
   throw new Error('error at Refresh Token !') 
}
}

