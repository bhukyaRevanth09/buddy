import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import axios from "axios";

export default function BuddyNavigationMap({
  userLocation,
  buddyLocation
}) {

  const mapRef = useRef(null);

  const [routeCoords, setRouteCoords] = useState([]);
  const [distance, setDistance] = useState(0);
  const [eta, setEta] = useState(0);

  /*
  =========================
  GET ROUTE (GOOGLE API)
  =========================
  */
  const fetchRoute = async () => {
    if (!userLocation || !buddyLocation) return;

    try {
      const origin = `${buddyLocation.latitude},${buddyLocation.longitude}`;
      const destination = `${userLocation.latitude},${userLocation.longitude}`;

      const API_KEY = "YOUR_GOOGLE_MAPS_API_KEY";

      const url =
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${API_KEY}`;

      const res = await axios.get(url);

      const points = res.data.routes[0].overview_polyline.points;

      const decode = (t) => {
        let points = [];
        let index = 0, lat = 0, lng = 0;

        while (index < t.length) {
          let b, shift = 0, result = 0;

          do {
            b = t.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
          } while (b >= 0x20);

          let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
          lat += dlat;

          shift = 0;
          result = 0;

          do {
            b = t.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
          } while (b >= 0x20);

          let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
          lng += dlng;

          points.push({
            latitude: lat / 1e5,
            longitude: lng / 1e5
          });
        }

        return points;
      };

      const coords = decode(points);

      setRouteCoords(coords);

      /*
      distance & time from API
      */
      const leg = res.data.routes[0].legs[0];
      setDistance((leg.distance.value / 1000).toFixed(2));
      setEta(Math.ceil(leg.duration.value / 60));

    } catch (err) {
      console.log("Route error:", err.message);
    }
  };

  /*
  =========================
  LOAD ROUTE
  =========================
  */
  useEffect(() => {
    fetchRoute();
  }, [userLocation, buddyLocation]);

  /*
  =========================
  FIT MAP
  =========================
  */
  useEffect(() => {
    if (!routeCoords.length) return;

    mapRef.current?.fitToCoordinates(routeCoords, {
      edgePadding: {
        top: 100,
        right: 100,
        bottom: 100,
        left: 100
      },
      animated: true
    });
  }, [routeCoords]);

  return (
    <View style={{ flex: 1 }}>

      {/* MAP */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        showsUserLocation
      >

        {/* Buddy */}
        {buddyLocation && (
          <Marker
            coordinate={buddyLocation}
            title="Buddy"
            pinColor="blue"
          />
        )}

        {/* User */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Customer"
            pinColor="green"
          />
        )}

        {/* Route */}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={5}
            strokeColor="#007AFF"
          />
        )}

      </MapView>

      {/* INFO PANEL */}
      <View style={styles.panel}>

        <Text style={styles.title}>
          🚗 Navigating to Customer
        </Text>

        <Text style={styles.text}>
          📍 Distance: {distance} km
        </Text>

        <Text style={styles.text}>
          ⏱️ ETA: {eta} mins
        </Text>

        <Text style={styles.status}>
          🟢 Live Navigation Active
        </Text>

      </View>

    </View>
  );
}

/*
=========================
STYLES
=========================
*/
const styles = StyleSheet.create({

  panel: {
    position: "absolute",
    top: 50,
    left: 15,
    right: 15,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    elevation: 5
  },

  title: {
    fontSize: 16,
    fontWeight: "bold"
  },

  text: {
    marginTop: 5,
    fontSize: 14
  },

  status: {
    marginTop: 8,
    color: "green",
    fontWeight: "700"
  }
});