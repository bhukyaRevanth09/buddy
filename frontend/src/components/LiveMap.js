import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

export default function LiveMap({
  userLocation,
  buddyLocation,
  route
}) {
  const mapRef = useRef(null);

  const [distance, setDistance] = useState(0);
  const [eta, setEta] = useState(0);

  /*
  Haversine formula
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
  UPDATE DISTANCE + ETA
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

    // assume avg speed 30 km/h (city travel)
    const etaMinutes = (dist / 30) * 60;
    setEta(Math.max(1, Math.ceil(etaMinutes)));
  }, [userLocation, buddyLocation]);

  /*
  FIT MAP BOUNDS
  */
  useEffect(() => {
    if (!userLocation || !buddyLocation) return;

    mapRef.current?.fitToCoordinates(
      [userLocation, buddyLocation],
      {
        edgePadding: {
          top: 120,
          right: 120,
          bottom: 120,
          left: 120
        },
        animated: true
      }
    );
  }, [userLocation, buddyLocation]);

  return (
    <View style={{ flex: 1 }}>

      {/* MAP */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        showsUserLocation
      >
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="You"
            pinColor="blue"
          />
        )}

        {buddyLocation && (
          <Marker
            coordinate={buddyLocation}
            title="Buddy"
            pinColor="green"
          />
        )}

        {route && (
          <Polyline
            coordinates={route}
            strokeWidth={4}
            strokeColor="#007AFF"
          />
        )}
      </MapView>

      {/* ETA PANEL */}
      <View style={styles.panel}>
        <Text style={styles.text}>
          📍 Distance: {distance} km
        </Text>

        <Text style={styles.text}>
          ⏱️ ETA: {eta} mins
        </Text>

        {buddyLocation ? (
          <Text style={styles.live}>
            🟢 Buddy is moving live
          </Text>
        ) : (
          <Text style={styles.offline}>
            🔴 Waiting for buddy location...
          </Text>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    top: 50,
    left: 15,
    right: 15,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    elevation: 5
  },

  text: {
    fontSize: 14,
    fontWeight: "600"
  },

  live: {
    marginTop: 5,
    color: "green",
    fontWeight: "700"
  },

  offline: {
    marginTop: 5,
    color: "red",
    fontWeight: "600"
  }
});