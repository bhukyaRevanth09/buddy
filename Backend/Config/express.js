import express from 'express'
import cors from 'cors'
import  dotenv from 'dotenv'
import errorHandler from '../middleware/errorHandling.js'
import authRouter from '../Routes/AuthRoute.js'





const app = express();

dotenv.config({quiet:true})

app.use(express.json());
app.use(cors());

app.use('/auth',authRouter)



app.use(errorHandler)



export default app