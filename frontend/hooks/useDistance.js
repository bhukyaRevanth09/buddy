import { getDistance } from "geolib";

export const calculateDistance = (a, b) => {
  if (!a || !b) return 0;

  const meters = getDistance(
    { latitude: a.latitude, longitude: a.longitude },
    { latitude: b.latitude, longitude: b.longitude }
  );

  return (meters / 1000).toFixed(2);
};