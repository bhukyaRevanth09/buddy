import dotenv from 'dotenv';
import connectDB from './Config/db.js';
import app from './Config/express.js';
import http from "http";
import { initSocket } from './socket/socket.js';
import seed from '../Backend/seedData/skillSeedData.js'
import { selectcategory } from './testing.js';
import { startBookingWorker } from './worker/Worker.js';


dotenv.config({ quiet: true });

const server = http.createServer(app);


 startBookingWorker()
// initialize socket
const io = initSocket(server);

// ADD THIS LINE: Make io accessible via the request object
app.set("io", io); 

// connect DB
connectDB();

const port = process.env.PORT_NO;
server.listen(port,"0.0.0.0",() => {
  console.log(`server running on port ${port}`);
});