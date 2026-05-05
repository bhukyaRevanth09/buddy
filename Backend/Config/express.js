import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";

import rateLimit from "express-rate-limit";

import errorHandler
from "../middleware/errorHandling.js";

import authRouter
from "../Routes/AuthRoute.js";

import buddyRouter
from "../Routes/BuddyRoute.js";

import userRouter
from "../Routes/UserRoute.js";

import bookingRouter
from "../Routes/bookingRoute.js";

import locationRouter from "../Routes/locationRouter.js";

dotenv.config({ quiet: true });

const app = express();

/*
=========================
MIDDLEWARES
=========================
*/

app.use(express.json());

app.use(cors());

app.use(helmet());

app.use(compression());

app.use(morgan("dev"));

/*
=========================
RATE LIMITER
=========================
*/

const limiter = rateLimit({

  windowMs: 60 * 1000,

  max: 100,

  message: {
    success: false,
    message: "Too many requests"
  }

});

app.use(limiter);

/*
=========================
ROUTES
=========================
*/

app.use("/api/auth", authRouter);

app.use("/api/buddy", buddyRouter);

app.use("/api/user", userRouter);

app.use("/api/booking", bookingRouter);

app.use("/api/location",locationRouter);
/*
=========================
ERROR HANDLER
=========================
*/

app.use(errorHandler);

export default app;