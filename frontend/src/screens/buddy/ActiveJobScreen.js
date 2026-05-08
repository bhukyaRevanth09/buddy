import React, { useEffect, useState, useContext, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
  Modal,
  TextInput
} from "react-native";

import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";

import { SocketContext } from "../../context/socketContext.js";
import useDistanceCalculator from "../../../hooks/useDistanceCalculator.js";
import DistanceBadge from "../../components/map/DistanceBadge.js";
import { SOCKET_EVENTS } from "../../../evenets/frontendsocketEvents.js";
import api from "../../api/Apiclient.js";

const GOOGLE_MAPS_API_KEY = "AIzaSyBBpz9mtvFZbogdiF52M87-ogsLLKf7zAk";

export default function ActiveJobScreen({ route, navigation }) {
  const { booking } = route.params || {};
  const { socket } = useContext(SocketContext);

  const mapRef = useRef(null);
  const intervalRef = useRef(null);

  const bookingId = booking?._id || booking?.bookingId;

  const rawDestination =
    booking?.pickupLocation ||
    booking?.location ||
    booking?.destination ||
    null;

  const destination =
    rawDestination?.latitude && rawDestination?.longitude
      ? {
          latitude: Number(rawDestination.latitude),
          longitude: Number(rawDestination.longitude)
        }
      : rawDestination?.lat && rawDestination?.lng
      ? {
          latitude: Number(rawDestination.lat),
          longitude: Number(rawDestination.lng)
        }
      : rawDestination?.coordinates?.length === 2
      ? {
          latitude: Number(rawDestination.coordinates[1]),
          longitude: Number(rawDestination.coordinates[0])
        }
      : null;

  const [status, setStatus] = useState(booking?.status || "accepted");
  const [myLocation, setMyLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [routeDistance, setRouteDistance] = useState(null);
  const [routeEta, setRouteEta] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [otpModal, setOtpModal] = useState(false);
  const [completeOtp, setCompleteOtp] = useState("");

  const { distance, eta } = useDistanceCalculator(myLocation, destination);

  const safeDistance = Number.isFinite(Number(routeDistance ?? distance))
    ? Number(routeDistance ?? distance)
    : 0;

  const safeEta = Number.isFinite(Number(routeEta ?? eta))
    ? Math.ceil(Number(routeEta ?? eta))
    : 0;

  const hasValidGoogleKey =
    GOOGLE_MAPS_API_KEY &&
    GOOGLE_MAPS_API_KEY !== "YOUR_GOOGLE_MAPS_API_KEY" &&
    GOOGLE_MAPS_API_KEY !== "YOUR_REAL_GOOGLE_MAPS_API_KEY";

  useEffect(() => {
    console.log("\n================ ACTIVE JOB SCREEN OPENED ================");
    console.log("🧪 FULL BOOKING:", JSON.stringify(booking, null, 2));
    console.log("🧪 bookingId:", bookingId);
    console.log("🧪 destination:", destination);
    console.log("🧪 socket connected:", socket?.connected);
    console.log("==========================================================\n");
  }, []);

  useEffect(() => {
    let mounted = true;

    const initLocation = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (permission.status !== "granted") {
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
        console.log("❌ INIT LOCATION ERROR:", err?.message || err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initLocation();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!socket || !bookingId) return;

    let isMounted = true;

    socket.emit(SOCKET_EVENTS.BOOKING_JOIN, { bookingId });

    const sendLocation = async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });

        if (!isMounted) return;

        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        };

        setMyLocation(coords);

        const payload = {
          bookingId,
          lat: coords.latitude,
          lng: coords.longitude,
          heading: loc.coords.heading || 0,
          speed: loc.coords.speed || 0
        };

        console.log("📡 SENDING LIVE LOCATION:", payload);

        socket.emit(SOCKET_EVENTS.LOCATION_UPDATE_SEND, payload);

        await api.post("/location/update", payload);
      } catch (err) {
        console.log("❌ LOCATION UPDATE ERROR:", err?.response?.data || err.message);
      }
    };

    sendLocation();
    intervalRef.current = setInterval(sendLocation, 3000);

    const onWorkStarted = (data) => {
      console.log("📥 SOCKET WORK_STARTED:", data);
      if (data?.bookingId !== bookingId) return;
      setStatus("started");
    };

    const onWorkCompleted = (data) => {
      console.log("📥 SOCKET WORK_COMPLETED:", data);
      if (data?.bookingId !== bookingId) return;

      Alert.alert("Completed", "Work done");
      navigation.replace("BuddyHome");
    };

    const onTrackingEnd = (data) => {
      console.log("📥 SOCKET TRACKING_ENDED:", data);
      if (data?.bookingId !== bookingId) return;

      navigation.replace("BuddyHome");
    };

    socket.on(SOCKET_EVENTS.WORK_STARTED, onWorkStarted);
    socket.on(SOCKET_EVENTS.WORK_COMPLETED, onWorkCompleted);
    socket.on(SOCKET_EVENTS.TRACKING_ENDED, onTrackingEnd);

    return () => {
      isMounted = false;
      clearInterval(intervalRef.current);

      socket.off(SOCKET_EVENTS.WORK_STARTED, onWorkStarted);
      socket.off(SOCKET_EVENTS.WORK_COMPLETED, onWorkCompleted);
      socket.off(SOCKET_EVENTS.TRACKING_ENDED, onTrackingEnd);

      socket.emit(SOCKET_EVENTS.BOOKING_LEAVE, { bookingId });
    };
  }, [socket, bookingId]);

  const openNavigation = () => {
    if (!destination) {
      Alert.alert("Location missing", "Customer location is missing");
      return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`;
    Linking.openURL(url);
  };

  const updateStatus = async (endpoint, nextStatus) => {
    if (!bookingId || statusLoading) return;

    try {
      setStatusLoading(true);

      const payload = { bookingId };

      console.log("\n================ STATUS UPDATE START ================");
      console.log("📌 Endpoint:", `/booking/${endpoint}`);
      console.log("📌 Payload:", payload);
      console.log("=====================================================\n");

      const res = await api.post(`/booking/${endpoint}`, payload);

      console.log("✅ STATUS RESPONSE:", res.data);

      if (res?.data?.success) {
        setStatus(nextStatus);
        return;
      }

      Alert.alert("Error", res?.data?.message || "Status update failed");
    } catch (err) {
      console.log("\n================ STATUS UPDATE FAILED ================");
      console.log("❌ Endpoint:", `/booking/${endpoint}`);
      console.log("❌ HTTP status:", err?.response?.status);
      console.log("❌ Backend data:", err?.response?.data);
      console.log("❌ Message:", err?.message);
      console.log("=====================================================\n");

      Alert.alert(
        "Error",
        err?.response?.data?.message || err?.message || "Status update failed"
      );
    } finally {
      setStatusLoading(false);
    }
  };

  const requestCompleteOtp = async () => {
    if (!bookingId || statusLoading) return;

    try {
      setStatusLoading(true);

      console.log("COMPLETE WORK BUTTON PRESSED");
      console.log("REQUESTING COMPLETE OTP:", { bookingId });

      const res = await api.post("/booking/complete", {
        bookingId
      });

      console.log(" COMPLETE OTP RESPONSE:", res.data);

      if (res?.data?.success && res?.data?.otpRequired) {
        setOtpModal(true);
        return;
      }

      if (res?.data?.success && res?.data?.completed) {
        Alert.alert("Completed", "Work completed successfully");
        navigation.replace("BuddyHome");
        return;
      }

      Alert.alert("Error", res?.data?.message || "Failed to request OTP");
    } catch (err) {
      console.log(" COMPLETE OTP REQUEST ERROR:", err?.response?.data || err.message);

      Alert.alert(
        "Error",
        err?.response?.data?.message || "Failed to request OTP"
      );
    } finally {
      setStatusLoading(false);
    }
  };

  const verifyCompleteOtp = async () => {
    if (!completeOtp.trim()) {
      Alert.alert("OTP required", "Please enter OTP from customer");
      return;
    }

    try {
      setStatusLoading(true);

      const payload = {
        bookingId,
        otp: completeOtp.trim()
      };

    
      console.log("otp Payload:", payload);
      

      const res = await api.post("/booking/complete", payload);

      console.log(" COMPLETE VERIFY RESPONSE:", res.data);

      if (res?.data?.success) {
        setOtpModal(false);
        setCompleteOtp("");
        setStatus("completed");

        Alert.alert("Completed", "Work completed successfully");
        navigation.replace("BuddyHome");
        return;
      }

      Alert.alert("Error", res?.data?.message || "Invalid OTP");
    } catch (err) {
      console.log(" COMPLETE OTP VERIFY ERROR:", err?.response?.data || err.message);

      Alert.alert(
        "Verification failed",
        err?.response?.data?.message || "Invalid OTP or complete failed"
      );
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading || !myLocation) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading location...</Text>
      </View>
    );
  }

  if (!destination) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Customer location missing</Text>
        <Text style={styles.errorText}>Booking: {bookingId}</Text>

        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => navigation.replace("BuddyHome")}
        >
          <Text style={styles.btnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
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

        {hasValidGoogleKey && (
          <MapViewDirections
            origin={myLocation}
            destination={destination}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={4}
            strokeColor="#007AFF"
            mode="DRIVING"
            resetOnChange={false}
            onReady={(result) => {
              console.log(" GOOGLE ROUTE READY:", {
                distance: result.distance,
                duration: result.duration
              });

              setRouteDistance(result.distance);
              setRouteEta(result.duration);

              mapRef.current?.fitToCoordinates(result.coordinates, {
                edgePadding: {
                  top: 80,
                  right: 80,
                  bottom: 300,
                  left: 80
                },
                animated: true
              });
            }}
            onError={(errorMessage) => {
              console.log(" GOOGLE ROUTE ERROR:", errorMessage);
            }}
          />
        )}
      </MapView>

      <DistanceBadge
        distance={`${safeDistance.toFixed(2)} km`}
        duration={`${safeEta} mins`}
      />

      <View style={styles.panel}>
        <View style={styles.handle} />

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Active Job</Text>
            <Text style={styles.name}>👤 {booking?.customerName || "Customer"}</Text>
          </View>

          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Distance</Text>
            <Text style={styles.infoValue}>{safeDistance.toFixed(2)} km</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>ETA</Text>
            <Text style={styles.infoValue}>{safeEta} mins</Text>
          </View>
        </View>

        <Text style={styles.bookingText}>Booking: {bookingId}</Text>
        <Text style={styles.socketText}>
          Socket: {socket?.connected ? "Connected" : "Disconnected"}
        </Text>

        <TouchableOpacity
          style={styles.navBtn}
          onPress={openNavigation}
          disabled={statusLoading}
        >
          <Text style={styles.btnText}>Open Google Maps</Text>
        </TouchableOpacity>

        {status === "accepted" && (
          <TouchableOpacity
            style={styles.arrivedBtn}
            disabled={statusLoading}
            onPress={() => updateStatus("arrived", "arrived")}
          >
            <Text style={styles.btnText}>
              {statusLoading ? "Updating..." : "I ARRIVED"}
            </Text>
          </TouchableOpacity>
        )}

        {status === "arrived" && (
          <TouchableOpacity
            style={styles.startBtn}
            disabled={statusLoading}
            onPress={() => updateStatus("start", "started")}
          >
            <Text style={styles.btnText}>
              {statusLoading ? "Updating..." : "START WORK"}
            </Text>
          </TouchableOpacity>
        )}

        {status === "started" && (
          <TouchableOpacity
            style={styles.completeBtn}
            disabled={statusLoading}
            onPress={requestCompleteOtp}
          >
            <Text style={styles.btnText}>
              {statusLoading ? "Sending OTP..." : "COMPLETE WORK"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={otpModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.premiumOtpBox}>
            <View style={styles.otpIconCircle}>
              <Text style={styles.otpIcon}>🔐</Text>
            </View>

            <Text style={styles.otpTitle}>Complete Work Securely</Text>

            <Text style={styles.otpSub}>
              OTP has been sent to the customer email. Ask the customer and enter it below.
            </Text>

            <TextInput
              style={styles.otpInput}
              value={completeOtp}
              onChangeText={setCompleteOtp}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="••••••"
              placeholderTextColor="#B8B8B8"
            />

            <TouchableOpacity
              style={[
                styles.verifyBtn,
                (!completeOtp.trim() || statusLoading) && styles.disabledBtn
              ]}
              disabled={!completeOtp.trim() || statusLoading}
              onPress={verifyCompleteOtp}
            >
              {statusLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.verifyText}>VERIFY & COMPLETE</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelOtpBtn}
              disabled={statusLoading}
              onPress={() => {
                setOtpModal(false);
                setCompleteOtp("");
              }}
            >
              <Text style={styles.cancelOtpText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },

  loadingText: {
    marginTop: 10,
    color: "#777"
  },

  panel: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    padding: 18,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    elevation: 18
  },

  handle: {
    width: 42,
    height: 5,
    borderRadius: 10,
    backgroundColor: "#DDD",
    alignSelf: "center",
    marginBottom: 14
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },

  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111"
  },

  name: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
    color: "#444"
  },

  statusPill: {
    backgroundColor: "#F2F4F7",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20
  },

  statusPillText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#111"
  },

  infoGrid: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14
  },

  infoBox: {
    flex: 1,
    backgroundColor: "#F7F8FA",
    padding: 12,
    borderRadius: 16
  },

  infoLabel: {
    color: "#777",
    fontSize: 12
  },

  infoValue: {
    marginTop: 3,
    fontWeight: "900",
    fontSize: 16,
    color: "#111"
  },

  bookingText: {
    marginTop: 12,
    color: "#777",
    fontSize: 12
  },

  socketText: {
    marginTop: 3,
    color: "#777",
    fontSize: 12
  },

  navBtn: {
    marginTop: 14,
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 16
  },

  arrivedBtn: {
    marginTop: 10,
    backgroundColor: "#FF9500",
    padding: 14,
    borderRadius: 16
  },

  startBtn: {
    marginTop: 10,
    backgroundColor: "#34C759",
    padding: 14,
    borderRadius: 16
  },

  completeBtn: {
    marginTop: 10,
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 16
  },

  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "900"
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8
  },

  errorText: {
    color: "#555",
    marginBottom: 8
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end"
  },

  premiumOtpBox: {
    backgroundColor: "#fff",
    padding: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    elevation: 20
  },

  otpIconCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#F2F6FF",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: -58,
    borderWidth: 5,
    borderColor: "#fff"
  },

  otpIcon: {
    fontSize: 32
  },

  otpTitle: {
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 18,
    color: "#111"
  },

  otpSub: {
    marginTop: 8,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    fontSize: 14
  },

  otpInput: {
    marginTop: 24,
    backgroundColor: "#F7F8FA",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6E8EC",
    paddingVertical: 16,
    paddingHorizontal: 14,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 10,
    color: "#111"
  },

  verifyBtn: {
    marginTop: 18,
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center"
  },

  verifyText: {
    color: "#fff",
    fontWeight: "900",
    letterSpacing: 0.5
  },

  disabledBtn: {
    backgroundColor: "#BDBDBD"
  },

  cancelOtpBtn: {
    marginTop: 14,
    padding: 14,
    alignItems: "center"
  },

  cancelOtpText: {
    color: "#FF3B30",
    fontWeight: "800"
  }
});
