import React, {
  createContext,
  useState,
  useEffect,
  useRef,
} from "react";
import * as Location from "expo-location";

export const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  const watchRef = useRef(null);

  const startTracking = async () => {
    if (watchRef.current) return; // prevent duplicate watcher

    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced, // 🔥 battery optimized
        timeInterval: 8000,
        distanceInterval: 20, // update only if moved 20m
      },
      (loc) => {
        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };

        setCurrentLocation(coords);
      }
    );
  };

  const stopTracking = () => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
  };

  const init = async () => {
    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      setCurrentLocation(coords);

      if (!selectedLocation) {
        setSelectedLocation(coords);
      }

      await startTracking();

    } catch (err) {
      console.log("Location error", err);
    }

    setLoading(false);
  };

  useEffect(() => {
    init();
    return () => stopTracking();
  }, []);

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        selectedLocation,
        setSelectedLocation,
        loading,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};