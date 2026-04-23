// This runs in the background of the Buddy App
socket.on("new-booking-request", (data) => {
  showIncomingRequestModal({
    title: "New Job Found!",
    body: `${data.customerName} needs ${data.categoryName} within ${data.distance}`,
    onAccept: () => handleAccept(data.bookingId)
  });
});

const handleAccept = async (tempId) => {
  const res = await api.post("/booking/accept", { bookingId: tempId });
  if(res.data.success) {
    navigation.navigate("ActiveJob", { booking: res.data.data });
  }
};