import express from 'express'
import cors from 'cors'
import  dotenv from 'dotenv'
import errorHandler from '../middleware/errorHandling.js'
import authRouter from '../Routes/AuthRoute.js'
import buddyRouter from '../Routes/BuddyRoute.js'
import userRouter from '../Routes/UserRoute.js'
import bookingRouter from '../Routes/bookingRoute.js'



dotenv.config({quiet:true})

const app = express();


app.use(express.json());
app.use(cors());

app.use('/api/auth',authRouter)
app.use('/api/buddy',buddyRouter)
app.use('/api/user',userRouter)
app.use('/api/booking',bookingRouter)


app.use(errorHandler)



export default app