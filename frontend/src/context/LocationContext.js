import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import * as Location from "expo-location";

export const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  // 1. STATE MANAGEMENT
  const [currentLocation, setCurrentLocation] = useState(null); // Real-time (Blue Dot)
  const [selectedLocation, setSelectedLocation] = useState(null); // Chosen spot (Red Pin)
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);

  const watchId = useRef(null);

  /**
   * INITIAL SETUP: Request Permissions & Get First Fix
   */
  const requestPermission = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setPermissionGranted(false);
        setLoading(false);
        return;
      }

      setPermissionGranted(true);

      // Get the one-time initial position
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const initialCoords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      setCurrentLocation(initialCoords);
      
      // Initially set Selected Location to where they are standing
      if (!selectedLocation) {
        setSelectedLocation(initialCoords);
      }

      setLoading(false);
      startLiveTracking(); // Start the live listener
    } catch (err) {
      console.error("Location Context Error:", err);
      setLoading(false);
    }
  };

  /**
   * LIVE TRACKING: Updates 'currentLocation' as the user moves physically
   */
  const startLiveTracking = useCallback(async () => {
    // Cleanup any existing listener first
    if (watchId.current) watchId.current.remove();

    watchId.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,   // Check every 5 seconds
        distanceInterval: 10, // Update only if moved 10 meters
      },
      (loc) => {
        setCurrentLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    );
  }, []);

  /**
   * CLEANUP: Stop GPS listener when app closes/unmounts
   */
  const stopTracking = () => {
    if (watchId.current) {
      watchId.current.remove();
      watchId.current = null;
    }
  };

  // Run on mount
  useEffect(() => {
    requestPermission();
    return () => stopTracking();
  }, []);

  // 2. EXPOSED VALUES
  return (
    <LocationContext.Provider
      value={{
        currentLocation,      // Read-only live position
        selectedLocation,     // Position for bookings
        setSelectedLocation,  // Function to change the Red Pin
        permissionGranted,
        loading,
        refreshLocation: requestPermission, // Manual refresh trigger
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};