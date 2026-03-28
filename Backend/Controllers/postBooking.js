import postBookingModel from "../models/postBookingSchema.js";
import { getIO } from "../services/chatSocket.js";
     console.log('post')
export const createPostTask = async (req, res, next) => {
  try {
    const io = getIO 
    const { title, description, budget, location } = req.body;
    const userId = req.user.id;

    const task = await postBookingSchema.create({
      user: userId,
      title,
      description,
      budget,
      location
    });

    io.to(buddyId.toString()).emit("new-booking", {
  message: "New booking request",
  booking
});  

    res.status(201).json({
      success: true,
      message: "Task posted successfully",
      data: task
    });

  } catch (error) {
    next(error);
  }
};