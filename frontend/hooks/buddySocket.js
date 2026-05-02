import { useEffect } from "react";
import * as Haptics from "expo-haptics";

export const useBuddySocket = ({ socket, isOnline, setIncomingRequest }) => {

  useEffect(() => {
    if (!socket) return;

    const handler = (data) => {
      if (!isOnline) return;

      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning
      );

      setIncomingRequest(data);
    };

    socket.on("new-booking-request", handler);

    return () => socket.off("new-booking-request", handler);

  }, [socket, isOnline]);
};