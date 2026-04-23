

// bookingWorker.js
bookingQueue.process("retry-booking", async (job) => {
  const { bookingId } = job.data;
  const booking = await instantBookingModel.findById(bookingId);

  // Stop if booking was already accepted or cancelled
  if (!booking || booking.status !== "searching") return;

  const state = JSON.parse(await redis.get(`booking:${bookingId}`));
  const nextIndex = state.buddyIndex + 1;

  if (nextIndex < state.buddies.length) {
    const nextBuddyId = state.buddies[nextIndex];
    
    // Update Redis state
    state.buddyIndex = nextIndex;
    await redis.set(`booking:${bookingId}`, JSON.stringify(state), "EX", 300);

    // Ping next buddy
    getIO().to(nextBuddyId).emit("new-booking", { bookingId });

    // Re-queue the job for the NEXT buddy in 15 seconds
    await bookingQueue.add("retry-booking", { bookingId }, { delay: 15000 });
  } else {
    // No more buddies left
    booking.status = "failed";
    await booking.save();
    getIO().to(booking.user.toString()).emit("no-buddies-available");
  }
});