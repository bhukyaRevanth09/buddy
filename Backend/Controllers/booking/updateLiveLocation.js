import instantBookingModel from "../../models/instantBooking.js";
import { getIO } from "../../socket/socket.js";
import { SOCKET_EVENTS } from "../../constants/backendSocketEvents.js";
/*
========================================
UPDATE LIVE LOCATION (BUDDY)
POST /api/location/update
========================================
*/
export const updateLiveLocation = async (req, res) => {
  try {
    const { bookingId, lat, lng } = req.body;

    console.log("\n📍 LOCATION UPDATE REQUEST");
    console.log("👉 bookingId:", bookingId);
    console.log("👉 lat:", lat);
    console.log("👉 lng:", lng);

    const booking = await instantBookingModel.findById(bookingId);

    if (!booking) {
      console.log("❌ BOOKING NOT FOUND");
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    console.log("✅ BOOKING FOUND:", booking._id);

    booking.liveLocation = {
      latitude: lat,
      longitude: lng,
      updatedAt: new Date()
    };

    await booking.save();

    console.log("💾 LOCATION SAVED");

    const io = getIO();

    io.to(`booking:${bookingId}`).emit(
      SOCKET_EVENTS.LOCATION_UPDATE,
      {
        bookingId,
        location: {
          latitude: lat,
          longitude: lng
        }
      }
    );

    console.log("📡 LOCATION EMITTED");

    res.json({ success: true });

  } catch (err) {
    console.log("❌ LOCATION ERROR:", err.message);
    res.status(500).json({ success: false });
  }
};

/*
========================================
GET LIVE LOCATION (USER / TRACKING)
GET /api/location/:bookingId
========================================
*/
export const getLiveLocation = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await instantBookingModel.findById(bookingId);

    if (!booking || !booking.liveLocation) {
      return res.status(404).json({
        success: false,
        message: "Location not available"
      });
    }

    res.json({
      success: true,
      location: booking.liveLocation
    });

  } catch (err) {
    console.log("❌ getLiveLocation error:", err);

    res.status(500).json({
      success: false
    });
  }
};