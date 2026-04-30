import React, { useEffect, useState, useContext, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert
} from "react-native";

import MapView, { Marker, Polyline } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

import { SocketContext } from "../../context/socketContext.js";
import api from "../../api/Apiclient.js";

export default function TrackingScreen({ route, navigation }) {

  const { bookingId, buddy } = route.params;
  const { socket } = useContext(SocketContext);

  const mapRef = useRef(null);

  const [userLocation, setUserLocation] = useState(null);
  const [buddyLocation, setBuddyLocation] = useState(null);
  const [status, setStatus] = useState("accepted");
  const [loading, setLoading] = useState(true);

  const [distance, setDistance] = useState(0);
  const [eta, setEta] = useState(0);

  const watchRef = useRef(null);

  /*
  ===============================
  LIVE USER LOCATION (SMOOTH)
  ===============================
  */
  useEffect(() => {

    let subscription;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission required");
          return;
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 10
          },
          (loc) => {
            setUserLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude
            });
          }
        );

      } catch (err) {
        console.log("Location error", err);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  /*
  ===============================
  SOCKET LISTENERS
  ===============================
  */
  useEffect(() => {

    if (!socket) return;

    socket.emit("join_booking_room", bookingId);

    const locationHandler = (data) => {
      if (data.bookingId === bookingId) {
        setBuddyLocation({
          latitude: data.location?.latitude || data.lat,
          longitude: data.location?.longitude || data.lng
        });
      }
    };

    const startedHandler = () => setStatus("started");

    const completedHandler = () => {
      setStatus("completed");
      Alert.alert("Job Completed");
      navigation.replace("Home");
    };

    socket.on("location_update", locationHandler);
    socket.on("tracking_started", (data) => {
  setStatus("started");
});
    socket.on("booking-completed", completedHandler);

    return () => {
      socket.off("location_update", locationHandler);
      socket.off("booking-started", startedHandler);
      socket.off("booking-completed", completedHandler);
    };

  }, [socket, bookingId, navigation]);

  /*
  ===============================
  DISTANCE CALCULATION
  ===============================
  */
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  /*
  ===============================
  UPDATE DISTANCE + ETA
  ===============================
  */
  useEffect(() => {

    if (!userLocation || !buddyLocation) return;

    const dist = getDistance(
      userLocation.latitude,
      userLocation.longitude,
      buddyLocation.latitude,
      buddyLocation.longitude
    );

    setDistance(dist.toFixed(2));

    const etaMinutes = (dist / 30) * 60;
    setEta(Math.max(1, Math.ceil(etaMinutes)));

  }, [userLocation, buddyLocation]);

  /*
  ===============================
  FIT MAP
  ===============================
  */
  useEffect(() => {

    if (!userLocation || !buddyLocation) return;

    mapRef.current?.fitToCoordinates(
      [userLocation, buddyLocation],
      {
        edgePadding: {
          top: 100,
          right: 100,
          bottom: 200,
          left: 100
        },
        animated: true
      }
    );

  }, [userLocation, buddyLocation]);

  /*
  ===============================
  CANCEL BOOKING
  ===============================
  */
  const cancelBooking = async () => {
    try {
      await api.post("/booking/cancel", { bookingId });
      Alert.alert("Booking Cancelled");
      navigation.replace("Home");
    } catch {
      Alert.alert("Cancel failed");
    }
  };

  /*
  ===============================
  LOADING
  ===============================
  */
  if (loading || !userLocation) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* MAP */}
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation
      >

        {userLocation && (
          <Marker coordinate={userLocation} title="You" pinColor="blue" />
        )}

        {buddyLocation && (
          <Marker
            coordinate={buddyLocation}
            title={buddy?.name || "Buddy"}
            pinColor="green"
          />
        )}

        {userLocation && buddyLocation && (
          <Polyline
            coordinates={[userLocation, buddyLocation]}
            strokeWidth={4}
            strokeColor="#007AFF"
          />
        )}

      </MapView>

      {/* PANEL */}
      <View style={styles.panel}>

        <Text style={styles.title}>
          {status.toUpperCase()}
        </Text>

        <Text style={styles.text}>
          📍 Distance: {distance} km
        </Text>

        <Text style={styles.text}>
          ⏱️ ETA: {eta} mins
        </Text>

        <Text style={styles.name}>
          👤 {buddy?.name}
        </Text>

        <View style={styles.row}>

          <TouchableOpacity style={styles.callBtn}>
            <Ionicons name="call" size={18} color="#fff" />
            <Text style={styles.btnText}>CALL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={cancelBooking}
          >
            <Text style={styles.btnText}>CANCEL</Text>
          </TouchableOpacity>

        </View>

      </View>

    </SafeAreaView>
  );
}

/*
===============================
STYLES
===============================
*/
const styles = StyleSheet.create({

  container: { flex: 1 },
  map: { flex: 1 },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },

  panel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10
  },

  title: {
    fontSize: 18,
    fontWeight: "bold"
  },

  text: {
    marginTop: 5,
    fontSize: 14
  },

  name: {
    marginTop: 10,
    fontWeight: "600"
  },

  row: {
    flexDirection: "row",
    marginTop: 15
  },

  callBtn: {
    flex: 1,
    backgroundColor: "#34C759",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginRight: 10,
    gap: 6
  },

  cancelBtn: {
    flex: 1,
    backgroundColor: "#FF3B30",
    padding: 12,
    borderRadius: 10,
    alignItems: "center"
  },

  btnText: {
    color: "#fff",
    fontWeight: "600"
  }

});