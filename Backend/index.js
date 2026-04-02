import dotenv from 'dotenv';
import connectDB from './Config/db.js';
import app from './Config/express.js';
import http from "http";
import { initSocket } from './services/chatSocket.js';

import authrouter from './Routes/AuthRoute.js';
import buddyRouter from './Routes/BuddyRoute.js';
import userRouter from './Routes/UserRoute.js';


dotenv.config({ quiet: true });

const server = http.createServer(app);

// initialize socket
const io = initSocket(server);


// connect DB
connectDB();

const port = process.env.PORT_NO || 3000;

//start this server (not app)
server.listen(port, () => {
  console.log(`server running on port ${port}`);
});