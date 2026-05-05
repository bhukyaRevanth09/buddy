import instantBookingModel from "../../models/instantBooking.js";
import buddyModel from "../../models/BuddySchema.js";
import { getIO } from "../../socket/socket.js";
import { SOCKET_EVENTS } from "../../constants/backendSocketEvents.js";
import redis from "../../Config/redis.js";
import { generateOTP } from "../../utils/otpGenrate.js";
import { sendEmail } from "../../services/emailServices.js";

export const completeWork = async (req, res) => {
  try {
    console.log("\n====================================");
    console.log("🏁 COMPLETE WORK");
    console.log("====================================");

    const { bookingId, otp } = req.body;
    const buddyId = req.userId;

    console.log("📦 BOOKING ID:", bookingId);
    console.log("🧑 BUDDY:", buddyId);
    console.log("🔐 OTP RECEIVED:", otp);

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID required",
      });
    }

    const booking = await instantBookingModel
      .findOne({
        _id: bookingId,
        status: "started",
      })
      .populate("user", "name email");

    if (!booking) {
      return res.status(400).json({
        success: false,
        message: "Invalid state or already completed",
      });
    }

    if (!booking.buddy || booking.buddy.toString() !== buddyId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not allowed",
      });
    }

    const io = getIO();

    const otpKey = `booking:complete_otp:${bookingId}`;
    const attemptsKey = `booking:complete_otp_attempts:${bookingId}`;

    /*
    ========================
    STEP 1: GENERATE OTP
    ========================
    */
    if (!otp) {
      if (!booking.user?.email) {
        return res.status(400).json({
          success: false,
          message: "Customer email not found",
        });
      }

      const completeOtp = generateOTP();

      await redis.set(otpKey, completeOtp, "EX", 300);
      await redis.set(attemptsKey, 0, "EX", 300);

      console.log("🔐 COMPLETE OTP GENERATED:", completeOtp);
      console.log("📧 SENDING OTP TO:", booking.user.email);

      await sendEmail({
        email: booking.user.email,
        otp: completeOtp,
        subject: "Work Completion OTP",
        title: "Complete your booking",
        message: "Share this OTP with your buddy to finish the work",
      });

      io.to(booking.user._id.toString()).emit(SOCKET_EVENTS.OTP_GENERATED, {
        bookingId,
        purpose: "complete",
        expiresIn: 300,
      });

      return res.status(200).json({
        success: true,
        otpRequired: true,
        message: "OTP sent to customer email",
      });
    }

    /*
    ========================
    STEP 2: VERIFY OTP
    ========================
    */
    const savedOtp = await redis.get(otpKey);

    if (!savedOtp) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not generated. Request OTP again.",
      });
    }

    const attempts = Number((await redis.get(attemptsKey)) || 0);

    if (attempts >= 3) {
      await redis.del(otpKey);
      await redis.del(attemptsKey);

      return res.status(400).json({
        success: false,
        message: "Too many attempts. Request new OTP.",
      });
    }

    if (otp.toString() !== savedOtp.toString()) {
      await redis.incr(attemptsKey);
      await redis.expire(attemptsKey, 300);

      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    /*
    ========================
    STEP 3: COMPLETE BOOKING
    ========================
    */
    booking.status = "completed";
    booking.completedAt = new Date();

    await booking.save();

    await buddyModel.findByIdAndUpdate(buddyId, {
      availabilityStatus: "available",
      currentBooking: null,
    });

    await redis.del(otpKey);
    await redis.del(attemptsKey);

    await redis.del(`booking:active:${bookingId}`);
    await redis.del(`user:active_booking:${booking.user._id}`);
    await redis.del(`buddy:active_booking:${booking.buddy}`);
    await redis.del(`booking:accept:${bookingId}`);

    const bookingRoom = `booking:${bookingId}`;

    io.to(booking.user._id.toString()).emit(SOCKET_EVENTS.WORK_COMPLETED, {
      bookingId,
      completedAt: booking.completedAt,
      amount: booking.pricing?.totalAmount || 0,
    });

    io.to(buddyId.toString()).emit(SOCKET_EVENTS.WORK_COMPLETED, {
      bookingId,
      completedAt: booking.completedAt,
    });

    io.to(bookingRoom).emit(SOCKET_EVENTS.STATUS_UPDATE, {
      bookingId,
      status: "completed",
      updatedAt: new Date(),
    });

    io.to(bookingRoom).emit(SOCKET_EVENTS.TRACKING_ENDED, {
      bookingId,
    });

    console.log("✅ WORK COMPLETED SUCCESSFULLY");

    return res.status(200).json({
      success: true,
      completed: true,
      message: "Work completed successfully",
    });

  } catch (error) {
    console.log("❌ COMPLETE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};