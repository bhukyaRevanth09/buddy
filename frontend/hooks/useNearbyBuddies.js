import { useEffect, useState, useCallback } from "react";
import api from "../api/Apiclient";
import { SOCKET_EVENTS } from "../evenets/frontendsocketEvents";

export default function useNearbyBuddies(
  location,
  category,
  skills = [],
  interests = [],
  socket
) {

  const [buddies, setBuddies] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBuddies = useCallback(async () => {

    if (!location) return;

    setLoading(true);

    try {

      const res = await api.get(
        "/user/nearest-buddy",
        {
          params: {
            latitude: location.latitude,
            longitude: location.longitude,
            categoryId: category?._id,
            skillIds: skills.join(","),
            interestIds: interests.join(",")
          }
        }
      );

      setBuddies(res.data.data || []);

    } catch (e) {

      console.log(e);

    }

    setLoading(false);

  }, [location, category, skills, interests]);

  useEffect(() => {
    fetchBuddies();
  }, [fetchBuddies]);

  useEffect(() => {

    if (!socket) return;

    const handler = (data) => {

      setBuddies(prev => {

        if (!data.isOnline) {
          return prev.filter(
            b => b._id !== data.buddyId
          );
        }

        fetchBuddies();

        return prev;

      });

    };

    socket.on(
      SOCKET_EVENTS.STATUS_UPDATE,
      handler
    );

    return () => {

      socket.off(
        SOCKET_EVENTS.STATUS_UPDATE,
        handler
      );

    };

  }, [socket, fetchBuddies]);

  return {
    buddies,
    loading,
    refresh: fetchBuddies
  };

}