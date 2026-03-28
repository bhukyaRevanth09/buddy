import express, { json } from 'express'
import cors from 'cors'
import  dotenv from 'dotenv'
import errorHandler from '../middleware/errorHandling.js'

import mainRouter from '../Routes/authroute.js'
import instantRoute from '../Routes/BookingRoute.js'

const app = express();

dotenv.config({quiet:true})

app.use(express.json());
app.use(cors());


app.use(mainRouter);
app.use(instantRoute);

app.use(errorHandler)



export default app