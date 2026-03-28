import mongoose from "mongoose";



const  connectDB = async ()=>{
    try {
    const mongodbConnect = await mongoose.connect(process.env.MONGO_DB) 
    console.log(`DataBase Connected: ${mongodbConnect.connection.host}`)
} catch (error) {
    console.error(`error${error?.message}`)
    process.exit(1)
}
}
export default connectDB