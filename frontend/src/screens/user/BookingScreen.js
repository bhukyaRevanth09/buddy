import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  ScrollView,
  RefreshControl
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import api from "../../api/Apiclient.js";
import { SocketContext } from "../../context/socketContext.js";

export default function BookingScreen({ navigation }) {
  const { socket } = useContext(SocketContext);

  const [currentBooking, setCurrentBooking] = useState(null);
  const [finishedBookings, setFinishedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getBookingId = (booking) =>
    booking?._id || booking?.bookingId || booking?.id;

  const getUserLocation = (booking) =>
    booking?.pickupLocation ||
    booking?.location ||
    booking?.userLocation ||
    booking?.address?.location ||
    null;

  const fetchBookings = async () => {
    try {
      const [activeRes, historyRes] = await Promise.all([
        api.get("/booking/active"),
        api.get("/booking/history")
      ]);

      console.log("📦 ACTIVE BOOKING:", activeRes.data);
      console.log("📚 BOOKING HISTORY:", historyRes.data);

      if (activeRes?.data?.success && activeRes?.data?.data) {
        const active = activeRes.data.data;
        setCurrentBooking(active);

        socket?.emit("booking:join", {
          bookingId: getBookingId(active)
        });
      } else {
        setCurrentBooking(null);
      }

      if (historyRes?.data?.success) {
        setFinishedBookings(historyRes.data.data || []);
      } else {
        setFinishedBookings([]);
      }
    } catch (err) {
      console.log("❌ Booking fetch error:", err?.response?.data || err.message);
      setCurrentBooking(null);
      setFinishedBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookings();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const refresh = (data) => {
      console.log("🔄 Booking refresh event:", data);
      fetchBookings();
    };

    socket.on("work:completed", refresh);
    socket.on("booking:cancelled", refresh);
    socket.on("booking:accepted", refresh);
    socket.on("booking:status_update", refresh);

    return () => {
      socket.off("work:completed", refresh);
      socket.off("booking:cancelled", refresh);
      socket.off("booking:accepted", refresh);
      socket.off("booking:status_update", refresh);
    };
  }, [socket]);

  const openCurrentBooking = () => {
    if (!currentBooking) return;

    const userLocation = getUserLocation(currentBooking);

    if (!userLocation) {
      Alert.alert(
        "Location missing",
        "Booking location is missing. Please refresh or create booking again."
      );
      return;
    }

    navigation.navigate("Tracking", {
      bookingId: getBookingId(currentBooking),
      buddy: currentBooking?.buddy,
      userLocation
    });
  };

  const openFinishedBooking = (booking) => {
    navigation.navigate("BookingDetails", {
      booking
    });
  };

  const cancelBooking = async () => {
    if (!currentBooking) return;

    Alert.alert("Cancel Booking", "Are you sure you want to cancel?", [
      { text: "No" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            await api.post("/booking/cancel", {
              bookingId: getBookingId(currentBooking)
            });

            Alert.alert("Cancelled", "Booking cancelled successfully");
            fetchBookings();
          } catch (err) {
            console.log("❌ Cancel failed:", err?.response?.data || err.message);
            Alert.alert(
              "Cancel failed",
              err?.response?.data?.message || "Could not cancel booking"
            );
          }
        }
      }
    ]);
  };

  const renderBookingCard = (booking, type) => {
    const isCurrent = type === "current";
    const bookingId = getBookingId(booking);

    return (
      <TouchableOpacity
        key={bookingId}
        style={[
          styles.card,
          isCurrent ? styles.currentCard : styles.finishedCard
        ]}
        activeOpacity={0.8}
        onPress={() =>
          isCurrent ? openCurrentBooking() : openFinishedBooking(booking)
        }
      >
        <Image
          source={{
            uri:
              booking?.buddy?.image ||
              booking?.buddy?.profileImage ||
              "https://via.placeholder.com/100"
          }}
          style={styles.avatar}
        />

        <View style={styles.cardContent}>
          <Text style={styles.name}>
            {booking?.buddy?.name || "Buddy"}
          </Text>

          <Text style={styles.info}>
            {booking?.category?.name || booking?.category || "Service"}
          </Text>

          <Text
            style={[
              styles.status,
              { color: isCurrent ? "#34C759" : "#777" }
            ]}
          >
            {isCurrent ? `Current • ${booking?.status || "active"}` : booking?.status || "completed"}
          </Text>

          <Text style={styles.small}>
            Booking: {bookingId}
          </Text>
        </View>

        <Ionicons
          name={isCurrent ? "navigate-circle" : "information-circle-outline"}
          size={28}
          color={isCurrent ? "#007AFF" : "#555"}
        />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>My Bookings</Text>

        {currentBooking && (
          <>
            <Text style={styles.sectionTitle}>Current Booking</Text>

            {renderBookingCard(currentBooking, "current")}

            <TouchableOpacity
              style={styles.trackBtn}
              onPress={openCurrentBooking}
            >
              <Ionicons name="navigate" size={18} color="#fff" />
              <Text style={styles.trackText}>Go to Tracking</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={cancelBooking}
            >
              <Text style={styles.cancelText}>Cancel Booking</Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.sectionTitle}>Finished Bookings</Text>

        {finishedBookings.length > 0 ? (
          finishedBookings.map((booking) =>
            renderBookingCard(booking, "finished")
          )
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={60} color="#ccc" />
            <Text style={styles.empty}>No finished bookings</Text>
          </View>
        )}

        {!currentBooking && finishedBookings.length === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={70} color="#ccc" />
            <Text style={styles.empty}>No bookings found</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

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

  loadingText: {
    marginTop: 10,
    color: "#777"
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 20
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginTop: 15,
    marginBottom: 10
  },

  card: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 12
  },

  currentCard: {
    backgroundColor: "#EAF4FF",
    borderWidth: 1,
    borderColor: "#007AFF"
  },

  finishedCard: {
    backgroundColor: "#F5F5F5"
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 15
  },

  cardContent: {
    flex: 1
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
    fontWeight: "700"
  },

  small: {
    marginTop: 3,
    fontSize: 11,
    color: "#888"
  },

  trackBtn: {
    marginTop: 10,
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
    marginTop: 12,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF3B30"
  },

  cancelText: {
    color: "#FF3B30",
    fontWeight: "700"
  },

  emptyBox: {
    alignItems: "center",
    padding: 30
  },

  empty: {
    marginTop: 10,
    color: "#777"
  }
});