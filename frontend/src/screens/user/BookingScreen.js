import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import api from "../../api/Apiclient.js";
import { SocketContext } from "../../context/socketContext.js";

export default function BookingScreen({ navigation }) {

  const { socket } = useContext(SocketContext);

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  /*
  ==============================
  GET ACTIVE BOOKING
  ==============================
  */
  const fetchBooking = async () => {
    try {
      const res = await api.get("/booking/active");

      if (res.data.success && res.data.data) {

        const data = res.data.data;
        setBooking(data);

        // safe socket join
        socket?.emit("join_booking_room", data._id);
      } else {
        setBooking(null);
      }

    } catch (err) {
      console.log("No active booking");
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, []);

  /*
  ==============================
  SOCKET LISTENERS
  ==============================
  */
  useEffect(() => {

    if (!socket) return;

    const onCancel = () => {
      Alert.alert("Booking Cancelled");
      setBooking(null);
    };

    const onComplete = () => {
      Alert.alert("Booking Completed");
      setBooking(null);
    };

    socket.on("booking_cancelled", onCancel);
    socket.on("booking_completed", onComplete);

    return () => {
      socket.off("booking_cancelled", onCancel);
      socket.off("booking_completed", onComplete);
    };

  }, [socket]);

  /*
  ==============================
  CANCEL BOOKING
  ==============================
  */
  const cancelBooking = async () => {
    try {
      await api.post("/booking/cancel", {
        bookingId: booking?._id
      });

      setBooking(null);
      Alert.alert("Booking cancelled");

    } catch (err) {
      Alert.alert("Cancel failed");
    }
  };

  /*
  ==============================
  LOADING
  ==============================
  */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /*
  ==============================
  EMPTY STATE
  ==============================
  */
  if (!booking) {
    return (
      <View style={styles.center}>
        <Ionicons name="calendar-outline" size={70} color="#ccc" />
        <Text style={styles.empty}>
          No Active Booking
        </Text>
      </View>
    );
  }

  /*
  ==============================
  UI
  ==============================
  */
  return (
    <SafeAreaView style={styles.container}>

      <Text style={styles.title}>
        Active Booking
      </Text>

      <View style={styles.card}>

        <Image
          source={{
            uri: booking?.buddy?.image ||
              "https://via.placeholder.com/100"
          }}
          style={styles.avatar}
        />

        <View style={{ flex: 1 }}>

          <Text style={styles.name}>
            {booking?.buddy?.name}
          </Text>

          <Text style={styles.info}>
            {booking?.category?.name}
          </Text>

          <Text style={styles.status}>
            {booking?.status}
          </Text>

        </View>
      </View>

      {/* TRACK BUTTON */}
      <TouchableOpacity
        style={styles.trackBtn}
        onPress={() =>
          navigation.navigate("Tracking", {
            bookingId: booking._id,
            buddy: booking?.buddy
          })
        }
      >
        <Ionicons name="navigate" size={18} color="#fff" />
        <Text style={styles.trackText}>
          Track Buddy
        </Text>
      </TouchableOpacity>

      {/* CANCEL */}
      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={cancelBooking}
      >
        <Text style={styles.cancelText}>
          Cancel Booking
        </Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

/*
==============================
STYLES
==============================
*/
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },

  empty: {
    marginTop: 10,
    color: "#777"
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    padding: 15,
    borderRadius: 12,
    alignItems: "center"
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 15
  },

  name: {
    fontSize: 16,
    fontWeight: "700"
  },

  info: {
    color: "#666",
    marginTop: 2
  },

  status: {
    marginTop: 4,
    color: "#34C759",
    fontWeight: "600"
  },

  trackBtn: {
    marginTop: 25,
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8
  },

  trackText: {
    color: "#fff",
    fontWeight: "700"
  },

  cancelBtn: {
    marginTop: 15,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF3B30"
  },

  cancelText: {
    color: "#FF3B30",
    fontWeight: "700"
  }

});