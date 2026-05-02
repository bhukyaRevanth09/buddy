import { useEffect, useState } from "react";

export default function useDistanceCalculator(a, b) {

  const [distance, setDistance] = useState(0);
  const [eta, setEta] = useState(0);

  useEffect(() => {
    if (!a || !b) return;

    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371;

    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);

    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.latitude)) *
      Math.cos(toRad(b.latitude)) *
      Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

    const dist = R * c;

    setDistance(dist.toFixed(2));
    setEta(Math.ceil((dist / 30) * 60));

  }, [a, b]);

  return { distance, eta };
}