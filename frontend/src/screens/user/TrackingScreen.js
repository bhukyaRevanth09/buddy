import React, { useContext, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import { SocketContext } from "../../context/socketContext.js";
import LiveMap from "../../components/LiveMap.js";

export default function TrackingScreen({ route, navigation }) {

  const { socket } = useContext(SocketContext);

  const { bookingId, userLocation } = route.params;

  const [buddyLocation, setBuddyLocation] = useState(null);

  /*
  ==============================
  SOCKET LIVE TRACKING
  ==============================
  */
  useEffect(() => {
    if (!socket || !bookingId) return;

    console.log("🎯 Join booking tracking:", bookingId);

    // join booking room
    socket.emit("track_booking", bookingId);

    const handleLocation = (data) => {
      console.log("📍 Buddy moving:", data);

      setBuddyLocation({
        latitude: data.lat,
        longitude: data.lng
      });
    };

    // listen live location
    socket.on("booking_location_update", handleLocation);

    return () => {
      socket.off("booking_location_update", handleLocation);
    };

  }, [socket, bookingId]);

  /*
  ==============================
  NAV BACK HANDLER
  ==============================
  */
  const handleBackHome = () => {
    navigation.navigate("MainTabs", {
      screen: "Home"
    });
  };

  const handleBackToTracking = () => {
    navigation.replace("Tracking", {
      bookingId,
      userLocation
    });
  };

  return (
    <View style={styles.container}>

      {/* LIVE MAP */}
      <LiveMap
        userLocation={userLocation}
        buddyLocation={buddyLocation}
      />

      {/* TOP INFO PANEL */}
      <View style={styles.topPanel}>
        <Text style={styles.title}>
          🚀 Live Tracking
        </Text>

        <Text style={styles.subtitle}>
          Buddy is on the way
        </Text>
      </View>

      {/* BOTTOM ACTION PANEL */}
      <View style={styles.bottomPanel}>

        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={handleBackHome}
        >
          <Text style={styles.btnTextDark}>
            Go Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={handleBackToTracking}
        >
          <Text style={styles.btnText}>
            Refresh Tracking
          </Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1
  },

  topPanel: {
    position: "absolute",
    top: 50,
    left: 15,
    right: 15,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    elevation: 5
  },

  title: {
    fontSize: 16,
    fontWeight: "700"
  },

  subtitle: {
    marginTop: 3,
    color: "#555"
  },

  bottomPanel: {
    position: "absolute",
    bottom: 30,
    left: 15,
    right: 15,
    flexDirection: "row",
    justifyContent: "space-between"
  },

  btnPrimary: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 12,
    alignItems: "center"
  },

  btnSecondary: {
    flex: 1,
    marginRight: 10,
    backgroundColor: "#eee",
    padding: 14,
    borderRadius: 12,
    alignItems: "center"
  },

  btnText: {
    color: "#fff",
    fontWeight: "700"
  },

  btnTextDark: {
    color: "#000",
    fontWeight: "700"
  }

});