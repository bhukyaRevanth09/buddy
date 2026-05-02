import React, { useEffect, useState, useContext, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert
} from "react-native";

import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";

import { SocketContext } from "../../context/socketContext.js";
import useDistanceCalculator from "../../../hooks/useDistanceCalculator.js";
import DistanceBadge from "../../components/map/DistanceBadge.js";

export default function ActiveJobScreen({ route, navigation }) {

  const { booking } = route.params;
  const { socket } = useContext(SocketContext);

  const mapRef = useRef(null);
  const intervalRef = useRef(null);

  const bookingId = booking?._id || booking?.bookingId;
  const destination = booking?.pickupLocation;

  const [status, setStatus] = useState(booking?.status || "accepted");
  const [myLocation, setMyLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  const { distance, eta } = useDistanceCalculator(myLocation, destination);

  /*
  =========================
  LOCATION INIT
  =========================
  */
  useEffect(() => {
    let mounted = true;

    const initLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          Alert.alert("Permission denied", "Location is required");
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });

        if (!mounted) return;

        setMyLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        });

      } catch (err) {
        console.log("Location init error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initLocation();

    return () => { mounted = false };
  }, []);

  /*
  =========================
  SOCKET + LIVE TRACKING
  =========================
  */
  useEffect(() => {
    if (!socket || !bookingId) return;

    let isMounted = true;

    socket.emit("join_booking_room", bookingId);

    const sendLocation = async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });

        if (!isMounted) return;

        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        };

        setMyLocation(coords);

        socket.emit("update_location", {
          bookingId,
          lat: coords.latitude,
          lng: coords.longitude
        });

      } catch (err) {
        console.log("Location update error:", err);
      }
    };

    // 🔥 smoother + less battery drain
    intervalRef.current = setInterval(sendLocation, 4000);

    sendLocation(); // initial hit

    const onStart = (data) => {
      if (data.bookingId === bookingId) {
        setStatus("started");
      }
    };

    const onComplete = (data) => {
      if (data.bookingId === bookingId) {
        navigation.replace("BuddyHome");
      }
    };

    socket.on("tracking_started", onStart);
    socket.on("booking-completed", onComplete);

    return () => {
      isMounted = false;

      clearInterval(intervalRef.current);

      socket.off("tracking_started", onStart);
      socket.off("booking-completed", onComplete);

      socket.emit("leave_booking_room", bookingId);
    };

  }, [socket, bookingId]);

  /*
  =========================
  MAP FOLLOW (SMOOTH)
  =========================
  */
  useEffect(() => {
    if (mapRef.current && myLocation) {
      mapRef.current.animateCamera({
        center: myLocation,
        zoom: 16
      });
    }
  }, [myLocation]);

  /*
  =========================
  OPEN GOOGLE MAPS
  =========================
  */
  const openNavigation = () => {
    if (!destination) return;

    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`;
    Linking.openURL(url);
  };

  /*
  =========================
  LOADING
  =========================
  */
  if (loading || !myLocation || !destination) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>

      {/* MAP */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: myLocation.latitude,
          longitude: myLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        }}
      >
        <Marker coordinate={myLocation} title="You" pinColor="blue" />
        <Marker coordinate={destination} title="Customer" pinColor="green" />
      </MapView>

      {/* DISTANCE BADGE */}
      {distance && (
        <DistanceBadge
          distance={`${Number(distance).toFixed(2)} km`}
          duration={`${eta} mins`}
        />
      )}

      {/* BOTTOM PANEL */}
      <View style={styles.panel}>
        <Text style={styles.name}>👤 {booking?.customerName}</Text>

        <Text style={styles.text}>
          📍 Distance: {Number(distance || 0).toFixed(2)} km
        </Text>

        <Text style={styles.text}>
          ⏱ ETA: {eta || 0} mins
        </Text>

        <Text style={[
          styles.status,
          { color: status === "started" ? "green" : "orange" }
        ]}>
          {status === "started"
            ? "🟢 On the way"
            : "🟡 Heading to pickup"}
        </Text>

        <TouchableOpacity style={styles.navBtn} onPress={openNavigation}>
          <Text style={styles.btnText}>Open Navigation</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

/*
=========================
STYLES
=========================
*/
const styles = StyleSheet.create({

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },

  panel: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    padding: 18,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10
  },

  name: {
    fontSize: 16,
    fontWeight: "600"
  },

  text: {
    marginTop: 5,
    fontSize: 14,
    color: "#444"
  },

  status: {
    marginTop: 8,
    fontWeight: "700"
  },

  navBtn: {
    marginTop: 12,
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 12
  },

  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600"
  }

});