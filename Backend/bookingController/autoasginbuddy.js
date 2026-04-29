import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid'; // Ensure you have 'uuid' package installed
import redis from "../Config/redis.js";
import buddyModel from "../models/BuddySchema.js";
import instantBookingModel from "../models/instantBooking.js";
import CategoryMOdel from "../models/Category.js";
import skillModel from "../models/SkillStore.js";
import interestModel from "../models/Inerest.js";
import { getIO } from "../services/Socket.js";
import { bookingQueue } from "../Config/queueConfig.js";
import { lockBuddy } from "../utils/bookingLock.js";


export const autoAssignBuddy = async (req, res) => {
console.log(req.body)
try {

const { category, skills, lat, lng, price } = req.body;

const io = getIO();

const longitude = parseFloat(lng);
const latitude = parseFloat(lat);

const categoryId =
new mongoose.Types.ObjectId(category);

/*
=========================
FIND NEARBY BUDDIES
=========================
*/

const buddies = await buddyModel.aggregate([
{
$geoNear: {
near: {
type: "Point",
coordinates: [longitude, latitude]
},
distanceField: "distance",
maxDistance: 10000,
spherical: true,
key: "geoLocation",
query: {
availabilityStatus: "available",
accountStatus: "active",
category: categoryId
}
}
},
{ $limit: 5 }
]);

if (!buddies.length) {
return res.json({
success:false,
message:"No buddies nearby"
});
}

/*
=========================
CREATE TEMP BOOKING
=========================
*/

const tempBookingId = `temp_bk_${uuidv4()}`;

const bookingState = {
id: tempBookingId,
user: req.userId,
category,
requestedSkills: skills,
pricing: { totalAmount: price || 0 },
location:{
type:"Point",
coordinates:[longitude, latitude]
},
buddies: buddies.map(b=>b._id.toString()),
currentIndex:0,
status:"searching",
createdAt: Date.now()
};

await redis.set(
`pending_booking:${tempBookingId}`,
JSON.stringify(bookingState),
"EX",
60*10
);

/*
=========================
SEND FIRST BUDDY
=========================
*/

const firstBuddy = buddies[0]._id.toString();

// LOCK BUDDY
const locked = await lockBuddy(firstBuddy);

if (!locked) {
return res.json({
success:false,
message:"All buddies busy"
});
}

io.to(req.userId.toString()).emit(
"booking-searching",
{ bookingId: tempBookingId }
);

io.to(firstBuddy).emit(
"new-booking-request",
{
bookingId: tempBookingId,
userId: req.userId,
category,
price,
distance:(buddies[0].distance/1000).toFixed(1)
}
);

/*
=========================
QUEUE NEXT
=========================
*/

await bookingQueue.add(
"check-acceptance",
{ bookingId: tempBookingId },
{ delay: 20000 }
);

res.json({
success:true,
bookingId: tempBookingId
});

} catch (err) {

console.log("Auto assign error", err);

res.status(500).json({
success:false,
message: err.message
});

}
};
// --- PART 2: BUDDY ACCEPTS THE REQUEST ---

export const acceptBooking = async (req, res) => {

  const { bookingId } = req.body;
  const buddyId = req.userId;

  const raw =
    await redis.get(`pending_booking:${bookingId}`);

  if (!raw)
    return res.json({ success: false });

  const state = JSON.parse(raw);

  await redis.del(
    `pending_booking:${bookingId}`
  );

  /*
  ===============================
  NOTIFY USER - ACCEPTED
  ===============================
  */
  getIO()
    .to(state.user.toString())
    .emit("booking-accepted", {
      bookingId,
      buddy: {
        _id: buddyId
      }
    });

  /*
  ===============================
  AUTO JOIN BOOKING ROOM
  ===============================
  */
  getIO()
    .to(state.user.toString())
    .emit("start_tracking", {
      bookingId
    });

  res.json({ success: true });
};



export const updateLiveLocation = async (req, res) => {
  try {
    const { bookingId, lat, lng, heading, speed } = req.body;
    const buddyId = req.userId;

    if (!bookingId || !lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "bookingId, lat, lng required",
      });
    }

    const io = getIO();

    /*
    =========================
    BROADCAST LIVE LOCATION
    =========================
    */

    io.to(`booking:${bookingId}`).emit("location_update", {
      bookingId,
      buddyId,
      location: {
        latitude: lat,
        longitude: lng,
        heading: heading || 0,
        speed: speed || 0,
      },
      timestamp: Date.now(),
    });

    /*
    =========================
    OPTIONAL: SAVE LAST LOCATION
    =========================
    */

    await instantBookingModel.findByIdAndUpdate(
      bookingId,
      {
        lastLocation: {
          type: "Point",
          coordinates: [lng, lat],
          updatedAt: new Date(),
        },
      },
       { returnDocument: "after" }
    );

    res.json({
      success: true,
    });

  } catch (error) {
    console.error("live tracking error", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // We 'populate' the buddy field to get their name and rating for the user
    const booking = await instantBookingModel.findById(bookingId)
      .populate('buddy', 'firstName lastName rating profilePicture');

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};