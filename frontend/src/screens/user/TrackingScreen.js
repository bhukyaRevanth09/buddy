import React, { useEffect, useRef, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity
} from "react-native";

import MapView, { Marker, AnimatedRegion } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { SocketContext } from "../../context/socketContext";
import DistanceBadge from "../../components/map/DistanceBadge";

import useTrackingSocket from "../../../hooks/useTrackingSocket";
import { calculateDistance } from "../../../hooks/useDistance";
import { SOCKET_EVENTS } from "../../../evenets/frontendsocketEvents";

const GOOGLE_MAPS_API_KEY = "AIzaSyBBpz9mtvFZbogdiF52M87-ogsLLKf7zAk";

export default function TrackingScreen({ route, navigation }) {
  const bookingId = route?.params?.bookingId;
  const buddy = route?.params?.buddy;
  const userLocation = route?.params?.userLocation;

  const { socket, connected } = useContext(SocketContext);

  const mapRef = useRef(null);
  const hasArrivedRef = useRef(false);
  const hasCompletedRef = useRef(false);

  const {
    buddyLocation,
    trackingStatus,
    workStarted,
    workCompleted
  } = useTrackingSocket(socket, bookingId);

  const [distance, setDistance] = useState(0);
  const [eta, setEta] = useState(0);
  const [heading, setHeading] = useState(0);
  const [arrived, setArrived] = useState(false);

  const buddyAnimatedLocation = useRef(
    new AnimatedRegion({
      latitude: userLocation?.latitude || 0,
      longitude: userLocation?.longitude || 0,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01
    })
  ).current;

  const goToReview = () => {
    if (hasCompletedRef.current) return;

    hasCompletedRef.current = true;

    Alert.alert("Completed", "Work completed");

    navigation.replace("UserReview", {
      bookingId,
      buddy
    });
  };

  const showArrivedUI = () => {
    if (hasArrivedRef.current) return;

    hasArrivedRef.current = true;
    setArrived(true);
  };

  useEffect(() => {
    if (trackingStatus === "arrived" || workStarted) {
      showArrivedUI();
    }

    if (trackingStatus === "completed" || workCompleted) {
      goToReview();
    }
  }, [trackingStatus, workStarted, workCompleted]);

  useEffect(() => {
    if (!userLocation || !buddyLocation || arrived) return;

    const newCoordinate = {
      latitude: Number(buddyLocation.latitude),
      longitude: Number(buddyLocation.longitude)
    };

    if (buddyLocation.heading) {
      setHeading(buddyLocation.heading);
    }

    buddyAnimatedLocation
      .timing({
        ...newCoordinate,
        duration: 1000,
        useNativeDriver: false
      })
      .start();

    mapRef.current?.animateCamera(
      {
        center: newCoordinate,
        pitch: 45,
        heading: buddyLocation.heading || heading || 0,
        zoom: 16
      },
      { duration: 1000 }
    );

    const fallbackDistance = calculateDistance(userLocation, newCoordinate);
    setDistance(fallbackDistance);

    const fallbackEta = Math.max(
      1,
      Math.ceil((fallbackDistance / 30) * 60)
    );

    setEta(fallbackEta);
  }, [buddyLocation, arrived]);

  useEffect(() => {
    if (!socket || !bookingId) return;

    socket.emit(SOCKET_EVENTS.BOOKING_JOIN, {
      bookingId
    });

    const onArrived = (data) => {
      if (data?.bookingId !== bookingId) return;
      showArrivedUI();
    };

    const onStatusUpdate = (data) => {
      if (data?.bookingId !== bookingId) return;

      if (data?.status === "arrived" || data?.status === "started") {
        showArrivedUI();
      }

      if (data?.status === "completed") {
        goToReview();
      }
    };

    const onWorkStarted = (data) => {
      if (data?.bookingId !== bookingId) return;
      showArrivedUI();
    };

    const onWorkCompleted = (data) => {
      if (data?.bookingId !== bookingId) return;
      goToReview();
    };

    socket.on(SOCKET_EVENTS.BUDDY_ARRIVED, onArrived);
    socket.on(SOCKET_EVENTS.STATUS_UPDATE, onStatusUpdate);
    socket.on(SOCKET_EVENTS.WORK_STARTED, onWorkStarted);
    socket.on(SOCKET_EVENTS.WORK_COMPLETED, onWorkCompleted);

    return () => {
      socket.emit(SOCKET_EVENTS.BOOKING_LEAVE, {
        bookingId
      });

      socket.off(SOCKET_EVENTS.BUDDY_ARRIVED, onArrived);
      socket.off(SOCKET_EVENTS.STATUS_UPDATE, onStatusUpdate);
      socket.off(SOCKET_EVENTS.WORK_STARTED, onWorkStarted);
      socket.off(SOCKET_EVENTS.WORK_COMPLETED, onWorkCompleted);
    };
  }, [socket, bookingId, buddy]);

  const safeDistance = Number.isFinite(Number(distance))
    ? Number(distance)
    : 0;

  const safeEta = Number.isFinite(Number(eta))
    ? Number(eta)
    : 0;

  if (!userLocation) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading location...</Text>
      </View>
    );
  }

  if (arrived) {
    return (
      <SafeAreaView style={styles.arrivedContainer}>
        <View style={styles.arrivedIconBox}>
          <Ionicons name="checkmark-circle" size={86} color="#34C759" />
        </View>

        <Text style={styles.arrivedTitle}>Buddy Arrived</Text>

        <Text style={styles.arrivedSub}>
          {buddy?.name || "Your buddy"} has reached your location.
        </Text>

        <View style={styles.arrivedCard}>
          <View style={styles.arrivedRow}>
            <Ionicons name="receipt-outline" size={21} color="#777" />

            <View style={{ flex: 1 }}>
              <Text style={styles.arrivedLabel}>Booking ID</Text>
              <Text style={styles.arrivedValue}>{bookingId}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.arrivedRow}>
            <Ionicons name="person-circle-outline" size={23} color="#777" />

            <View style={{ flex: 1 }}>
              <Text style={styles.arrivedLabel}>Buddy</Text>
              <Text style={styles.arrivedValue}>
                {buddy?.name || "Buddy"}
              </Text>
            </View>
          </View>

          <Text style={styles.arrivedInfo}>
            Please meet your buddy. Work will start shortly after confirmation.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.arrivedBtn}
          onPress={() =>
            navigation.reset({
              index: 0,
              routes: [{ name: "MainTabs" }]
            })
          }
        >
          <Text style={styles.arrivedBtnText}>Go to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() =>
            navigation.navigate("MainTabs", {
              screen: "Booking"
            })
          }
        >
          <Text style={styles.secondaryText}>View Booking</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const buddyCoordinate = buddyLocation
    ? {
        latitude: Number(buddyLocation.latitude),
        longitude: Number(buddyLocation.longitude)
      }
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={false}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02
        }}
      >
        <Marker coordinate={userLocation} title="You">
          <View style={styles.userMarker}>
            <Ionicons name="person" size={18} color="#fff" />
          </View>
        </Marker>

        {buddyCoordinate && (
          <Marker.Animated
            coordinate={buddyAnimatedLocation}
            title={buddy?.name || "Buddy"}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
            rotation={heading}
          >
            <View style={styles.buddyMarker}>
              <Ionicons name="bicycle" size={24} color="#fff" />
            </View>
          </Marker.Animated>
        )}

        {buddyCoordinate && (
          <MapViewDirections
            origin={buddyCoordinate}
            destination={userLocation}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={5}
            strokeColor="#007AFF"
            mode="DRIVING"
            optimizeWaypoints
            resetOnChange={false}
            onReady={(result) => {
              setDistance(result.distance);
              setEta(Math.ceil(result.duration));

              mapRef.current?.fitToCoordinates(result.coordinates, {
                edgePadding: {
                  top: 90,
                  right: 70,
                  bottom: 260,
                  left: 70
                },
                animated: true
              });
            }}
            onError={(errorMessage) => {
              console.log("Google route error:", errorMessage);
            }}
          />
        )}
      </MapView>

      {buddyCoordinate && (
        <DistanceBadge
          distance={`${safeDistance.toFixed(2)} km`}
          duration={`${safeEta} mins`}
        />
      )}

      {!buddyCoordinate && (
        <View style={styles.waitingBox}>
          <ActivityIndicator />
          <Text style={styles.waitingText}>Waiting for buddy location...</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.title}>Buddy is on the way</Text>

        <Text style={styles.name}>
          👤 {buddy?.name || "Buddy"}
        </Text>

        <Text style={styles.text}>
          📍 Distance: {safeDistance.toFixed(2)} km
        </Text>

        <Text style={styles.text}>
          ⏱ ETA: {safeEta} mins
        </Text>

        <Text style={styles.text}>
          🔌 Socket: {connected ? "Connected" : "Disconnected"}
        </Text>

        <Text
          style={[
            styles.status,
            {
              color: trackingStatus === "moving" ? "green" : "orange"
            }
          ]}
        >
          {trackingStatus === "moving"
            ? "🟢 Buddy moving"
            : "🟡 Waiting for live location..."}
        </Text>

        {workStarted && <Text style={styles.started}>✅ Work Started</Text>}

        {workCompleted && (
          <Text style={styles.completed}>🎉 Work Completed</Text>
        )}
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

  userMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff"
  },

  buddyMarker: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#34C759",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
    elevation: 5
  },

  waitingBox: {
    position: "absolute",
    top: 70,
    alignSelf: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    elevation: 5
  },

  waitingText: {
    marginLeft: 8,
    fontWeight: "600"
  },

  card: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 10
  },

  title: {
    fontSize: 20,
    fontWeight: "bold"
  },

  name: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "700"
  },

  text: {
    marginTop: 6,
    color: "#444"
  },

  status: {
    marginTop: 12,
    fontWeight: "700"
  },

  started: {
    marginTop: 10,
    color: "green",
    fontWeight: "700"
  },

  completed: {
    marginTop: 10,
    color: "#007AFF",
    fontWeight: "700"
  },

  arrivedContainer: {
    flex: 1,
    backgroundColor: "#F6F7FB",
    justifyContent: "center",
    padding: 24
  },

  arrivedIconBox: {
    alignSelf: "center",
    width: 134,
    height: 134,
    borderRadius: 67,
    backgroundColor: "#EAF8EF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 26
  },

  arrivedTitle: {
    fontSize: 31,
    fontWeight: "900",
    textAlign: "center",
    color: "#111"
  },

  arrivedSub: {
    marginTop: 10,
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    lineHeight: 23
  },

  arrivedCard: {
    marginTop: 32,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 24,
    elevation: 7
  },

  arrivedRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center"
  },

  arrivedLabel: {
    color: "#777",
    fontSize: 12
  },

  arrivedValue: {
    marginTop: 4,
    fontWeight: "900",
    color: "#111"
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 16
  },

  arrivedInfo: {
    marginTop: 18,
    color: "#555",
    lineHeight: 22
  },

  arrivedBtn: {
    marginTop: 30,
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 18,
    alignItems: "center"
  },

  arrivedBtnText: {
    color: "#fff",
    fontWeight: "900"
  },

  secondaryBtn: {
    marginTop: 12,
    padding: 14,
    alignItems: "center"
  },

  secondaryText: {
    color: "#007AFF",
    fontWeight: "800"
  }
});