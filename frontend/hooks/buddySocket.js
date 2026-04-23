import { useEffect } from "react";
import * as Haptics from "expo-haptics";

export const useBuddySocket = ({
  socket,
  isOnline,
  setIncomingRequest
}) => {

  useEffect(() => {
    if (!socket) return;

    const handleNewRequest = (data) => {
      if (!isOnline) return;

      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning
      );

      setIncomingRequest(data);
    };

    socket.on("new-booking-request", handleNewRequest);

    return () => {
      socket.off("new-booking-request", handleNewRequest);
    };

  }, [socket, isOnline]);
};