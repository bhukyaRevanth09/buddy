
import dotenv from 'dotenv'
import connectDB from './Config/db.js'
import app from './Config/express.js'
import http from "http";
import { initSocket } from './services/chatSocket.js';

const server = http.createServer(app);

initSocket(server);


dotenv.config({quiet:true})
connectDB()


const port = process.env.PORT_NO

app.listen(port,()=>{
    try {
        console.log(`server running on `,port)
    } catch (error) {
        console.log(error?.message)
    }
})


