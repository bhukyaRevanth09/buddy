import { generateOTP } from "../utils/otp.js";

export const markArrived = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const buddyId = req.user.id;

    const booking = await instantBookingModel.findById(bookingId);

    if (!booking) return res.status(404).json({ message: "Not found" });

    if (booking.buddy.toString() !== buddyId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (booking.status !== "accepted") {
      return res.status(400).json({ message: "Invalid state" });
    }

    const otp = generateOTP();

    booking.status = "arrived";
    booking.arrivedAt = new Date();

    booking.otp.start = {
      code: otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      attempts: 0
    };

    await booking.save();

    // 📡 SEND OTP (for now via socket)
    const io = getIO();
    io.to(booking.user.toString()).emit("otp", {
      bookingId,
      otp // ⚠️ remove in production
    });

    res.json({ message: "OTP generated" });

  } catch (err) {
    next(err);
  }
};