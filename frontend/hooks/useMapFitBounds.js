import { useEffect } from "react";

export default function useMapFitBounds(mapRef, coords = []) {

  useEffect(() => {
    if (!mapRef?.current || coords.length < 2) return;

    mapRef.current.fitToCoordinates(coords, {
      edgePadding: {
        top: 100,
        right: 100,
        bottom: 150,
        left: 100
      },
      animated: true
    });

  }, [coords, mapRef]);
}