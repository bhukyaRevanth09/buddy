import React, { useEffect, useRef, useState, useContext } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

import { SocketContext } from "../../context/socketContext";

import useUserLocation from "../../../hooks/useUserLocation";
import useTrackingSocket from "../../../hooks/useTrackingSocket";
import { calculateDistance } from "../../../hooks/useDistance";

export default function TrackingScreen({ route }) {

  const { bookingId, buddy } = route.params;
  const { socket } = useContext(SocketContext);

  const mapRef = useRef(null);

  const userLocation = useUserLocation();
  const { buddyLocation, status } = useTrackingSocket(socket, bookingId);

  const [distance, setDistance] = useState(0);
  const [eta, setEta] = useState(0);

  /*
  =========================
  DISTANCE + ETA UPDATE
  =========================
  */
  useEffect(() => {
    if (!userLocation || !buddyLocation) return;

    const dist = calculateDistance(userLocation, buddyLocation);

    setDistance(dist);

    const etaCalc = dist ? Math.max(1, Math.ceil((dist / 30) * 60)) : 0;
    setEta(etaCalc);

  }, [userLocation, buddyLocation]);

  /*
  =========================
  AUTO FIT MAP
  =========================
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
  =========================
  LOADING STATE
  =========================
  */
  if (!userLocation) {
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

        {/* USER */}
        <Marker coordinate={userLocation} title="You" pinColor="blue" />

        {/* BUDDY */}
        {buddyLocation && (
          <Marker
            coordinate={buddyLocation}
            title={buddy?.name || "Buddy"}
            pinColor="green"
          />
        )}

      </MapView>

      {/* INFO PANEL */}
      <View style={styles.panel}>

        <Text style={styles.title}>LIVE TRACKING</Text>

        <Text style={styles.text}>
          👤 {buddy?.name}
        </Text>

        <Text style={styles.text}>
          📍 Distance: {distance} km
        </Text>

        <Text style={styles.text}>
          ⏱️ ETA: {eta} mins
        </Text>

        <Text style={styles.status}>
          🟢 {status === "started" ? "On the way" : "Waiting"}
        </Text>

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
    padding: 18,
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

  status: {
    marginTop: 10,
    fontWeight: "700",
    color: "green"
  }
});