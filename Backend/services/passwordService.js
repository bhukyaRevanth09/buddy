
import bcrypt from "bcryptjs"




export const passwordHashing = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10)
    const hashPass = await bcrypt.hash(password, salt)
    return hashPass
  } catch (error) {
    console.error(`Error at ${error?.message}`)
    throw error
  }
}
