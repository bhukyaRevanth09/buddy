import React, { useEffect, useRef, useState, useContext } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

import RoutePolyline from "../../components/map/RoutePolyline";
import DistanceBadge from "../../components/map/DistanceBadge";

import { SocketContext } from "../../context/socketContext";
import useTrackingSocket from "../../../hooks/useTrackingSocket";
import { calculateDistance } from "../../../hooks/useDistance";

export default function TrackingScreen({ route }) {

  const bookingId = route?.params?.bookingId;
  const buddy = route?.params?.buddy;
  const userLocation = route?.params?.userLocation;

  const { socket } = useContext(SocketContext);

  const mapRef = useRef(null);

  const { buddyLocation, status } = useTrackingSocket(socket, bookingId);

  const [distance, setDistance] = useState(0);
  const [eta, setEta] = useState(0);

  /*
  =========================
  DISTANCE + ETA
  =========================
  */
  useEffect(() => {
    if (!userLocation || !buddyLocation) return;

    const dist = calculateDistance(userLocation, buddyLocation);
    setDistance(dist);

    const etaMinutes = Math.max(1, Math.ceil((dist / 30) * 60));
    setEta(etaMinutes);

  }, [userLocation, buddyLocation]);

  /*
  =========================
  AUTO FIT MAP
  =========================
  */
  useEffect(() => {
    if (userLocation && buddyLocation) {
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
    }
  }, [buddyLocation]);

  /*
  =========================
  LOADING
  =========================
  */
  if (!userLocation) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading location...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* MAP */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        }}
      >

        <Marker
          coordinate={userLocation}
          title="Pickup Location"
          pinColor="blue"
        />

        {buddyLocation && (
          <Marker
            coordinate={buddyLocation}
            title={buddy?.name || "Buddy"}
            pinColor="green"
          />
        )}

        <RoutePolyline
          coordinates={
            buddyLocation ? [userLocation, buddyLocation] : []
          }
        />

      </MapView>

      {/* FLOATING DISTANCE */}
      <DistanceBadge
        distance={`${distance.toFixed(2)} km`}
        duration={`${eta} mins`}
      />

      {/* INFO CARD */}
      <View style={styles.card}>
        <Text style={styles.title}>Live Tracking</Text>

        <Text style={styles.name}>
          👤 {buddy?.name || "Buddy"}
        </Text>

        <Text style={styles.text}>
          📍 Distance: {distance.toFixed(2)} km
        </Text>

        <Text style={styles.text}>
          ⏱ ETA: {eta} mins
        </Text>

        <Text
          style={[
            styles.status,
            { color: status === "started" ? "green" : "orange" }
          ]}
        >
          {status === "started"
            ? "🟢 Buddy is on the way"
            : "🟡 Waiting for movement"}
        </Text>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },

  card: {
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

  name: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 5
  },

  text: {
    marginTop: 4,
    fontSize: 14
  },

  status: {
    marginTop: 10,
    fontWeight: "700"
  }
});