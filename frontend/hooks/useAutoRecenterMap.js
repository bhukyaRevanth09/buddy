import { useEffect } from "react";

export default function useAutoRecenterMap(mapRef, location) {

  useEffect(() => {
    if (!mapRef?.current || !location) return;

    mapRef.current.animateToRegion({
      ...location,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01
    }, 800);

  }, [location]);
}