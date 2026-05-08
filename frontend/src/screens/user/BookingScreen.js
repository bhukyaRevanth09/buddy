import React, {
  useEffect,
  useState,
  useContext,
  useCallback
} from "react";

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

  const getBookingId = (booking) => {
    return booking?._id || booking?.bookingId || booking?.id;
  };

  const getUserLocation = (booking) => {
    const loc =
      booking?.pickupLocation ||
      booking?.userLocation ||
      booking?.location ||
      booking?.address?.location ||
      null;

    if (!loc) return null;

    if (loc.latitude && loc.longitude) {
      return {
        latitude: Number(loc.latitude),
        longitude: Number(loc.longitude)
      };
    }

    if (loc.lat && loc.lng) {
      return {
        latitude: Number(loc.lat),
        longitude: Number(loc.lng)
      };
    }

    if (loc.coordinates && loc.coordinates.length >= 2) {
      return {
        latitude: Number(loc.coordinates[1]),
        longitude: Number(loc.coordinates[0])
      };
    }

    return null;
  };

  const fetchBookings = async () => {
    try {
      console.log(" FETCHING BOOKINGS...");

      const [activeRes, historyRes] = await Promise.all([
        api.get("/booking/active"),
        api.get("/booking/history")
      ]);

      console.log(" ACTIVE RESPONSE DATA:", activeRes?.data);
      console.log(" HISTORY RESPONSE DATA:", historyRes?.data);

      if (activeRes?.data?.success && activeRes?.data?.data) {
        const active = activeRes.data.data;

        console.log("✅ ACTIVE BOOKING FOUND:", active);

        setCurrentBooking(active);

        socket?.emit("booking:join", {
          bookingId: getBookingId(active)
        });
      } else {
        console.log(" NO ACTIVE BOOKING FOUND");
        setCurrentBooking(null);
      }

      if (historyRes?.data?.success) {
        console.log(" HISTORY BOOKINGS SET:", historyRes.data.data);
        setFinishedBookings(historyRes.data.data || []);
      } else {
        console.log(" HISTORY RESPONSE FAILED");
        setFinishedBookings([]);
      }
    } catch (err) {
      console.log(" FETCH ERROR:", err?.response?.data || err.message);

      setCurrentBooking(null);
      setFinishedBookings([]);

      Alert.alert(
        "Error",
        err?.response?.data?.message || "Failed to load bookings"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.log(" FETCH COMPLETED");
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
      console.log(" Booking refresh event:", data);
      fetchBookings();
    };

    const handleWorkCompleted = (data) => {
      console.log("WORK COMPLETED IN BOOKING SCREEN:", data);

      if (data?.bookingId) {
        navigation.navigate("UserReview", {
          bookingId: data.bookingId,
          buddy: data.buddy || {
            _id: data.buddyId,
            name: "Buddy"
          }
        });
        return;
      }

      fetchBookings();
    };

    socket.on("work:completed", handleWorkCompleted);
    socket.on("booking:cancelled", refresh);
    socket.on("booking:accepted", refresh);
    socket.on("booking:status_update", refresh);
    socket.on("buddy:arrived", refresh);
    socket.on("work:started", refresh);

    return () => {
      socket.off("work:completed", handleWorkCompleted);
      socket.off("booking:cancelled", refresh);
      socket.off("booking:accepted", refresh);
      socket.off("booking:status_update", refresh);
      socket.off("buddy:arrived", refresh);
      socket.off("work:started", refresh);
    };
  }, [socket, navigation]);

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

  const cancelBooking = async () => {
    if (!currentBooking) return;

    Alert.alert("Cancel Booking", "Are you sure you want to cancel?", [
      {
        text: "No",
        style: "cancel"
      },
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
            console.log(
              " Cancel failed:",
              err?.response?.data || err.message
            );

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
        activeOpacity={0.85}
        onPress={isCurrent ? openCurrentBooking : undefined}
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
            {booking?.buddy?.name || "Buddy not assigned"}
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
            {isCurrent
              ? `Current • ${booking?.status || "active"}`
              : booking?.status || "completed"}
          </Text>

          <Text style={styles.small}>Booking: {bookingId}</Text>
        </View>

        <Ionicons
          name={isCurrent ? "navigate-circle" : "checkmark-circle-outline"}
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
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>My Bookings</Text>

        {currentBooking ? (
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

            <TouchableOpacity style={styles.cancelBtn} onPress={cancelBooking}>
              <Text style={styles.cancelText}>Cancel Booking</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons name="time-outline" size={60} color="#ccc" />
            <Text style={styles.empty}>No running booking</Text>
          </View>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20
  },

  scrollContent: {
    paddingBottom: 110
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
    marginTop: 10,
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
    marginRight: 15,
    backgroundColor: "#ddd"
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
    fontWeight: "700",
    textTransform: "capitalize"
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
    color: "#777",
    fontWeight: "600"
  }
});